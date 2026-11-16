import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Field,
  Label,
  Radio,
  RadioGroup,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
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

const TAB_GENERAL = 0;
const TAB_PARAMETERS = 1;

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
  }, [token, revision, signOut]);

  const choose = (tank) => {
    if (managing) {
      setEditor({ mode: "edit", tank, tab: "general" });
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
          <PrimaryButton type="button" onClick={() => setEditor({ mode: "create", tank: null, tab: "general" })}>
            {t("tanks.add")}
          </PrimaryButton>
          {managing && tanks.data.length > 0 ? (
            <Link
              to="/"
              className="inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm"
            >
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
            <button
              type="button"
              onClick={() => choose(tank)}
              className="block w-full text-left"
              aria-label={t("tanks.select", { name: tank.name })}
            >
              <TankPhoto token={token} tank={tank} />
              <span className="block px-4 pt-3 text-lg font-semibold leading-snug text-ink">{tank.name}</span>
              {tank.water_type ? (
                <span className="mt-1.5 inline-flex px-4 pb-3">
                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-sea">
                    {t(`tanks.form.water_type_${tank.water_type}`)}
                  </span>
                </span>
              ) : (
                <span className="block pb-3" />
              )}
            </button>
            {managing ? (
              <div className="grid grid-cols-3 gap-2 border-t border-slate-200 bg-slate-50 px-3 py-3">
                <ActionButton
                  tone="primary"
                  label={t("tanks.form.edit_action")}
                  onClick={() => setEditor({ mode: "edit", tank, tab: "general" })}
                  icon={<IconEdit />}
                />
                <ActionButton
                  tone="secondary"
                  label={t("tanks.form.parameters_button")}
                  onClick={() => setEditor({ mode: "edit", tank, tab: "parameters" })}
                  icon={<IconSliders />}
                />
                <ActionButton
                  tone="danger"
                  label={t("tanks.form.delete")}
                  onClick={() => setPendingDelete(tank)}
                  icon={<IconTrash />}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <TankEditorSheet
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
        onParametersUpdated={(name) => {
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

function ActionButton({ label, onClick, icon, tone = "secondary" }) {
  const tones = {
    primary: "border-ink/20 bg-ink text-white hover:bg-[#12485c]",
    secondary: "border-slate-300 bg-white text-slate-800 hover:bg-white hover:border-slate-400",
    danger: "border-rose-300 bg-white text-rose-800 hover:bg-rose-50",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-center text-xs font-semibold shadow-sm transition sm:flex-row sm:gap-1.5 sm:text-sm ${tones[tone]}`}
    >
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M4 13.5V16h2.5L14.8 7.7l-2.5-2.5L4 13.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m11.4 5.9 2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path d="M3.5 6.5h13M3.5 13.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="7.5" cy="6.5" r="2" fill="currentColor" />
      <circle cx="12.5" cy="13.5" r="2" fill="currentColor" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <path d="M5 6.5h10M8 6.5V5h4v1.5M7 6.5v8.5h6V6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TankPhoto({ token, tank, className = "h-40 w-full bg-cyan-50 object-cover" }) {
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

  return <img src={src || "/tank-placeholder.svg"} alt="" className={src ? className : `${className} object-contain p-4`} />;
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

function TankEditorSheet({ editor, token, onClose, onCreated, onUpdated, onParametersUpdated }) {
  const { t } = useTranslation();
  const open = Boolean(editor);
  const editing = editor?.mode === "edit";
  const initialTab = editor?.tab === "parameters" ? TAB_PARAMETERS : TAB_GENERAL;
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [failures, setFailures] = useState([]);
  const [catalog, setCatalog] = useState({ loading: false, parameters: [], error: null });
  const [paramQuery, setParamQuery] = useState("");
  const [paramsDirty, setParamsDirty] = useState(false);
  const [paramsLoading, setParamsLoading] = useState(false);
  const [paramsSaving, setParamsSaving] = useState(false);
  const [parameterIds, setParameterIds] = useState([]);
  const [linkedCustoms, setLinkedCustoms] = useState([]);
  const [baseline, setBaseline] = useState({ linkedCatalogIds: [], customs: [] });
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
  const createParameterIds = watch("parameterIds") ?? [];

  useEffect(() => {
    if (!open) return;
    reset({
      name: editor?.tank?.name ?? "",
      waterType: editor?.tank?.water_type === "freshwater" ? "freshwater" : "seawater",
      parameterIds: [],
    });
    setFile(null);
    setPreview(null);
    setFileError("");
    setFailures([]);
    setParamQuery("");
    setParamsDirty(false);
    resetCustoms();
    setParameterIds([]);
    setLinkedCustoms([]);
    setBaseline({ linkedCatalogIds: [], customs: [] });
    setCatalog({ loading: !editing, parameters: [], error: null });
    setSelectedTab(editor?.tab === "parameters" ? TAB_PARAMETERS : TAB_GENERAL);
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

  useEffect(() => {
    if (!open || !editing || !token || !editor?.tank) return undefined;
    let cancelled = false;
    setParamsLoading(true);
    setFailures([]);
    Promise.all([listParameters(token), listTankParameters(token, editor.tank.id)])
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
        setCatalog({ loading: false, parameters: catalogList, error: null });
        setParameterIds(enabledCatalog);
        setLinkedCustoms(customs);
        setBaseline({ linkedCatalogIds, customs });
        setParamsLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setCatalog({ loading: false, parameters: [], error });
        setParameterIds([]);
        setLinkedCustoms([]);
        setFailures([error]);
        setParamsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, editing, token, editor?.tank]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

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

  const toggleCreateParameter = (id, checked) => {
    const current = getValues("parameterIds") ?? [];
    const next = checked ? [...new Set([...current, id])] : current.filter((value) => value !== id);
    setValue("parameterIds", next, { shouldDirty: true });
    setParamsDirty(true);
  };

  const selectFilteredCreate = (ids, checked) => {
    const current = new Set(getValues("parameterIds") ?? []);
    ids.forEach((id) => {
      if (checked) current.add(id);
      else current.delete(id);
    });
    setValue("parameterIds", [...current], { shouldDirty: true });
    setParamsDirty(true);
  };

  const toggleEditParameter = (id, checked) => {
    setParameterIds((current) => (checked ? [...new Set([...current, id])] : current.filter((value) => value !== id)));
  };

  const selectFilteredEdit = (ids, checked) => {
    setParameterIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return [...next];
    });
  };

  const applyEditDefaults = () => {
    const type = editor?.tank?.water_type || "seawater";
    setParameterIds(presetParameterIds(catalog.parameters, type));
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

  const onSubmitGeneral = handleSubmit(async (values) => {
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

  const onSaveParameters = async () => {
    if (!editing || !editor?.tank) return;
    setParamsSaving(true);
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
        await updateTankParameters(token, editor.tank.id, patch);
      }
      for (const item of customParameters) {
        await createCustomTankParameter(token, editor.tank.id, { name: item.name, unit: item.unit });
      }
      onParametersUpdated(editor.tank.name);
      onClose();
    } catch (error) {
      setFailures([error]);
    } finally {
      setParamsSaving(false);
    }
  };

  const footerBusy = isSubmitting || paramsSaving;
  const showCreateSave = !editing;
  const showGeneralSave = editing && selectedTab === TAB_GENERAL;
  const showParametersSave = editing && selectedTab === TAB_PARAMETERS;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/50" />
      <div className="fixed inset-0 flex items-stretch justify-center sm:items-center sm:p-4">
        <DialogPanel className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl sm:h-[min(92vh,880px)] sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
            <div>
              <DialogTitle className="text-xl font-semibold text-ink">
                {editing ? t("tanks.form.edit_title") : t("tanks.form.create_title")}
              </DialogTitle>
              {editing && editor?.tank?.name ? (
                <p className="mt-1 text-sm text-slate-500">{editor.tank.name}</p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">{t("tanks.form.edit_sheet_hint")}</p>
              )}
            </div>
            <QuietButton type="button" onClick={onClose} className="shrink-0 px-3" aria-label={t("tanks.form.cancel")}>
              ✕
            </QuietButton>
          </div>

          <TabGroup selectedIndex={selectedTab} onChange={setSelectedTab} className="flex min-h-0 flex-1 flex-col">
            <TabList className="mx-4 mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 sm:mx-6">
              <Tab className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none transition data-[selected]:bg-white data-[selected]:text-ink data-[selected]:shadow-sm data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-sea">
                {t("tanks.form.tab_general")}
              </Tab>
              <Tab className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none transition data-[selected]:bg-white data-[selected]:text-ink data-[selected]:shadow-sm data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-sea">
                {t("tanks.form.tab_parameters")}
              </Tab>
            </TabList>

            <TabPanels className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <TabPanel className="grid gap-4 outline-none">
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
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t("tanks.form.water_type")}</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{t(`tanks.form.water_type_${editor.tank.water_type}`)}</p>
                    <p className="mt-1 text-xs text-slate-500">{t("tanks.form.water_type_immutable")}</p>
                  </div>
                ) : null}

                <TextField
                  label={t("tanks.form.name")}
                  error={errors.name?.message}
                  {...register("name", { required: t("tanks.form.name_required") })}
                />

                <div className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">{t("tanks.photo")}</span>
                  <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-ink shadow-sm">
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
                  <img src={preview} alt={t("tanks.form.current_photo")} className="h-44 w-full rounded-2xl bg-cyan-50 object-cover" />
                ) : (
                  <TankPhoto token={token} tank={editor?.tank} className="h-44 w-full rounded-2xl bg-cyan-50 object-cover" />
                )}
              </TabPanel>

              <TabPanel className="grid gap-4 outline-none">
                {failures.map((error) => (
                  <Notice key={`params-${error.functionName || error.message}`}>{describeError(error, t)}</Notice>
                ))}
                {editing && paramsLoading ? <Spinner label={t("loading")} /> : null}
                {!editing ? (
                  <TankParameterPicker
                    catalog={catalog.parameters}
                    catalogLoading={catalog.loading}
                    catalogError={catalog.error}
                    parameterIds={createParameterIds}
                    onToggleParameter={toggleCreateParameter}
                    onSelectFiltered={selectFilteredCreate}
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
                ) : null}
                {editing && !paramsLoading ? (
                  <TankParameterPicker
                    catalog={catalog.parameters}
                    catalogLoading={catalog.loading}
                    catalogError={catalog.error}
                    parameterIds={parameterIds}
                    onToggleParameter={toggleEditParameter}
                    onSelectFiltered={selectFilteredEdit}
                    onResetDefaults={applyEditDefaults}
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
              </TabPanel>
            </TabPanels>

            <div className="flex gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
              <QuietButton type="button" onClick={onClose} className="flex-1 border-slate-300 text-slate-800" disabled={footerBusy}>
                {t("tanks.form.cancel")}
              </QuietButton>
              {showCreateSave || showGeneralSave ? (
                <PrimaryButton type="button" onClick={onSubmitGeneral} disabled={footerBusy} className="flex-1">
                  {editing ? t("tanks.form.edit_button") : t("tanks.form.create_button")}
                </PrimaryButton>
              ) : null}
              {showParametersSave ? (
                <PrimaryButton type="button" onClick={onSaveParameters} disabled={footerBusy || paramsLoading} className="flex-1">
                  {t("tanks.form.parameters_save")}
                </PrimaryButton>
              ) : null}
            </div>
          </TabGroup>
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
