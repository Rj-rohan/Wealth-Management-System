import { db } from "@/lib/db/database";
import { dataset } from "@/lib/mock/dataset";
import { ok, fail } from "@/lib/api/response";

export async function POST() {
  try {
    await db.ensureInit();

    // 1. Seed clients
    for (const c of dataset.clients) {
      await db.upsert("clients", { id: c.id }, {
        first_name: c.firstName,
        last_name: c.lastName,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        risk_profile: c.riskProfile,
        age: c.age,
        occupation: c.occupation,
        location: c.location,
        joined_date: c.joinedDate,
        last_contact: c.lastContact,
        net_worth: c.netWorth,
        assets: c.assets,
        liabilities: c.liabilities,
        income: c.income,
        expenses: c.expenses,
        allocation: c.allocation,
        tags: c.tags,
      });
    }

    // 2. Seed appointments
    for (const a of dataset.appointments) {
      await db.upsert("appointments", { id: a.id }, {
        client_id: a.clientId,
        client_name: a.clientName,
        title: a.title,
        type: a.type,
        start: a.start,
        duration: a.duration,
        status: a.status,
        notes: a.notes,
      });
    }

    // 3. Seed conversations
    for (const conv of dataset.conversations) {
      await db.upsert("conversations", { id: conv.id }, {
        client_id: conv.clientId,
        client_name: conv.clientName,
        last_message: conv.lastMessage,
        last_at: conv.lastAt,
        unread: conv.unread,
        messages: conv.messages,
      });
    }

    // 4. Seed documents
    for (const d of dataset.documents) {
      await db.upsert("documents", { id: d.id }, {
        client_id: d.clientId,
        client_name: d.clientName,
        name: d.name,
        category: d.category,
        size_kb: d.sizeKb,
        uploaded_at: d.uploadedAt,
      });
    }

    // 5. Seed notes
    for (const n of dataset.notes) {
      await db.upsert("notes", { id: n.id }, {
        client_id: n.clientId,
        client_name: n.clientName,
        type: n.type,
        pinned: n.pinned,
        title: n.title,
        body: n.body,
      });
    }

    // 6. Seed goals
    for (const g of dataset.goals) {
      await db.upsert("client_goals", { id: g.id }, {
        client_id: g.clientId,
        type: g.type,
        label: g.label,
        target_amount: g.targetAmount,
        current_savings: g.currentSavings,
        target_date: g.targetDate,
        monthly_contribution: g.monthlyContribution,
        progress: g.progress,
        priority: g.priority,
        status: g.status,
      });
    }

    // 7. Seed financial profiles
    for (const fp of dataset.financialProfiles) {
      await db.upsert("financial_profiles", { client_id: fp.clientId }, {
        client_id: fp.clientId,
        income: fp.income,
        expenses: fp.expenses,
        debts: fp.debts,
        emergency_fund: fp.emergencyFund,
        health_score: fp.healthScore,
        savings_rate: fp.savingsRate,
        monthly_surplus: fp.monthlySurplus,
        net_worth_timeline: fp.netWorthTimeline,
        cash_flow_history: fp.cashFlowHistory,
      });
    }

    // 8. Seed financial plans
    for (const p of dataset.financialPlans) {
      await db.upsert("financial_plans", { id: p.id }, {
        client_id: p.clientId,
        client_name: p.clientName,
        title: p.title,
        status: p.status,
        version: p.version,
        executive_summary: p.executiveSummary,
        objectives: p.objectives,
        financial_analysis: p.financialAnalysis,
        recommended_strategy: p.recommendedStrategy,
        asset_allocation: p.assetAllocation,
        risk_assessment: p.riskAssessment,
        action_items: p.actionItems,
        advisor_notes: p.advisorNotes,
        version_history: p.versionHistory,
      });
    }

    // 9. Seed portfolios
    for (const p of dataset.portfolios) {
      await db.upsert("portfolio_data", { client_id: p.clientId }, {
        client_id: p.clientId,
        holdings: p.holdings,
        performance_history: p.performanceHistory,
        analysis: p.analysis,
        total_value: p.totalValue,
        total_cost: p.totalCost,
        total_return: p.totalReturn,
      });
    }

    // 10. Seed risk profiles
    for (const r of dataset.riskProfiles) {
      await db.upsert("risk_profiles", { client_id: r.clientId }, {
        client_id: r.clientId,
        risk_level: r.riskLevel,
        risk_score: r.riskScore,
        investment_experience: r.investmentExperience,
        risk_capacity: r.riskCapacity,
        risk_tolerance: r.riskTolerance,
        financial_stability: r.financialStability,
        investment_horizon: r.investmentHorizon,
        recommended_allocation: r.recommendedAllocation,
        suitable_categories: r.suitableCategories,
        assessed_at: r.assessedAt,
      });
    }

    // 11. Seed recommendations
    for (const rec of dataset.recommendations) {
      await db.upsert("recommendations", { id: rec.id }, {
        client_id: rec.clientId,
        category: rec.category,
        title: rec.title,
        priority: rec.priority,
        explanation: rec.explanation,
        expected_benefit: rec.expectedBenefit,
        estimated_timeline: rec.estimatedTimeline,
        status: rec.status,
      });
    }

    return ok({ seeded: true, message: "Database successfully seeded with realistic sample data into PostgreSQL" });
  } catch (error) {
    console.error("[Seed Error]:", error);
    return fail(error.message || "Failed to seed database", 500);
  }
}
