// Framework-agnostic validation helpers (safe for client and server).

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}

export function isRequired(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && String(value).trim() !== "";
}

/**
 * Score a password 0-4 and return strength metadata.
 */
export function passwordStrength(password = "") {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["#EF4444", "#F59E0B", "#EAB308", "#3B82F6", "#10B981"];
  return { score, label: labels[score], color: colors[score] };
}

export function isStrongPassword(password = "") {
  return passwordStrength(password).score >= 2 && password.length >= 8;
}

/**
 * Validate a set of fields against rule functions.
 * rules: { field: [{ test: (val, all) => bool, message }] }
 * Returns an object of { field: errorMessage }.
 */
export function validate(values, rules) {
  const errors = {};
  for (const [field, checks] of Object.entries(rules)) {
    for (const { test, message } of checks) {
      if (!test(values[field], values)) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}
