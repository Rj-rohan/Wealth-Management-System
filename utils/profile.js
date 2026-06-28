// Pure helpers for computing advisor profile completeness + verification.

const PERSONAL_FIELDS = [
  "full_name",
  "phone",
  "date_of_birth",
  "gender",
  "nationality",
  "bio",
  "address",
  "city",
  "country",
];

const PROFESSIONAL_FIELDS = [
  "job_title",
  "organization",
  "years_of_experience",
  "professional_summary",
  "consultation_mode",
];

/**
 * Compute a 0-100 completion score from the aggregated profile object
 * returned by the profile service.
 */
export function computeCompletion(aggregate = {}) {
  const {
    profile = {},
    professional = {},
    qualifications = [],
    certifications = [],
    languages = [],
    expertise = [],
    availability = null,
  } = aggregate;

  const checks = [];

  PERSONAL_FIELDS.forEach((f) => checks.push(Boolean(profile?.[f])));
  PROFESSIONAL_FIELDS.forEach((f) => checks.push(Boolean(professional?.[f])));
  checks.push(qualifications.length > 0);
  checks.push(certifications.length > 0);
  checks.push(languages.length > 0);
  checks.push(expertise.length > 0);
  checks.push(Boolean(availability?.working_hours));
  checks.push(Boolean(profile?.profile_photo));

  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function buildVerification(aggregate = {}, user = {}) {
  const completion = computeCompletion(aggregate);
  const licenses = aggregate.licenses || [];
  const licenseVerified = licenses.some((l) => l.verification_status === "verified");
  return {
    completion,
    email_verified: Boolean(user.email_verified),
    identity_verified: completion >= 70,
    license_verified: licenseVerified,
    kyc_status: completion >= 90 ? "verified" : completion >= 50 ? "in_review" : "pending",
    badge: completion === 100 && licenseVerified ? "verified" : "unverified",
  };
}
