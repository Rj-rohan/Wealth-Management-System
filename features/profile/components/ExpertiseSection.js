"use client";
import { useState } from "react";
import { Target, Plus, X } from "lucide-react";
import { Card, CardHeader, Input, Button } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { profileService } from "../services/profileService";
import { EXPERTISE_SUGGESTIONS } from "@/constants/options";

export default function ExpertiseSection({ entries = [], onUpdated }) {
  const { success, error: notifyError } = useNotifications();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const existing = entries.map((e) => e.specialization?.toLowerCase());
  const suggestions = EXPERTISE_SUGGESTIONS.filter((s) => !existing.includes(s.toLowerCase()));

  async function add(specialization) {
    const text = (specialization ?? value).trim();
    if (!text) return;
    setBusy(true);
    try {
      const aggregate = await profileService.addEntry("expertise", { specialization: text });
      onUpdated?.(aggregate);
      setValue("");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      const aggregate = await profileService.deleteEntry("expertise", id);
      onUpdated?.(aggregate);
      success("Removed");
    } catch (err) {
      notifyError(err.message);
    }
  }

  return (
    <Card>
      <CardHeader title="Areas of Expertise" subtitle="Highlight your specializations" icon={Target} />

      <div className="flex flex-wrap gap-2 mb-4">
        {entries.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No areas of expertise added yet.
          </p>
        )}
        {entries.map((e) => (
          <span
            key={e.id}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
          >
            {e.specialization}
            <button onClick={() => remove(e.id)} aria-label="Remove">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          name="expertise"
          placeholder="Add an area of expertise"
          value={value}
          onChange={(ev) => setValue(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              add();
            }
          }}
        />
        <Button icon={Plus} onClick={() => add()} loading={busy}>
          Add
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs mb-1.5" style={{ color: "var(--muted)" }}>
            Suggestions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.slice(0, 6).map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors"
                style={{ background: "var(--surface-raised)", border: "1px solid var(--border)", color: "var(--muted-strong)" }}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
