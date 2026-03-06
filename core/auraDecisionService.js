// =======================================================
// 🧠 AURA Decision Service – Phase 4.4
// Trifft klare Entscheidungen auf Basis von Daten
// =======================================================

/**
 * Erzeugt eine konkrete Entscheidungslogik für das Studio
 * @param {Object} summary          Ergebnis aus getAuraSummary
 * @param {Array} recommendations   Ergebnis aus getAuraRecommendations
 */
export function decideAura(summary, recommendations = []) {
  const period = summary?.period || "today";

  // ===============================
  // 🔥 PRIORITY 1 – Keine Termine
  // ===============================
  if (summary?.studio?.count === 0) {
    return {
      period,
      priority: "high",
      decision: "START_MARKETING",
      reason: "Keine Termine im ausgewählten Zeitraum",
      next_steps: [
        "Instagram Story posten (Vorher/Nachher oder Angebot)",
        "WhatsApp Broadcast an Bestandskunden senden",
        "Online-Angebot klarer kommunizieren",
      ],
    };
  }

  // ===============================
  // ⚠️ PRIORITY 2 – Empfehlungen vorhanden
  // ===============================
  if (Array.isArray(recommendations) && recommendations.length > 0) {
    const top = recommendations[0];

    return {
      period,
      priority: top.priority || "medium",
      decision: top.action || "OPTIMIZE",
      reason: top.message || "Optimierungspotenzial erkannt",
      next_steps: [
        "Empfohlene Maßnahme umsetzen",
        "Ergebnisse nach 7 Tagen prüfen",
      ],
    };
  }

  // ===============================
  // ✅ PRIORITY 3 – Alles stabil
  // ===============================
  return {
    period,
    priority: "low",
    decision: "KEEP_RUNNING",
    reason: "System läuft stabil",
    next_steps: [
      "Aktuelle Strategie beibehalten",
      "Optional: Premium-Angebot testen",
    ],
  };
}
