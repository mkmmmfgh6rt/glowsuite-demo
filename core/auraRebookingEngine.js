// =======================================================
// 🔁 AURA Rebooking Engine
// erkennt Kunden die lange nicht gebucht haben
// =======================================================

import { getAllBookings } from "./db.js";

function daysBetween(a, b) {
  const diff = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function detectRebookingCandidates({ tenant, daysThreshold = 35 }) {

  const bookings = getAllBookings() || [];

  const customers = {};

  // letzte Buchung pro Kunde finden
  for (const b of bookings) {

    if (b.tenant !== tenant) continue;
    if (!b.phone) continue;

    const date = new Date(b.dateTime);

    if (!customers[b.phone] || customers[b.phone] < date) {
      customers[b.phone] = date;
    }

  }

  const now = new Date();

  const candidates = [];

  for (const phone in customers) {

    const lastVisit = customers[phone];
    const days = daysBetween(now, lastVisit);

    if (days >= daysThreshold) {

      candidates.push({
        customerKey: phone,
        segment: "rebooking",
        triggerType: "rebooking_reminder",
        channel: "whatsapp",
        priority: 2,
        confidence: 0.8,
        reason: [
          `Kunde seit ${days} Tagen nicht im Studio`
        ]
      });

    }

  }

  return candidates;

}