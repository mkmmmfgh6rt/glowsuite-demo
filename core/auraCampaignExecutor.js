// =======================================================
// 🚀 AURA Campaign Executor
// Führt Marketing Aktionen aus
// =======================================================

import { getAllBookings } from "./db.js";

export async function executeAuraCampaign({ tenant, action }) {

  if (!action) {
    return {
      success: false,
      error: "no_action"
    };
  }

  const bookings = getAllBookings() || [];

  // Kundenliste aus Buchungen generieren
  const customers = [...new Map(
    bookings.map(b => [b.phone, b])
  ).values()];

  // =====================================================
  // MARKETING START
  // =====================================================

  if (action === "start_marketing") {

    const inactiveCustomers = customers.filter(c => {

      if (!c.dateTime) return true;

      const lastVisit = new Date(c.dateTime);
      const days =
        (Date.now() - lastVisit.getTime()) /
        (1000 * 60 * 60 * 24);

      return days > 30;

    });

    return {
      success: true,
      type: "reactivation_campaign",
      targetCustomers: inactiveCustomers.length,
      customers: inactiveCustomers.slice(0, 10).map(c => ({
        phone: c.phone,
        name: c.name
      }))
    };

  }

  // =====================================================
  // FALLBACK
  // =====================================================

  return {
    success: false,
    error: "unknown_action"
  };

}