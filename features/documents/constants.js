import { ShieldCheck, IdCard, ReceiptText, LineChart, FileBarChart, Files } from "lucide-react";

export const DOCUMENT_CATEGORIES = [
  { value: "kyc", label: "KYC", icon: ShieldCheck, color: "var(--primary)" },
  { value: "identity", label: "Identity", icon: IdCard, color: "var(--info)" },
  { value: "tax", label: "Tax", icon: ReceiptText, color: "var(--warning)" },
  { value: "investment_statements", label: "Statements", icon: LineChart, color: "var(--success)" },
  { value: "reports", label: "Reports", icon: FileBarChart, color: "#A855F7" },
  { value: "other", label: "Other", icon: Files, color: "var(--muted-strong)" },
];

export function categoryMeta(value) {
  return DOCUMENT_CATEGORIES.find((c) => c.value === value) || DOCUMENT_CATEGORIES[5];
}
