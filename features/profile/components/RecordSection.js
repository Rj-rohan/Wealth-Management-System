"use client";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { Card, CardHeader, Button } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import FieldRenderer from "./FieldRenderer";

function displayValue(field, data) {
  const raw = data?.[field.name];
  if (raw === undefined || raw === null || raw === "") return "—";
  if (field.type === "select" && Array.isArray(field.options)) {
    const match = field.options.find((o) => (typeof o === "string" ? o : o.value) === raw);
    return match ? (typeof match === "string" ? match : match.label) : raw;
  }
  return raw;
}

/**
 * Editable section backed by a single record. `onSave` receives the form
 * values and must return the fresh aggregate profile.
 */
export default function RecordSection({ title, subtitle, icon, fields, data = {}, onSave, onUpdated }) {
  const { success, error: notifyError } = useNotifications();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function startEdit() {
    const initial = {};
    fields.forEach((f) => (initial[f.name] = data?.[f.name] ?? ""));
    setValues(initial);
    setErrors({});
    setEditing(true);
  }

  function update(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  function validate() {
    const next = {};
    fields.forEach((f) => {
      if (f.required && !String(values[f.name] ?? "").trim()) next[f.name] = `${f.label} is required`;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const aggregate = await onSave(values);
      onUpdated?.(aggregate);
      success(`${title} updated`);
      setEditing(false);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={
          editing ? (
            <Button size="sm" variant="ghost" icon={X} onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          ) : (
            <Button size="sm" variant="secondary" icon={Pencil} onClick={startEdit}>
              Edit
            </Button>
          )
        }
      />

      {editing ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((field) => (
              <div key={field.name} className={field.full ? "sm:col-span-2" : ""}>
                <FieldRenderer field={field} value={values[field.name]} error={errors[field.name]} onChange={update} />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave} loading={saving}>
              Save changes
            </Button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {fields.map((field) => (
            <div key={field.name} className={field.full ? "sm:col-span-2" : ""}>
              <p className="text-xs font-medium mb-0.5" style={{ color: "var(--muted)" }}>
                {field.label}
              </p>
              <p className="text-sm" style={{ color: "var(--foreground)", whiteSpace: field.type === "textarea" ? "pre-wrap" : "normal" }}>
                {displayValue(field, data)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
