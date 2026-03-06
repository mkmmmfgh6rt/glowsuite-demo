// =======================================================
// 🧠 AURA Explain Service – Phase 4.2.2
// Übersetzt Zahlen & Insights in Klartext
// =======================================================

/**
 * Erzeugt verständliche Erklärungen für Studio & Mitarbeiter
 * @param {Object} summary  Ergebnis aus getAuraSummary
 * @param {Array} insights  Ergebnis aus auraInsightsService
 */
export function explainAura(summary, insights = []) {
  const explanations = [];

  // ===============================
  // 🏢 STUDIO – ÜBERSICHT
  // ===============================
  const { count, revenue, avg_booking_value } = summary.studio || {};

  if (count === 0) {
    explanations.push({
      level: "info",
      message: "Heute gibt es aktuell keine Termine.",
    });
  } else {
    explanations.push({
      level: "success",
      message: `Es gab ${count} Termine mit einem Umsatz von ${revenue} €.`,
    });

    explanations.push({
      level: "info",
      message: `Der durchschnittliche Buchungswert liegt bei ${avg_booking_value} €.`,
    });
  }

  // ===============================
  // 👥 MITARBEITER – AUSLASTUNG
  // ===============================
  for (const emp of summary.employees || []) {
    if (emp.utilization_percent >= 90) {
      explanations.push({
        level: "warning",
        employee_id: emp.id,
        message: `${emp.name} ist sehr stark ausgelastet (${emp.utilization_percent} %).`,
      });
    } else if (emp.utilization_percent <= 40) {
      explanations.push({
        level: "hint",
        employee_id: emp.id,
        message: `${emp.name} hat noch viele freie Kapazitäten (${emp.utilization_percent} %).`,
      });
    } else {
      explanations.push({
        level: "ok",
        employee_id: emp.id,
        message: `${emp.name} ist normal ausgelastet (${emp.utilization_percent} %).`,
      });
    }
  }

  // ===============================
  // 💡 INSIGHTS (optional)
  // ===============================
  for (const ins of insights) {
    explanations.push({
      level: ins.level || "info",
      message: ins.message,
      action: ins.action || null,
    });
  }

  return {
    period: summary.period,
    explanations,
  };
}
