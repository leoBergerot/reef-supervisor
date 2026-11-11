const base = "/api";

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, { method = "GET", body, token, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = form;
  } else if (body instanceof FormData) {
    payload = body;
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

/**
 * Create a tank (PR #6 / feat/tank-water-type-params):
 * `{ name, water_type, enabled_parameter_ids?, custom_parameters? }`
 * custom_parameters: `[{ name, unit }]` — unit required by the API.
 */
export function createTank(token, payload) {
  const name = typeof payload === "string" ? payload : payload?.name;
  const body = { name };
  if (payload && typeof payload === "object") {
    if (payload.waterType != null) body.water_type = payload.waterType;
    if (payload.enabledParameterIds !== undefined) {
      body.enabled_parameter_ids = payload.enabledParameterIds;
    }
    if (payload.customParameters?.length) {
      body.custom_parameters = payload.customParameters.map((item) => ({
        name: item.name,
        unit: item.unit,
      }));
    }
  }
  return request("/tanks", { method: "POST", token, body });
}

export function updateTank(token, id, name) {
  return request(`/tanks/${id}`, { method: "PATCH", token, body: { name } });
}

export function listTankParameters(token, tankId) {
  return request(`/tanks/${tankId}/parameters`, { token });
}

/**
 * PATCH /tanks/{id}/parameters —
 * `{ parameters: [{ parameter_id, enabled, sort_order? }] }`.
 */
export function updateTankParameters(token, tankId, parameters) {
  return request(`/tanks/${tankId}/parameters`, {
    method: "PATCH",
    token,
    body: {
      parameters: parameters.map((item) => {
        const row = {
          parameter_id: item.parameterId,
          enabled: item.enabled,
        };
        if (item.sortOrder != null) row.sort_order = item.sortOrder;
        return row;
      }),
    },
  });
}

/** POST /tanks/{id}/parameters/custom — `{ name, unit }`. */
export function createCustomTankParameter(token, tankId, { name, unit }) {
  return request(`/tanks/${tankId}/parameters/custom`, {
    method: "POST",
    token,
    body: { name, unit },
  });
}

export function deleteTank(token, id) {
  return request(`/tanks/${id}`, { method: "DELETE", token });
}

export function uploadTankPhoto(token, id, file) {
  const body = new FormData();
  body.append("file", file);
  return request(`/tanks/${id}/photo`, { method: "PATCH", token, body });
}

export async function fetchTankPhoto(token, photoUrl) {
  if (!photoUrl) return null;
  let response;
  try {
    response = await fetch(`${base}${photoUrl}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError("network", 0, null);
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiError("http", response.status, null);
  }
  return URL.createObjectURL(await response.blob());
}

export function requestAccountActivation(email) {
  return request("/account-activations", { method: "POST", body: { email } });
}

export function activateAccount(token) {
  return request("/account-activations/confirm", { method: "POST", body: { token } });
}

export function requestPasswordReset(email) {
  return request("/password-resets", { method: "POST", body: { email } });
}

export function resetPassword({ id, token, password }) {
  return request("/password-resets/confirm", {
    method: "POST",
    body: { id: Number(id), token, password },
  });
}

export function setMeasureTimestamp(token, id, createdAt) {
  return request(`/measures/${id}/timestamp`, {
    method: "PATCH",
    token,
    body: { created_at: createdAt },
  });
}

export function listParameters(token, { waterType } = {}) {
  const query = new URLSearchParams();
  if (waterType) query.set("water_type", waterType);
  const suffix = query.toString() ? `?${query}` : "";
  return request(`/parameters${suffix}`, { token });
}

/** GET /parameters/ranges?water_type= — default min/max bands (display warnings only). */
export function listParameterRanges(token, waterType = "seawater") {
  const query = new URLSearchParams({ water_type: waterType === "freshwater" ? "freshwater" : "seawater" });
  return request(`/parameters/ranges?${query}`, { token });
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
    const stamped = await setMeasureTimestamp(token, created.id, createdAt);
    return { measure: stamped, warning: null };
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
  if (error.status === 0) return t("error.no_network");
  const detail = error.detail;
  if (detail === "Email already registered") return t("register.error.email_already_register");
  if (detail === "Email not registered") return t("forgot_password.unknown");
  if (detail === "Incorrect username or password") return t("login.invalid");
  if (detail === "Invalid token") return t("recover.invalid");
  if (detail === "Unsupported file type" || detail === "Empty file") return t("tanks.form.image_extension");
  if (detail === "File is too large") return t("tanks.form.file_too_large");
  if (detail === "Tank not found" || detail === "Photo not found") return t("tanks.form.not_found");
  if (detail === "Timestamp can only be set on a parameter that has no value") return t("measure.timestamp_rejected");
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
