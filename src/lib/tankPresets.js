/** Stable catalog `parameter.name` keys used as create-dialog defaults. */
export const WATER_TYPES = Object.freeze(["seawater", "freshwater"]);

/** Visual accents so seawater (ocean cyan) vs freshwater (emerald) stay distinct. */
export const WATER_TYPE_ACCENTS = Object.freeze({
  seawater: Object.freeze({
    radio:
      "border-cyan-100 bg-cyan-50/50 data-[checked]:border-sea data-[checked]:bg-cyan-50 data-[focus]:outline-sea",
    pill: "bg-cyan-50 text-sea",
    panel: "border-cyan-200 bg-cyan-50/70",
  }),
  freshwater: Object.freeze({
    radio:
      "border-emerald-100 bg-emerald-50/50 data-[checked]:border-fresh data-[checked]:bg-emerald-50 data-[focus]:outline-fresh",
    pill: "bg-emerald-50 text-fresh",
    panel: "border-emerald-200 bg-emerald-50/70",
  }),
});

export function waterTypeAccent(waterType) {
  return WATER_TYPE_ACCENTS[waterType === "freshwater" ? "freshwater" : "seawater"];
}

export const DEFAULT_PARAMETER_NAMES = Object.freeze({
  seawater: Object.freeze([
    "Temperature",
    "Alkalinity",
    "Calcium",
    "Magnesium",
    "Nitrate",
    "Phosphate",
    "Salinity",
  ]),
  freshwater: Object.freeze([
    "Temperature",
    "Power of hydrogen",
    "Alkalinity",
    "Nitrite",
    "Nitrate",
    "Water change",
  ]),
});

export function presetParameterIds(parameters, waterType) {
  const names = new Set(DEFAULT_PARAMETER_NAMES[waterType] ?? []);
  if (!names.size || !Array.isArray(parameters)) return [];
  return parameters.filter((parameter) => names.has(parameter.name)).map((parameter) => parameter.id);
}

export function parameterMatchesQuery(parameter, query, label) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystacks = [label, parameter.name, parameter.sub_name]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return haystacks.some((value) => value.includes(needle));
}
