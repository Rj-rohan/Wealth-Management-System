// Helpers that make mock services behave like a real async data source.
// Swapping these for Supabase later means replacing the bodies only.

export function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Deep clone so callers can't mutate the in-memory dataset by reference.
export function clone(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

export async function respond(value, ms = 300) {
  await delay(ms);
  return clone(value);
}

export function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}
