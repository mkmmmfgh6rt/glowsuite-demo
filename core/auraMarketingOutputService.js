// =======================================================
// 🚀 AURA Marketing Output Service – Phase 7 + Phase 9.0 Autopilot Light
// =======================================================

import crypto from "crypto";

export function generateMarketingOutput({
  tenant = null,
  summary = {},
  insights = [],
  recommendations = [],
  learning = [],
  context = {},
  forecast = null, // 🔥 NEU (Phase 9.0)
}) {
  if (!tenant) {
    throw new Error("tenant fehlt");
  }

  let headline = "Mehr Buchungen für dein Studio";
  let channels = ["Instagram"];
  let offers = [];
  let cta = "Jetzt Termin buchen";
  let confidence = 0.5;
  let reason = [];

  // 🆕 Strategy Layer
  let strategy_type = "unknown";

  const utilization = summary?.studio?.utilization ?? 0;
  const bookingCount = summary?.studio?.count ?? 0;

  // =====================================================
  // 🧠 PHASE 9.0 – Forecast-basierter Präventiv-Trigger
  // =====================================================

  if (forecast?.trigger?.type === "forecast_drop_prevention") {
    strategy_type = "preventive_revenue_defense";
    headline = "Terminlücken vermeiden – diese Woche Vorteil sichern";
    offers.push("Exklusiver Midweek-Vorteil für freie Slots");
    channels = ["Instagram", "WhatsApp"];
    confidence += 0.2;

    reason.push("Prognostizierter Buchungsrückgang erkannt");
    if (forecast.trigger.dropPct !== undefined) {
      reason.push(
        `Erwarteter Rückgang: ${Math.round(forecast.trigger.dropPct * 100)} %`
      );
    }
  }

  // =====================================================
  // 🧠 PHASE 7 – Smart Learning Evaluation
  // =====================================================

  let bestLearning = null;

  if (Array.isArray(learning) && learning.length > 0) {
    bestLearning = learning
      .filter(a => a.total_runs >= 2)
      .sort((a, b) => b.success_rate - a.success_rate)[0] || null;
  }

  let lastROI = 0;
  let learningBoost = 0;

  if (bestLearning) {
    const successRate = Number(bestLearning.success_rate || 0);
    lastROI = Number(bestLearning.avg_roi || 0);

    if (successRate >= 0.75 && lastROI > 1) {
      learningBoost = 0.25;
      reason.push("Vergangene Kampagnen sehr erfolgreich");
    } 
    else if (successRate >= 0.5) {
      learningBoost = 0.1;
      reason.push("Vergangene Kampagnen moderat erfolgreich");
    } 
    else if (successRate === 0) {
      learningBoost = -0.2;
      reason.push("Frühere Aktionen ohne Erfolg");
    }
  }

  // =====================================================
  // 1️⃣ Niedrige Auslastung
  // =====================================================

  if (strategy_type === "unknown" && utilization < 60) {
    strategy_type = "discount_push";

    headline = "Freie Termine diese Woche – jetzt sichern ✨";

    let discount = 10;

    if (lastROI >= 1.5) {
      discount = 5;
      reason.push("Hoher ROI – geringerer Rabatt ausreichend");
    }

    if (lastROI < 0) {
      discount = 8;
      reason.push("ROI schwach – moderater Test-Rabatt");
    }

    offers.push(`${discount} % Rabatt auf ausgewählte Services`);
    channels = ["Instagram", "WhatsApp"];
    confidence += 0.25;
    reason.push("Auslastung unter 60 %");
  }

  // =====================================================
  // 2️⃣ Mittlere Auslastung
  // =====================================================

  else if (strategy_type === "unknown" && utilization >= 60 && utilization < 75) {
    strategy_type = "soft_push";

    headline = "Freie Termine verfügbar – jetzt Termin sichern";
    channels = ["Instagram"];
    confidence += 0.1;
    reason.push("Mittlere Auslastung – leichte Aktivierung");
  }

  // =====================================================
  // 3️⃣ Hohe Auslastung
  // =====================================================

  else if (strategy_type === "unknown" && utilization >= 75) {
    strategy_type = "no_marketing";
    confidence -= 0.3;
    reason.push("Hohe Auslastung – kein Rabatt notwendig");
  }

  // =====================================================
  // 4️⃣ Stammkunden-Boost
  // =====================================================

  if (bookingCount > 30) {
    offers.push("Upgrade beim nächsten Termin");
    channels.push("E-Mail");
    confidence += 0.1;
    reason.push("Starker Kundenstamm – Upsell sinnvoll");

    if (strategy_type === "soft_push") {
      strategy_type = "loyalty_upsell";
    }
  }

  // =====================================================
  // 5️⃣ Cooldown
  // =====================================================

  if (context.cooldown === "true") {
    channels = channels.filter(c => c !== "WhatsApp");
    confidence -= 0.15;
    reason.push("Cooldown aktiv – reduzierte Reichweite");
  }

  // =====================================================
  // 🧠 STRATEGY OVERRIDE DURCH LEARNING
  // =====================================================

  if (
    bestLearning &&
    bestLearning.success_rate >= 0.5 &&
    bestLearning.strategy_type &&
    bestLearning.strategy_type !== strategy_type
  ) {
    reason.push(
      `Strategie angepasst basierend auf Learning (${bestLearning.strategy_type})`
    );

    strategy_type = bestLearning.strategy_type;
  }

  // =====================================================
  // 🎯 Learning Boost anwenden
  // =====================================================

  confidence = Math.min(Math.max(confidence + learningBoost, 0), 1);

  return {
    marketing_id: crypto.randomUUID(),
    tenant,
    strategy_type,
    headline,
    channels: [...new Set(channels)],
    offers,
    cta,
    confidence: Number(confidence.toFixed(2)),
    reason,
    metrics: {
      utilization,
      booking_count: bookingCount,
      last_roi: lastROI,
    },
    generated_at: new Date().toISOString(),
  };
}







