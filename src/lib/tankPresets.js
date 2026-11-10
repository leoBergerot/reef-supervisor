/** Stable catalog `parameter.name` keys used as create-dialog defaults. */
export const WATER_TYPES = Object.freeze(["seawater", "freshwater"]);

export const DEFAULT_PARAMETER_NAMES = Object.freeze({
  seawater: Object.freeze([
    "Temperature",
    "Alkalinity",
    "Calcium",
    "Magnesium",
    "Nitrate",
    "Phosphate",
    "Density",
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
