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

export function toDateTimeInput(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
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
