// =======================================================
// 📈 AURA Demand Spike Engine
// erkennt steigende Nachfrage nach Services
// =======================================================

import { getAllBookings } from "./db.js";

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function detectDemandSpikeCandidates({ tenant }) {

  const bookings = getAllBookings() || [];

  const last7 = {};
  const prev7 = {};

  const now = new Date();
  const lastWeek = daysAgo(7);
  const prevWeek = daysAgo(14);

  for (const b of bookings) {

    if (b.tenant !== tenant) continue;
    if (!b.service) continue;

    const date = new Date(b.dateTime);

    if (date >= lastWeek) {

      last7[b.service] = (last7[b.service] || 0) + 1;

    } else if (date >= prevWeek && date < lastWeek) {

      prev7[b.service] = (prev7[b.service] || 0) + 1;

    }

  }

  const candidates = [];

  for (const service in last7) {

    const current = last7[service];
    const previous = prev7[service] || 0;

    if (previous === 0) continue;

    const growth = (current - previous) / previous;

    if (growth >= 0.5 && current >= 5) {

      candidates.push({
        customerKey: `demand_${service}`,
        segment: "system",
        recency: 0,
        frequency: 0,
        monetary: 0,
        triggerType: "demand_spike",
        channel: "whatsapp",
        priority: 2,
        reason: [
          `Nachfrage nach ${service} steigt stark (${current} Buchungen)`
        ],
        confidence: 0.74
      });

    }

  }

  return candidates;

}