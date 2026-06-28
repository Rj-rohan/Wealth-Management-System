"use client";
import { Input, Textarea, Select } from "@/components/ui";

// Renders a single form control from a field descriptor.
// field: { name, label, type, options, placeholder, required, rows }
export default function FieldRenderer({ field, value, error, onChange }) {
  const common = {
    label: field.label,
    name: field.name,
    required: field.required,
    error,
    value: value ?? "",
    placeholder: field.placeholder,
  };

  if (field.type === "textarea") {
    return <Textarea {...common} rows={field.rows || 3} onChange={(e) => onChange(field.name, e.target.value)} />;
  }
  if (field.type === "select") {
    return (
      <Select
        {...common}
        options={field.options || []}
        placeholder={field.placeholder || "Select…"}
        onChange={(e) => onChange(field.name, e.target.value)}
      />
    );
  }
  return (
    <Input
      {...common}
      type={field.type || "text"}
      onChange={(e) => onChange(field.name, e.target.value)}
    />
  );
}
