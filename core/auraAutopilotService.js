// =======================================================
// 🤖 AURA Autopilot Service – Phase 9.1 (Light)
// =======================================================

import { 
  getAuraDailyKpis, 
  buildForecastV2, 
  getAuraContext 
} from "./db.js";

import { generateMarketingOutput } from "./auraMarketingOutputService.js";
import { getAuraSummary } from "./auraSummaryService.js";
import { getAuraInsights } from "./auraInsightsService.js";
import { getAuraRecommendations } from "./auraRecommendationsService.js";
import { learnFromAuraActions } from "./auraActionLearningService.js";

export async function runAuraAutopilot({ tenant }) {
  if (!tenant) throw new Error("tenant fehlt");

  const summary = await getAuraSummary("today", tenant);
  const insights = (await getAuraInsights("today", tenant))?.insights || [];
  const recommendations =
    getAuraRecommendations(summary, insights)?.recommendations || [];
  const learning = await learnFromAuraActions({ tenant });
  const context = getAuraContext(tenant);

  const history = getAuraDailyKpis({ tenant, days: 60 });
  const forecast = history.length ? buildForecastV2(history, 7) : null;

  const marketing = generateMarketingOutput({
    tenant,
    summary,
    insights,
    recommendations,
    learning: learning?.learned_actions || [],
    context,
    forecast,
  });

  // 🧠 Entscheidungslogik (Light)
  let decision = "hold";
  let reason = [];

  if (marketing.confidence >= 0.7) {
    decision = "execute";
    reason.push("Confidence hoch genug");
  } else {
    reason.push("Confidence zu niedrig für Autopilot");
  }

  return {
    tenant,
    decision,
    reason,
    marketing,
    forecast_meta: forecast
      ? { confidence: forecast.confidence, reliability: forecast.reliability }
      : null,
    executed_at: new Date().toISOString(),
  };
}