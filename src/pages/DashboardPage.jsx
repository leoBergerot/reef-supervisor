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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
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
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  createMeasure,
  describeError,
  listMeasures,
  listTankParameters,
  listTanks,
  updateTankParameters,
} from "../api/client";
import { DateTimeField, Notice, PrimaryButton, QuietButton, Spinner, TextField } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useParameter } from "../context/ParameterContext";
import { useTankSelection } from "../context/TankContext";
import { useToast } from "../context/ToastContext";
import { formatDateTime, formatDelta, numericValue, parameterLabel, toDateTimeInput } from "../lib/format";
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

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { token, signOut } = useAuth();
  const { tankId, revision } = useTankSelection();
  const navigate = useNavigate();
  const toast = useToast();
  const [catalog, setCatalog] = useState({ loading: true, rows: [], error: null });
  const [waterType, setWaterType] = useState("seawater");
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
  }, [token, tankId, revision]);

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

  const listProps = {
    waterType,
    tankId,
    token,
    language: i18n.resolvedLanguage,
    busy,
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
          {!editing && visible.length > 0 ? (
            <Link
              to="/measures/entry"
              className="inline-flex h-11 items-center rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-[#12485c]"
            >
              {t("dashboard.batch_entry")}
            </Link>
          ) : null}
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
          <SortableContext items={visible.map((row) => row.parameter.id)} strategy={verticalListSortingStrategy}>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <DenseListHeader />
              <ul className="divide-y divide-slate-100">
                {visible.map((row) => (
                  <SortableMeasureRow
                    key={row.parameter.id}
                    id={row.parameter.id}
                    parameter={row.parameter}
                    editing
                    onHide={() => setPendingHide(row)}
                    {...listProps}
                  />
                ))}
              </ul>
            </section>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeDragId != null
              ? (() => {
                  const row = visible.find((item) => item.parameter.id === activeDragId);
                  if (!row) return null;
                  return (
                    <div className="rounded-xl border border-sea/40 bg-white shadow-xl ring-2 ring-sea/30">
                      <MeasureRow
                        parameter={row.parameter}
                        editing
                        onHide={() => {}}
                        busy
                        overlay
                        {...listProps}
                      />
                    </div>
                  );
                })()
              : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <DenseListHeader />
          <ul className="divide-y divide-slate-100">
            {visible.map((row) => (
              <li key={row.parameter.id}>
                <MeasureRow
                  parameter={row.parameter}
                  editing={false}
                  onHide={() => setPendingHide(row)}
                  {...listProps}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {editing && hidden.length > 0 ? (
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

function DenseListHeader() {
  const { t } = useTranslation();
  return (
    <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5.5rem_minmax(0,0.9fr)_auto] gap-3 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:grid sm:px-4">
      <span>{t("dashboard.col_parameter")}</span>
      <span>{t("dashboard.col_value")}</span>
      <span className="text-center">{t("dashboard.col_trend")}</span>
      <span>{t("dashboard.col_delta")}</span>
      <span className="sr-only">{t("dashboard.col_actions")}</span>
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

function SortableMeasureRow({ id, ...rowProps }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: rowProps.busy });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : undefined,
  };

  return (
    <li ref={setNodeRef} style={style} className={isDragging ? "relative z-10 bg-white" : undefined}>
      <MeasureRow
        {...rowProps}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          attributes,
          listeners,
        }}
      />
    </li>
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

function Sparkline({ values, color }) {
  if (!values?.length) {
    return <div className="mx-auto h-8 w-[5.5rem] rounded bg-slate-50" aria-hidden="true" />;
  }
  const width = 88;
  const height = 28;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : pad + (index / (values.length - 1)) * (width - pad * 2);
      const y = pad + (1 - (value - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto h-8 w-[5.5rem]" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" points={points} />
      {values.length === 1 ? (
        <circle cx={width / 2} cy={height / 2} r="2.5" fill={color} />
      ) : null}
    </svg>
  );
}

function MeasureRow({
  parameter,
  tankId,
  token,
  language,
  waterType,
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
  // API returns newest first — reverse for chronological sparkline.
  const sparkValues = state.items
    .slice(0, 12)
    .map((item) => numericValue(item.value))
    .filter((value) => value !== null)
    .reverse();

  const range = resolveParameterRange(parameter.name, waterType, parameter.range ?? null);
  const rangeState = evaluateRangeState(shown, range);
  const colors = rangeStateClasses(rangeState);

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
    <div
      className={`relative grid grid-cols-1 gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5.5rem_minmax(0,0.9fr)_auto] sm:items-center sm:gap-3 sm:px-4 ${
        editing ? "bg-cyan-50/40" : "bg-white"
      } ${overlay ? "rounded-xl" : ""}`}
    >
      <span className={`absolute inset-y-2 left-0 w-1 rounded-r ${colors.bar}`} aria-hidden="true" />

      <div className="min-w-0 pl-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-slate-800">
            {label}
            {parameter.sub_name ? <span className="font-medium text-slate-400"> ({parameter.sub_name})</span> : null}
          </h2>
          {rangeState ? (
            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.badge}`}>
              {t(`dashboard.range_${rangeState}`)}
            </span>
          ) : null}
        </div>
        {!overlay && last ? (
          <p className="mt-0.5 truncate text-xs text-slate-500">{formatDateTime(last.created_at, locale)}</p>
        ) : null}
      </div>

      <div className="pl-2 sm:pl-0">
        {overlay ? (
          <p className="text-sm text-slate-500">{t("dashboard.dragging")}</p>
        ) : state.loading ? (
          <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
        ) : state.error ? (
          <p className="text-xs text-rose-600">{describeError(state.error, t)}</p>
        ) : (
          <p className={`text-lg font-semibold tracking-tight tabular-nums ${colors.text}`}>
            {shown === null ? t("measure.empty_value") : shown}
            {parameter.sub_name ? <span className="ml-1 text-xs font-medium text-slate-400">{parameter.sub_name}</span> : null}
          </p>
        )}
      </div>

      <div className="hidden sm:block">
        {overlay || state.loading || state.error ? null : <Sparkline values={sparkValues} color={colors.spark} />}
      </div>

      <div className="pl-2 text-sm sm:pl-0">
        {overlay || state.loading || state.error ? null : delta ? (
          <p className={`font-medium tabular-nums ${delta.up ? "text-emerald-600" : "text-rose-600"}`}>
            {delta.up ? "+" : ""}
            {delta.delta}
            {parameter.sub_name ? ` ${parameter.sub_name}` : ""}
          </p>
        ) : last && previous ? (
          <p className="text-xs text-slate-400">{t("measure.delta_unavailable")}</p>
        ) : (
          <p className="text-xs text-slate-400">—</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-1 pl-2 sm:pl-0">
        {editing ? (
          <>
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
          </>
        ) : (
          <>
            <Popover key={formKey} className="relative">
              <PopoverButton className="h-9 rounded-lg bg-cyan-50 px-2.5 text-xs font-semibold text-ink data-[hover]:bg-cyan-100">
                {t("measure.add")}
              </PopoverButton>
              <PopoverPanel anchor="bottom end" className="z-40 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <AddReading
                  parameter={parameter}
                  tankId={tankId}
                  token={token}
                  locale={locale}
                  waterType={waterType}
                  lastValue={last?.value}
                  onSaved={() => {
                    toast.push(t("measure.saved"), "success");
                    setFormKey((key) => key + 1);
                    load();
                  }}
                  onRefresh={load}
                />
              </PopoverPanel>
            </Popover>
            <Menu>
              <MenuButton
                className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 data-[focus]:outline data-[focus]:outline-2 data-[focus]:outline-sea"
                aria-label={label}
              >
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
          </>
        )}
      </div>

      {editing && !overlay ? (
        <p className="col-span-full pl-2 text-xs text-slate-500 sm:hidden">{t("dashboard.edit_row_hint")}</p>
      ) : null}
    </div>
  );
}

function AddReading({ parameter, tankId, token, locale, waterType, lastValue, onSaved, onRefresh }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [failure, setFailure] = useState(null);
  const prefill = parameter.need_value ? numericValue(lastValue) : null;
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      value: prefill === null ? "" : String(prefill),
      createdAt: toDateTimeInput(new Date()),
    },
  });

  const watchedValue = watch("value");
  const range = resolveParameterRange(parameter.name, waterType, parameter.range ?? null);
  const rangeState = parameter.need_value
    ? evaluateRangeState(numericValue(watchedValue), range)
    : null;
  const colors = rangeStateClasses(rangeState);

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
        <>
          <TextField
            label={t("measure.value")}
            inputMode="decimal"
            error={errors.value?.message}
            {...register("value", {
              validate: (value) => numericValue(value) !== null || t("measure.error_value"),
            })}
          />
          {range ? (
            <p className="text-[11px] text-slate-400">{t("measure.batch.range_hint", { min: range.min, max: range.max })}</p>
          ) : null}
          {rangeState && rangeState !== "ok" ? (
            <p className={`text-xs ${colors.text}`}>{t("measure.batch.range_soft")}</p>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-slate-500">{t("measure.no_value")}</p>
      )}
      <Controller
        name="createdAt"
        control={control}
        rules={{ required: t("measure.error_date") }}
        render={({ field }) => (
          <DateTimeField
            label={t("measure.date")}
            locale={locale}
            error={errors.createdAt?.message}
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        )}
      />
      <PrimaryButton type="submit" disabled={isSubmitting}>
        {t("measure.validate")}
      </PrimaryButton>
    </form>
  );
}
