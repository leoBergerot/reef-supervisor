import { Checkbox } from "@headlessui/react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { describeError } from "../api/client";
import { parameterLabel } from "../lib/format";
import { parameterMatchesQuery } from "../lib/tankPresets";
import { Notice, QuietButton, Spinner } from "./ui";

export function TankParameterPicker({
  catalog = [],
  catalogLoading = false,
  catalogError = null,
  parameterIds = [],
  onToggleParameter,
  onSelectFiltered,
  onResetDefaults = null,
  paramQuery,
  onParamQueryChange,
  pendingCustoms = [],
  onAddPendingCustom,
  onRemovePendingCustom,
  customDraft,
  onCustomDraftChange,
  customError = "",
  linkedCustoms = [],
  onToggleLinkedCustom = null,
  laterHint = true,
}) {
  const { t } = useTranslation();
  const customNameId = useId();
  const customUnitId = useId();

  const filteredParameters = catalog.filter((parameter) =>
    parameterMatchesQuery(parameter, paramQuery, parameterLabel(t, parameter.name)),
  );

  const enabledCatalogCount = parameterIds.length;
  const enabledLinkedCount = linkedCustoms.filter((item) => item.enabled).length;
  const selectedCount = enabledCatalogCount + enabledLinkedCount + pendingCustoms.length;

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">{t("tanks.form.parameters_title")}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{t("tanks.form.parameters_selected", { count: selectedCount })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuietButton
            type="button"
            className="h-9 px-3 text-xs"
            onClick={() => onSelectFiltered(filteredParameters.map((item) => item.id), true)}
          >
            {t("tanks.form.select_filtered")}
          </QuietButton>
          {onResetDefaults ? (
            <QuietButton type="button" className="h-9 px-3 text-xs" onClick={onResetDefaults}>
              {t("tanks.form.reset_defaults")}
            </QuietButton>
          ) : null}
        </div>
      </div>

      <label className="grid gap-1.5">
        <span className="sr-only">{t("tanks.form.parameters_search")}</span>
        <input
          type="search"
          value={paramQuery}
          onChange={(event) => onParamQueryChange(event.target.value)}
          placeholder={t("tanks.form.parameters_search")}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none transition focus:border-sea"
        />
      </label>

      {catalogLoading ? <Spinner label={t("loading")} /> : null}
      {catalogError ? <Notice>{describeError(catalogError, t)}</Notice> : null}

      {!catalogLoading && !catalogError ? (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-2">
          {filteredParameters.length === 0 ? (
            <li className="px-2 py-3 text-sm text-slate-500">{t("tanks.form.parameters_empty")}</li>
          ) : (
            filteredParameters.map((parameter) => {
              const label = parameterLabel(t, parameter.name);
              const checked = parameterIds.includes(parameter.id);
              return (
                <li key={parameter.id}>
                  <ParameterCheckRow
                    checked={checked}
                    onChange={(value) => onToggleParameter(parameter.id, value)}
                    label={label}
                    unit={parameter.sub_name}
                  />
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {laterHint ? <p className="text-xs text-slate-500">{t("tanks.form.parameters_later")}</p> : null}

      {linkedCustoms.length > 0 ? (
        <div className="grid gap-2 border-t border-slate-100 pt-3">
          <h4 className="text-sm font-semibold text-ink">{t("tanks.form.custom_existing_title")}</h4>
          <p className="text-xs text-slate-500">{t("tanks.form.custom_existing_help")}</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-2">
            {linkedCustoms.map((item) => (
              <li key={item.parameterId}>
                <ParameterCheckRow
                  checked={item.enabled}
                  onChange={(value) => onToggleLinkedCustom?.(item.parameterId, value)}
                  label={item.name}
                  unit={item.unit}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-2 border-t border-slate-100 pt-3">
        <h4 className="text-sm font-semibold text-ink">{t("tanks.form.custom_title")}</h4>
        <p className="text-xs text-slate-500">{t("tanks.form.custom_help")}</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <label className="grid gap-1" htmlFor={customNameId}>
            <span className="text-xs font-medium text-slate-600">{t("tanks.form.custom_name")}</span>
            <input
              id={customNameId}
              value={customDraft.name}
              onChange={(event) => onCustomDraftChange({ ...customDraft, name: event.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-sea"
            />
          </label>
          <label className="grid gap-1" htmlFor={customUnitId}>
            <span className="text-xs font-medium text-slate-600">{t("tanks.form.custom_unit")}</span>
            <input
              id={customUnitId}
              value={customDraft.unit}
              onChange={(event) => onCustomDraftChange({ ...customDraft, unit: event.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-900 outline-none focus:border-sea"
            />
          </label>
          <QuietButton type="button" onClick={onAddPendingCustom} className="sm:mt-5">
            {t("tanks.form.custom_add")}
          </QuietButton>
        </div>
        {customError ? (
          <p className="text-sm text-rose-600" role="alert">
            {customError}
          </p>
        ) : null}
        {pendingCustoms.length > 0 ? (
          <ul className="grid gap-2">
            {pendingCustoms.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-2 rounded-xl bg-cyan-50 px-3 py-2 text-sm">
                <span className="font-medium text-ink">
                  {item.name}
                  {item.unit ? <span className="font-normal text-slate-500"> ({item.unit})</span> : null}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-rose-700"
                  onClick={() => onRemovePendingCustom(item.key)}
                >
                  {t("tanks.form.custom_remove")}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ParameterCheckRow({ checked, onChange, label, unit }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white">
      <Checkbox
        checked={checked}
        onChange={onChange}
        className="group flex size-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white data-[checked]:border-sea data-[checked]:bg-sea"
      >
        <svg viewBox="0 0 14 14" fill="none" className="size-3 stroke-white opacity-0 group-data-[checked]:opacity-100">
          <path d="M3 7.5 5.5 10 11 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Checkbox>
      <span className="text-sm font-medium text-slate-800">
        {label}
        {unit ? <span className="font-normal text-slate-400"> ({unit})</span> : null}
      </span>
    </label>
  );
}
