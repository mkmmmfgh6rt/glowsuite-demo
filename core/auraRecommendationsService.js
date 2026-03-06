// =======================================================
// 🧠 AURA Recommendations Service – Phase 4.3
// Konkrete Handlungsempfehlungen für Studios
// =======================================================

/**
 * Erzeugt konkrete Business-Empfehlungen
 * @param {Object} summary  Ergebnis aus getAuraSummary
 * @param {Array} insights  Ergebnis aus getAuraInsights
 */
export function getAuraRecommendations(summary, insights = []) {
  const recommendations = [];

  const studio = summary?.studio || {};
  const employees = summary?.employees || [];

  // ===============================
  // 🏢 STUDIO – AUSLASTUNG & UMSATZ
  // ===============================

  if (studio.count === 0) {
    recommendations.push({
      priority: "high",
      title: "Keine Termine",
      message:
        "Aktuell gibt es keine Termine. Starte sofort eine Aktion (z. B. Instagram Story oder WhatsApp Broadcast), um Buchungen zu erzeugen.",
      action: "start_marketing",
    });
  }

  if (studio.avg_booking_value && studio.avg_booking_value < 40) {
    recommendations.push({
      priority: "medium",
      title: "Buchungswert erhöhen",
      message:
        "Der durchschnittliche Buchungswert ist niedrig. Prüfe Upsells oder Kombi-Angebote.",
      action: "increase_avg_value",
    });
  }

  // ===============================
  // 👥 MITARBEITER – AUSLASTUNG
  // ===============================

  for (const emp of employees) {
    if (emp.utilization_percent <= 40) {
      recommendations.push({
        priority: "medium",
        title: `Freie Kapazitäten bei ${emp.name}`,
        message:
          `${emp.name} ist nur zu ${emp.utilization_percent} % ausgelastet. Leite gezielt Termine oder Aktionen auf diese Person.`,
        action: "redistribute_appointments",
        employee_id: emp.id,
      });
    }

    if (emp.utilization_percent >= 90) {
      recommendations.push({
        priority: "high",
        title: `Überlastung bei ${emp.name}`,
        message:
          `${emp.name} ist stark ausgelastet (${emp.utilization_percent} %). Prüfe Terminverteilung oder Pausen.`,
        action: "reduce_load",
        employee_id: emp.id,
      });
    }
  }

  // ===============================
  // 💡 INSIGHTS → EMPFEHLUNGEN
  // ===============================

  for (const ins of insights) {
    if (ins.action) {
      recommendations.push({
        priority: ins.level || "info",
        title: "Insight Empfehlung",
        message: ins.message,
        action: ins.action,
      });
    }
  }

  return {
    period: summary.period,
    recommendations,
  };
}
