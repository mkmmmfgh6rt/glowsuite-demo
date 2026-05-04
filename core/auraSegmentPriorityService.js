// =======================================================
// 🧠 AURA Segment Priority Service – Phase 11
// Priorisiert Trigger-Kandidaten + Confidence Scoring
// =======================================================

import { getTenantSegments } from "./auraSegmentationService.js";
import { getSegmentTriggerSuggestion } from "./auraSegmentTriggerService.js";
import { buildForecastV2 } from "./db.js";
import { evaluateRoiGuard } from "./auraRoiGuardService.js";
import { handleAuraCooldown } from "./auraCooldownService.js";
import { analyzeRevenueTrend } from "./auraRevenueBrainService.js";

import { detectRebookingCandidates } from "./auraRebookingEngine.js";
import { detectFreeSlotCandidates } from "./auraFreeSlotEngine.js";
import { detectDemandSpikeCandidates } from "./auraDemandSpikeEngine.js";
import { detectReactivationCandidates } from "./auraReactivationCampaignEngine.js";
import { detectBroadcastCandidates } from "./auraSmartBroadcastEngine.js";


export async function getTopTriggerCandidates({ tenant, limit = 10 }) {

  if (!tenant) return [];

  // ===================================================
  // 1️⃣ Segmente laden
  // ===================================================
  const segments = getTenantSegments({ tenant }) || [];

  // ===================================================
  // 2️⃣ Systemzustand analysieren
  // ===================================================
  const forecast = await buildForecastV2(tenant);
  const roiGuard = evaluateRoiGuard({ tenant });
  const cooldownResult = handleAuraCooldown({ tenant });
  const cooldownActive = cooldownResult?.cooldown === "true";

  // ===================================================
  // 3️⃣ Revenue Brain
  // ===================================================
  const revenueSignal = analyzeRevenueTrend({ tenant });

  // ===================================================
  // 4️⃣ Rebooking Engine
  // ===================================================
  const rebookingCandidates =
    detectRebookingCandidates({ tenant }) || [];

  // ===================================================
  // 5️⃣ Free Slot Engine
  // ===================================================
  const freeSlotCandidates =
    detectFreeSlotCandidates({ tenant }) || [];

  // ===================================================
  // 6️⃣ Demand Spike Engine
  // ===================================================
  const demandSpikeCandidates =
    detectDemandSpikeCandidates({ tenant }) || [];

  // ===================================================
  // 7️⃣ Reactivation Engine
  // ===================================================
  const reactivationCandidates =
    detectReactivationCandidates({ tenant }) || [];

  // ===================================================
  // 8️⃣ Broadcast Engine (NEU)
  // erkennt viele freie Slots
  // ===================================================
  const broadcastCandidates =
    await detectBroadcastCandidates({ tenant }) || [];

  // ===================================================
  // 9️⃣ Segment-basierte Trigger
  // ===================================================
  const candidates = segments.map(s => {

    const trigger = getSegmentTriggerSuggestion({
      segment: s.segment,
      forecast,
      roiGuard,
      cooldownActive
    });

    let confidence = 0.5;

    if (s.segment === "VIP") confidence += 0.3;
    if (s.segment === "Aktiv") confidence += 0.2;
    if (s.segment === "Potenziell") confidence += 0.1;

    if (s.monetary > 200) confidence += 0.1;
    if (s.monetary > 500) confidence += 0.1;

    if (trigger?.priority === 1) confidence += 0.1;

    if (s.recency <= 3) confidence += 0.1;

    if (roiGuard?.blocked) confidence -= 0.2;

    if (cooldownActive) confidence -= 0.1;

    confidence = Math.max(0, Math.min(1, confidence));

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

  // ===================================================
  // 🔟 Revenue Opportunity hinzufügen
  // ===================================================
  if (revenueSignal) {

    candidates.push({
      customerKey: "segment_general",
      segment: "system",
      recency: 0,
      frequency: 0,
      monetary: 0,
      triggerType: revenueSignal.triggerType,
      channel: revenueSignal.channel,
      priority: 1,
      reason: revenueSignal.reason || [],
      confidence: revenueSignal.confidence ?? 0.7
    });

  }

  // ===================================================
  // 11️⃣ Rebooking Kandidaten
  // ===================================================
  if (rebookingCandidates.length > 0) {
    candidates.push(...rebookingCandidates);
  }

  // ===================================================
  // 12️⃣ Free Slot Kandidaten
  // ===================================================
  if (freeSlotCandidates.length > 0) {
    candidates.push(...freeSlotCandidates);
  }

  // ===================================================
  // 13️⃣ Demand Spike Kandidaten
  // ===================================================
  if (demandSpikeCandidates.length > 0) {
    candidates.push(...demandSpikeCandidates);
  }

  // ===================================================
  // 14️⃣ Reactivation Kandidaten
  // ===================================================
  if (reactivationCandidates.length > 0) {
    candidates.push(...reactivationCandidates);
  }

  // ===================================================
  // 15️⃣ Broadcast Kandidaten (NEU)
  // ===================================================
  if (broadcastCandidates.length > 0) {
    candidates.push(...broadcastCandidates);
  }

  // ===================================================
  // 16️⃣ Sortierung
  // ===================================================
  candidates.sort((a, b) => {

    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }

    return (b.monetary || 0) - (a.monetary || 0);

  });

  // ===================================================
  // 17️⃣ Limit anwenden
  // ===================================================
  return candidates.slice(0, limit);

}