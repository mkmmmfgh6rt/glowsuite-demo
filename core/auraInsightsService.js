// Datein/core/auraInsightsService.js
import { getAuraSummary } from "./auraSummaryService.js";

/* =========================================
   AURA INSIGHTS – PHASE 4.2.1
   Read-only Intelligence
========================================= */

export async function getAuraInsights(period = "today", tenant = null) {
  const summary = await getAuraSummary(period, tenant);

  const insights = [];

  // --------------------------------------------------
  // 1️⃣ Niedrige Auslastung pro Mitarbeiter
  // --------------------------------------------------
  for (const emp of summary.employees || []) {
    if (emp.utilization_percent < 40) {
      insights.push({
        type: "utilization_low",
        level: "warning",
        message: `Mitarbeiter ${emp.name} ist nur zu ${emp.utilization_percent}% ausgelastet.`,
        employee_id: emp.id,
      });
    }
  }

  // --------------------------------------------------
  // 2️⃣ Niedriger Ø-Buchungswert
  // --------------------------------------------------
  if (summary.studio.avg_booking_value > 0 &&
      summary.studio.avg_booking_value < 45) {
    insights.push({
      type: "avg_booking_low",
      level: "info",
      message: `Ø Buchungswert liegt bei ${summary.studio.avg_booking_value} €. Upsell-Potenzial vorhanden.`,
    });
  }

  // --------------------------------------------------
  // 3️⃣ Service-Konzentration (nur 1 Service dominiert)
  // --------------------------------------------------
  if (
    summary.studio.count > 0 &&
    summary.employees.length === 1
  ) {
    insights.push({
      type: "service_concentration",
      level: "info",
      message: "Aktuell dominiert ein einzelner Service. Angebotsvielfalt prüfen.",
    });
  }

  return {
    period,
    studio: summary.studio,
    insights,
  };
}
