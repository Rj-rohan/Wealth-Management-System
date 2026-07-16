"use client";
import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import CosmicBackground from "../../components/CosmicBackground";
import GlassCard from "../../components/GlassCard";

const rolesList = ["CFO", "Auditor", "Treasury Manager", "Investment Manager"];

export default function CompanyProfile() {
  const [company, setCompany] = useState({
    name: "",
    taxBracket: "",
    cfoName: "",
    incorporationDate: "",
    pan: "",
  });
  const [role, setRole] = useState("CFO");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load company config
    async function loadConfig() {
      try {
        const res = await fetch("/api/company");
        if (res.ok) {
          const data = await res.json();
          setCompany(data);
        }
      } catch (e) {
        console.error("Failed to load company config", e);
      } finally {
        setLoading(false);
      }
    }

    // Load active cookie role
    const cookies = document.cookie.split("; ");
    const mockRoleCookie = cookies.find((row) => row.startsWith("mock_role="));
    if (mockRoleCookie) {
      setRole(mockRoleCookie.split("=")[1]);
    } else {
      setRole("CFO");
    }

    loadConfig();
  }, []);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    document.cookie = `mock_role=${selectedRole}; path=/; max-age=86400`;
    setMessage(`Mock role switched to ${selectedRole}. The middleware will now apply these restrictions.`);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });

      if (res.ok) {
        const updated = await res.json();
        setCompany(updated);
        setMessage("Company profile updated successfully!");
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error || "Failed to update profile"}`);
      }
    } catch (e) {
      setMessage("Failed to submit request.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  return (
    <AppShell pageTitle="Company Profile" pageSubtitle="Configure identity, tax rules, and simulate workspace roles">
      <CosmicBackground />
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6 relative z-10" id="company-profile-root">
        {message && (
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-xs text-white text-center animate-pulse">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form details */}
          <div className="md:col-span-2 space-y-6">
            <GlassCard hover={false}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Enterprise Details
              </h3>
              {loading ? (
                <p className="text-xs text-gray-400">Loading details...</p>
              ) : (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Company Registered Name</label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-green-500"
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tax Bracket</label>
                      <select
                        className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-green-500"
                        value={company.taxBracket}
                        onChange={(e) => setCompany({ ...company, taxBracket: e.target.value })}
                      >
                        <option value="15%">15% (Start-up / New Mfg)</option>
                        <option value="22%">22% (Standard Corporate)</option>
                        <option value="25%">25% (Standard Corp &gt; 400cr)</option>
                        <option value="30%">30% (Highest Surcharge Bracket)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">CFO / Administrator Name</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-green-500"
                        value={company.cfoName}
                        onChange={(e) => setCompany({ ...company, cfoName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Incorporation Date</label>
                      <input
                        type="date"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                        value={company.incorporationDate}
                        onChange={(e) => setCompany({ ...company, incorporationDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Company PAN</label>
                      <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none"
                        value={company.pan}
                        onChange={(e) => setCompany({ ...company, pan: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {saving ? "Saving Changes..." : "Save Configuration"}
                    </button>
                  </div>
                </form>
              )}
            </GlassCard>
          </div>

          {/* Role Switching Panel (Mock Authentication Bypass Tool) */}
          <div className="space-y-6">
            <GlassCard hover={false} style={{ border: "1px solid rgba(245,158,11,0.2)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
                <span>🔐</span> Mock Auth Controls
              </p>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Since this application runs without a production Cognito or Okta provider, use this switcher to simulate different corporate workspace roles and trigger authorization checks in the route middleware.
              </p>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Select Simulation Role</label>
                <select
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-[#161B22] border border-white/15 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 space-y-1">
                <p>• <strong>CFO</strong>: All reads, writes, and config edits</p>
                <p>• <strong>Auditor</strong>: Read-only access to ledger & audit trail</p>
                <p>• <strong>Treasury Manager</strong>: Treasury sweeps and account views</p>
                <p>• <strong>Investment Manager</strong>: Portfolio purchases only</p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
