import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deleteMeasure, describeError, listMeasures, setMeasureTimestamp, updateMeasure } from "../api/client";
import { Notice, PrimaryButton, QuietButton, Spinner, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useParameter } from "../context/ParameterContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, numericValue, parameterLabel, toDateTimeInput } from "../lib/format";

const PAGE_SIZE = 10;

export function MeasuresPage() {
  const { t, i18n } = useTranslation();
  const { token, signOut } = useAuth();
  const { tankId } = useTankSelection();
  const { parameter } = useParameter();
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: true, data: [], totalPage: 1, error: null });
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const locale = i18n.resolvedLanguage?.startsWith("en") ? "en" : "fr";

  useEffect(() => {
    if (!tankId) navigate("/tanks", { replace: true });
  }, [tankId, navigate]);

  const load = () => {
    if (!parameter || !tankId) return;
    setState((current) => ({ ...current, loading: true }));
    listMeasures(token, { page, parameterId: parameter.id, tankId })
      .then((result) => {
        setState({
          loading: false,
          data: result.data ?? [],
          totalPage: result.total_page || 1,
          error: null,
        });
      })
      .catch((error) => {
        if (error?.status === 401) signOut();
        setState({ loading: false, data: [], totalPage: 1, error });
      });
  };

  useEffect(() => {
    load();
  }, [token, tankId, parameter, page]);

  if (!parameter) {
    return (
      <div className="grid gap-4">
        <Notice tone="empty">{t("measure.list.empty")}</Notice>
        <Link to="/" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
          {t("back_home")}
        </Link>
      </div>
    );
  }

  const label = parameterLabel(t, parameter.name);

  return (
    <section>
      <h1 className="text-2xl font-semibold text-ink">{t("measure.list.title", { name: label })}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {t("measure.list.newest")} · {t("measure.list.per_page", { count: PAGE_SIZE })}
      </p>
      <div className="mt-5">
        {state.loading ? <Spinner label={t("loading")} /> : null}
        {state.error ? <Notice>{describeError(state.error, t)}</Notice> : null}
        {!state.loading && !state.error && state.data.length === 0 ? <Notice tone="empty">{t("measure.list.empty")}</Notice> : null}
      </div>
      {state.data.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">{t("measure.list.created_at")}</th>
                <th className="px-4 py-3 font-medium">{t("measure.list.value")}</th>
                <th className="px-4 py-3 font-medium">{t("measure.list.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {state.data.map((measure) => (
                <tr key={measure.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{formatDateTime(measure.created_at, locale)}</td>
                  <td className="px-4 py-3">{formatReading(measure.value, parameter.sub_name, t)}</td>
                  <td className="px-4 py-3">
                    <RowActions measure={measure} onEdit={() => setEditing(measure)} onDelete={() => setPendingDelete(measure)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="grid gap-3 p-3 md:hidden">
            {state.data.map((measure) => (
              <li key={measure.id} className="rounded-2xl border border-slate-100 p-3">
                <p className="text-sm text-slate-500">{formatDateTime(measure.created_at, locale)}</p>
                <p className="text-lg font-semibold">{formatReading(measure.value, parameter.sub_name, t)}</p>
                <div className="mt-2">
                  <RowActions measure={measure} onEdit={() => setEditing(measure)} onDelete={() => setPendingDelete(measure)} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-3">
        <QuietButton type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
          {t("measure.list.previous")}
        </QuietButton>
        <p className="text-sm text-slate-500">{t("measure.list.page", { page, total: state.totalPage })}</p>
        <QuietButton type="button" disabled={page >= state.totalPage} onClick={() => setPage((current) => current + 1)}>
          {t("measure.list.next")}
        </QuietButton>
      </div>
      <EditDialog
        measure={editing}
        parameter={parameter}
        token={token}
        onClose={() => setEditing(null)}
        onSaved={() => {
          toast.push(t("measure.list.updated"), "success");
          setEditing(null);
          load();
        }}
      />
      <DeleteMeasureDialog
        measure={pendingDelete}
        token={token}
        locale={locale}
        onClose={() => setPendingDelete(null)}
        onDeleted={(createdAt) => {
          toast.push(t("measure.list.deleted", { createdAt }), "success");
          setPendingDelete(null);
          load();
        }}
      />
    </section>
  );
}

function formatReading(value, unit, t) {
  const number = numericValue(value);
  if (number === null) return t("measure.empty_value");
  return unit ? `${number} ${unit}` : String(number);
}

function RowActions({ onEdit, onDelete }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2">
      <QuietButton type="button" onClick={onEdit} className="h-9 px-3">
        {t("measure.list.edit")}
      </QuietButton>
      <QuietButton type="button" onClick={onDelete} className="h-9 px-3">
        {t("measure.list.remove")}
      </QuietButton>
    </div>
  );
}

function EditDialog({ measure, parameter, token, onClose, onSaved }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [failure, setFailure] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { value: "", createdAt: "" } });

  useEffect(() => {
    if (!measure) return;
    reset({
      value: measure.value ?? "",
      createdAt: toDateTimeInput(new Date(measure.created_at)),
    });
    setFailure(null);
  }, [measure, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    const value = numericValue(values.value);
    try {
      if (parameter.need_value && value === null) return;
      if (value === null) {
        await setMeasureTimestamp(token, measure.id, new Date(values.createdAt).toISOString());
      } else {
        await updateMeasure(token, measure.id, {
          value,
          createdAt: new Date(values.createdAt).toISOString(),
        });
      }
      onSaved();
    } catch (error) {
      if (error?.status === 401) signOut();
      setFailure(error);
    }
  });

  return (
    <Dialog open={Boolean(measure)} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-ink">{t("measure.list.edit")}</DialogTitle>
          <form className="mt-4 grid gap-4" onSubmit={onSubmit} noValidate>
            {failure ? (
              <Notice title={failure.code === "missing_endpoint" ? t("api.missing_title") : undefined}>
                {describeError(failure, t)}
              </Notice>
            ) : null}
            {parameter?.need_value === false ? (
              <p className="text-sm text-slate-500">{t("measure.no_value")}</p>
            ) : (
              <TextField
                label={t("measure.value")}
                inputMode="decimal"
                error={errors.value?.message}
                {...register("value", {
                  validate: (value) => numericValue(value) !== null || t("measure.error_value"),
                })}
              />
            )}
            <TextField
              label={t("measure.date")}
              type="datetime-local"
              error={errors.createdAt?.message}
              {...register("createdAt", { required: t("measure.error_date") })}
            />
            <div className="flex gap-2">
              <QuietButton type="button" onClick={onClose} className="flex-1">
                {t("measure.list.cancel")}
              </QuietButton>
              <PrimaryButton type="submit" disabled={isSubmitting} className="flex-1">
                {t("measure.list.save")}
              </PrimaryButton>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function DeleteMeasureDialog({ measure, token, locale, onClose, onDeleted }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [failure, setFailure] = useState(null);
  const [pending, setPending] = useState(false);
  const createdAt = measure ? formatDateTime(measure.created_at, locale) : "";

  useEffect(() => setFailure(null), [measure]);

  const confirm = async () => {
    setPending(true);
    try {
      await deleteMeasure(token, measure.id);
      onDeleted(createdAt);
    } catch (error) {
      if (error?.status === 401) signOut();
      setFailure(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={Boolean(measure)} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-ink">
            {t("delete_modal.title", { name: createdAt })}
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
            <PrimaryButton type="button" disabled={pending} onClick={confirm} tone="danger" className="flex-1">
              {t("delete_modal.delete")}
            </PrimaryButton>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
