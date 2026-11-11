import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Popover,
  PopoverButton,
  PopoverPanel,
  Switch,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createMeasure,
  describeError,
  listMeasures,
  listTankParameters,
  updateTankParameters,
} from "../api/client";
import { Notice, PrimaryButton, QuietButton, Spinner, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useParameter } from "../context/ParameterContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatDelta, numericValue, parameterLabel, toDateTimeInput } from "../lib/format";

function sortRows(rows) {
  return [...rows].sort((a, b) => {
    const order = (a.sort_order ?? 0) - (b.sort_order ?? 0);
    if (order !== 0) return order;
    return a.id - b.id;
  });
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { token, signOut } = useAuth();
  const { tankId } = useTankSelection();
  const navigate = useNavigate();
  const toast = useToast();
  const [catalog, setCatalog] = useState({ loading: true, rows: [], error: null });
  const [editing, setEditing] = useState(false);
  const [pendingHide, setPendingHide] = useState(null);
  const [busy, setBusy] = useState(false);
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!tankId) {
      navigate("/tanks", { replace: true });
    }
  }, [tankId, navigate]);

  const load = () => {
    setCatalog((current) => ({ ...current, loading: true, error: null }));
    listTankParameters(token, tankId)
      .then((rows) => {
        setCatalog({
          loading: false,
          rows: sortRows(Array.isArray(rows) ? rows : []),
          error: null,
        });
      })
      .catch((error) => {
        if (error?.status === 401) signOut();
        setCatalog({ loading: false, rows: [], error });
      });
  };

  useEffect(() => {
    if (token && tankId) {
      setEditing(false);
      load();
    }
  }, [token, tankId]);

  if (!tankId) return null;
  if (catalog.loading) return <Spinner label={t("loading")} />;
  if (catalog.error) {
    return <Notice title={t("catalog.error")}>{describeError(catalog.error, t)}</Notice>;
  }

  const visible = catalog.rows.filter((row) => row.enabled);
  const hidden = catalog.rows.filter((row) => !row.enabled);

  const persistOrderAndFlags = async (rows) => {
    setBusy(true);
    try {
      const updated = await updateTankParameters(
        token,
        tankId,
        rows.map((row, index) => ({
          parameterId: row.parameter.id,
          enabled: row.enabled,
          sortOrder: index,
        })),
      );
      setCatalog({
        loading: false,
        rows: sortRows(Array.isArray(updated) ? updated : rows),
        error: null,
      });
      return true;
    } catch (error) {
      if (error?.status === 401) signOut();
      toast.push(describeError(error, t), "error");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const reorderVisible = async (activeId, overId) => {
    const oldIndex = visible.findIndex((row) => row.parameter.id === activeId);
    const newIndex = visible.findIndex((row) => row.parameter.id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    const nextVisible = arrayMove(visible, oldIndex, newIndex);
    const hiddenTail = catalog.rows.filter((row) => !row.enabled);
    const nextRows = [...nextVisible, ...hiddenTail];
    setCatalog((current) => ({ ...current, rows: nextRows }));
    const ok = await persistOrderAndFlags(nextRows);
    if (!ok) load();
  };

  const confirmHide = async () => {
    if (!pendingHide) return;
    const next = catalog.rows.map((row) =>
      row.parameter.id === pendingHide.parameter.id ? { ...row, enabled: false } : row,
    );
    const ok = await persistOrderAndFlags(sortRows(next));
    if (ok) {
      toast.push(t("dashboard.hidden", { name: parameterLabel(t, pendingHide.parameter.name) }), "success");
      setPendingHide(null);
    }
  };

  const showAgain = async (row) => {
    const nextVisible = [...visible, { ...row, enabled: true }];
    const nextHidden = hidden.filter((item) => item.parameter.id !== row.parameter.id);
    const ok = await persistOrderAndFlags([...nextVisible, ...nextHidden]);
    if (ok) toast.push(t("dashboard.shown", { name: parameterLabel(t, row.parameter.name) }), "success");
  };

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t("menu.dashboard")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {editing ? t("dashboard.edit_help") : t("dashboard.view_help")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/tanks/manage"
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            {t("dashboard.manage_parameters")}
          </Link>
          <QuietButton
            type="button"
            disabled={busy}
            onClick={() => setEditing((current) => !current)}
            className={editing ? "border-sea bg-cyan-50 text-ink" : ""}
          >
            {editing ? t("dashboard.done") : t("dashboard.edit")}
          </QuietButton>
        </div>
      </div>

      {catalog.rows.length === 0 ? (
        <Notice tone="empty">
          {t("dashboard.empty")}{" "}
          <Link to="/tanks/manage" className="font-semibold text-ink underline">
            {t("dashboard.manage_parameters")}
          </Link>
        </Notice>
      ) : null}

      {editing ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveDragId(active.id)}
          onDragCancel={() => setActiveDragId(null)}
          onDragEnd={({ active, over }) => {
            setActiveDragId(null);
            if (!over || busy || active.id === over.id) return;
            void reorderVisible(active.id, over.id);
          }}
        >
          <SortableContext items={visible.map((row) => row.parameter.id)} strategy={rectSortingStrategy}>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((row) => (
                <SortableMeasureCard
                  key={row.parameter.id}
                  id={row.parameter.id}
                  parameter={row.parameter}
                  tankId={tankId}
                  token={token}
                  language={i18n.resolvedLanguage}
                  editing
                  onHide={() => setPendingHide(row)}
                  busy={busy}
                />
              ))}
            </section>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeDragId != null
              ? (() => {
                  const row = visible.find((item) => item.parameter.id === activeDragId);
                  if (!row) return null;
                  return (
                    <MeasureCard
                      parameter={row.parameter}
                      tankId={tankId}
                      token={token}
                      language={i18n.resolvedLanguage}
                      editing
                      onHide={() => {}}
                      busy
                      overlay
                    />
                  );
                })()
              : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => (
            <MeasureCard
              key={row.parameter.id}
              parameter={row.parameter}
              tankId={tankId}
              token={token}
              language={i18n.resolvedLanguage}
              editing={false}
              onHide={() => setPendingHide(row)}
              busy={busy}
            />
          ))}
        </section>
      )}

      {hidden.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">{t("preferences.hidden_title")}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("preferences.hidden_help")}</p>
          <ul className="mt-4 grid gap-3">
            {hidden.map((row) => {
              const label = parameterLabel(t, row.parameter.name);
              return (
                <li key={row.parameter.id} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    {label}
                    {row.parameter.sub_name ? <span className="text-slate-400"> ({row.parameter.sub_name})</span> : null}
                  </span>
                  <Switch
                    checked={false}
                    disabled={busy}
                    onChange={() => showAgain(row)}
                    aria-label={t("preferences.show", { name: label })}
                    className="group inline-flex h-6 w-11 items-center rounded-full bg-slate-300 transition data-[checked]:bg-sea data-[disabled]:opacity-50"
                  >
                    <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-[checked]:translate-x-6" />
                  </Switch>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <HideConfirmDialog
        row={pendingHide}
        busy={busy}
        onClose={() => setPendingHide(null)}
        onConfirm={confirmHide}
      />
    </div>
  );
}

function HideConfirmDialog({ row, busy, onClose, onConfirm }) {
  const { t } = useTranslation();
  const label = row ? parameterLabel(t, row.parameter.name) : "";

  return (
    <Dialog open={Boolean(row)} onClose={busy ? () => {} : onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/40" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-ink">
            {t("dashboard.hide_title", { name: label })}
          </DialogTitle>
          <p className="mt-2 text-sm text-slate-600">{t("dashboard.hide_warning")}</p>
          <div className="mt-5 flex gap-2">
            <QuietButton type="button" onClick={onClose} disabled={busy} className="flex-1">
              {t("dashboard.hide_cancel")}
            </QuietButton>
            <PrimaryButton type="button" onClick={onConfirm} disabled={busy} tone="danger" className="flex-1">
              {t("dashboard.hide_confirm")}
            </PrimaryButton>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function SortableMeasureCard({ id, ...cardProps }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: cardProps.busy });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "relative z-10" : undefined}>
      <MeasureCard
        {...cardProps}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          attributes,
          listeners,
        }}
      />
    </div>
  );
}

function DragHandleIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4 fill-current">
      <circle cx="7" cy="5" r="1.5" />
      <circle cx="13" cy="5" r="1.5" />
      <circle cx="7" cy="10" r="1.5" />
      <circle cx="13" cy="10" r="1.5" />
      <circle cx="7" cy="15" r="1.5" />
      <circle cx="13" cy="15" r="1.5" />
    </svg>
  );
}

function MeasureCard({
  parameter,
  tankId,
  token,
  language,
  editing,
  onHide,
  busy,
  dragHandleProps = null,
  overlay = false,
}) {
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
    if (overlay) {
      setState({ loading: false, items: [], error: null });
      return;
    }
    load();
  }, [parameter.id, tankId, token, overlay]);

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

  const handleProps = dragHandleProps
    ? {
        ref: dragHandleProps.ref,
        ...dragHandleProps.attributes,
        ...dragHandleProps.listeners,
      }
    : {};

  return (
    <article
      className={`flex min-h-56 flex-col rounded-3xl border bg-white p-4 shadow-sm ${
        editing ? "border-sea/40 ring-1 ring-sea/20" : "border-slate-200"
      } ${overlay ? "shadow-xl ring-2 ring-sea/30" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-700">
          {label}
          {parameter.sub_name ? <span className="font-medium text-slate-400"> ({parameter.sub_name})</span> : null}
        </h2>
        {editing ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy && !overlay}
              aria-label={t("dashboard.drag_handle", { name: label })}
              className="inline-flex size-9 touch-none items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 cursor-grab active:cursor-grabbing"
              {...handleProps}
            >
              <DragHandleIcon />
            </button>
            {!overlay ? (
              <button
                type="button"
                disabled={busy}
                onClick={onHide}
                aria-label={t("dashboard.hide_action", { name: label })}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-rose-200 text-rose-700 transition hover:bg-rose-50 disabled:opacity-40"
              >
                ×
              </button>
            ) : null}
          </div>
        ) : (
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
              <MenuItem>
                <button type="button" className="block w-full rounded-lg px-3 py-2 text-left data-[focus]:bg-cyan-50" onClick={onHide}>
                  {t("measure.hide")}
                </button>
              </MenuItem>
            </MenuItems>
          </Menu>
        )}
      </div>
      <div className="mt-4 flex-1">
        {overlay ? (
          <p className="text-sm text-slate-500">{t("dashboard.dragging")}</p>
        ) : state.loading ? (
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
      {!editing ? (
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
      ) : (
        <p className="mt-3 text-xs text-slate-500">{t("dashboard.edit_card_hint")}</p>
      )}
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
