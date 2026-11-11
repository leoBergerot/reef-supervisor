import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { describeError, listMeasuresInRange } from "../api/client";
import { LineChart } from "../components/LineChart";
import { DateField, Notice, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useParameter } from "../context/ParameterContext";
import { useTankSelection } from "../context/TankContext";
import { endOfDay, monthAgoDate, numericValue, parameterLabel, parseApiDate, startOfDay, toDateInput } from "../lib/format";

export function ChartPage() {
  const { t, i18n } = useTranslation();
  const { token, signOut } = useAuth();
  const { tankId } = useTankSelection();
  const { parameter } = useParameter();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: false, points: [], error: null });
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const {
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      start: toDateInput(monthAgoDate()),
      end: toDateInput(new Date()),
    },
  });
  const start = watch("start");
  const end = watch("end");
  const rangeError = start && end && startOfDay(start) > endOfDay(end);

  useEffect(() => {
    if (!tankId) navigate("/tanks", { replace: true });
  }, [tankId, navigate]);

  useEffect(() => {
    if (!parameter || !tankId || !start || !end || rangeError) return undefined;
    let cancelled = false;
    setState({ loading: true, points: [], error: null });
    listMeasuresInRange(token, {
      tankId,
      parameterId: parameter.id,
      start: startOfDay(start),
      end: endOfDay(end),
    })
      .then((measures) => {
        if (cancelled) return;
        const points = measures
          .map((measure) => {
            const date = parseApiDate(measure.created_at);
            if (Number.isNaN(date.getTime())) return null;
            // Event-style parameters (no numeric value) still plot on the time axis.
            if (parameter.need_value === false) return { date, value: 1 };
            const value = numericValue(measure.value);
            if (value === null) return null;
            return { date, value };
          })
          .filter(Boolean);
        setState({ loading: false, points, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        if (error?.status === 401) signOut();
        setState({ loading: false, points: [], error });
      });
    return () => {
      cancelled = true;
    };
  }, [token, tankId, parameter, start, end, rangeError, signOut]);

  if (!parameter) {
    return (
      <div className="grid gap-4">
        <Notice tone="empty">{t("chart.empty")}</Notice>
        <Link to="/" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
          {t("back_home")}
        </Link>
      </div>
    );
  }

  const label = parameterLabel(t, parameter.name);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h1 className="text-2xl font-semibold text-ink">{t("chart.title", { name: label })}</h1>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
        <Controller
          name="start"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <DateField
              label={t("chart.start")}
              locale={locale}
              error={errors.start?.message}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <Controller
          name="end"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <DateField
              label={t("chart.end")}
              locale={locale}
              error={errors.end?.message}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </form>
      {rangeError ? (
        <div className="mt-4">
          <Notice>{t("chart.range_error")}</Notice>
        </div>
      ) : null}
      <div className="mt-4">
        {state.loading ? <Spinner label={t("chart.loading")} /> : null}
        {state.error ? <Notice>{describeError(state.error, t)}</Notice> : null}
        {!state.loading && !state.error && !rangeError && state.points.length === 0 ? <Notice tone="empty">{t("chart.empty")}</Notice> : null}
        {state.points.length > 0 ? (
          <LineChart
            points={state.points}
            language={locale}
            unit={parameter.need_value === false ? "" : parameter.sub_name || ""}
            domainStart={startOfDay(start)}
            domainEnd={endOfDay(end)}
          />
        ) : null}
      </div>
    </section>
  );
}
