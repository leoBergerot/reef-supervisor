import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
  Radio,
  RadioGroup,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createCustomTankParameter,
  createTank,
  deleteTank,
  describeError,
  fetchTankPhoto,
  listParameters,
  listTankParameters,
  listTanks,
  updateTank,
  updateTankParameters,
  uploadTankPhoto,
} from "../api/client";
import { TankParameterPicker } from "../components/TankParameterPicker";
import { Notice, PrimaryButton, QuietButton, Spinner, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { imageExtensionOk } from "../lib/format";
import { presetParameterIds } from "../lib/tankPresets";

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
  const [parametersEditor, setParametersEditor] = useState(null);
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
              {tank.water_type ? (
                <span className="block px-4 pb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t(`tanks.form.water_type_${tank.water_type}`)}
                </span>
              ) : null}
            </button>
            {managing ? (
              <div className="flex flex-wrap gap-2 px-4 pb-4">
                <QuietButton type="button" onClick={() => setEditor({ mode: "edit", tank })}>
                  {t("tanks.form.edit_button")}
                </QuietButton>
                <QuietButton type="button" onClick={() => setParametersEditor(tank)}>
                  {t("tanks.form.parameters_button")}
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
        onOpenParameters={(tank) => {
          setEditor(null);
          setParametersEditor(tank);
        }}
        onCreated={(name) => {
          toast.push(t("tanks.form.created", { name }), "success");
          touchTanks();
        }}
        onUpdated={(name) => {
          toast.push(t("tanks.form.updated", { name }), "success");
          touchTanks();
        }}
      />
      <TankParametersDialog
        tank={parametersEditor}
        token={token}
        onClose={() => setParametersEditor(null)}
        onSaved={(name) => {
          toast.push(t("tanks.form.parameters_updated", { name }), "success");
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

function usePendingCustoms() {
  const { t } = useTranslation();
  const [customParameters, setCustomParameters] = useState([]);
  const [customDraft, setCustomDraft] = useState({ name: "", unit: "" });
  const [customError, setCustomError] = useState("");

  const resetCustoms = () => {
    setCustomParameters([]);
    setCustomDraft({ name: "", unit: "" });
    setCustomError("");
  };

  const addCustomParameter = (extraNames = []) => {
    const name = customDraft.name.trim();
    const unit = customDraft.unit.trim();
    if (!name) {
      setCustomError(t("tanks.form.custom_name_required"));
      return false;
    }
    if (!unit) {
      setCustomError(t("tanks.form.custom_unit_required"));
      return false;
    }
    const duplicatePending = customParameters.some((item) => item.name.toLowerCase() === name.toLowerCase());
    const duplicateExtra = extraNames.some((value) => String(value).toLowerCase() === name.toLowerCase());
    if (duplicatePending || duplicateExtra) {
      setCustomError(t("tanks.form.custom_duplicate"));
      return false;
    }
    setCustomParameters((current) => [...current, { key: `${name}-${Date.now()}`, name, unit }]);
    setCustomDraft({ name: "", unit: "" });
    setCustomError("");
    return true;
  };

  return {
    customParameters,
    setCustomParameters,
    customDraft,
    setCustomDraft,
    customError,
    setCustomError,
    resetCustoms,
    addCustomParameter,
  };
}

function TankDialog({ editor, token, onClose, onCreated, onUpdated, onOpenParameters }) {
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
  const {
    customParameters,
    setCustomParameters,
    customDraft,
    setCustomDraft,
    customError,
    resetCustoms,
    addCustomParameter,
  } = usePendingCustoms();
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
    resetCustoms();
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
              ) : editor?.tank?.water_type ? (
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-700">{t("tanks.form.water_type")}: </span>
                  {t(`tanks.form.water_type_${editor.tank.water_type}`)}
                </p>
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
                <TankParameterPicker
                  catalog={catalog.parameters}
                  catalogLoading={catalog.loading}
                  catalogError={catalog.error}
                  parameterIds={parameterIds}
                  onToggleParameter={toggleParameter}
                  onSelectFiltered={selectFiltered}
                  onResetDefaults={() => applyDefaults(waterType, true)}
                  paramQuery={paramQuery}
                  onParamQueryChange={setParamQuery}
                  pendingCustoms={customParameters}
                  onAddPendingCustom={() => addCustomParameter()}
                  onRemovePendingCustom={(key) => setCustomParameters((current) => current.filter((entry) => entry.key !== key))}
                  customDraft={customDraft}
                  onCustomDraftChange={setCustomDraft}
                  customError={customError}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
                  <p className="text-sm text-slate-600">{t("tanks.form.parameters_edit_hint")}</p>
                  <QuietButton
                    type="button"
                    className="mt-3"
                    onClick={() => onOpenParameters(editor.tank)}
                  >
                    {t("tanks.form.parameters_button")}
                  </QuietButton>
                </div>
              )}

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

function TankParametersDialog({ tank, token, onClose, onSaved }) {
  const { t } = useTranslation();
  const open = Boolean(tank);
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [parameterIds, setParameterIds] = useState([]);
  const [linkedCustoms, setLinkedCustoms] = useState([]);
  const [paramQuery, setParamQuery] = useState("");
  const [baseline, setBaseline] = useState({ catalogEnabled: [], customs: [] });
  const {
    customParameters,
    setCustomParameters,
    customDraft,
    setCustomDraft,
    customError,
    resetCustoms,
    addCustomParameter,
  } = usePendingCustoms();

  useEffect(() => {
    if (!open || !token || !tank) return undefined;
    let cancelled = false;
    setFailures([]);
    setParamQuery("");
    resetCustoms();
    setLoading(true);
    Promise.all([listParameters(token), listTankParameters(token, tank.id)])
      .then(([parameters, tankParameters]) => {
        if (cancelled) return;
        const catalogList = Array.isArray(parameters) ? parameters : [];
        const rows = Array.isArray(tankParameters) ? tankParameters : [];
        const linkedCatalogIds = rows.filter((row) => !row.is_custom).map((row) => row.parameter.id);
        const enabledCatalog = rows
          .filter((row) => !row.is_custom && row.enabled)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id)
          .map((row) => row.parameter.id);
        const customs = rows
          .filter((row) => row.is_custom)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id)
          .map((row) => ({
            parameterId: row.parameter.id,
            name: row.parameter.name,
            unit: row.parameter.sub_name,
            enabled: row.enabled,
            sortOrder: row.sort_order ?? 0,
          }));
        setCatalog(catalogList);
        setParameterIds(enabledCatalog);
        setLinkedCustoms(customs);
        setBaseline({ linkedCatalogIds, customs });
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalog([]);
        setParameterIds([]);
        setLinkedCustoms([]);
        setFailures([error]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token, tank]);

  const toggleParameter = (id, checked) => {
    setParameterIds((current) => (checked ? [...new Set([...current, id])] : current.filter((value) => value !== id)));
  };

  const selectFiltered = (ids, checked) => {
    setParameterIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return [...next];
    });
  };

  const applyDefaults = () => {
    const type = tank?.water_type || "seawater";
    setParameterIds(presetParameterIds(catalog, type));
  };

  const onSave = async () => {
    setSaving(true);
    setFailures([]);
    try {
      const enabledOrder = [
        ...parameterIds,
        ...linkedCustoms.filter((item) => item.enabled).map((item) => item.parameterId),
      ];
      const catalogIds = new Set([...(baseline.linkedCatalogIds || []), ...parameterIds]);
      const catalogPatch = [...catalogIds].map((parameterId) => ({
        parameterId,
        enabled: parameterIds.includes(parameterId),
        sortOrder: enabledOrder.includes(parameterId)
          ? enabledOrder.indexOf(parameterId)
          : enabledOrder.length + parameterId,
      }));
      const customPatch = linkedCustoms.map((item) => ({
        parameterId: item.parameterId,
        enabled: item.enabled,
        sortOrder: enabledOrder.includes(item.parameterId)
          ? enabledOrder.indexOf(item.parameterId)
          : enabledOrder.length + item.parameterId,
      }));
      const patch = [...catalogPatch, ...customPatch];
      if (patch.length > 0) {
        await updateTankParameters(token, tank.id, patch);
      }
      for (const item of customParameters) {
        await createCustomTankParameter(token, tank.id, { name: item.name, unit: item.unit });
      }
      onSaved(tank.name);
      onClose();
    } catch (error) {
      setFailures([error]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
          <div className="overflow-y-auto p-5">
            <DialogTitle className="text-lg font-semibold text-ink">
              {t("tanks.form.parameters_edit_title", { name: tank?.name })}
            </DialogTitle>
            {tank?.water_type ? (
              <p className="mt-1 text-sm text-slate-500">
                {t(`tanks.form.water_type_${tank.water_type}`)} — {t("tanks.form.water_type_immutable")}
              </p>
            ) : null}

            <div className="mt-4 grid gap-4">
              {failures.map((error) => (
                <Notice key={error.functionName || error.message}>{describeError(error, t)}</Notice>
              ))}
              {loading ? <Spinner label={t("loading")} /> : null}
              {!loading ? (
                <TankParameterPicker
                  catalog={catalog}
                  parameterIds={parameterIds}
                  onToggleParameter={toggleParameter}
                  onSelectFiltered={selectFiltered}
                  onResetDefaults={applyDefaults}
                  paramQuery={paramQuery}
                  onParamQueryChange={setParamQuery}
                  pendingCustoms={customParameters}
                  onAddPendingCustom={() =>
                    addCustomParameter(linkedCustoms.map((item) => item.name).concat(customParameters.map((item) => item.name)))
                  }
                  onRemovePendingCustom={(key) => setCustomParameters((current) => current.filter((entry) => entry.key !== key))}
                  customDraft={customDraft}
                  onCustomDraftChange={setCustomDraft}
                  customError={customError}
                  linkedCustoms={linkedCustoms}
                  onToggleLinkedCustom={(parameterId, enabled) => {
                    setLinkedCustoms((current) =>
                      current.map((item) => (item.parameterId === parameterId ? { ...item, enabled } : item)),
                    );
                  }}
                  laterHint
                />
              ) : null}
              <div className="flex gap-2">
                <QuietButton type="button" onClick={onClose} className="flex-1" disabled={saving}>
                  {t("tanks.form.cancel")}
                </QuietButton>
                <PrimaryButton type="button" onClick={onSave} disabled={saving || loading} className="flex-1">
                  {t("tanks.form.parameters_save")}
                </PrimaryButton>
              </div>
            </div>
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
