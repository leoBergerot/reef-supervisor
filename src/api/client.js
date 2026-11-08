const base = "/api";

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export class MissingEndpointError extends Error {
  constructor(functionName) {
    super(functionName);
    this.name = "MissingEndpointError";
    this.code = "missing_endpoint";
    this.functionName = functionName;
  }
}

function missing(functionName) {
  return Promise.reject(new MissingEndpointError(functionName));
}

async function request(path, { method = "GET", body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${base}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError("network", 0, null);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!response.ok) {
    throw new ApiError("http", response.status, data?.detail ?? null);
  }
  return data;
}

export function login(email, password) {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  return request("/token", { method: "POST", form });
}

export function createUser({ email, password }) {
  return request("/users", { method: "POST", body: { email, password } });
}

export function listTanks(token) {
  return request("/tanks", { token });
}

export function createTank(token, name) {
  return request("/tanks", { method: "POST", token, body: { name } });
}

export function updateTank() {
  return missing("updateTank");
}

export function deleteTank() {
  return missing("deleteTank");
}

export function uploadTankPhoto() {
  return missing("uploadTankPhoto");
}

export function activateAccount() {
  return missing("activateAccount");
}

export function requestAccountActivation() {
  return missing("requestAccountActivation");
}

export function requestPasswordReset() {
  return missing("requestPasswordReset");
}

export function resetPassword() {
  return missing("resetPassword");
}

export function setMeasureTimestamp() {
  return missing("setMeasureTimestamp");
}

export function listParameters(token) {
  return request("/parameters", { token });
}

export function listPreferences(token) {
  return request("/preferences", { token });
}

export function updatePreference(token, id, enabled) {
  return request(`/preferences/${id}`, {
    method: "PATCH",
    token,
    body: { enabled },
  });
}

export function listMeasures(token, { page = 1, parameterId, tankId } = {}) {
  const query = new URLSearchParams({ page: String(page) });
  if (parameterId != null) query.set("parameter_id", String(parameterId));
  if (tankId != null) query.set("tank_id", String(tankId));
  return request(`/measures?${query}`, { token });
}

function roundValue(value) {
  return Math.round(Number(value) * 100) / 100;
}

export async function createMeasure(token, { parameterId, tankId, value, createdAt }) {
  const created = await request("/measures", {
    method: "POST",
    token,
    body: {
      parameter_id: parameterId,
      tank_id: tankId,
      value,
    },
  });

  if (value === null || value === undefined) {
    const chosen = new Date(createdAt).getTime();
    if (Number.isFinite(chosen) && Math.abs(chosen - Date.now()) > 60_000) {
      return { measure: created, warning: new MissingEndpointError("setMeasureTimestamp") };
    }
    return { measure: created, warning: null };
  }

  try {
    const updated = await request(`/measures/${created.id}`, {
      method: "PATCH",
      token,
      body: { value: roundValue(value), created_at: createdAt },
    });
    return { measure: updated, warning: null };
  } catch (error) {
    return { measure: created, warning: error };
  }
}

export function updateMeasure(token, id, { value, createdAt }) {
  return request(`/measures/${id}`, {
    method: "PATCH",
    token,
    body: {
      value: roundValue(value),
      ...(createdAt ? { created_at: createdAt } : {}),
    },
  });
}

export function deleteMeasure(token, id) {
  return request(`/measures/${id}`, { method: "DELETE", token });
}

export async function listMeasuresInRange(token, { tankId, parameterId, start, end }) {
  const first = await listMeasures(token, { page: 1, tankId, parameterId });
  const pages = [first];
  for (let page = 2; page <= first.total_page; page += 1) {
    pages.push(await listMeasures(token, { page, tankId, parameterId }));
  }
  const startMs = start.getTime();
  const endMs = end.getTime();
  return pages
    .flatMap((page) => page.data)
    .filter((measure) => {
      const time = new Date(measure.created_at).getTime();
      return time >= startMs && time <= endMs;
    });
}

export function describeError(error, t) {
  if (!error) return t("error.500");
  if (error.code === "missing_endpoint") {
    return t("api.missing_body", { name: error.functionName });
  }
  if (error.status === 0) return t("error.no_network");
  const detail = error.detail;
  if (detail === "Email already registered") return t("register.error.email_already_register");
  if (detail === "Incorrect username or password") return t("login.invalid");
  if (error.status === 401) return t("error.unauthorized");
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const text = detail
      .map((item) => item?.msg || item?.ctx?.error || "")
      .filter(Boolean)
      .join(" ");
    if (text) return text;
  }
  if (error.status >= 500) return t("error.500");
  return t("error.500");
}
