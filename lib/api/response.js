// Small helpers for consistent JSON responses from route handlers.
export function ok(data = {}, init = {}) {
  return Response.json({ success: true, data }, { status: 200, ...init });
}

export function created(data = {}) {
  return Response.json({ success: true, data }, { status: 201 });
}

export function fail(message, status = 400, extra = {}) {
  return Response.json({ success: false, error: message, ...extra }, { status });
}

export function unauthorized(message = "Not authenticated") {
  return fail(message, 401);
}
