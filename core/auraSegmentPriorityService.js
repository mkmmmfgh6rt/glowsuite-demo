// =======================================================
// 🧠 AURA Segment Priority Service – Phase 10.9
// Priorisiert Trigger-Kandidaten + Confidence Scoring
// =======================================================

import { getTenantSegments } from "./auraSegmentationService.js";
import { getSegmentTriggerSuggestion } from "./auraSegmentTriggerService.js";
import { buildForecastV2 } from "./db.js";
import { evaluateRoiGuard } from "./auraRoiGuardService.js";
import { handleAuraCooldown } from "./auraCooldownService.js";

export async function getTopTriggerCandidates({ tenant, limit = 10 }) {
  if (!tenant) return [];

  // 1️⃣ Segmente
  const segments = getTenantSegments({ tenant });

  // 2️⃣ Systemzustand
  const forecast = await buildForecastV2(tenant);
  const roiGuard = evaluateRoiGuard({ tenant });
  const cooldownResult = handleAuraCooldown({ tenant });
  const cooldownActive = cooldownResult?.cooldown === "true";

  // 3️⃣ Trigger + Confidence erzeugen
  const candidates = segments.map(s => {
    const trigger = getSegmentTriggerSuggestion({
      segment: s.segment,
      forecast,
      roiGuard,
      cooldownActive
    });

    // ===============================
    // 🔥 CONFIDENCE SCORING
    // ===============================
    let confidence = 0.5;

    // Segment Gewichtung
    if (s.segment === "VIP") confidence += 0.3;
    if (s.segment === "Aktiv") confidence += 0.2;
    if (s.segment === "Potenziell") confidence += 0.1;

    // Monetarisierung
    if (s.monetary > 200) confidence += 0.1;
    if (s.monetary > 500) confidence += 0.1;

    // Priorität
    if (trigger?.priority === 1) confidence += 0.1;

    // Recency (sehr frisch = besser)
    if (s.recency <= 3) confidence += 0.1;

    // ROI Guard Einfluss
    if (roiGuard?.blocked) confidence -= 0.2;

    // Cooldown Einfluss
    if (cooldownActive) confidence -= 0.1;

    // Begrenzen
    if (confidence > 1) confidence = 1;
    if (confidence < 0) confidence = 0;

    return {
      customerKey: s.customerKey,
      segment: s.segment,
      recency: s.recency,
      frequency: s.frequency,
      monetary: s.monetary,
      triggerType: trigger?.triggerType,
      channel: trigger?.channel,
      priority: trigger?.priority ?? 99,
      reason: trigger?.reason || [],
      confidence: Number(confidence.toFixed(2))
    };
  });

  // 4️⃣ Sortierung (Priority → Confidence → Monetary)
  candidates.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }

    return b.monetary - a.monetary;
  });

  return candidates.slice(0, limit);
}