// =======================================================
// 🚀 AURA Campaign Executor
// Führt Marketing Aktionen aus
// =======================================================

import { getAllBookings, hasMarketingConsent } from "./db.js";

export async function executeAuraCampaign({ tenant, action }) {

  const tenantId = String(tenant || "").trim();

  if (!tenantId) {
    return {
      success: false,
      error: "tenant_required"
    };
  }

  if (!action) {
    return {
      success: false,
      error: "no_action"
    };
  }

  const bookings = (getAllBookings() || []).filter(b =>
    String(b?.tenant || "").trim() === tenantId &&
    String(b?.phone || "").trim()
  );

  // Letzte Buchung pro Kunde und Mandant bestimmen.
  const customers = [...new Map(
    [...bookings]
      .sort((a, b) =>
        new Date(a?.dateTime || 0) - new Date(b?.dateTime || 0)
      )
      .map(b => [b.phone, b])
  ).values()];

  // =====================================================
  // MARKETING START
  // =====================================================

  if (action === "start_marketing") {

    const inactiveCustomers = customers.filter(c => {

      if (!hasMarketingConsent({
        tenant: tenantId,
        phone: c.phone
      })) {
        return false;
      }

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
