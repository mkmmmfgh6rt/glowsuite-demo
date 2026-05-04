// =======================================================
// 💡 AURA Recommendation Engine – Phase 12
// erzeugt konkrete Empfehlungen fürs Dashboard
// =======================================================

import { getTopTriggerCandidates } from "./auraSegmentPriorityService.js";

export async function generateAuraRecommendations({ tenant, limit = 5 }) {

  if (!tenant) {
    return [];
  }

  const candidates = await getTopTriggerCandidates({ tenant, limit });

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  return candidates.map((candidate) => {
    let title = "Empfehlung";
    let description = "AURA hat eine neue Maßnahme erkannt.";
    let actionLabel = "Maßnahme starten";

    switch (candidate.triggerType) {
      case "vip_loyalty":
        title = "VIP Kampagne starten";
        description =
          "AURA hat erkannt, dass ein wertvoller Stammkunde mit hoher Priorität aktiviert werden sollte.";
        break;

      case "reactivation_campaign":
        title = "Kundenreaktivierung senden";
        description =
          "AURA hat inaktive Kunden erkannt, die wahrscheinlich zurückgewonnen werden können.";
        break;

      case "free_slot_broadcast":
        title = "Freie Termine bewerben";
        description =
          "AURA hat viele freie Slots erkannt und empfiehlt eine Broadcast-Kampagne.";
        break;

      case "rebooking_reminder":
        title = "Rebooking Erinnerung senden";
        description =
          "AURA empfiehlt, Kunden an ihren nächsten wahrscheinlichen Termin zu erinnern.";
        break;

      case "demand_spike":
        title = "Nachfrage nutzen";
        description =
          "AURA hat eine erhöhte Nachfrage erkannt und empfiehlt eine gezielte Kampagne.";
        break;

      case "revenue_drop":
        title = "Umsatzrückgang abfangen";
        description =
          "AURA hat einen Rückgang erkannt und empfiehlt eine schnelle Marketingmaßnahme.";
        break;

      case "low_occupancy":
        title = "Auslastung erhöhen";
        description =
          "AURA hat schwache Auslastung erkannt und empfiehlt eine kurzfristige Aktion.";
        break;

      default:
        break;
    }

    return {
      id: candidate.customerKey,
      triggerType: candidate.triggerType,
      title,
      description,
      actionLabel,
      priority: candidate.priority ?? 99,
      confidence: candidate.confidence ?? 0.5,
      channel: candidate.channel ?? "whatsapp",
      reason: candidate.reason || [],
      raw: candidate
    };
  });

}