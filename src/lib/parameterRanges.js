/**
 * Provisional min/max helpers for dashboard color cues.
 * RS-30 can pass API ranges with the same shape; saving measures must never
 * depend on these values (display-only).
 *
 * Range shape: `{ min, max, softMin?, softMax? }`
 * - Prefer explicit softMin/softMax when present.
 * - Otherwise soft band extends softRatio outside [min, max].
 */

export const RANGE_STATES = Object.freeze(["ok", "soft_warn", "strong_warn"]);

/** Catalog `parameter.name` → provisional band by water type. */
export const PROVISIONAL_RANGES = Object.freeze({
  seawater: Object.freeze({
    Temperature: Object.freeze({ min: 24, max: 27 }),
    Alkalinity: Object.freeze({ min: 7, max: 11 }),
    Calcium: Object.freeze({ min: 380, max: 450 }),
    Magnesium: Object.freeze({ min: 1250, max: 1400 }),
    Nitrate: Object.freeze({ min: 1, max: 20 }),
    Phosphate: Object.freeze({ min: 0.02, max: 0.12 }),
    Salinity: Object.freeze({ min: 33, max: 36 }),
    Density: Object.freeze({ min: 1.024, max: 1.026 }),
    "Power of hydrogen": Object.freeze({ min: 7.8, max: 8.4 }),
    Silicate: Object.freeze({ min: 0, max: 0.5 }),
    "Water hardness": Object.freeze({ min: 6, max: 12 }),
  }),
  freshwater: Object.freeze({
    Temperature: Object.freeze({ min: 22, max: 28 }),
    "Power of hydrogen": Object.freeze({ min: 6.5, max: 7.8 }),
    Alkalinity: Object.freeze({ min: 3, max: 8 }),
    Nitrite: Object.freeze({ min: 0, max: 0.1 }),
    Nitrate: Object.freeze({ min: 0, max: 40 }),
    "Water hardness": Object.freeze({ min: 4, max: 12 }),
    Phosphate: Object.freeze({ min: 0, max: 1 }),
  }),
});

const DEFAULT_SOFT_RATIO = 0.2;

function normalizeWaterType(waterType) {
  return waterType === "freshwater" ? "freshwater" : "seawater";
}

/**
 * Resolve a range for a parameter. API ranges (when provided) win over
 * provisional defaults so RS-30 can plug in without rewriting callers.
 */
export function resolveParameterRange(parameterName, waterType, apiRange = null) {
  if (apiRange && Number.isFinite(apiRange.min) && Number.isFinite(apiRange.max)) {
    return apiRange;
  }
  if (!parameterName) return null;
  const table = PROVISIONAL_RANGES[normalizeWaterType(waterType)];
  return table?.[parameterName] ?? null;
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
