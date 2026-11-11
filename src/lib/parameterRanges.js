/**
 * Min/max helpers for soft display warnings.
 * Prefer API ranges when present (`parameter.range` or `/parameters/ranges`);
 * otherwise use client defaults by water_type + catalog `parameter.name`.
 * Saving measures must never depend on these values.
 *
 * Range shape: `{ min, max, softMin?, softMax? }`
 * - Prefer explicit softMin/softMax when present.
 * - Otherwise soft band extends softRatio outside [min, max].
 */

export const RANGE_STATES = Object.freeze(["ok", "soft_warn", "strong_warn"]);

/**
 * Catalog `parameter.name` → recommended band by water type.
 * Kept in sync with reef-supervisor-py `app/defaults/parameter_ranges.py`.
 */
export const PROVISIONAL_RANGES = Object.freeze({
  seawater: Object.freeze({
    Temperature: Object.freeze({ min: 24, max: 27, softMin: 22, softMax: 29 }),
    Alkalinity: Object.freeze({ min: 7, max: 11 }),
    Calcium: Object.freeze({ min: 380, max: 450 }),
    Magnesium: Object.freeze({ min: 1250, max: 1450 }),
    Nitrate: Object.freeze({ min: 1, max: 20 }),
    Phosphate: Object.freeze({ min: 0.02, max: 0.15 }),
    // Catalog Salinity uses unit "Density" (specific gravity), not ppt.
    Salinity: Object.freeze({ min: 1.024, max: 1.026, softMin: 1.022, softMax: 1.028 }),
    Density: Object.freeze({ min: 1.024, max: 1.026, softMin: 1.022, softMax: 1.028 }),
    "Power of hydrogen": Object.freeze({ min: 7.8, max: 8.5 }),
    Nitrite: Object.freeze({ min: 0, max: 0.05 }),
    Silicate: Object.freeze({ min: 0, max: 0.5 }),
    "Water hardness": Object.freeze({ min: 6, max: 12 }),
  }),
  freshwater: Object.freeze({
    Temperature: Object.freeze({ min: 22, max: 28, softMin: 18, softMax: 32 }),
    "Power of hydrogen": Object.freeze({ min: 6.5, max: 7.8 }),
    Alkalinity: Object.freeze({ min: 3, max: 8 }),
    Nitrite: Object.freeze({ min: 0, max: 0.1 }),
    Nitrate: Object.freeze({ min: 0, max: 40 }),
    "Water hardness": Object.freeze({ min: 4, max: 12 }),
    Phosphate: Object.freeze({ min: 0, max: 1 }),
    Calcium: Object.freeze({ min: 40, max: 120 }),
  }),
});

const DEFAULT_SOFT_RATIO = 0.2;

function normalizeWaterType(waterType) {
  return waterType === "freshwater" ? "freshwater" : "seawater";
}

/**
 * Normalize API/client range payloads (snake_case or camelCase soft bounds).
 * Returns null when min/max are missing or invalid.
 */
export function normalizeRange(apiRange) {
  if (!apiRange || typeof apiRange !== "object") return null;
  const min = Number(apiRange.min);
  const max = Number(apiRange.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;

  const softMinRaw = apiRange.softMin ?? apiRange.soft_min;
  const softMaxRaw = apiRange.softMax ?? apiRange.soft_max;
  const softMin = softMinRaw == null || softMinRaw === "" ? null : Number(softMinRaw);
  const softMax = softMaxRaw == null || softMaxRaw === "" ? null : Number(softMaxRaw);

  const range = { min, max };
  if (Number.isFinite(softMin) && Number.isFinite(softMax)) {
    range.softMin = softMin;
    range.softMax = softMax;
  }
  return range;
}

/**
 * Resolve a range for a parameter. API ranges (when provided) win over
 * client defaults so older apps stay compatible if the API omits `range`.
 */
export function resolveParameterRange(parameterName, waterType, apiRange = null) {
  const fromApi = normalizeRange(apiRange);
  if (fromApi) return fromApi;
  if (!parameterName) return null;
  const table = PROVISIONAL_RANGES[normalizeWaterType(waterType)];
  return table?.[parameterName] ?? null;
}

/**
 * Build a name → range map from `/parameters/ranges` rows.
 */
export function rangesByName(entries) {
  const map = {};
  if (!Array.isArray(entries)) return map;
  for (const entry of entries) {
    const range = normalizeRange(entry);
    if (range && entry?.name) map[entry.name] = range;
  }
  return map;
}

function softBounds(range, softRatio = DEFAULT_SOFT_RATIO) {
  const { min, max } = range;
  if (Number.isFinite(range.softMin) && Number.isFinite(range.softMax)) {
    return { softMin: range.softMin, softMax: range.softMax };
  }
  const span = max - min;
  const pad = (Number.isFinite(span) && span > 0 ? span : Math.abs(min) || 1) * softRatio;
  return { softMin: min - pad, softMax: max + pad };
}

/**
 * Classify a numeric reading against a range.
 * Returns `ok` | `soft_warn` | `strong_warn` | null (no value / no range).
 *
 * - ok: inside [min, max]
 * - soft_warn: outside the recommended band but still within the soft pad
 * - strong_warn: clearly outside the soft pad
 */
export function evaluateRangeState(value, range, { softRatio = DEFAULT_SOFT_RATIO } = {}) {
  if (value == null || !Number.isFinite(value) || !range) return null;
  const { min, max } = range;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;

  const { softMin, softMax } = softBounds(range, softRatio);
  if (value < softMin || value > softMax) return "strong_warn";
  if (value < min || value > max) return "soft_warn";
  return "ok";
}

/** Tailwind-friendly classes for state cues (border / text / fill). */
export function rangeStateClasses(state) {
  switch (state) {
    case "ok":
      return {
        bar: "bg-emerald-500",
        text: "text-emerald-700",
        spark: "#059669",
        badge: "bg-emerald-50 text-emerald-800",
      };
    case "soft_warn":
      return {
        bar: "bg-amber-400",
        text: "text-amber-700",
        spark: "#d97706",
        badge: "bg-amber-50 text-amber-900",
      };
    case "strong_warn":
      return {
        bar: "bg-rose-500",
        text: "text-rose-700",
        spark: "#e11d48",
        badge: "bg-rose-50 text-rose-800",
      };
    default:
      return {
        bar: "bg-slate-300",
        text: "text-slate-700",
        spark: "#13a1de",
        badge: "bg-slate-100 text-slate-600",
      };
  }
}
