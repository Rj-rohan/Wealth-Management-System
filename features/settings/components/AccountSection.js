"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trash2, UserCog } from "lucide-react";
import { Card, CardHeader, Button, ConfirmDialog } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { settingsService } from "../services/settingsService";

export default function AccountSection() {
  const { logout, setUser } = useAuth();
  const { success, error: notifyError } = useNotifications();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleLogout() {
    await logout();
    success("You have been signed out");
    router.replace("/login");
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await settingsService.deleteAccount();
      setUser(null);
      success("Your account has been deleted");
      router.replace("/register");
    } catch (err) {
      notifyError(err.message);
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Account" subtitle="Manage your session and account" icon={UserCog} />

      <div className="flex items-center justify-between rounded-xl p-3.5 mb-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--border)" }}>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Sign out
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            End your current session on this device
          </p>
        </div>
        <Button variant="outline" icon={LogOut} onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div
        className="flex items-center justify-between rounded-xl p-3.5"
        style={{ background: "var(--danger-dim)", border: "1px solid rgba(239,68,68,0.25)" }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Delete account
          </p>
          <p className="text-xs" style={{ color: "var(--muted-strong)" }}>
            Permanently remove your account and all associated data
          </p>
        </div>
        <Button variant="danger" icon={Trash2} onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete your account?"
        message="This will permanently delete your profile, credentials, and settings. This action cannot be undone."
        confirmLabel="Delete account"
      />
    </Card>
  );
}
