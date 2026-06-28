"use client";
import { useState } from "react";
import { Languages, Plus, X } from "lucide-react";
import { Card, CardHeader, Input, Select, Button } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { profileService } from "../services/profileService";
import { PROFICIENCY_LEVELS } from "@/constants/options";

export default function LanguagesSection({ entries = [], onUpdated }) {
  const { success, error: notifyError } = useNotifications();
  const [language, setLanguage] = useState("");
  const [proficiency, setProficiency] = useState("fluent");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!language.trim()) return;
    setBusy(true);
    try {
      const aggregate = await profileService.addEntry("languages", { language: language.trim(), proficiency });
      onUpdated?.(aggregate);
      setLanguage("");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    try {
      const aggregate = await profileService.deleteEntry("languages", id);
      onUpdated?.(aggregate);
      success("Removed");
    } catch (err) {
      notifyError(err.message);
    }
  }

  const labelFor = (v) => PROFICIENCY_LEVELS.find((p) => p.value === v)?.label || v;

  return (
    <Card>
      <CardHeader title="Languages Spoken" subtitle="Languages you can advise in" icon={Languages} />

      <div className="flex flex-wrap gap-2 mb-4">
        {entries.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No languages added yet.
          </p>
        )}
        {entries.map((e) => (
          <span
            key={e.id}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: "var(--surface-hover)", color: "var(--muted-strong)", border: "1px solid var(--border)" }}
          >
            {e.language}
            <span style={{ color: "var(--muted)" }}>· {labelFor(e.proficiency)}</span>
            <button onClick={() => remove(e.id)} aria-label="Remove">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2 items-end">
        <Input name="language" label="Language" placeholder="e.g. Spanish" value={language} onChange={(e) => setLanguage(e.target.value)} />
        <Select name="proficiency" label="Proficiency" options={PROFICIENCY_LEVELS} value={proficiency} onChange={(e) => setProficiency(e.target.value)} />
        <Button icon={Plus} onClick={add} loading={busy}>
          Add
        </Button>
      </div>
    </Card>
  );
}
