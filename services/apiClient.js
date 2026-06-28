// Thin client-side fetch wrapper used by all feature services.
// Centralises JSON handling, credentials, and error normalisation.

async function request(url, { method = "GET", body, isForm = false } = {}) {
  const options = { method, credentials: "same-origin", headers: {} };

  if (body !== undefined) {
    if (isForm) {
      options.body = body; // FormData sets its own content-type
    } else {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
  }

  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error("Network error. Please check your connection.");
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || (payload && payload.success === false)) {
    const message = payload?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload?.data ?? payload;
}

export const apiClient = {
  get: (url) => request(url),
  post: (url, body) => request(url, { method: "POST", body }),
  put: (url, body) => request(url, { method: "PUT", body }),
  patch: (url, body) => request(url, { method: "PATCH", body }),
  del: (url, body) => request(url, { method: "DELETE", body }),
  upload: (url, formData) => request(url, { method: "POST", body: formData, isForm: true }),
};
