// =======================================================
// 🔄 AURA Reactivation Campaign Engine – Phase 11
// erkennt Kunden die lange nicht mehr im Studio waren
// und erzeugt Reaktivierungs Kampagnen
// =======================================================

import { getAllBookings } from "./db.js";
import { getAllCustomers } from "./memory.js";

export function detectReactivationCandidates({ tenant, days = 45 }) {

  if (!tenant) return [];

  const customers = getAllCustomers(tenant) || [];
  const bookings = getAllBookings() || [];

  const candidates = [];

  const now = new Date();

  for (const customer of customers) {

    const customerBookings =
      bookings.filter(b => b.customerKey === customer.customerKey);

    if (customerBookings.length === 0) continue;

    // letzten Termin finden
    const lastBooking =
      customerBookings.sort((a, b) =>
        new Date(b.dateTime) - new Date(a.dateTime)
      )[0];

    const lastVisit = new Date(lastBooking.dateTime);

    const diffDays =
      (now - lastVisit) / (1000 * 60 * 60 * 24);

    if (diffDays >= days) {

      candidates.push({

        customerKey: customer.customerKey,

        segment: "reactivation",

        recency: Math.floor(diffDays),

        frequency: customerBookings.length,

        monetary: customer.totalSpent || 0,

        triggerType: "reactivation_campaign",

        channel: "whatsapp",

        priority: 2,

        reason: [
          `Kunde ${Math.floor(diffDays)} Tage nicht im Studio`
        ],

        confidence: 0.7

      });

    }

  }

  return candidates;

}