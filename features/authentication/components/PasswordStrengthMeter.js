"use client";
import { passwordStrength } from "@/utils/validation";

export default function PasswordStrengthMeter({ password = "" }) {
  if (!password) return null;
  const { score, label, color } = passwordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="flex-1 rounded-full transition-colors duration-200"
            style={{ height: 4, background: i < score ? color : "var(--surface-hover)" }}
          />
        ))}
      </div>
      <p className="text-xs mt-1" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
