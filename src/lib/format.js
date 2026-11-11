function tokenPayload(token) {
  const part = token.split(".")[1];
  if (!part) return null;
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return JSON.parse(atob(padded));
}

export function isTokenExpired(token) {
  try {
    const payload = tokenPayload(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function tokenExpiryMs(token) {
  try {
    const payload = tokenPayload(token);
    return payload?.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function formatDateTime(value, language) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDateInput(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const FR_DATE_RE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;

function isValidIsoDate(iso) {
  const match = ISO_DATE_RE.exec(iso);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Display an ISO YYYY-MM-DD value for the app locale (FR → DD/MM/YYYY). */
export function formatIsoDateForLocale(iso, locale) {
  if (!iso || !isValidIsoDate(iso)) return "";
  if (locale === "fr") {
    const [, year, month, day] = ISO_DATE_RE.exec(iso);
    return `${day}/${month}/${year}`;
  }
  return iso;
}

/** Parse a locale-typed date back to ISO YYYY-MM-DD (empty string if invalid). */
export function parseLocaleDateToIso(text, locale) {
  const raw = String(text ?? "").trim();
  if (!raw) return "";
  if (ISO_DATE_RE.test(raw)) return isValidIsoDate(raw) ? raw : "";
  if (locale === "fr") {
    const match = FR_DATE_RE.exec(raw);
    if (!match) return "";
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];
    const iso = `${year}-${month}-${day}`;
    return isValidIsoDate(iso) ? iso : "";
  }
  return "";
}

const ISO_DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const FR_DATE_TIME_RE = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})[ T](\d{1,2}):(\d{2})$/;

export function toDateTimeInput(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

/** Display an ISO YYYY-MM-DDTHH:mm value for the app locale (FR → DD/MM/YYYY HH:mm). */
export function formatIsoDateTimeForLocale(value, locale) {
  if (!value || !ISO_DATE_TIME_RE.test(value)) return "";
  const [, year, month, day, hour, minute] = ISO_DATE_TIME_RE.exec(value);
  if (!isValidIsoDate(`${year}-${month}-${day}`)) return "";
  if (locale === "fr") return `${day}/${month}/${year} ${hour}:${minute}`;
  return value;
}

/** Parse a locale-typed datetime back to ISO YYYY-MM-DDTHH:mm. */
export function parseLocaleDateTimeToIso(text, locale) {
  const raw = String(text ?? "").trim();
  if (!raw) return "";
  if (ISO_DATE_TIME_RE.test(raw)) {
    const [, year, month, day] = ISO_DATE_TIME_RE.exec(raw);
    return isValidIsoDate(`${year}-${month}-${day}`) ? raw : "";
  }
  if (locale === "fr") {
    const match = FR_DATE_TIME_RE.exec(raw);
    if (!match) return "";
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];
    const hour = match[4].padStart(2, "0");
    const minute = match[5];
    const isoDate = `${year}-${month}-${day}`;
    if (!isValidIsoDate(isoDate)) return "";
    return `${isoDate}T${hour}:${minute}`;
  }
  return "";
}

/** Convert ISO YYYY-MM-DD to a local Date at midnight (or null). */
export function isoDateToLocalDate(iso) {
  if (!iso || !isValidIsoDate(iso)) return undefined;
  const [, year, month, day] = ISO_DATE_RE.exec(iso);
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/** Convert a Date to ISO YYYY-MM-DD in local time. */
export function localDateToIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return toDateInput(date);
}

/** Split ISO YYYY-MM-DDTHH:mm into date + time parts. */
export function splitIsoDateTime(value) {
  if (!value || !ISO_DATE_TIME_RE.test(value)) return { date: "", time: "" };
  const [, year, month, day, hour, minute] = ISO_DATE_TIME_RE.exec(value);
  return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
}

/** Join ISO date + HH:mm into YYYY-MM-DDTHH:mm. */
export function joinIsoDateTime(date, time) {
  if (!date || !isValidIsoDate(date)) return "";
  const match = /^(\d{2}):(\d{2})$/.exec(String(time ?? "").trim());
  if (!match) return "";
  return `${date}T${match[1]}:${match[2]}`;
}

export function startOfDay(value) {
  const date = new Date(`${value}T00:00:00`);
  return date;
}

export function endOfDay(value) {
  return new Date(`${value}T23:59:59.999`);
}

export function monthAgoDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date;
}

export function parameterLabel(t, name) {
  return t(`parameter.${name}`, { defaultValue: name });
}

export function numericValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatDelta(last, previous) {
  const current = numericValue(last);
  const before = numericValue(previous);
  if (current === null || before === null) return null;
  const delta = Math.round((current - before) * 100) / 100;
  const percent = before !== 0 ? Math.round((delta / before) * 10000) / 100 : null;
  return { delta, percent, up: delta >= 0 };
}

export function imageExtensionOk(file) {
  if (!file) return true;
  const name = file.name.toLowerCase();
  return [".png", ".gif", ".svg", ".jpeg", ".jpg"].some((ext) => name.endsWith(ext));
}
