import { GENDER_OPTIONS, CONSULTATION_MODES } from "@/constants/options";

export const PERSONAL_FIELDS = [
  { name: "full_name", label: "Full Name", required: true },
  { name: "phone", label: "Phone Number", type: "tel", placeholder: "+1 555 000 0000" },
  { name: "date_of_birth", label: "Date of Birth", type: "date" },
  { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
  { name: "nationality", label: "Nationality" },
  { name: "address", label: "Address", full: true },
  { name: "city", label: "City" },
  { name: "state", label: "State / Province" },
  { name: "country", label: "Country" },
  { name: "bio", label: "Bio", type: "textarea", full: true, rows: 3, placeholder: "A short introduction about yourself" },
];

export const PROFESSIONAL_FIELDS = [
  { name: "job_title", label: "Professional Title", required: true, placeholder: "Senior Wealth Advisor" },
  { name: "organization", label: "Organization" },
  { name: "years_of_experience", label: "Years of Experience", type: "number" },
  { name: "consultation_mode", label: "Consultation Mode", type: "select", options: CONSULTATION_MODES },
  { name: "professional_summary", label: "Professional Summary", type: "textarea", full: true, rows: 4 },
];

export const OFFICE_FIELDS = [
  { name: "office_name", label: "Office Name" },
  { name: "postal_code", label: "Postal Code" },
  { name: "office_address", label: "Office Address", full: true },
  { name: "office_city", label: "City" },
  { name: "office_state", label: "State / Province" },
  { name: "office_country", label: "Country" },
];

export const QUALIFICATION_FIELDS = [
  { name: "degree", label: "Degree", required: true },
  { name: "specialization", label: "Specialization" },
  { name: "university", label: "University", full: true },
  { name: "passing_year", label: "Passing Year", type: "number" },
  { name: "description", label: "Description", type: "textarea", full: true, rows: 2 },
];

export const CERTIFICATION_FIELDS = [
  { name: "certification_name", label: "Certification Name", required: true },
  { name: "issuing_organization", label: "Issuing Organization" },
  { name: "credential_id", label: "Credential ID" },
  { name: "issue_date", label: "Issue Date", type: "date" },
  { name: "expiry_date", label: "Expiry Date", type: "date" },
];

export const LICENSE_FIELDS = [
  { name: "license_number", label: "License Number", required: true },
  { name: "issuing_authority", label: "Issuing Authority" },
  { name: "issue_date", label: "Issue Date", type: "date" },
  { name: "expiry_date", label: "Expiry Date", type: "date" },
];

export const PROFILE_TABS = [
  { id: "personal", label: "Personal" },
  { id: "professional", label: "Professional" },
  { id: "education", label: "Education" },
  { id: "certifications", label: "Certifications" },
  { id: "licenses", label: "Licenses" },
  { id: "availability", label: "Availability" },
  { id: "fees", label: "Fees" },
  { id: "verification", label: "Verification" },
];
