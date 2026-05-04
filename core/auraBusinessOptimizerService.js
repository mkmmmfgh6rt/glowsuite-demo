import { runAuraDailyMonitor } from "./auraDailyMonitorService.js";
import { getAuraRecommendations } from "./auraRecommendationsService.js";
import { insertAuraMarketingAction } from "./db.js";
import { detectFreeSlots } from "./auraAvailabilityService.js";

export async function runAuraBusinessOptimizer({ tenant }) {

  const monitor = await runAuraDailyMonitor({ tenant });

  const freeSlots = detectFreeSlots({ tenant });

  if (monitor.status !== "action_required" && freeSlots.length < 5) {
    return {
      status: "no_action",
      reason: "forecast_healthy"
    };
  }

  const recommendations = getAuraRecommendations({
    trigger: monitor.trigger,
    forecast: monitor.forecast
  });

  const actions = [];

  // Empfehlungen aus AI
  if (recommendations?.length) {

    for (const rec of recommendations) {

      const action = {
        id: crypto.randomUUID(),
        tenant,
        headline: rec.headline,
        channels: rec.channels,
        offers: rec.offers,
        cta: rec.cta,
        confidence: rec.confidence,
        reason: rec.reason,
        status: "generated" // Studio muss bestätigen
      };

      insertAuraMarketingAction(action);
      actions.push(action);
    }

  }

  // Fallback: viele freie Termine erkannt
  if (!actions.length && freeSlots.length >= 5) {

    const action = {
      id: crypto.randomUUID(),
      tenant,
      headline: "Freie Termine verfügbar",
      channels: ["whatsapp"],
      offers: [
        {
          title: "Schnelltermin verfügbar",
          description: "Mehrere freie Termine in den nächsten Tagen"
        }
      ],
      cta: "Jetzt Termin sichern",
      confidence: 0.6,
      reason: "free_slots_detected",
      status: "generated" // Studio entscheidet
    };

    insertAuraMarketingAction(action);
    actions.push(action);

  }

  if (!actions.length) {
    return {
      status: "no_recommendation"
    };
  }

  return {
    status: "actions_created",
    count: actions.length,
    actions
  };

}