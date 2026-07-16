"use client";
import { useState, useEffect } from "react";
import AppShell from "../../components/AppShell";
import CosmicBackground from "../../components/CosmicBackground";
import GlassCard from "../../components/GlassCard";
import AnimatedNumber from "../../components/AnimatedNumber";
import ShimmerLoader from "../../components/ShimmerLoader";
import SearchableDropdown from "../../components/SearchableDropdown";

export default function CorporateCashFlow() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [dropdowns, setDropdowns] = useState({
    vendors: [],
    customers: [],
    projects: [],
    employees: [],
    departments: [],
    paymentMethods: [],
    currencies: [],
    transactionTypes: [],
    taxRates: []
  });

  const [form, setForm] = useState({
    type: "income",
    amount: "",
    category: "",
    bankAccountId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    currency: "INR",
    department: "Sales",
    project: "",
    employee: "",
    vendor: "",
    customer: "",
    taxRate: "GST 18%",
    dueDate: new Date().toISOString().split("T")[0],
  });

  const [stmtPayload, setStmtPayload] = useState(
    JSON.stringify([
      { amount: 450000, category: "Sales Revenue", description: "Inbound Invoice #2031", date: new Date().toISOString().split("T")[0] },
      { amount: -85000, category: "Utility Rent", description: "AWS Billing Cloud", date: new Date().toISOString().split("T")[0] }
    ], null, 2)
  );

  async function loadData() {
    try {
      const [txRes, accRes, dropRes] = await Promise.all([
        fetch("/api/cashflow/transactions"),
        fetch("/api/treasury/accounts"),
        fetch("/api/corporate/dropdowns")
      ]);

      if (txRes.ok && accRes.ok && dropRes.ok) {
        const txData = await txRes.json();
        const accData = await accRes.json();
        const dropData = await dropRes.json();

        setTransactions(txData);
        setAccounts(accData);
        setDropdowns(dropData);

        if (accData.length > 0 && !form.bankAccountId) {
          setForm((f) => ({ 
            ...f, 
            bankAccountId: accData[0].id,
            category: dropData.transactionTypes[0] || "",
            paymentMethod: dropData.paymentMethods[0] || "Bank Transfer",
            currency: dropData.currencies[0] || "INR",
            department: dropData.departments[0] || "Sales",
            taxRate: dropData.taxRates[0] || "GST 18%"
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load cash flow data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOption = async (type, name) => {
    try {
      const res = await fetch("/api/corporate/dropdowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
      });
      if (res.ok) {
        const newItem = await res.json();
        setDropdowns(prev => ({
          ...prev,
          [type]: [...prev[type], newItem]
        }));
        return newItem;
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create option.");
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError("");
    setMessage("");

    const amountNum = Number(form.amount);

    // Form validations
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid positive transaction amount.");
      setAdding(false);
      return;
    }

    if (!form.category) {
      setError("Please select or specify a category.");
      setAdding(false);
      return;
    }

    // Check account balances / overdrafts on UI level
    const bankAccount = accounts.find(b => b.id === form.bankAccountId);
    if (form.type === "expense" && bankAccount && bankAccount.balance < amountNum) {
      setError(`Overdraft Rejected: Insufficient balance in ${bankAccount.name}. Balance is ₹${bankAccount.balance.toLocaleString('en-IN')}`);
      setAdding(false);
      return;
    }

    try {
      const res = await fetch("/api/cashflow/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage("Transaction posted successfully and general ledger updated.");
        setForm({
          ...form,
          amount: "",
          description: "",
          vendor: "",
          customer: "",
          employee: "",
          project: ""
        });
        await loadData();
      } else {
        const err = await res.json();
        setError(err.error || "Post rejected.");
      }
    } catch (err) {
      setError("Network or server error.");
    } finally {
      setAdding(false);
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 6000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this transaction? This will reverse its effect on your bank account balance.")) return;

    try {
      const res = await fetch(`/api/cashflow/transactions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("Transaction deleted. Bank balance adjusted.");
        await loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Delete failed.");
      }
    } catch (e) {
      alert("Failed to delete transaction.");
    } finally {
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleReconcile = async (e) => {
    e.preventDefault();
    setReconciling(true);
    setError("");
    setMessage("");

    try {
      let parsed;
      try {
        parsed = JSON.parse(stmtPayload);
      } catch (err) {
        setError("Invalid JSON format in bank statement payload.");
        setReconciling(false);
        return;
      }

      const res = await fetch("/api/cashflow/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccountId: form.bankAccountId,
          entries: parsed,
        }),
      });

      if (res.ok) {
        setMessage("Reconciliation file parsed successfully. Bank balances adjusted.");
        await loadData();
      } else {
        const err = await res.json();
        setError(err.error || "Reconciliation failed.");
      }
    } catch (err) {
      setError("Server error during reconciliation upload.");
    } finally {
      setReconciling(false);
      setTimeout(() => {
        setMessage("");
        setError("");
      }, 6000);
    }
  };

  const totalInflow = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalOutflow = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Group categories from transactions + static ones for searchable list
  const categoryOptions = Array.from(new Set([
    ...dropdowns.transactionTypes,
    "Salary", "Rent", "Utilities", "Revenue", "Marketing", "Travel", "Software", "Hardware",
    ...transactions.map(t => t.category)
  ]));

  return (
    <AppShell pageTitle="Cash Flow Ledger" pageSubtitle="Company inflows, outflows, and bank statement uploads">
      <CosmicBackground />
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6 relative z-10" id="corporate-cashflow-root">
        
        {/* Banner notices */}
        {message && (
          <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-xs text-green-300 text-center animate-pulse">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-300 text-center animate-pulse">
            {error}
          </div>
        )}

        {/* Console stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Consolidated Inflows</p>
            <p className="text-2xl font-bold text-green-400">
              <AnimatedNumber value={totalInflow} prefix="₹" />
            </p>
            <p className="text-xs text-gray-500 mt-1">Total revenue / sales logged</p>
          </GlassCard>
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Consolidated Outflows</p>
            <p className="text-2xl font-bold text-red-400">
              <AnimatedNumber value={totalOutflow} prefix="₹" />
            </p>
            <p className="text-xs text-gray-500 mt-1">Total payroll / bills paid</p>
          </GlassCard>
          <GlassCard hover={false}>
            <p className="text-xs text-gray-400 mb-1">Net Cash Delta</p>
            <p className={`text-2xl font-bold ${totalInflow - totalOutflow >= 0 ? "text-white" : "text-red-400"}`}>
              <AnimatedNumber value={totalInflow - totalOutflow} prefix="₹" />
            </p>
            <p className="text-xs text-gray-500 mt-1">Delta for the cycle</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Post transaction form */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard hover={false}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Record Transaction
              </h3>
              {accounts.length === 0 ? (
                <p className="text-xs text-gray-500">Add a bank account to start recording transactions.</p>
              ) : (
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  {/* Basic Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Flow Type</label>
                      <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value, customer: "", vendor: "", employee: "" })}
                        className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      >
                        <option value="income">Inflow (Income)</option>
                        <option value="expense">Outflow (Expense)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Bank Account</label>
                      <select
                        value={form.bankAccountId}
                        onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}
                        className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} (Bal: ₹{a.balance.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="Amount"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Logging Date</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Classification Dropdowns (Part 1 replacement) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Category</label>
                      <SearchableDropdown
                        options={categoryOptions}
                        value={form.category}
                        onChange={(val) => setForm({ ...form, category: val })}
                        placeholder="Search category..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Payment Method</label>
                      <SearchableDropdown
                        options={dropdowns.paymentMethods}
                        value={form.paymentMethod}
                        onChange={(val) => setForm({ ...form, paymentMethod: val })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Currency</label>
                      <SearchableDropdown
                        options={dropdowns.currencies}
                        value={form.currency}
                        onChange={(val) => setForm({ ...form, currency: val })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Tax Code</label>
                      <SearchableDropdown
                        options={dropdowns.taxRates}
                        value={form.taxRate}
                        onChange={(val) => setForm({ ...form, taxRate: val })}
                      />
                    </div>
                  </div>

                  {/* Conditional Parties inputs (Part 1 Customer/Vendor dynamic create) */}
                  {form.type === "income" ? (
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Customer / Payer</label>
                      <SearchableDropdown
                        options={dropdowns.customers}
                        value={form.customer}
                        onChange={(val) => setForm({ ...form, customer: val })}
                        placeholder="Search customer..."
                        allowCreate={true}
                        onCreate={(name) => handleCreateOption('customers', name)}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Vendor / Payee</label>
                      <SearchableDropdown
                        options={dropdowns.vendors}
                        value={form.vendor}
                        onChange={(val) => setForm({ ...form, vendor: val })}
                        placeholder="Search vendor..."
                        allowCreate={true}
                        onCreate={(name) => handleCreateOption('vendors', name)}
                      />
                    </div>
                  )}

                  {/* Payroll / Employee Dropdown */}
                  {form.type === "expense" && form.category.toLowerCase().includes("salary") && (
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Linked Employee</label>
                      <SearchableDropdown
                        options={dropdowns.employees}
                        value={form.employee}
                        onChange={(val) => setForm({ ...form, employee: val })}
                        placeholder="Search employee..."
                        allowCreate={true}
                        onCreate={(name) => handleCreateOption('employees', name)}
                      />
                    </div>
                  )}

                  {/* Cost Center / Allocation tags */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Department</label>
                      <SearchableDropdown
                        options={dropdowns.departments}
                        value={form.department}
                        onChange={(val) => setForm({ ...form, department: val })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Project</label>
                      <SearchableDropdown
                        options={dropdowns.projects}
                        value={form.project}
                        onChange={(val) => setForm({ ...form, project: val })}
                        placeholder="Search project..."
                        allowCreate={true}
                        onCreate={(name) => handleCreateOption('projects', name)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Due / Settled Date</label>
                      <input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-1">Memo</label>
                      <input
                        type="text"
                        placeholder="Reference invoice..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adding}
                    className="w-full mt-2 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    {adding ? "Posting..." : "Log Transaction"}
                  </button>
                </form>
              )}
            </GlassCard>

            {/* Reconciliation tool */}
            <GlassCard hover={false}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Upload Bank Statement
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Paste statement entries in JSON format to trigger bulk reconciliation. Negatives represent outflows. Bank balance adjusts automatically.
              </p>
              <form onSubmit={handleReconcile} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Target Reconciliation Bank</label>
                  <select
                    value={form.bankAccountId}
                    onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}
                    className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (Bal: ₹{a.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Reconciliation Entries (JSON)</label>
                  <textarea
                    rows={5}
                    value={stmtPayload}
                    onChange={(e) => setStmtPayload(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-mono text-white focus:outline-none font-mono resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reconciling}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {reconciling ? "Reconciling..." : "Trigger Bulk Reconcile"}
                </button>
              </form>
            </GlassCard>
          </div>

          {/* Ledger Table */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              General Ledger Records
            </h3>
            {loading ? (
              <ShimmerLoader type="list" rows={6} />
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-sm text-gray-400">No ledger transactions posted.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const targetAcc = accounts.find((a) => a.id === tx.bankAccountId);

                  return (
                    <GlassCard key={tx.id} hover={false} style={{ padding: "16px" }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                tx.type === "income"
                                  ? "bg-green-400/10 text-green-400"
                                  : "bg-red-400/10 text-red-400"
                              }`}
                            >
                              {tx.type === "income" ? "INFLOW" : "OUTFLOW"}
                            </span>
                            <span className="text-xs text-gray-500">{tx.category}</span>
                            {targetAcc && (
                              <span className="text-xs text-gray-500">🏢 {targetAcc.name}</span>
                            )}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                tx.reconcileStatus === "reconciled"
                                  ? "bg-green-500/15 text-green-400"
                                  : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              {tx.reconcileStatus}
                            </span>
                          </div>
                          <h4 className="font-semibold text-white text-base">
                            {tx.description || "No description"}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400">
                            <span>Date: {tx.date.split("T")[0]}</span>
                            {tx.paymentMethod && <span>• Method: {tx.paymentMethod}</span>}
                            {tx.department && <span>• Dept: {tx.department}</span>}
                            {tx.project && <span>• Project: {tx.project}</span>}
                            {tx.customer && <span>• Client: {tx.customer}</span>}
                            {tx.vendor && <span>• Vendor: {tx.vendor}</span>}
                            {tx.employee && <span>• Staff: {tx.employee}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg font-bold ${
                              tx.type === "income" ? "text-green-400" : "text-white"
                            }`}
                          >
                            {tx.type === "income" ? "+" : "-"}₹{Number(tx.amount).toLocaleString('en-IN')}
                          </p>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="mt-2 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer block ml-auto"
                          >
                            Delete
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
