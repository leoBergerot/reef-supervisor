import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createMeasure,
  describeError,
  listMeasures,
  listTankParameters,
  listTanks,
} from "../api/client";
import { DateTimeField, Notice, PrimaryButton, QuietButton, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { numericValue, parameterLabel, toDateTimeInput } from "../lib/format";
import {
  evaluateRangeState,
  rangeStateClasses,
  resolveParameterRange,
} from "../lib/parameterRanges";

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const order = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (order !== 0) return order;
    return a.id - b.id;
  });
}

export function GroupedMeasurePage() {
  const { t, i18n } = useTranslation();
  const { token, signOut } = useAuth();
  const { tankId } = useTankSelection();
  const navigate = useNavigate();
  const toast = useToast();
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const firstFieldRef = useRef(null);

  const [catalog, setCatalog] = useState({ loading: true, rows: [], error: null });
  const [waterType, setWaterType] = useState("seawater");
  const [createdAt, setCreatedAt] = useState(() => toDateTimeInput(new Date()));
  const [dateError, setDateError] = useState(null);
  const [values, setValues] = useState({});
  const [included, setIncluded] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tankId) navigate("/tanks", { replace: true });
  }, [tankId, navigate]);

  useEffect(() => {
    if (!token || !tankId) return;
    let cancelled = false;
    listTanks(token)
      .then((tanks) => {
        if (cancelled) return;
        const tank = (Array.isArray(tanks) ? tanks : []).find((item) => String(item.id) === String(tankId));
        setWaterType(tank?.water_type === "freshwater" ? "freshwater" : "seawater");
      })
      .catch(() => {
        if (!cancelled) setWaterType("seawater");
      });
    return () => {
      cancelled = true;
    };
  }, [token, tankId]);

  useEffect(() => {
    if (!token || !tankId) return;
    let cancelled = false;
    setCatalog((current) => ({ ...current, loading: true, error: null }));
    setReady(false);

    listTankParameters(token, tankId)
      .then(async (rows) => {
        const enabled = sortRows(Array.isArray(rows) ? rows : []).filter((row) => row.enabled);
        if (cancelled) return;

        const lastById = {};
        await Promise.all(
          enabled.map(async (row) => {
            try {
              const page = await listMeasures(token, {
                page: 1,
                parameterId: row.parameter.id,
                tankId,
              });
              lastById[row.parameter.id] = page?.data?.[0] ?? null;
            } catch {
              lastById[row.parameter.id] = null;
            }
          }),
        );
        if (cancelled) return;

        const nextValues = {};
        const nextIncluded = {};
        for (const row of enabled) {
          const id = row.parameter.id;
          const last = lastById[id];
          if (row.parameter.need_value === false) {
            nextValues[id] = "";
            nextIncluded[id] = false;
          } else {
            const prefill = numericValue(last?.value);
            nextValues[id] = prefill === null ? "" : String(prefill);
            nextIncluded[id] = true;
          }
        }

        setCatalog({ loading: false, rows: enabled, error: null });
        setValues(nextValues);
        setIncluded(nextIncluded);
        setRowErrors({});
        setFailure(null);
        setCreatedAt(toDateTimeInput(new Date()));
        setReady(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 401) signOut();
        setCatalog({ loading: false, rows: [], error });
      });

    return () => {
      cancelled = true;
    };
  }, [token, tankId, signOut]);

  useEffect(() => {
    if (!ready) return;
    firstFieldRef.current?.focus();
  }, [ready]);

  const selectedCount = useMemo(
    () => catalog.rows.reduce((count, row) => count + (included[row.parameter.id] ? 1 : 0), 0),
    [catalog.rows, included],
  );

  const setAllIncluded = (value) => {
    setIncluded((current) => {
      const next = { ...current };
      for (const row of catalog.rows) next[row.parameter.id] = value;
      return next;
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFailure(null);
    setDateError(null);
    setRowErrors({});

    if (!createdAt) {
      setDateError(t("measure.error_date"));
      return;
    }
    const stamp = new Date(createdAt);
    if (Number.isNaN(stamp.getTime())) {
      setDateError(t("measure.error_date"));
      return;
    }

    const selected = catalog.rows.filter((row) => included[row.parameter.id]);
    if (selected.length === 0) {
      setFailure({ message: t("measure.batch.none_selected") });
      return;
    }

    const errors = {};
    const payload = [];
    for (const row of selected) {
      const id = row.parameter.id;
      if (row.parameter.need_value === false) {
        payload.push({ parameterId: id, value: null });
        continue;
      }
      const value = numericValue(values[id]);
      if (value === null) {
        errors[id] = t("measure.error_value");
        continue;
      }
      payload.push({ parameterId: id, value });
    }

    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);
      return;
    }

    setSaving(true);
    const createdAtIso = stamp.toISOString();
    let saved = 0;
    let warning = null;
    try {
      for (const item of payload) {
        const result = await createMeasure(token, {
          parameterId: item.parameterId,
          tankId: Number(tankId),
          value: item.value,
          createdAt: createdAtIso,
        });
        if (result.warning) {
          warning = result.warning;
          break;
        }
        saved += 1;
      }
      if (warning) {
        setFailure(warning);
        toast.push(t("measure.batch.partial", { count: saved }), "warning");
        return;
      }
      toast.push(t("measure.batch.saved", { count: saved }), "success");
      navigate("/", { replace: true });
    } catch (error) {
      if (error?.status === 401) signOut();
      setFailure(error);
      if (saved > 0) toast.push(t("measure.batch.partial", { count: saved }), "warning");
    } finally {
      setSaving(false);
    }
  };

  if (!tankId) return null;
  if (catalog.loading) return <Spinner label={t("loading")} />;
  if (catalog.error) {
    return <Notice title={t("catalog.error")}>{describeError(catalog.error, t)}</Notice>;
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t("measure.batch.title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("measure.batch.help")}</p>
        </div>
        <Link to="/" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
          {t("back_home")}
        </Link>
      </div>

      {catalog.rows.length === 0 ? (
        <Notice tone="empty">
          {t("dashboard.empty")}{" "}
          <Link to="/tanks/manage" className="font-semibold text-ink underline">
            {t("dashboard.manage_parameters")}
          </Link>
        </Notice>
      ) : (
        <form className="grid gap-5" onSubmit={onSubmit} noValidate>
          <div className="sticky top-[4.25rem] z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
            <DateTimeField
              label={t("measure.batch.shared_date")}
              locale={locale}
              name="createdAt"
              value={createdAt}
              error={dateError}
              onChange={(next) => {
                setCreatedAt(next);
                setDateError(null);
              }}
            />
            <p className="mt-2 text-xs text-slate-500">{t("measure.batch.shared_date_help")}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <QuietButton type="button" className="h-9 px-3 text-xs" onClick={() => setAllIncluded(true)}>
                {t("measure.batch.select_all")}
              </QuietButton>
              <QuietButton type="button" className="h-9 px-3 text-xs" onClick={() => setAllIncluded(false)}>
                {t("measure.batch.select_none")}
              </QuietButton>
              <p className="text-xs text-slate-500">{t("measure.batch.selected", { count: selectedCount })}</p>
            </div>
          </div>

          {failure ? (
            <Notice title={failure.code === "missing_endpoint" ? t("api.missing_title") : undefined}>
              {failure.message && !failure.status ? failure.message : describeError(failure, t)}
            </Notice>
          ) : null}

          <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {catalog.rows.map((row, index) => (
              <GroupedRow
                key={row.parameter.id}
                row={row}
                waterType={waterType}
                included={Boolean(included[row.parameter.id])}
                value={values[row.parameter.id] ?? ""}
                error={rowErrors[row.parameter.id]}
                inputRef={index === 0 ? firstFieldRef : undefined}
                onToggle={(checked) =>
                  setIncluded((current) => ({ ...current, [row.parameter.id]: checked }))
                }
                onValueChange={(next) => {
                  setValues((current) => ({ ...current, [row.parameter.id]: next }));
                  setIncluded((current) => ({ ...current, [row.parameter.id]: true }));
                  setRowErrors((current) => {
                    if (!current[row.parameter.id]) return current;
                    const copy = { ...current };
                    delete copy[row.parameter.id];
                    return copy;
                  });
                }}
              />
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <QuietButton type="button" onClick={() => navigate("/")} className="flex-1 sm:flex-none">
              {t("measure.cancel")}
            </QuietButton>
            <PrimaryButton type="submit" disabled={saving || selectedCount === 0} className="flex-1 sm:min-w-[12rem]">
              {saving ? t("measure.batch.saving") : t("measure.batch.save", { count: selectedCount })}
            </PrimaryButton>
          </div>
        </form>
      )}
    </section>
  );
}

function GroupedRow({ row, waterType, included, value, error, inputRef, onToggle, onValueChange }) {
  const { t } = useTranslation();
  const parameter = row.parameter;
  const label = parameterLabel(t, parameter.name);
  const needsValue = parameter.need_value !== false;
  const parsed = needsValue ? numericValue(value) : null;
  const range = resolveParameterRange(parameter.name, waterType, parameter.range ?? null);
  const rangeState = needsValue && included ? evaluateRangeState(parsed, range) : null;
  const colors = rangeStateClasses(rangeState);
  const inputId = `batch-value-${parameter.id}`;

  return (
    <li
      className={`relative grid gap-2 border-t border-slate-100 px-3 py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-3 sm:px-4 ${
        included ? "bg-white" : "bg-slate-50/70"
      }`}
    >
      {rangeState ? (
        <span className={`absolute inset-y-2 left-0 w-1 rounded-r ${colors.bar}`} aria-hidden="true" />
      ) : null}

      <label className="flex items-center gap-2 pl-2 sm:pl-1">
        <input
          type="checkbox"
          className="size-4 rounded border-slate-300 text-sea focus:ring-sea"
          checked={included}
          onChange={(event) => onToggle(event.target.checked)}
          aria-label={t("measure.batch.include", { name: label })}
        />
      </label>

      <div className="min-w-0 pl-2 sm:pl-0">
        <label htmlFor={needsValue ? inputId : undefined} className="block text-sm font-semibold text-slate-800">
          {label}
          {parameter.sub_name ? <span className="font-medium text-slate-400"> ({parameter.sub_name})</span> : null}
        </label>
        {range && needsValue ? (
          <p className="mt-0.5 text-[11px] text-slate-400">
            {t("measure.batch.range_hint", { min: range.min, max: range.max })}
          </p>
        ) : null}
      </div>

      <div className="pl-2 sm:pl-0">
        {needsValue ? (
          <div className="grid gap-1">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={value}
              disabled={!included}
              onChange={(event) => onValueChange(event.target.value)}
              className={`h-11 w-full rounded-xl border bg-white px-3 text-slate-900 outline-none transition disabled:bg-slate-100 disabled:text-slate-400 data-[focus]:border-sea ${
                error ? "border-rose-500" : "border-slate-200"
              }`}
              aria-invalid={Boolean(error)}
            />
            {error ? (
              <p className="text-sm text-rose-600" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t("measure.no_value")}</p>
        )}
      </div>

      <div className="pl-2 sm:justify-self-end sm:pl-0">
        {rangeState ? (
          <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.badge}`}>
            {t(`dashboard.range_${rangeState}`)}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
        {rangeState && rangeState !== "ok" ? (
          <p className={`mt-1 text-[11px] ${colors.text}`}>{t("measure.batch.range_soft")}</p>
        ) : null}
      </div>
    </li>
  );
}
