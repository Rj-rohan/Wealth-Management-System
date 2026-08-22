import { db } from "@/lib/db/database";
import { ok } from "@/lib/api/response";

export async function GET(request, { params }) {
  const { clientId } = await params;
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  let recs = await db.findMany("recommendations", { client_id: clientId });
  if (recs.length === 0) {
    const defaults = [
      {
        client_id: clientId,
        category: "investment",
        title: "Increase equity allocation in index funds",
        priority: "high",
        explanation: "Current equity allocation is below recommended targets for long-term compound wealth growth.",
        expected_benefit: "Potential 2-4% higher annual returns",
        estimated_timeline: "1-3 months",
        status: "pending",
      },
      {
        client_id: clientId,
        category: "tax",
        title: "Maximize Section 80C & ELSS deductions",
        priority: "medium",
        explanation: "Unused tax deductions available for current financial year.",
        expected_benefit: "Direct tax savings up to ₹46,800",
        estimated_timeline: "Before year-end",
        status: "pending",
      },
      {
        client_id: clientId,
        category: "emergency_fund",
        title: "Maintain 6 months liquidity in liquid mutual fund",
        priority: "high",
        explanation: "Liquid buffer ensures insulation against market downturns without premature redemption.",
        expected_benefit: "Capital safety & instant access",
        estimated_timeline: "Immediate",
        status: "pending",
      },
      {
        client_id: clientId,
        category: "insurance",
        title: "Review term life and super top-up health cover",
        priority: "medium",
        explanation: "Ensure comprehensive family coverage aligned with current liabilities and income.",
        expected_benefit: "Adequate protection for dependents",
        estimated_timeline: "2-4 weeks",
        status: "pending",
      },
    ];

    recs = [];
    for (const d of defaults) {
      const inserted = await db.insert("recommendations", d);
      recs.push(inserted);
    }
  }

  if (category) {
    recs = recs.filter((r) => r.category === category);
  }

  return ok(
    recs.map((r) => ({
      id: r.id,
      clientId: r.client_id || r.clientId,
      category: r.category,
      title: r.title,
      priority: r.priority,
      explanation: r.explanation,
      expectedBenefit: r.expected_benefit || r.expectedBenefit,
      estimatedTimeline: r.estimated_timeline || r.estimatedTimeline,
      status: r.status,
      createdAt: r.created_at || r.createdAt,
    }))
  );
}
