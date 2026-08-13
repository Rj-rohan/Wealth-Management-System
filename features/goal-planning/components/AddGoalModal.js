"use client";
import { useState } from "react";
import { Button, Modal, Input, Select } from "@/components/ui";
import { Plus } from "lucide-react";

const GOAL_TYPES = [
  { value: "retirement", label: "Retirement" },
  { value: "house", label: "House Purchase" },
  { value: "car", label: "Car Purchase" },
  { value: "education", label: "Children's Education" },
  { value: "marriage", label: "Marriage" },
  { value: "vacation", label: "Vacation" },
  { value: "emergency_fund", label: "Emergency Fund" },
  { value: "wealth_creation", label: "Wealth Creation" },
  { value: "custom", label: "Custom Goal" },
];
const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export default function AddGoalModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ label: "", type: "retirement", targetAmount: "", targetDate: "", priority: "medium" });
  const [saving, setSaving] = useState(false);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.label || !form.targetAmount) return;
    setSaving(true);
    await onCreate({
      ...form,
      targetAmount: Number(form.targetAmount),
      targetDate: form.targetDate ? new Date(form.targetDate).toISOString() : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
    setSaving(false);
    setForm({ label: "", type: "retirement", targetAmount: "", targetDate: "", priority: "medium" });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Create New Goal" footer={
      <>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={handleSubmit} icon={Plus}>Create Goal</Button>
      </>
    }>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Goal Name" value={form.label} onChange={(e) => handleChange("label", e.target.value)} placeholder="e.g., Retirement fund" required />
        <Select label="Goal Type" options={GOAL_TYPES} value={form.type} onChange={(e) => handleChange("type", e.target.value)} />
        <Input label="Target Amount (₹)" type="number" value={form.targetAmount} onChange={(e) => handleChange("targetAmount", e.target.value)} placeholder="500000" required />
        <Input label="Target Date" type="date" value={form.targetDate} onChange={(e) => handleChange("targetDate", e.target.value)} />
        <Select label="Priority" options={PRIORITIES} value={form.priority} onChange={(e) => handleChange("priority", e.target.value)} />
      </form>
    </Modal>
  );
}
