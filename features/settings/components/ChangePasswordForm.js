"use client";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { useNotifications } from "@/context/NotificationContext";
import { settingsService } from "../services/settingsService";
import { isRequired, isStrongPassword } from "@/utils/validation";
import PasswordStrengthMeter from "@/features/authentication/components/PasswordStrengthMeter";

export default function ChangePasswordForm() {
  const { success, error: notifyError } = useNotifications();
  const [values, setValues] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!isRequired(values.currentPassword)) next.currentPassword = "Current password is required";
    if (!isStrongPassword(values.newPassword)) next.newPassword = "At least 8 characters, mixing letters and numbers";
    if (values.newPassword !== values.confirm) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await settingsService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      success("Password changed successfully");
      setValues({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-md">
      <Input
        label="Current password"
        name="currentPassword"
        type="password"
        icon={Lock}
        value={values.currentPassword}
        onChange={(e) => update("currentPassword", e.target.value)}
        error={errors.currentPassword}
        autoComplete="current-password"
      />
      <div>
        <Input
          label="New password"
          name="newPassword"
          type="password"
          icon={Lock}
          value={values.newPassword}
          onChange={(e) => update("newPassword", e.target.value)}
          error={errors.newPassword}
          autoComplete="new-password"
        />
        <PasswordStrengthMeter password={values.newPassword} />
      </div>
      <Input
        label="Confirm new password"
        name="confirm"
        type="password"
        icon={Lock}
        value={values.confirm}
        onChange={(e) => update("confirm", e.target.value)}
        error={errors.confirm}
        autoComplete="new-password"
      />
      <Button type="submit" loading={loading}>
        Update password
      </Button>
    </form>
  );
}
