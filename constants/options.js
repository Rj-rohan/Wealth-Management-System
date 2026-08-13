// Static option lists used across profile and settings forms.

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not", label: "Prefer not to say" },
];

export const CONSULTATION_MODES = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "hybrid", label: "Hybrid" },
];

export const PROFICIENCY_LEVELS = [
  { value: "basic", label: "Basic" },
  { value: "conversational", label: "Conversational" },
  { value: "fluent", label: "Fluent" },
  { value: "native", label: "Native" },
];

export const VERIFICATION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

export const WORKING_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Singapore",
];

export const CURRENCIES = ["INR"];

export const CONSULTATION_DURATIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
];

export const EXPERTISE_SUGGESTIONS = [
  "Retirement Planning",
  "Tax Optimization",
  "Estate Planning",
  "Portfolio Management",
  "Risk Management",
  "Equity Research",
  "Wealth Preservation",
  "Insurance Advisory",
  "Education Funding",
  "Alternative Investments",
];

export const FEE_FIELDS = [
  { key: "hourly", label: "Hourly Consultation" },
  { key: "portfolio_review", label: "Portfolio Review" },
  { key: "financial_planning", label: "Financial Planning" },
  { key: "retirement_planning", label: "Retirement Planning" },
  { key: "tax_planning", label: "Tax Planning" },
];
