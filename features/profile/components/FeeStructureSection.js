"use client";
import { useState } from "react";
import { Banknote, Pencil, X } from "lucide-react";
import { Card, CardHeader, Button, Input, Select } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { profileService } from "../services/profileService";
import { FEE_FIELDS, CURRENCIES } from "@/constants/options";
import { formatCurrency } from "@/utils/format";

export default function FeeStructureSection({ professional, onUpdated }) {
  const { success, error: notifyError } = useNotifications();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const fees = professional?.fee_structure || {};
  const currency = fees.currency || "USD";

  function startEdit() {
    const initial = { currency };
    FEE_FIELDS.forEach((f) => (initial[f.key] = fees[f.key] ?? ""));
    setForm(initial);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    try {
      const aggregate = await profileService.updateProfessional({ fee_structure: form });
      onUpdated?.(aggregate);
      success("Fee structure updated");
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
        title="Fee Structure"
        subtitle="Your service pricing"
        icon={Banknote}
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
        <div className="space-y-3">
          <Select
            name="currency"
            label="Currency"
            options={CURRENCIES}
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            className="sm:max-w-[200px]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEE_FIELDS.map((f) => (
              <Input
                key={f.key}
                name={f.key}
                label={f.label}
                type="number"
                placeholder="0"
                value={form[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={save} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEE_FIELDS.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between rounded-xl p-3"
              style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}
            >
              <span className="text-sm" style={{ color: "var(--muted-strong)" }}>
                {f.label}
              </span>
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {fees[f.key] ? formatCurrency(fees[f.key], currency) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
