"use client";
import { useState, useEffect, useCallback } from "react";
import AppShell from "../components/AppShell";
import CosmicBackground from "../components/CosmicBackground";
import GlassCard from "../components/GlassCard";
import AnimatedNumber from "../components/AnimatedNumber";
import ShimmerLoader from "../components/ShimmerLoader";
import SearchableDropdown from "../components/SearchableDropdown";
import { jsPDF } from "jspdf";

// Import Recharts components
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

const SMART_REPORT_TYPES = [
  { id: "quarterly", label: "Quarterly review" },
  { id: "portfolio", label: "Portfolio analysis" },
  { id: "risk", label: "Risk assessment" },
  { id: "cashflow", label: "Cash flow report" },
];

const STATUS_MESSAGES = [
  "Fetching market benchmarks...",
  "Analysing financial data...",
  "Writing executive narrative...",
  "Formatting report...",
];

export default function CorporateReports() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [dropdowns, setDropdowns] = useState({
    vendors: [],
    customers: [],
    projects: [],
    employees: [],
    departments: []
  });

  const [activeTab, setActiveTab] = useState("pl"); // pl, bs, cf, aging, assets, ratios, smart

  // Filters state (Part 7)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    financialYear: "All",
    quarter: "All",
    month: "All",
    department: "All",
    project: "All",
    currency: "All",
    category: "All",
    paymentMethod: "All"
  });

  // AI insights state (Part 9)
  const [aiInsights, setAiInsights] = useState("");
  const [generatingAi, setGeneratingAi] = useState(false);

  // Integrated Smart Reports states
  const [smartReportType, setSmartReportType] = useState("quarterly");
  const [smartPeriod, setSmartPeriod] = useState("Q1 FY2025-26");
  const [smartGenerating, setSmartGenerating] = useState(false);
  const [smartStatusIndex, setSmartStatusIndex] = useState(0);
  const [smartReport, setSmartReport] = useState(null);
  const [smartError, setSmartError] = useState(null);
  const [smartHistory, setSmartHistory] = useState([]);
  const [smartDownloading, setSmartDownloading] = useState(false);
  const [smartVisibleSections, setSmartVisibleSections] = useState([]);

  async function loadAllData() {
    try {
      const [txRes, accRes, assetRes, invRes, dropRes] = await Promise.all([
        fetch("/api/cashflow/transactions"),
        fetch("/api/treasury/accounts"),
        fetch("/api/assets"),
        fetch("/api/investments"),
        fetch("/api/corporate/dropdowns")
      ]);

      if (txRes.ok && accRes.ok && assetRes.ok && invRes.ok && dropRes.ok) {
        setTransactions(await txRes.json());
        setAccounts(await accRes.json());
        setAssets(await assetRes.json());
        setInvestments(await invRes.json());
        setDropdowns(await dropRes.json());
      }
    } catch (e) {
      console.error("Failed to load reports data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter logic helper
  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      // Date Range
      if (filters.startDate && new Date(t.date) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(t.date) > new Date(filters.endDate)) return false;

      // Financial Year
      if (filters.financialYear !== "All") {
        const year = new Date(t.date).getFullYear();
        if (filters.financialYear === "FY24" && year !== 2024) return false;
        if (filters.financialYear === "FY25" && year !== 2025) return false;
        if (filters.financialYear === "FY26" && year !== 2026) return false;
      }

      // Quarter
      if (filters.quarter !== "All") {
        const m = new Date(t.date).getMonth(); // 0-11
        const q = Math.floor(m / 3) + 1; // 1-4
        if (filters.quarter !== `Q${q}`) return false;
      }

      // Month
      if (filters.month !== "All") {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const mLabel = months[new Date(t.date).getMonth()];
        if (filters.month !== mLabel) return false;
      }

      // Dimensions
      if (filters.department !== "All" && t.department !== filters.department) return false;
      if (filters.project !== "All" && t.project !== filters.project) return false;
      if (filters.currency !== "All" && t.currency !== filters.currency) return false;
      if (filters.category !== "All" && t.category !== filters.category) return false;
      if (filters.paymentMethod !== "All" && t.paymentMethod !== filters.paymentMethod) return false;

      return true;
    });
  };

  const filteredTx = getFilteredTransactions();

  // Part 4 - Financial KPIs Calculation
  const cashAccountsTotal = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const totalAssetsOriginal = assets.reduce((sum, a) => sum + Number(a.purchasePrice), 0);
  
  // Calculate P&L aggregates
  const revenue = filteredTx.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const operatingExpenses = filteredTx.filter(t => t.type === "expense" && t.category.toLowerCase() !== "cogs").reduce((sum, t) => sum + Number(t.amount), 0);
  const cogs = filteredTx.filter(t => t.type === "expense" && t.category.toLowerCase() === "cogs").reduce((sum, t) => sum + Number(t.amount), 0);
  
  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const ebitda = revenue - cogs - operatingExpenses;
  
  // Depreciation calculation helper
  const annualDepreciation = assets.reduce((sum, a) => {
    if (a.status !== 'active') return sum;
    const factor = a.depreciationMethod === 'straight-line' ? 1 : 2;
    const rate = (1 / (Number(a.usefulLifeMonths) / 12)) * factor;
    return sum + (Number(a.purchasePrice) * rate);
  }, 0);
  
  const ebit = ebitda - (annualDepreciation / 12); // monthly average ebit
  const netProfit = ebitda - (annualDepreciation / 12); // Assuming no tax/interest for simplicity
  const operatingMargin = revenue > 0 ? (ebit / revenue) * 100 : 0;
  
  // Balance Sheet Assets / Liabilities
  const investmentsValue = investments.reduce((sum, i) => sum + Number(i.currentValue || i.amountInvested), 0);
  const currentAssets = cashAccountsTotal + investmentsValue;
  const fixedAssetsBookValue = assets.reduce((sum, a) => sum + (a.status === 'active' ? Number(a.purchasePrice) : 0), 0);
  const totalAssets = currentAssets + fixedAssetsBookValue;
  
  // Liabilities & Equity
  const accountsPayable = filteredTx.filter(t => t.type === "expense" && t.reconcileStatus === "pending").reduce((sum, t) => sum + Number(t.amount), 0);
  const accountsReceivable = filteredTx.filter(t => t.type === "income" && t.reconcileStatus === "pending").reduce((sum, t) => sum + Number(t.amount), 0);
  
  const currentLiabilities = accountsPayable > 0 ? accountsPayable : 500000; // fallback default short debt
  const longTermDebt = 2000000; // corporate long term bonds/loans
  const totalLiabilities = currentLiabilities + longTermDebt;
  const totalEquity = totalAssets - totalLiabilities;
  
  // Ratios (Part 4)
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : 0;
  const quickRatio = currentLiabilities > 0 ? ((cashAccountsTotal + accountsReceivable) / currentLiabilities) : 0;
  const debtToEquity = totalEquity > 0 ? (totalLiabilities / totalEquity) : 0;
  const debtRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) : 0;
  const workingCapital = currentAssets - currentLiabilities;
  
  const avgMonthlyBurn = operatingExpenses > 0 ? (operatingExpenses / 3) : 100000; // avg monthly expense
  const runwayMonths = avgMonthlyBurn > 0 ? (cashAccountsTotal / avgMonthlyBurn) : 0;

  // AI insights generator (Part 9)
  const generateAiInsights = () => {
    setGeneratingAi(true);
    setTimeout(() => {
      const insights = `### 🤖 CFO AI Insights & Recommendations
* **Revenue Performance:** Total revenue stands at **₹${revenue.toLocaleString('en-IN')}**. Gross Margin is healthy at **${grossMargin.toFixed(1)}%**.
* **Cash Runway:** With cash reserves of **₹${cashAccountsTotal.toLocaleString('en-IN')}** and average operating burn of **₹${Math.round(avgMonthlyBurn).toLocaleString('en-IN')}/mo**, your liquidity runway is **${runwayMonths.toFixed(1)} months**.
* **Liquidity & Debt:** Current Ratio is **${currentRatio.toFixed(2)}x** and Quick Ratio is **${quickRatio.toFixed(2)}x** indicating ${quickRatio > 1 ? 'excellent short-term liquidity' : 'potential working capital stress'}. Debt-to-Equity stands at **${debtToEquity.toFixed(2)}**.
* **Risk Warnings:** 
  ${accountsPayable > 1500000 ? '⚠️ **High Accounts Payable:** Large outstanding vendor balances may impact supplier trust. Recommend sweep schedules.' : '✅ Accounts Payable aging balances are within safe margins.'}
  ${runwayMonths < 6 ? '🚨 **Liquidity Warning:** Runway is below 6 months. Advise immediate capital reallocation or cost audits.' : '✅ Surplus liquidity runway is stable.'}
* **Optimizations:** Recommend shifting ₹50,00,000 idle cash from HDFC Current to ICICI Treasury to capture arbitrage interest yield.`;
      setAiInsights(insights);
      setGeneratingAi(false);
    }, 1500);
  };

  // CSV Exporter (Part 8)
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Category,Description,Date,Amount,Status,Department,Project\n";
    
    filteredTx.forEach(t => {
      csvContent += `"${t.type}","${t.category}","${t.description}","${t.date}","${t.amount}","${t.reconcileStatus}","${t.department || ''}","${t.project || ''}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `General_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Exporter (Part 8)
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Page Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text("Apex Wealth Corp", 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Enterprise Financial Report", 14, 25);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text("Prepared by: CFO Office / Internal Audit", 14, 35);
    
    // Horizontal Line
    doc.setDrawColor(200);
    doc.line(14, 40, 196, 40);
    
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30);
    doc.text(activeTab.toUpperCase() + " Statement", 14, 48);
    
    // Render tabular metrics dynamically based on tab
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let y = 60;
    
    if (activeTab === "pl") {
      const items = [
        ["Total Revenue", `INR ${revenue.toLocaleString('en-IN')}`],
        ["Cost of Goods Sold (COGS)", `INR ${cogs.toLocaleString('en-IN')}`],
        ["Gross Margin / Profit", `INR ${grossProfit.toLocaleString('en-IN')} (${grossMargin.toFixed(1)}%)`],
        ["Operating Expenses", `INR ${operatingExpenses.toLocaleString('en-IN')}`],
        ["EBITDA", `INR ${ebitda.toLocaleString('en-IN')}`],
        ["Est. Depreciation (Monthly)", `INR ${Math.round(annualDepreciation / 12).toLocaleString('en-IN')}`],
        ["Net Profit (Pre-tax)", `INR ${netProfit.toLocaleString('en-IN')}`]
      ];
      
      items.forEach(row => {
        doc.text(row[0], 14, y);
        doc.text(row[1], 150, y);
        doc.line(14, y + 2, 196, y + 2);
        y += 10;
      });
    } else if (activeTab === "bs") {
      const items = [
        ["Current Assets (Cash + Equities)", `INR ${currentAssets.toLocaleString('en-IN')}`],
        ["Fixed Assets (Net value)", `INR ${fixedAssetsBookValue.toLocaleString('en-IN')}`],
        ["Total Book Assets", `INR ${totalAssets.toLocaleString('en-IN')}`],
        ["Current Liabilities (Dues / AP)", `INR ${currentLiabilities.toLocaleString('en-IN')}`],
        ["Long Term Loans", `INR ${longTermDebt.toLocaleString('en-IN')}`],
        ["Total Liabilities", `INR ${totalLiabilities.toLocaleString('en-IN')}`],
        ["Owner Equity Balance", `INR ${totalEquity.toLocaleString('en-IN')}`]
      ];
      
      items.forEach(row => {
        doc.text(row[0], 14, y);
        doc.text(row[1], 150, y);
        doc.line(14, y + 2, 196, y + 2);
        y += 10;
      });
    } else {
      doc.text("Report details exported to CSV format. Standard PDF prints support financial P&L and Balance Sheet summary views.", 14, y);
    }
    
    // Page Footers
    doc.line(14, 270, 196, 270);
    doc.setFontSize(8);
    doc.text("Confidential - Apex Wealth Corp Auditing Console", 14, 275);
    doc.text("Signature: __________________________", 130, 275);
    
    doc.save(`Financial_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Recharts Chart Data Prep
  const barData = [
    { name: "Inflow (Income)", amount: revenue, fill: "#10B981" },
    { name: "Outflow (Expense)", amount: operatingExpenses + cogs, fill: "#EF4444" }
  ];

  const pieData = [
    { name: "Treasury Cash", value: cashAccountsTotal, fill: "#3B82F6" },
    { name: "Equities / Securities", value: investmentsValue, fill: "#10B981" },
    { name: "Property & IP", value: fixedAssetsBookValue, fill: "#F59E0B" }
  ];

  // AR/AP Aging buckets calculation
  const getAgingBuckets = (type) => {
    const today = new Date();
    const buckets = { "0-30 Days": 0, "31-60 Days": 0, "61-90 Days": 0, "90+ Days": 0 };
    
    transactions.forEach(t => {
      if (t.type !== type || t.reconcileStatus === "reconciled") return;
      const due = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
      const diffTime = today - due;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 30) buckets["0-30 Days"] += Number(t.amount);
      else if (diffDays <= 60) buckets["31-60 Days"] += Number(t.amount);
      else if (diffDays <= 90) buckets["61-90 Days"] += Number(t.amount);
      else buckets["90+ Days"] += Number(t.amount);
    });
    
    return Object.keys(buckets).map(key => ({ name: key, amount: buckets[key] }));
  };

  const arAging = getAgingBuckets("income");
  const apAging = getAgingBuckets("expense");

  // Integrated Smart Reports Methods
  const generateSmartReport = useCallback(async () => {
    setSmartGenerating(true);
    setSmartError(null);
    setSmartReport(null);
    setSmartVisibleSections([]);
    setSmartStatusIndex(0);

    const statusInterval = setInterval(() => {
      setSmartStatusIndex((prev) => {
        if (prev >= STATUS_MESSAGES.length - 1) {
          clearInterval(statusInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType: smartReportType, period: smartPeriod, companyData: null }),
      });

      clearInterval(statusInterval);

      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      setSmartReport(data);

      (data.sections || []).forEach((_, i) => {
        setTimeout(() => setSmartVisibleSections((prev) => [...prev, i]), i * 400);
      });

      setSmartHistory((prev) => [{
        type: smartReportType,
        period: smartPeriod,
        generatedAt: data.generatedAt,
        wordCount: data.wordCount,
        data,
      }, ...prev].slice(0, 10));
    } catch (err) {
      clearInterval(statusInterval);
      setSmartError(err.message);
    } finally {
      setSmartGenerating(false);
    }
  }, [smartReportType, smartPeriod]);

  const downloadSmartPDF = useCallback(async () => {
    if (!smartReport) return;
    setSmartDownloading(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Title
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("MyMoneyPlant — Wealth Management", margin, y);
      y += 10;

      doc.setFontSize(22);
      doc.setTextColor(124, 58, 237);
      const titleText = `${smartReportType.charAt(0).toUpperCase() + smartReportType.slice(1)} Report`;
      doc.text(titleText, margin, y);
      y += 8;

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Period: ${smartPeriod} | Generated: ${new Date(smartReport.generatedAt).toLocaleDateString('en-IN')}`, margin, y);
      y += 4;

      doc.setDrawColor(124, 58, 237);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      for (const section of smartReport.sections) {
        if (y > 260) {
          doc.addPage();
          y = margin;
        }

        doc.setFontSize(14);
        doc.setTextColor(124, 58, 237);
        doc.text(section.title, margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        const paragraphs = section.content.split("\n").filter(Boolean);
        for (const para of paragraphs) {
          const lines = doc.splitTextToSize(para, contentWidth);
          for (const line of lines) {
            if (y > 275) {
              doc.addPage();
              y = margin;
            }
            doc.text(line, margin, y);
            y += 5;
          }
          y += 3;
        }
        y += 5;
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Confidential — MyMoneyPlant AI Generated Report", pageWidth / 2, 290, { align: "center" });
      }

      doc.save(`${smartReportType}_report_${smartPeriod.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setSmartDownloading(false);
    }
  }, [smartReport, smartReportType, smartPeriod]);

  return (
    <AppShell pageTitle="Corporate Reports Console" pageSubtitle="Real-time statutory statements, ratio matrices, aging schedules, and AI auditor analysis">
      <CosmicBackground />
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6 relative z-10" id="corporate-reports-root">
        
        {loading ? (
          <ShimmerLoader type="dashboard" />
        ) : (
          <>
            {/* KPI Cards Panel */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <GlassCard hover={false} style={{ padding: "16px" }}>
                <p className="text-[10px] text-gray-400 mb-1">EBITDA</p>
                <p className="text-lg font-bold text-white">₹{ebitda.toLocaleString('en-IN')}</p>
                <p className="text-[9px] text-gray-500 mt-1">Earnings pre dep/tax</p>
              </GlassCard>
              <GlassCard hover={false} style={{ padding: "16px" }}>
                <p className="text-[10px] text-gray-400 mb-1">Gross Margin</p>
                <p className="text-lg font-bold text-green-400">{grossMargin.toFixed(1)}%</p>
                <p className="text-[9px] text-gray-500 mt-1">Product margins</p>
              </GlassCard>
              <GlassCard hover={false} style={{ padding: "16px" }}>
                <p className="text-[10px] text-gray-400 mb-1">Current Ratio</p>
                <p className={`text-lg font-bold ${currentRatio >= 1.5 ? 'text-green-400' : 'text-amber-400'}`}>
                  {currentRatio.toFixed(2)}x
                </p>
                <p className="text-[9px] text-gray-500 mt-1">Assets vs Liabilities</p>
              </GlassCard>
              <GlassCard hover={false} style={{ padding: "16px" }}>
                <p className="text-[10px] text-gray-400 mb-1">Quick Ratio</p>
                <p className={`text-lg font-bold ${quickRatio >= 1.0 ? 'text-green-400' : 'text-red-400'}`}>
                  {quickRatio.toFixed(2)}x
                </p>
                <p className="text-[9px] text-gray-500 mt-1">Acid-test cash coverage</p>
              </GlassCard>
              <GlassCard hover={false} style={{ padding: "16px" }}>
                <p className="text-[10px] text-gray-400 mb-1">Debt to Equity</p>
                <p className="text-lg font-bold text-white">{debtToEquity.toFixed(2)}</p>
                <p className="text-[9px] text-gray-500 mt-1">Financial leverage ratio</p>
              </GlassCard>
              <GlassCard hover={false} style={{ padding: "16px" }}>
                <p className="text-[10px] text-gray-400 mb-1">Cash Runway</p>
                <p className={`text-lg font-bold ${runwayMonths > 6 ? 'text-green-400' : 'text-red-400'}`}>
                  {runwayMonths.toFixed(1)} mo
                </p>
                <p className="text-[9px] text-gray-500 mt-1">Based on monthly burn</p>
              </GlassCard>
            </div>

            {/* Filters Matrix */}
            <GlassCard hover={false}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Statement Custom Filtering & Controls
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Financial Year</label>
                  <select
                    className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                    value={filters.financialYear}
                    onChange={(e) => setFilters({ ...filters, financialYear: e.target.value })}
                  >
                    <option value="All">All Years</option>
                    <option value="FY24">FY24 (2024)</option>
                    <option value="FY25">FY25 (2025)</option>
                    <option value="FY26">FY26 (2026)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Quarter</label>
                  <select
                    className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                    value={filters.quarter}
                    onChange={(e) => setFilters({ ...filters, quarter: e.target.value })}
                  >
                    <option value="All">All Quarters</option>
                    <option value="Q1">Q1 (Apr - Jun)</option>
                    <option value="Q2">Q2 (Jul - Sep)</option>
                    <option value="Q3">Q3 (Oct - Dec)</option>
                    <option value="Q4">Q4 (Jan - Mar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Department</label>
                  <select
                    className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  >
                    <option value="All">All Departments</option>
                    {dropdowns.departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={() => setFilters({
                    startDate: "",
                    endDate: "",
                    financialYear: "All",
                    quarter: "All",
                    month: "All",
                    department: "All",
                    project: "All",
                    currency: "All",
                    category: "All",
                    paymentMethod: "All"
                  })}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </GlassCard>

            {/* Split layout: Reports Tab and Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Tabbed Statements UI */}
              <div className="lg:col-span-2 space-y-4">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 p-1 bg-[#161B22]/80 border border-white/10 rounded-xl">
                  {[
                    { id: "pl", name: "Income Statement (P&L)" },
                    { id: "bs", name: "Balance Sheet" },
                    { id: "cf", name: "Cash Flows" },
                    { id: "aging", name: "Aging AR/AP" },
                    { id: "assets", name: "Fixed Asset Register" },
                    { id: "ratios", name: "Financial Ratios" },
                    { id: "smart", name: "Smart AI Reports" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-green-500 text-black"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>

                {/* Tab Content Display */}
                <GlassCard hover={false} style={{ padding: "24px" }}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-white uppercase tracking-wide">
                      {activeTab === 'pl' && "Profit & Loss Statement"}
                      {activeTab === 'bs' && "Balance Sheet / Equity Statement"}
                      {activeTab === 'cf' && "Statutory Statement of Cash Flows"}
                      {activeTab === 'aging' && "Payables & Receivables Aging Ledger"}
                      {activeTab === 'assets' && "Fixed Asset Register & Depreciation Book"}
                      {activeTab === 'ratios' && "Leverage & Margin Ratio Ledger"}
                      {activeTab === 'smart' && "Smart AI Narrative Report Generator"}
                    </h2>
                    {activeTab !== "smart" && (
                      <div className="flex gap-2">
                        <button
                          onClick={exportToCSV}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        >
                          💾 CSV
                        </button>
                        <button
                          onClick={exportToPDF}
                          className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                        >
                          📄 Export PDF
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profit and Loss UI */}
                  {activeTab === "pl" && (
                    <div className="space-y-4 text-sm text-gray-300">
                      <div className="flex justify-between font-medium">
                        <span>Corporate Sales Revenue</span>
                        <span className="text-green-400">₹{revenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pl-4 border-l border-white/10">
                        <span>Direct Invoices</span>
                        <span>₹{revenue.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between font-medium text-red-400">
                        <span>Cost of Goods Sold (COGS)</span>
                        <span>-₹{cogs.toLocaleString('en-IN')}</span>
                      </div>
                      <hr className="border-white/10" />
                      <div className="flex justify-between font-bold text-white text-base">
                        <span>Gross Profit</span>
                        <span>₹{grossProfit.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between font-medium text-red-400 pl-2">
                        <span>Operating & Administrative Expenses</span>
                        <span>-₹{operatingExpenses.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 pl-6 border-l border-white/10">
                        <span>Marketing, Salaries & Utility Bills</span>
                        <span>₹{operatingExpenses.toLocaleString('en-IN')}</span>
                      </div>
                      <hr className="border-white/10" />
                      <div className="flex justify-between font-bold text-white text-base">
                        <span>EBITDA</span>
                        <span>₹{ebitda.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between font-medium text-amber-500 pl-2">
                        <span>Est. Capital Depreciation (Physical/Digital)</span>
                        <span>-₹{Math.round(annualDepreciation / 12).toLocaleString('en-IN')}</span>
                      </div>
                      <hr className="border-white/10" />
                      <div className="flex justify-between font-bold text-green-400 text-lg">
                        <span>Net Profit (Pre-tax)</span>
                        <span>₹{netProfit.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  {/* Balance Sheet UI */}
                  {activeTab === "bs" && (
                    <div className="space-y-6 text-sm text-gray-300">
                      <div>
                        <h4 className="font-bold text-white mb-2">1. Current Assets</h4>
                        <div className="space-y-2 pl-4 border-l border-white/10">
                          <div className="flex justify-between">
                            <span>Cash & Bank Balances</span>
                            <span>₹{cashAccountsTotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Central Treasury Investments</span>
                            <span>₹{investmentsValue.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Accounts Receivable (Pending client invoices)</span>
                            <span>₹{accountsReceivable.toLocaleString('en-IN')}</span>
                          </div>
                          <hr className="border-white/5" />
                          <div className="flex justify-between font-semibold text-white">
                            <span>Subtotal Current Assets</span>
                            <span>₹{currentAssets.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-white mb-2">2. Non-Current Assets</h4>
                        <div className="space-y-2 pl-4 border-l border-white/10">
                          <div className="flex justify-between">
                            <span>Property, Plant & Equipment (PPE)</span>
                            <span>₹{fixedAssetsBookValue.toLocaleString('en-IN')}</span>
                          </div>
                          <hr className="border-white/5" />
                          <div className="flex justify-between font-semibold text-white">
                            <span>Total Book Assets</span>
                            <span>₹{totalAssets.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-white mb-2">3. Liabilities & Debt</h4>
                        <div className="space-y-2 pl-4 border-l border-white/10">
                          <div className="flex justify-between">
                            <span>Accounts Payable (Pending bills)</span>
                            <span>₹{accountsPayable.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Long-term Loans / Debentures</span>
                            <span>₹{longTermDebt.toLocaleString('en-IN')}</span>
                          </div>
                          <hr className="border-white/5" />
                          <div className="flex justify-between font-semibold text-white">
                            <span>Total Liabilities</span>
                            <span>₹{totalLiabilities.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <div className="flex justify-between font-bold text-green-400 text-lg">
                          <span>Owner Equity Balance</span>
                          <span>₹{totalEquity.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cash Flow Statement */}
                  {activeTab === "cf" && (
                    <div className="space-y-4 text-sm text-gray-300">
                      <div>
                        <h4 className="font-bold text-white mb-2">Operating Activities</h4>
                        <div className="flex justify-between pl-4 border-l border-white/10">
                          <span>Net Inflows from Customers & Sales Ledger</span>
                          <span className="text-green-400">₹{revenue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pl-4 border-l border-white/10 mt-2">
                          <span>Payments to Employees & Service Providers</span>
                          <span className="text-red-400">-₹{operatingExpenses.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-white mb-2">Investing Activities</h4>
                        <div className="flex justify-between pl-4 border-l border-white/10">
                          <span>Stock Purchases / Capital deployment</span>
                          <span className="text-red-400">-₹{investmentsValue.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pl-4 border-l border-white/10 mt-2">
                          <span>Purchase of Plant & IP Assets</span>
                          <span className="text-red-400">-₹{totalAssetsOriginal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      
                      <hr className="border-white/10" />
                      <div className="flex justify-between font-bold text-white text-base">
                        <span>Net Cash Flow Delta</span>
                        <span className={revenue - (operatingExpenses + investmentsValue) >= 0 ? "text-green-400" : "text-red-400"}>
                          ₹{(revenue - (operatingExpenses + investmentsValue)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Aging AR/AP Ledger */}
                  {activeTab === "aging" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-white mb-3">Receivables (AR) Aging</h4>
                        <div className="space-y-2">
                          {arAging.map(item => (
                            <div key={item.name} className="flex justify-between items-center p-2.5 rounded-lg bg-white/5">
                              <span className="text-xs font-medium text-gray-300">{item.name}</span>
                              <span className="text-sm font-bold text-white">₹{item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-3">Payables (AP) Aging</h4>
                        <div className="space-y-2">
                          {apAging.map(item => (
                            <div key={item.name} className="flex justify-between items-center p-2.5 rounded-lg bg-white/5">
                              <span className="text-xs font-medium text-gray-300">{item.name}</span>
                              <span className="text-sm font-bold text-white">₹{item.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fixed Assets Book */}
                  {activeTab === "assets" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-gray-300">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-500 font-bold">
                            <th className="py-2">Asset Label</th>
                            <th>Class</th>
                            <th>Acq Price</th>
                            <th>Date</th>
                            <th>Useful Life</th>
                            <th>Method</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assets.map(a => (
                            <tr key={a.id} className="border-b border-white/5">
                              <td className="py-2.5 font-semibold text-white">{a.name}</td>
                              <td>{a.category}</td>
                              <td>₹{Number(a.purchasePrice).toLocaleString()}</td>
                              <td>{a.purchaseDate}</td>
                              <td>{a.usefulLifeMonths} mo</td>
                              <td className="capitalize">{a.depreciationMethod}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Ratio Matrix */}
                  {activeTab === "ratios" && (
                    <div className="space-y-3">
                      {[
                        { name: "Current Ratio", value: `${currentRatio.toFixed(2)}x`, target: ">= 1.5x", desc: "Short term bill payment health metric.", status: currentRatio >= 1.5 ? "Healthy" : "Attention" },
                        { name: "Quick Ratio", value: `${quickRatio.toFixed(2)}x`, target: ">= 1.0x", desc: "Acid-test asset safety indicator.", status: quickRatio >= 1.0 ? "Healthy" : "Critical" },
                        { name: "Debt-to-Equity", value: `${debtToEquity.toFixed(2)}`, target: "< 1.5", desc: "Shareholder funding gearing leverage.", status: debtToEquity < 1.5 ? "Healthy" : "Critical" },
                        { name: "Debt Ratio", value: `${(debtRatio * 100).toFixed(1)}%`, target: "< 50%", desc: "Assets portion financed through liabilities.", status: debtRatio < 0.5 ? "Healthy" : "Attention" },
                        { name: "Net Profit Margin", value: `${(revenue > 0 ? (netProfit / revenue) * 100 : 0).toFixed(1)}%`, target: ">= 10%", desc: "Company core profitability metrics.", status: (revenue > 0 ? (netProfit / revenue) : 0) >= 0.1 ? "Healthy" : "Attention" }
                      ].map(ratio => (
                        <div key={ratio.name} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white text-sm">{ratio.name}</h4>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                ratio.status === "Healthy" ? "bg-green-500/10 text-green-400" :
                                ratio.status === "Attention" ? "bg-yellow-500/10 text-yellow-400" :
                                "bg-red-500/10 text-red-400"
                              }`}>
                                {ratio.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{ratio.desc}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-white">{ratio.value}</p>
                            <p className="text-[9px] text-gray-500">Benchmark: {ratio.target}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Integrated Smart AI Reports Console (Ported from smart-reports) */}
                  {activeTab === "smart" && (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col md:flex-row items-end gap-4">
                        <div className="flex-1">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2">Report Type</label>
                          <select
                            value={smartReportType}
                            onChange={(e) => setSmartReportType(e.target.value)}
                            className="w-full bg-[#161B22] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-green-500"
                          >
                            {SMART_REPORT_TYPES.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2">Period</label>
                          <input
                            type="text"
                            value={smartPeriod}
                            onChange={(e) => setSmartPeriod(e.target.value)}
                            placeholder="e.g. Q1 FY2025-26"
                            className="w-full bg-[#1C2128] border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={generateSmartReport}
                          disabled={smartGenerating}
                          className="px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          {smartGenerating ? "Generating..." : "Generate AI Report"}
                        </button>
                      </div>

                      {/* Progress bar */}
                      {smartGenerating && (
                        <div className="p-4 rounded-xl border border-white/10 bg-[#161B22]">
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                            <div
                              className="h-full bg-green-500 transition-all duration-500"
                              style={{ width: `${((smartStatusIndex + 1) / STATUS_MESSAGES.length) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-green-400 text-center animate-pulse">{STATUS_MESSAGES[smartStatusIndex]}</p>
                        </div>
                      )}

                      {smartError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400 rounded-lg">
                          Error: {smartError}
                        </div>
                      )}

                      {/* Display results */}
                      {smartReport && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                          <div className="md:col-span-2 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Report Sections Preview</h3>
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 max-h-96 overflow-y-auto space-y-4">
                              {smartReport.sections.map((section, idx) => (
                                <div key={idx} className="space-y-2">
                                  <h4 className="text-sm font-bold text-green-400 border-b border-white/5 pb-1">{section.title}</h4>
                                  {section.content.split('\n').filter(Boolean).map((para, pIdx) => (
                                    <p key={pIdx} className="text-xs text-gray-300 leading-relaxed">{para}</p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Report Metadata</h3>
                            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                              <div>
                                <p className="text-[10px] text-gray-500">Period</p>
                                <p className="text-xs font-bold text-white">{smartReport.period}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500">Generated At</p>
                                <p className="text-xs font-bold text-white">{new Date(smartReport.generatedAt).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500">Word Count</p>
                                <p className="text-xs font-bold text-white">{smartReport.wordCount} words</p>
                              </div>
                              <button
                                onClick={downloadSmartPDF}
                                disabled={smartDownloading}
                                className="w-full mt-3 py-2 bg-green-500 text-black font-bold text-xs rounded-lg hover:bg-green-600 cursor-pointer"
                              >
                                {smartDownloading ? "Generating PDF..." : "Download Full PDF"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Smart History */}
                      {smartHistory.length > 0 && (
                        <div className="pt-4 border-t border-white/5">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Previous Generation Runs</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left text-gray-400">
                              <thead>
                                <tr className="border-b border-white/10 text-gray-500 font-bold">
                                  <th className="py-2">Type</th>
                                  <th>Period</th>
                                  <th>Generated</th>
                                  <th>Details</th>
                                </tr>
                              </thead>
                              <tbody>
                                {smartHistory.map((h, i) => (
                                  <tr key={i} className="border-b border-white/5">
                                    <td className="py-2 capitalize">{h.type}</td>
                                    <td>{h.period}</td>
                                    <td>{new Date(h.generatedAt).toLocaleString()}</td>
                                    <td>
                                      <button
                                        onClick={() => setSmartReport(h.data)}
                                        className="text-green-400 hover:underline cursor-pointer"
                                      >
                                        View Preview
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </GlassCard>
              </div>

              {/* Right Column: Visual Charts & AI insights */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* AI Analyst summary */}
                <GlassCard hover={false}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                      CFO AI Insights Box
                    </h3>
                    <button
                      onClick={generateAiInsights}
                      disabled={generatingAi}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-green-500 text-black hover:bg-green-600 disabled:opacity-50 cursor-pointer"
                    >
                      {generatingAi ? "Analyzing..." : "Run Review"}
                    </button>
                  </div>
                  
                  {aiInsights ? (
                    <div className="text-xs text-gray-300 leading-relaxed space-y-2 prose prose-invert max-w-none">
                      {aiInsights.split('\n').map((line, idx) => {
                        if (line.startsWith('* **')) {
                          const parts = line.replace('* **', '').split('**');
                          return (
                            <p key={idx} className="mt-1">
                              <strong>{parts[0]}</strong> {parts.slice(1).join('')}
                            </p>
                          );
                        }
                        if (line.startsWith('###')) {
                          return <h4 key={idx} className="font-bold text-white mt-3 text-sm">{line.replace('###', '').trim()}</h4>;
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Click &ldquo;Run Review&rdquo; to trigger the automated system audit check. Generates cash conversions, cost optimizations, and ledger warnings.
                    </p>
                  )}
                </GlassCard>

                {/* Recharts flow bar */}
                <GlassCard hover={false}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Cash Inflow vs Outflow
                  </h3>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <XAxis dataKey="name" stroke="#A1A1AA" fontSize={10} />
                        <YAxis stroke="#A1A1AA" fontSize={10} />
                        <Tooltip contentStyle={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.1)" }} labelStyle={{ color: "#fff" }} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {barData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                {/* Pie Chart asset distribution */}
                <GlassCard hover={false}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                    Corporate Capital Mix
                  </h3>
                  <div className="h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.1)" }} labelStyle={{ color: "#fff" }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

              </div>

            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}
