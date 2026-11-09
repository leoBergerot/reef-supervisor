import { Menu, MenuButton, MenuItem, MenuItems, Popover, PopoverButton, PopoverPanel, Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createMeasure,
  describeError,
  listMeasures,
  listParameters,
  listPreferences,
  updatePreference,
} from "../api/client";
import { Notice, PrimaryButton, Spinner, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useParameter } from "../context/ParameterContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatDelta, numericValue, parameterLabel, toDateTimeInput } from "../lib/format";

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { token, signOut } = useAuth();
  const { tankId } = useTankSelection();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState({ loading: true, parameters: [], preferences: [], error: null });

  useEffect(() => {
    if (!tankId) {
      navigate("/tanks", { replace: true });
    }
  }, [tankId, navigate]);

  const load = () => {
    setCatalog((current) => ({ ...current, loading: true, error: null }));
    Promise.all([listParameters(token), listPreferences(token)])
      .then(([parameters, preferences]) => {
        setCatalog({
          loading: false,
          parameters: Array.isArray(parameters) ? parameters : [],
          preferences: Array.isArray(preferences) ? preferences : [],
          error: null,
        });
      })
      .catch((error) => {
        if (error?.status === 401) signOut();
        setCatalog({ loading: false, parameters: [], preferences: [], error });
      });
  };

  useEffect(() => {
    if (token && tankId) load();
  }, [token, tankId]);

  if (!tankId) return null;
  if (catalog.loading) return <Spinner label={t("loading")} />;
  if (catalog.error) {
    return (
      <Notice title={t("catalog.error")}>{describeError(catalog.error, t)}</Notice>
    );
  }
  if (catalog.parameters.length === 0) return <Notice tone="empty">{t("catalog.empty")}</Notice>;

  const preferenceByParameter = new Map(catalog.preferences.map((item) => [item.parameter.id, item]));
  const visible = catalog.parameters.filter((parameter) => preferenceByParameter.get(parameter.id)?.enabled !== false);
  const hidden = catalog.parameters.filter((parameter) => preferenceByParameter.get(parameter.id)?.enabled === false);

  const setEnabled = async (preference, enabled) => {
    try {
      await updatePreference(token, preference.id, enabled);
      load();
    } catch (error) {
      if (error?.status === 401) signOut();
      setCatalog((current) => ({ ...current, error }));
    }
  };

  return (
    <div className="grid gap-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((parameter) => (
          <MeasureCard
            key={parameter.id}
            parameter={parameter}
            preference={preferenceByParameter.get(parameter.id)}
            tankId={tankId}
            token={token}
            language={i18n.resolvedLanguage}
            onHide={() => {
              const preference = preferenceByParameter.get(parameter.id);
              if (preference) setEnabled(preference, false);
            }}
          />
        ))}
      </section>
      {hidden.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">{t("preferences.hidden_title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("preferences.hidden_help")}</p>
          <ul className="mt-4 grid gap-3">
            {hidden.map((parameter) => {
              const preference = preferenceByParameter.get(parameter.id);
              const label = parameterLabel(t, parameter.name);
              return (
                <li key={parameter.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {label}
                    {parameter.sub_name ? <span className="text-slate-400"> ({parameter.sub_name})</span> : null}
                  </span>
                  <Switch
                    checked={false}
                    onChange={() => preference && setEnabled(preference, true)}
                    aria-label={t("preferences.show", { name: label })}
                    className="group inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition data-[checked]:bg-sea"
                  >
                    <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
                  </Switch>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function MeasureCard({ parameter, preference, tankId, token, language, onHide }) {
  const { t } = useTranslation();
  const { setParameter } = useParameter();
  const navigate = useNavigate();
  const toast = useToast();
  const { signOut } = useAuth();
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const [formKey, setFormKey] = useState(0);
  const label = parameterLabel(t, parameter.name);
  const locale = language?.startsWith("en") ? "en" : "fr";

  const load = () => {
    setState((current) => ({ ...current, loading: true }));
    listMeasures(token, { page: 1, parameterId: parameter.id, tankId })
      .then((page) => setState({ loading: false, items: page.data ?? [], error: null }))
      .catch((error) => {
        if (error?.status === 401) signOut();
        setState({ loading: false, items: [], error });
      });
  };

  useEffect(() => {
    load();
  }, [parameter.id, tankId, token]);

  const last = state.items[0] ?? null;
  const previous = state.items[1] ?? null;
  const delta = last && previous ? formatDelta(last.value, previous.value) : null;
  const shown = numericValue(last?.value);

  const open = (path) => {
    setParameter({
      id: parameter.id,
      name: parameter.name,
      sub_name: parameter.sub_name,
      need_value: parameter.need_value,
    });
    navigate(path);
  };

  return (
    <article className="flex min-h-56 flex-col rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">
          {label}
          {parameter.sub_name ? <span className="font-medium text-slate-400"> ({parameter.sub_name})</span> : null}
        </h2>
        <Menu>
          <MenuButton className="rounded-lg px-2 py-1 text-slate-500 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-sea" aria-label={label}>
            ···
          </MenuButton>
          <MenuItems anchor="bottom end" className="z-40 w-52 rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg focus:outline-none">
            <MenuItem>
              <button type="button" className="block w-full rounded-lg px-3 py-2 text-left data-[focus]:bg-cyan-50" onClick={() => open("/measures")}>
                {t("measure.history")}
              </button>
            </MenuItem>
            <MenuItem>
              <button type="button" className="block w-full rounded-lg px-3 py-2 text-left data-[focus]:bg-cyan-50" onClick={() => open("/chart")}>
                {t("measure.chart")}
              </button>
            </MenuItem>
            {preference ? (
              <MenuItem>
                <button type="button" className="block w-full rounded-lg px-3 py-2 text-left data-[focus]:bg-cyan-50" onClick={onHide}>
                  {t("measure.hide")}
                </button>
              </MenuItem>
            ) : null}
          </MenuItems>
        </Menu>
      </div>
      <div className="mt-4 flex-1">
        {state.loading ? (
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        ) : state.error ? (
          <Notice>{describeError(state.error, t)}</Notice>
        ) : (
          <>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {shown === null ? t("measure.empty_value") : shown}
              {parameter.sub_name ? <span className="ml-2 text-base font-medium text-slate-400">{parameter.sub_name}</span> : null}
            </p>
            <p className="mt-1 text-xs text-slate-500">{last ? formatDateTime(last.created_at, locale) : ""}</p>
            {delta ? (
              <p className={`mt-2 text-sm font-medium ${delta.up ? "text-emerald-600" : "text-rose-600"}`}>
                {delta.up ? "+" : ""}
                {delta.delta}
                {parameter.sub_name ? ` ${parameter.sub_name}` : ""}
                {delta.percent !== null ? ` (${delta.up ? "+" : ""}${delta.percent} %)` : ""}
              </p>
            ) : last && previous ? (
              <p className="mt-2 text-xs text-slate-400">{t("measure.delta_unavailable")}</p>
            ) : null}
          </>
        )}
      </div>
      <Popover key={formKey} className="relative mt-3">
        <PopoverButton className="h-10 rounded-xl bg-cyan-50 px-3 text-sm font-semibold text-ink data-[hover]:bg-cyan-100">
          {t("measure.add")}
        </PopoverButton>
        <PopoverPanel anchor="bottom start" className="z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <AddReading
            parameter={parameter}
            tankId={tankId}
            token={token}
            onSaved={() => {
              toast.push(t("measure.saved"), "success");
              setFormKey((key) => key + 1);
              load();
            }}
            onRefresh={load}
          />
        </PopoverPanel>
      </Popover>
    </article>
  );
}

function AddReading({ parameter, tankId, token, onSaved, onRefresh }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [failure, setFailure] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      value: "",
      createdAt: toDateTimeInput(new Date()),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    const value = parameter.need_value ? numericValue(values.value) : null;
    try {
      const result = await createMeasure(token, {
        parameterId: parameter.id,
        tankId: Number(tankId),
        value,
        createdAt: new Date(values.createdAt).toISOString(),
      });
      if (result.warning) {
        setFailure(result.warning);
        onRefresh();
        return;
      }
      onSaved();
    } catch (error) {
      if (error?.status === 401) signOut();
      setFailure(error);
    }
  });

  return (
    <form className="grid gap-3" onSubmit={onSubmit} noValidate>
      {failure ? <Notice title={failure.code === "missing_endpoint" ? t("api.missing_title") : undefined}>{describeError(failure, t)}</Notice> : null}
      {parameter.need_value ? (
        <TextField
          label={t("measure.value")}
          inputMode="decimal"
          error={errors.value?.message}
          {...register("value", {
            validate: (value) => numericValue(value) !== null || t("measure.error_value"),
          })}
        />
      ) : (
        <p className="text-sm text-slate-500">{t("measure.no_value")}</p>
      )}
      <TextField
        label={t("measure.date")}
        type="datetime-local"
        error={errors.createdAt?.message}
        {...register("createdAt", { required: t("measure.error_date") })}
      />
      <PrimaryButton type="submit" disabled={isSubmitting}>
        {t("measure.validate")}
      </PrimaryButton>
    </form>
  );
}
