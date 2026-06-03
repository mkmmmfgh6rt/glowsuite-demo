// =======================================================
// 🧠 AURA Strategy ROI Learning Service – SQLite Only
// Lernt auf Strategie-Ebene (strategy_type)
// Robust Fallback für Alt-Daten
// =======================================================

import { getAuraMarketingHistory } from "./db.js";

const KNOWN_STRATEGY_TYPES = new Set([
  "free_slots_detected",
  "revenue_drop",
  "loyalty_bonus",
  "vip_customer",
  "upsell",
  "forecast_drop",
  "unknown_trigger"
]);

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
    const key = detectStrategyType(r);
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

  const learned = Object.values(map)
  .filter(entry => entry.strategy_type !== "unknown")
  .map(entry => {
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
    learned_actions: learned.sort(sortLearnedActions),
    count: learned.length,
  };
}

// -------------------------------------------------------
// 🧠 Strategy Type Resolver
// -------------------------------------------------------
// Priorität:
// 1. echte DB-Spalte strategy_type
// 2. Alt-Daten: headline, falls dort ein bekannter Trigger steht
// 3. Fallback unknown
// -------------------------------------------------------

function detectStrategyType(action) {
  const direct = normalizeStrategyType(action?.strategy_type);

  if (direct) {
    return direct;
  }

  const fromHeadline = normalizeStrategyType(action?.headline);

  if (fromHeadline && KNOWN_STRATEGY_TYPES.has(fromHeadline)) {
    return fromHeadline;
  }

  return "unknown";
}

function normalizeStrategyType(value) {
  if (!value) return null;

  const clean = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return clean || null;
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

// -------------------------------------------------------
// 📊 Ranking
// -------------------------------------------------------

function sortLearnedActions(a, b) {
  if (b.success_rate !== a.success_rate) {
    return b.success_rate - a.success_rate;
  }

  if (b.avg_roi !== a.avg_roi) {
    return b.avg_roi - a.avg_roi;
  }

  if (b.avg_revenue_impact !== a.avg_revenue_impact) {
    return b.avg_revenue_impact - a.avg_revenue_impact;
  }

  return b.avg_booking_impact - a.avg_booking_impact;
}


