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
import {
  endOfDay,
  monthAgoDate,
  numericValue,
  parameterLabel,
  startOfDay,
  toDateInput,
  todayIsoDate,
} from "../lib/format";

export function ChartPage() {
  const { t, i18n } = useTranslation();
  const { token, signOut } = useAuth();
  const { tankId } = useTankSelection();
  const { parameter } = useParameter();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: false, points: [], error: null });
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";
  const today = todayIsoDate();
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      start: toDateInput(monthAgoDate()),
      end: today,
    },
  });
  const start = watch("start");
  const end = watch("end");

  useEffect(() => {
    if (!tankId) navigate("/tanks", { replace: true });
  }, [tankId, navigate]);

  useEffect(() => {
    if (!parameter || !tankId || !start || !end) return undefined;
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
          .map((measure) => ({ date: new Date(measure.created_at), value: numericValue(measure.value) }))
          .filter((point) => point.value !== null && !Number.isNaN(point.date.getTime()));
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
  }, [token, tankId, parameter, start, end, signOut]);

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
              max={today}
              onChange={(next) => {
                field.onChange(next);
                if (next && end && next > end) {
                  setValue("end", next, { shouldDirty: true, shouldValidate: true });
                }
              }}
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
              max={today}
              onChange={(next) => {
                field.onChange(next);
                if (next && start && next < start) {
                  setValue("start", next, { shouldDirty: true, shouldValidate: true });
                }
              }}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </form>
      <div className="mt-4">
        {state.loading ? <Spinner label={t("chart.loading")} /> : null}
        {state.error ? <Notice>{describeError(state.error, t)}</Notice> : null}
        {!state.loading && !state.error && state.points.length === 0 ? <Notice tone="empty">{t("chart.empty")}</Notice> : null}
        {state.points.length > 0 ? <LineChart points={state.points} language={locale} unit={parameter.sub_name || ""} /> : null}
      </div>
    </section>
  );
}
