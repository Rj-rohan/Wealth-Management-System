"use client";
import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import CosmicBackground from "../../components/CosmicBackground";
import GlassCard from "../../components/GlassCard";
import AnimatedNumber from "../../components/AnimatedNumber";
import ShimmerLoader from "../../components/ShimmerLoader";
import SearchableDropdown from "../../components/SearchableDropdown";

export default function CorporateAssets() {
  const [assets, setAssets] = useState([]);
  const [depreciation, setDepreciation] = useState({});
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    type: "physical",
    name: "",
    category: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    depreciationMethod: "straight-line",
    usefulLifeMonths: "120",
    location: "",
    ownerId: "corp",
  });

  async function loadData() {
    try {
      const [assetsRes, depRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/assets/depreciation"),
      ]);

      if (assetsRes.ok && depRes.ok) {
        const assetsList = await assetsRes.json();
        const depList = await depRes.json();

        // Convert depreciation array to an object mapped by ID
        const depMap = {};
        depList.forEach((item) => {
          depMap[item.id] = item;
        });

        setAssets(assetsList);
        setDepreciation(depMap);
      }
    } catch (e) {
      console.error("Error loading assets data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAsset = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError("");

    const price = Number(form.purchasePrice);
    const life = Number(form.usefulLifeMonths);

    if (isNaN(price) || price <= 0) {
      setError("Acquisition cost must be a positive number.");
      setAdding(false);
      return;
    }

    if (isNaN(life) || life <= 0) {
      setError("Useful life must be a positive number.");
      setAdding(false);
      return;
    }

    if (!form.category) {
      setError("Please select an asset category.");
      setAdding(false);
      return;
    }

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setForm({
          type: "physical",
          name: "",
          category: "",
          purchasePrice: "",
          purchaseDate: new Date().toISOString().split("T")[0],
          depreciationMethod: "straight-line",
          usefulLifeMonths: "120",
          location: "",
          ownerId: "corp",
        });
        await loadData();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to create asset.");
      }
    } catch (err) {
      setError("Network or server error.");
    } finally {
      setAdding(false);
    }
  };

  const handleDispose = async (id) => {
    if (!confirm("Are you sure you want to archive / dispose of this asset?")) return;

    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to archive asset.");
      }
    } catch (e) {
      alert("Failed to send request.");
    }
  };

  const totalOriginal = assets
    .filter(a => a.status === 'active')
    .reduce((sum, a) => sum + Number(a.purchasePrice), 0);

  const totalCurrent = assets
    .filter(a => a.status === 'active')
    .reduce((sum, a) => {
      const depVal = depreciation[a.id]?.computedCurrentValue;
      return sum + (depVal !== undefined ? depVal : Number(a.purchasePrice));
    }, 0);

  const activeAssets = assets.filter(a => a.status === 'active');
  const disposedAssets = assets.filter(a => a.status === 'disposed');

  return (
    <AppShell pageTitle="Corporate Assets" pageSubtitle="Track physical property, digital IP, and depreciation cycles" maxWidth="max-w-6xl">
      <CosmicBackground />
      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6 relative z-10" id="corporate-assets-root">
        
        {/* KPI Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Asset Inventory Count</p>
            <p className="text-2xl font-bold text-white">{activeAssets.length} Active</p>
            <p className="text-xs text-gray-500 mt-1">{disposedAssets.length} Disposed / Archived</p>
          </GlassCard>
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Total Book Value (Original)</p>
            <p className="text-2xl font-bold text-white">
              <AnimatedNumber value={totalOriginal} prefix="₹" />
            </p>
            <p className="text-xs text-gray-500 mt-1">Capital investment capital</p>
          </GlassCard>
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Depreciated Book Value (Current)</p>
            <p className="text-2xl font-bold text-green-400">
              <AnimatedNumber value={totalCurrent} prefix="₹" />
            </p>
            <p className="text-xs text-red-400 mt-1">
              Loss to depreciation: -₹{(totalOriginal - totalCurrent).toLocaleString()}
            </p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form to add an Asset */}
          <div className="lg:col-span-1">
            <GlassCard hover={false}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Record New Asset
              </h3>
              {error && (
                <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                  {error}
                </div>
              )}
              <form onSubmit={handleAddAsset} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Asset Classification</label>
                  <select
                    className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-green-500"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="physical">Physical (Property, Equipment, Machinery)</option>
                    <option value="digital">Digital (IP, Licenses, Domains)</option>
                    <option value="financial">Financial (Bonds, FDs, Liquid Funds)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Asset Label / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Server Rack A-12"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Category</label>
                    <SearchableDropdown
                      options={["Real Estate", "Office Premises", "IT Hardware", "Software Licenses", "Intellectual Property", "Office Furniture", "Company Vehicles"]}
                      value={form.category}
                      onChange={(val) => setForm({ ...form, category: val })}
                      placeholder="Select category..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Location</label>
                    <SearchableDropdown
                      options={["Mumbai HQ", "AWS Cloud", "Delhi Office", "Pune Hub", "Bengaluru Tech Park"]}
                      value={form.location}
                      onChange={(val) => setForm({ ...form, location: val })}
                      placeholder="Select location..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Acquisition Cost</label>
                    <input
                      type="number"
                      required
                      placeholder="₹"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      value={form.purchasePrice}
                      onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Acquisition Date</label>
                    <input
                      type="date"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      value={form.purchaseDate}
                      onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Depr. Schema</label>
                    <select
                      className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      value={form.depreciationMethod}
                      onChange={(e) => setForm({ ...form, depreciationMethod: e.target.value })}
                    >
                      <option value="straight-line">Straight Line</option>
                      <option value="declining-balance">Double Declining</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Useful Life (months)</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 60"
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      value={form.usefulLifeMonths}
                      onChange={(e) => setForm({ ...form, usefulLifeMonths: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {adding ? "Adding Asset..." : "Record Asset"}
                </button>
              </form>
            </GlassCard>
          </div>

          {/* List of active assets */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Active Assets Ledger
            </h3>
            {loading ? (
              <ShimmerLoader type="list" rows={4} />
            ) : activeAssets.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-sm text-gray-400">No active assets tracked. Add your first asset.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAssets.map((asset) => {
                  const depInfo = depreciation[asset.id];
                  const currentVal = depInfo ? depInfo.computedCurrentValue : Number(asset.purchasePrice);
                  const isDepreciable = asset.type === "physical";

                  return (
                    <GlassCard key={asset.id} hover={false} style={{ padding: "16px" }}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs uppercase font-bold text-green-400 px-2 py-0.5 bg-green-400/10 rounded-full">
                              {asset.type}
                            </span>
                            <span className="text-xs text-gray-500">{asset.category}</span>
                            {asset.location && (
                              <span className="text-xs text-gray-500">📍 {asset.location}</span>
                            )}
                          </div>
                          <h4 className="font-semibold text-white text-base">{asset.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Acquired: {asset.purchaseDate} • {asset.usefulLifeMonths} months useful life
                          </p>
                          {isDepreciable && depInfo && (
                            <p className="text-[11px] text-gray-400 mt-2">
                              {asset.depreciationMethod === "straight-line" ? "Straight Line" : "Double Declining"} depr: <strong>{depInfo.monthsElapsed} months elapsed</strong>.
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Current Book Value</p>
                          <p className="text-lg font-bold text-white">₹{currentVal.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Original: ₹{Number(asset.purchasePrice).toLocaleString()}</p>
                          <button
                            onClick={() => handleDispose(asset.id)}
                            className="mt-3 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer block ml-auto"
                          >
                            Dispose Asset
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </AppShell>
  );
}
