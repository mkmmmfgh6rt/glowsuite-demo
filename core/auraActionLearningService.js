// =======================================================
// 🧠 AURA Strategy ROI Learning Service – SQLite Only
// Lernt auf Strategie-Ebene (strategy_type)
// =======================================================

import { getAuraMarketingHistory } from "./db.js";

export function learnFromAuraActions({ tenant = null, limit = 200 } = {}) {
  if (!tenant) {
    return { tenant: null, learned_actions: [], count: 0 };
  }

  // Nur ausgeführte Aktionen berücksichtigen
  const records = getAuraMarketingHistory({
    tenant,
    limit,
    status: "executed",
  });

  if (!records || records.length === 0) {
    return { tenant, learned_actions: [], count: 0 };
  }

  const map = {};

  for (const r of records) {
    const key = r.strategy_type || "unknown";
    if (!key) continue;

    if (!map[key]) {
      map[key] = {
        strategy_type: key,
        total_runs: 0,
        roi_values: [],
        revenue_impacts: [],
        booking_impacts: [],
        last_used: r.created_at,
      };
    }

    map[key].total_runs++;

    if (typeof r.roi_score === "number") {
      map[key].roi_values.push(r.roi_score);
    }

    if (typeof r.impact_revenue === "number") {
      map[key].revenue_impacts.push(r.impact_revenue);
    }

    if (typeof r.impact_bookings === "number") {
      map[key].booking_impacts.push(r.impact_bookings);
    }

    if (r.created_at > map[key].last_used) {
      map[key].last_used = r.created_at;
    }
  }

  const learned = Object.values(map).map(entry => {
    const avgROI =
      entry.roi_values.length > 0
        ? entry.roi_values.reduce((a, b) => a + b, 0) /
          entry.roi_values.length
        : 0;

    const avgRevenueImpact =
      entry.revenue_impacts.length > 0
        ? entry.revenue_impacts.reduce((a, b) => a + b, 0) /
          entry.revenue_impacts.length
        : 0;

    const avgBookingImpact =
      entry.booking_impacts.length > 0
        ? entry.booking_impacts.reduce((a, b) => a + b, 0) /
          entry.booking_impacts.length
        : 0;

    return {
      strategy_type: entry.strategy_type,
      total_runs: entry.total_runs,
      avg_roi: Number(avgROI.toFixed(3)),
      avg_revenue_impact: Number(avgRevenueImpact.toFixed(2)),
      avg_booking_impact: Number(avgBookingImpact.toFixed(2)),
      success_rate: normalizeROI(avgROI),
      last_used: entry.last_used,
    };
  });

  return {
    tenant,
    learned_actions: learned.sort(
      (a, b) => b.success_rate - a.success_rate
    ),
    count: learned.length,
  };
}

// -------------------------------------------------------
// 🔧 ROI → Success Mapping
// -------------------------------------------------------

function normalizeROI(roi) {
  if (roi >= 2) return 1;
  if (roi >= 1) return 0.75;
  if (roi >= 0.5) return 0.5;
  if (roi > 0) return 0.25;
  return 0;
}


