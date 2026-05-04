// =======================================================
// 🧠 AURA Revenue Brain
// erkennt Umsatzprobleme und Chancen
// =======================================================

import { getRevenueAndBookingsBetween } from "./db.js";

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// =======================================================
// Umsatz Trend Analyse
// =======================================================

export function analyzeRevenueTrend({ tenant }) {

  const now = new Date().toISOString();

  const last7 = getRevenueAndBookingsBetween({
    tenant,
    startISO: daysAgo(7),
    endISO: now
  });

  const prev7 = getRevenueAndBookingsBetween({
    tenant,
    startISO: daysAgo(14),
    endISO: daysAgo(7)
  });

  if (!prev7.bookings) return null;

  const bookingTrend =
    (last7.bookings - prev7.bookings) / prev7.bookings;

  const revenueTrend =
    (last7.revenue - prev7.revenue) / prev7.revenue;

  if (bookingTrend < -0.15) {

    return {
      triggerType: "revenue_drop",
      priority: "high",
      confidence: 0.75,
      channel: "whatsapp",
      reason: [
        "Buchungen sind im Vergleich zur Vorwoche gesunken"
      ]
    };

  }

  return null;
}