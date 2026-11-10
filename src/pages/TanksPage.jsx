import {
  Checkbox,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
  Radio,
  RadioGroup,
} from "@headlessui/react";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createTank,
  deleteTank,
  describeError,
  fetchTankPhoto,
  listParameters,
  listTanks,
  updateTank,
  uploadTankPhoto,
} from "../api/client";
import { Notice, PrimaryButton, QuietButton, Spinner, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { imageExtensionOk, parameterLabel } from "../lib/format";
import { parameterMatchesQuery, presetParameterIds } from "../lib/tankPresets";

export function TanksPage() {
  const { t } = useTranslation();
  const { manage } = useParams();
  const managing = manage === "manage";
  const { token, signOut } = useAuth();
  const { tankId, setTankId, touchTanks, revision } = useTankSelection();
  const navigate = useNavigate();
  const toast = useToast();
  const [tanks, setTanks] = useState({ loading: true, data: [], error: null });
  const [editor, setEditor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setTanks((current) => ({ ...current, loading: true }));
    listTanks(token)
      .then((data) => {
        if (cancelled) return;
        setTanks({ loading: false, data: Array.isArray(data) ? data : [], error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 401) signOut();
        setTanks({ loading: false, data: [], error });
      });
    return () => {
      cancelled = true;
    };
  }, [token, revision]);

  const choose = (tank) => {
    if (managing) {
      setEditor({ mode: "edit", tank });
      return;
    }
    setTankId(tank.id);
    navigate("/");
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {managing ? t("tanks.manage") : tanks.data.length ? t("tanks.choice") : t("tanks.create")}
          </h1>
          {!tanks.loading && tanks.data.length === 0 ? <p className="mt-2 text-sm text-slate-600">{t("tanks.empty")}</p> : null}
        </div>
        <div className="flex gap-2">
          <PrimaryButton type="button" onClick={() => setEditor({ mode: "create", tank: null })}>
            {t("tanks.add")}
          </PrimaryButton>
          {managing && tanks.data.length > 0 ? (
            <Link to="/" className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
              {t("tanks.finish")}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="mt-6">
        {tanks.loading ? <Spinner label={t("loading")} /> : null}
        {tanks.error ? <Notice>{describeError(tanks.error, t)}</Notice> : null}
        {!tanks.loading && !tanks.error && tanks.data.length === 0 ? <Notice tone="empty">{t("tanks.empty")}</Notice> : null}
      </div>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {tanks.data.map((tank) => (
          <li key={tank.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={() => choose(tank)} className="block w-full text-left" aria-label={t("tanks.select", { name: tank.name })}>
              <TankPhoto token={token} tank={tank} />
              <span className="block px-4 py-3 text-lg font-semibold text-slate-800">{tank.name}</span>
            </button>
            {managing ? (
              <div className="flex gap-2 px-4 pb-4">
                <QuietButton type="button" onClick={() => setEditor({ mode: "edit", tank })}>
                  {t("tanks.form.edit_button")}
                </QuietButton>
                <QuietButton type="button" onClick={() => setPendingDelete(tank)}>
                  {t("tanks.form.delete")}
                </QuietButton>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <TankDialog
        editor={editor}
        token={token}
        onClose={() => setEditor(null)}
        onCreated={(name) => {
          toast.push(t("tanks.form.created", { name }), "success");
          touchTanks();
        }}
        onUpdated={(name) => {
          toast.push(t("tanks.form.updated", { name }), "success");
          touchTanks();
        }}
      />
      <DeleteDialog
        tank={pendingDelete}
        token={token}
        onClose={() => setPendingDelete(null)}
        onDeleted={(removed) => {
          if (String(tankId) === String(removed.id)) setTankId(null);
          toast.push(t("tanks.form.deleted", { name: removed.name }), "success");
          touchTanks();
        }}
      />
    </section>
  );
}

function TankPhoto({ token, tank, className = "h-36 w-full bg-cyan-50 object-contain p-4" }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!tank?.photo_url) {
      setSrc(null);
      return undefined;
    }
    let cancelled = false;
    let objectUrl = null;
    fetchTankPhoto(token, tank.photo_url)
      .then((url) => {
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [token, tank?.id, tank?.photo_url]);

  return <img src={src || "/tank-placeholder.svg"} alt="" className={className} />;
}

function TankDialog({ editor, token, onClose, onCreated, onUpdated }) {
  const { t } = useTranslation();
  const open = Boolean(editor);
  const editing = editor?.mode === "edit";
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [failures, setFailures] = useState([]);
  const [catalog, setCatalog] = useState({ loading: false, parameters: [], error: null });
  const [paramQuery, setParamQuery] = useState("");
  const [paramsDirty, setParamsDirty] = useState(false);
  const [customParameters, setCustomParameters] = useState([]);
  const [customDraft, setCustomDraft] = useState({ name: "", unit: "" });
  const [customError, setCustomError] = useState("");
  const customNameId = useId();
  const customUnitId = useId();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      waterType: "seawater",
      parameterIds: [],
    },
  });

  const waterType = watch("waterType");
  const parameterIds = watch("parameterIds") ?? [];

  useEffect(() => {
    if (!open) return;
    reset({
      name: editor?.tank?.name ?? "",
      waterType: "seawater",
      parameterIds: [],
    });
    setFile(null);
    setPreview(null);
    setFileError("");
    setFailures([]);
    setParamQuery("");
    setParamsDirty(false);
    setCustomParameters([]);
    setCustomDraft({ name: "", unit: "" });
    setCustomError("");
    setCatalog({ loading: !editing, parameters: [], error: null });
  }, [open, editor, editing, reset]);

  useEffect(() => {
    if (!open || editing || !token) return undefined;
    let cancelled = false;
    setCatalog((current) => ({ ...current, loading: true, error: null }));
    listParameters(token)
      .then((parameters) => {
        if (cancelled) return;
        const list = Array.isArray(parameters) ? parameters : [];
        setCatalog({ loading: false, parameters: list, error: null });
        const type = getValues("waterType") || "seawater";
        setValue("parameterIds", presetParameterIds(list, type), { shouldDirty: false });
        setParamsDirty(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalog({ loading: false, parameters: [], error });
      });
    return () => {
      cancelled = true;
    };
  }, [open, editing, token, getValues, setValue]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const applyDefaults = (type = waterType, markClean = true) => {
    setValue("parameterIds", presetParameterIds(catalog.parameters, type), { shouldDirty: false });
    if (markClean) setParamsDirty(false);
  };

  const onWaterTypeChange = (next) => {
    const previous = getValues("waterType");
    if (next === previous) return;
    setValue("waterType", next, { shouldValidate: true });
    if (!paramsDirty) {
      applyDefaults(next, true);
      return;
    }
    if (window.confirm(t("tanks.form.replace_defaults", { type: t(`tanks.form.water_type_${next}`) }))) {
      applyDefaults(next, true);
    }
  };

  const toggleParameter = (id, checked) => {
    const current = getValues("parameterIds") ?? [];
    const next = checked ? [...new Set([...current, id])] : current.filter((value) => value !== id);
    setValue("parameterIds", next, { shouldDirty: true });
    setParamsDirty(true);
  };

  const selectFiltered = (ids, checked) => {
    const current = new Set(getValues("parameterIds") ?? []);
    ids.forEach((id) => {
      if (checked) current.add(id);
      else current.delete(id);
    });
    setValue("parameterIds", [...current], { shouldDirty: true });
    setParamsDirty(true);
  };

  const addCustomParameter = () => {
    const name = customDraft.name.trim();
    const unit = customDraft.unit.trim();
    if (!name) {
      setCustomError(t("tanks.form.custom_name_required"));
      return;
    }
    const duplicate = customParameters.some((item) => item.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setCustomError(t("tanks.form.custom_duplicate"));
      return;
    }
    setCustomParameters((current) => [...current, { key: `${name}-${Date.now()}`, name, unit }]);
    setCustomDraft({ name: "", unit: "" });
    setCustomError("");
  };

  const onFile = (event) => {
    const next = event.target.files?.[0];
    if (!next) return;
    if (!imageExtensionOk(next)) {
      setFile(null);
      setPreview(null);
      setFileError(t("tanks.form.image_extension"));
      return;
    }
    setFileError("");
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const onSubmit = handleSubmit(async (values) => {
    if (fileError) return;
    const name = values.name.trim();
    try {
      if (editing) {
        const updated = await updateTank(token, editor.tank.id, name);
        if (file) {
          try {
            await uploadTankPhoto(token, updated.id, file);
          } catch (error) {
            onUpdated(updated.name);
            setFailures([error]);
            return;
          }
        }
        onUpdated(updated.name);
        onClose();
        return;
      }
      const created = await createTank(token, {
        name,
        waterType: values.waterType,
        enabledParameterIds: values.parameterIds ?? [],
        customParameters: customParameters.map(({ name: customName, unit }) => ({
          name: customName,
          unit,
        })),
      });
      if (file) {
        try {
          await uploadTankPhoto(token, created.id, file);
        } catch (error) {
          onCreated(name);
          setFailures([error]);
          return;
        }
      }
      onCreated(name);
      onClose();
    } catch (error) {
      setFailures([error]);
    }
  });

  const filteredParameters = catalog.parameters.filter((parameter) =>
    parameterMatchesQuery(parameter, paramQuery, parameterLabel(t, parameter.name)),
  );

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="overflow-y-auto p-5">
            <DialogTitle className="text-lg font-semibold text-ink">
              {editing ? t("tanks.form.edit_title") : t("tanks.form.create_title")}
            </DialogTitle>
            <form className="mt-4 grid gap-4" onSubmit={onSubmit} noValidate>
              {failures.map((error) => (
                <Notice key={error.functionName || error.message} title={error.code === "missing_endpoint" ? t("api.missing_title") : undefined}>
                  {describeError(error, t)}
                </Notice>
              ))}

              {!editing ? (
                <Field className="grid gap-2">
                  <Label className="text-sm font-medium text-slate-700">{t("tanks.form.water_type")}</Label>
                  <RadioGroup value={waterType} onChange={onWaterTypeChange} className="grid gap-2 sm:grid-cols-2">
                    {["seawater", "freshwater"].map((type) => (
                      <Radio
                        key={type}
                        value={type}
                        className="group cursor-pointer rounded-2xl border border-slate-200 px-3 py-3 transition data-[checked]:border-sea data-[checked]:bg-cyan-50 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-sea"
                      >
                        <span className="block text-sm font-semibold text-ink">{t(`tanks.form.water_type_${type}`)}</span>
                        <span className="mt-1 block text-xs text-slate-500">{t(`tanks.form.water_type_${type}_hint`)}</span>
                      </Radio>
                    ))}
                  </RadioGroup>
                  {errors.waterType ? (
                    <p className="text-sm text-rose-600" role="alert">
                      {errors.waterType.message}
                    </p>
                  ) : null}
                  <input type="hidden" {...register("waterType", { required: t("tanks.form.water_type_required") })} />
                </Field>
              ) : null}

              <TextField
                label={t("tanks.form.name")}
                error={errors.name?.message}
                {...register("name", { required: t("tanks.form.name_required") })}
              />

              <div className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">{t("tanks.photo")}</span>
                <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-slate-200 px-3 text-sm font-medium text-ink">
                  {file ? file.name : t("tanks.photo_pick")}
                  <input
                    type="file"
                    accept=".png,.gif,.svg,.jpeg,.jpg,image/png,image/gif,image/svg+xml,image/jpeg"
                    onChange={onFile}
                    className="sr-only"
                  />
                </label>
                <span className="text-sm text-slate-500">{t("tanks.photo_hint")}</span>
              </div>
              {fileError ? <Notice>{fileError}</Notice> : null}
              {preview ? (
                <img src={preview} alt={t("tanks.form.current_photo")} className="h-32 w-full rounded-2xl bg-cyan-50 object-contain" />
              ) : (
                <TankPhoto token={token} tank={editor?.tank} className="h-32 w-full rounded-2xl bg-cyan-50 object-contain p-3" />
              )}

              {!editing ? (
                <div className="grid gap-3 rounded-2xl border border-slate-200 p-3">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-ink">{t("tanks.form.parameters_title")}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{t("tanks.form.parameters_selected", { count: parameterIds.length })}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <QuietButton type="button" className="h-9 px-3 text-xs" onClick={() => selectFiltered(filteredParameters.map((item) => item.id), true)}>
                        {t("tanks.form.select_filtered")}
                      </QuietButton>
                      <QuietButton type="button" className="h-9 px-3 text-xs" onClick={() => applyDefaults(waterType, true)}>
                        {t("tanks.form.reset_defaults")}
                      </QuietButton>
                    </div>
                  </div>

                  <label className="grid gap-1.5">
                    <span className="sr-only">{t("tanks.form.parameters_search")}</span>
                    <input
                      type="search"
                      value={paramQuery}
                      onChange={(event) => setParamQuery(event.target.value)}
                      placeholder={t("tanks.form.parameters_search")}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-sea"
                    />
                  </label>

                  {catalog.loading ? <Spinner label={t("loading")} /> : null}
                  {catalog.error ? <Notice>{describeError(catalog.error, t)}</Notice> : null}

                  {!catalog.loading && !catalog.error ? (
                    <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-2">
                      {filteredParameters.length === 0 ? (
                        <li className="px-2 py-3 text-sm text-slate-500">{t("tanks.form.parameters_empty")}</li>
                      ) : (
                        filteredParameters.map((parameter) => {
                          const label = parameterLabel(t, parameter.name);
                          const checked = parameterIds.includes(parameter.id);
                          return (
                            <li key={parameter.id}>
                              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white">
                                <Checkbox
                                  checked={checked}
                                  onChange={(value) => toggleParameter(parameter.id, value)}
                                  className="group flex size-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white data-[checked]:border-sea data-[checked]:bg-sea"
                                >
                                  <svg viewBox="0 0 14 14" fill="none" className="size-3 stroke-white opacity-0 group-data-[checked]:opacity-100">
                                    <path d="M3 7.5 5.5 10 11 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </Checkbox>
                                <span className="text-sm font-medium text-slate-800">
                                  {label}
                                  {parameter.sub_name ? <span className="font-normal text-slate-400"> ({parameter.sub_name})</span> : null}
                                </span>
                              </label>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  ) : null}

                  <p className="text-xs text-slate-500">{t("tanks.form.parameters_later")}</p>

                  <div className="grid gap-2 border-t border-slate-100 pt-3">
                    <h4 className="text-sm font-semibold text-ink">{t("tanks.form.custom_title")}</h4>
                    <p className="text-xs text-slate-500">{t("tanks.form.custom_help")}</p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                      <label className="grid gap-1" htmlFor={customNameId}>
                        <span className="text-xs font-medium text-slate-600">{t("tanks.form.custom_name")}</span>
                        <input
                          id={customNameId}
                          value={customDraft.name}
                          onChange={(event) => setCustomDraft((current) => ({ ...current, name: event.target.value }))}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-sea"
                        />
                      </label>
                      <label className="grid gap-1" htmlFor={customUnitId}>
                        <span className="text-xs font-medium text-slate-600">{t("tanks.form.custom_unit")}</span>
                        <input
                          id={customUnitId}
                          value={customDraft.unit}
                          onChange={(event) => setCustomDraft((current) => ({ ...current, unit: event.target.value }))}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-sea"
                        />
                      </label>
                      <QuietButton type="button" onClick={addCustomParameter} className="sm:mt-5">
                        {t("tanks.form.custom_add")}
                      </QuietButton>
                    </div>
                    {customError ? (
                      <p className="text-sm text-rose-600" role="alert">
                        {customError}
                      </p>
                    ) : null}
                    {customParameters.length > 0 ? (
                      <ul className="grid gap-2">
                        {customParameters.map((item) => (
                          <li key={item.key} className="flex items-center justify-between gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-sm">
                            <span className="font-medium text-ink">
                              {item.name}
                              {item.unit ? <span className="font-normal text-slate-500"> ({item.unit})</span> : null}
                            </span>
                            <button
                              type="button"
                              className="text-xs font-semibold text-rose-700"
                              onClick={() => setCustomParameters((current) => current.filter((entry) => entry.key !== item.key))}
                            >
                              {t("tanks.form.custom_remove")}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2">
                <QuietButton type="button" onClick={onClose} className="flex-1">
                  {t("tanks.form.cancel")}
                </QuietButton>
                <PrimaryButton type="submit" disabled={isSubmitting} className="flex-1">
                  {editing ? t("tanks.form.edit_button") : t("tanks.form.create_button")}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function DeleteDialog({ tank, token, onClose, onDeleted }) {
  const { t } = useTranslation();
  const [failure, setFailure] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFailure(null);
  }, [tank]);

  const confirm = async () => {
    setPending(true);
    setFailure(null);
    try {
      await deleteTank(token, tank.id);
      onDeleted(tank);
      onClose();
    } catch (error) {
      setFailure(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={Boolean(tank)} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-ink">
            {t("delete_modal.title", { name: tank?.name })}
          </DialogTitle>
          <p className="mt-2 text-sm text-slate-600">{t("delete_modal.warning")}</p>
          {failure ? (
            <div className="mt-4">
              <Notice>{describeError(failure, t)}</Notice>
            </div>
          ) : null}
          <div className="mt-5 flex gap-2">
            <QuietButton type="button" onClick={onClose} className="flex-1">
              {t("delete_modal.cancel")}
            </QuietButton>
            <PrimaryButton type="button" onClick={confirm} disabled={pending} tone="danger" className="flex-1">
              {t("delete_modal.delete")}
            </PrimaryButton>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
