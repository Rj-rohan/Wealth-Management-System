"use client";
import { createContext, useContext, useState, useEffect } from "react";

// Investor type classification based on profile inputs
export function classifyInvestor(profile) {
  const { age, riskAppetite, horizon, monthlyInvestment, goal } = profile;

  if (riskAppetite === "low" || horizon <= 2) {
    return {
      type: "Conservative",
      icon: "🛡️",
      color: "blue",
      desc: "Capital preservation with steady returns. Focus on dividends and large-caps.",
      allocation: { equity: 30, debt: 60, gold: 10 },
      buffettAdvice: "Stick to businesses you understand. Margin of safety is your best friend.",
      maxStockPE: 20,
      minDividendYield: 2,
    };
  }
  if (riskAppetite === "high" && age < 35 && horizon >= 7) {
    return {
      type: "Aggressive Growth",
      icon: "🚀",
      color: "green",
      desc: "High-conviction bets on quality compounders. Long horizon allows volatility.",
      allocation: { equity: 85, debt: 10, gold: 5 },
      buffettAdvice: "Time in the market beats timing the market. Buy wonderful businesses and hold.",
      maxStockPE: 45,
      minDividendYield: 0,
    };
  }
  if (goal === "retirement") {
    return {
      type: "Wealth Builder",
      icon: "🏦",
      color: "purple",
      desc: "Long-term compounding for retirement. Balanced quality equity with some debt.",
      allocation: { equity: 65, debt: 30, gold: 5 },
      buffettAdvice: "Compound interest is the 8th wonder. Start early, stay consistent.",
      maxStockPE: 35,
      minDividendYield: 1,
    };
  }
  return {
    type: "Balanced",
    icon: "⚖️",
    color: "amber",
    desc: "Mix of growth and safety. Quality large and mid-caps with moderate risk.",
    allocation: { equity: 55, debt: 35, gold: 10 },
    buffettAdvice: "Diversification is protection against ignorance. Know what you own.",
    maxStockPE: 30,
    minDividendYield: 1,
  };
}

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wm_profile");
      if (saved) setProfile(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  function saveProfile(data) {
    const investor = classifyInvestor(data);
    const full = { ...data, investor };
    setProfile(full);
    localStorage.setItem("wm_profile", JSON.stringify(full));
  }

  function clearProfile() {
    setProfile(null);
    localStorage.removeItem("wm_profile");
  }

  return (
    <UserContext.Provider value={{ profile, saveProfile, clearProfile, loaded }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
