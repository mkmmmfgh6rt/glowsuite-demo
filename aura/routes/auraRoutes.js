// routes/auraRoutes.js
import express from "express";
import { randomUUID } from "crypto";

import {
  auraAnalyze,
  auraInsights,
  auraChat,
  auraCreateCampaign,
} from "../engine/auraEngine.js";

// 🔹 PHASE 4.x
import { getAuraSummary } from "../../core/auraSummaryService.js";
import { getAuraInsights } from "../../core/auraInsightsService.js";
import { explainAura } from "../../core/auraExplainService.js";
import { getAuraRecommendations } from "../../core/auraRecommendationsService.js";
import { decideAura } from "../../core/auraDecisionService.js";

// 🔹 PHASE 5.x
import { recordAuraActionFeedback } from "../../core/auraActionFeedbackService.js";
import { getAuraActionTemplate } from "../../core/auraActionTemplatesService.js";
import { executeAuraAction } from "../../core/auraActionExecutionService.js";

import {
  getAuraActionLogs,
  getAuraContext,
  insertAuraMarketingAction,
  updateAuraMarketingStatus,
  getAuraMarketingHistory,
  getAuraDailyKpis,
  buildForecastV2
} from "../../core/db.js";

// 🔹 PHASE 6.x
import { learnFromAuraActions } from "../../core/auraActionLearningService.js";
import { handleAuraCooldown } from "../../core/auraCooldownService.js";
import { generateMarketingOutput } from "../../core/auraMarketingOutputService.js";
import { runAuraAutopilot } from "../../core/auraAutopilotService.js";
import { buildSeverityCampaignPreset } from "../../core/auraSeverityCampaignService.js";
import { applyAdaptiveSeverity } from "../../core/auraAdaptiveSeverityService.js";

// 🔹 PHASE 10.x
import { getTenantSegments } from "../../core/auraSegmentationService.js";
import { getSegmentTriggerSuggestion } from "../../core/auraSegmentTriggerService.js";
import { getTopTriggerCandidates } from "../../core/auraSegmentPriorityService.js";
import { shouldExecuteTrigger } from "../../core/auraExecutionGateService.js";
import { executeApprovedTriggers } from "../../core/auraExecutionPipelineService.js";
import { expireOldGeneratedMarketingActions } from "../../core/db.js";


import { 
  isRoiGuardActive, 
  evaluateRoiGuard 
} from "../../core/auraRoiGuardService.js";

const router = express.Router();

/* =====================================================
   ANALYZE – PHASE 4.0
===================================================== */

router.post("/analyze", async (req, res) => {
  try {
    const result = auraAnalyze(req.body || {});
    res.json(result);
  } catch (err) {
    console.error("A.U.R.A Analyze Fehler:", err.message);
    res.status(500).json({ error: "Analyse fehlgeschlagen" });
  }
});

/* =====================================================
   SUMMARY – PHASE 4.1
===================================================== */

router.get("/summary", async (req, res) => {
  const summary = await getAuraSummary(
    req.query.period || "today",
    req.query.tenant || null
  );
  res.json(summary);
});

/* =====================================================
   INSIGHTS – PHASE 4.2.1
===================================================== */

router.get("/insights", async (req, res) => {
  const insights = await getAuraInsights(
    req.query.period || "today",
    req.query.tenant || null
  );
  res.json(insights);
});

/* =====================================================
   EXPLAIN – PHASE 4.2.3
===================================================== */

router.get("/explain", async (req, res) => {
  const period = req.query.period || "today";
  const tenant = req.query.tenant || null;

  const summary = await getAuraSummary(period, tenant);
  const insights = (await getAuraInsights(period, tenant))?.insights || [];

  res.json(explainAura(summary, insights));
});

/* =====================================================
   🧠 SEGMENTS PREVIEW – PHASE 10 (Read-Only Debug)
   GET /api/aura/segments/preview?tenant=...&limit=50
===================================================== */

router.get("/segments/preview", (req, res) => {
  try {
    const tenant = req.query.tenant || null;
    if (!tenant) return res.status(400).json({ error: "tenant fehlt" });

    const limit = Math.max(1, Math.min(500, Number(req.query.limit || 50)));

    const segments = getTenantSegments({ tenant });

    // sort: wichtigste zuerst
    const rank = { VIP: 1, Aktiv: 2, Potenziell: 3, Risiko: 4, Verloren: 5, Unbekannt: 6 };
    segments.sort((a, b) => (rank[a.segment] ?? 99) - (rank[b.segment] ?? 99));

    return res.json({
      tenant,
      count: segments.length,
      limit,
      segments: segments.slice(0, limit),
    });
  } catch (err) {
    console.error("AURA Segments Preview Fehler:", err.message);
    return res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   🧠 SEGMENT TRIGGER PREVIEW – PHASE 10.3
   GET /api/aura/segments/triggers-preview?tenant=...
===================================================== */

router.get("/segments/triggers-preview", async (req, res) => {
  try {
    const tenant = req.query.tenant || null;
    if (!tenant) {
      return res.status(400).json({ error: "tenant fehlt" });
    }

    // 1️⃣ Segmente holen
    const segments = getTenantSegments({ tenant });

    // 2️⃣ Forecast berechnen
    const forecast = await buildForecastV2(tenant);

    // 3️⃣ ROI Guard prüfen
    const roiGuard = evaluateRoiGuard({ tenant });

    // 4️⃣ Cooldown prüfen
    const cooldownResult = handleAuraCooldown({ tenant });
    const cooldownActive = cooldownResult?.cooldown === "true";

    // 5️⃣ Trigger-Vorschläge erzeugen
    const suggestions = segments.map(s => {
      const trigger = getSegmentTriggerSuggestion({
        segment: s.segment,
        forecast,
        roiGuard,
        cooldownActive
      });

      return {
        customerKey: s.customerKey,
        segment: s.segment,
        recency: s.recency,
        frequency: s.frequency,
        monetary: s.monetary,
        triggerSuggestion: trigger
      };
    });

    return res.json({
      tenant,
      forecastSummary: forecast?.trigger?.type || "none",
      roiBlocked: roiGuard?.blocked || false,
      cooldownActive,
      count: suggestions.length,
      suggestions
    });

  } catch (err) {
    console.error("AURA Trigger Preview Fehler:", err.message);
    return res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   🧠 SEGMENT PRIORITY PREVIEW – PHASE 10.4
   GET /api/aura/segments/priority-preview?tenant=...
===================================================== */

router.get("/segments/priority-preview", async (req, res) => {
  try {
    const tenant = req.query.tenant || null;
    if (!tenant) {
      return res.status(400).json({ error: "tenant fehlt" });
    }

    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 10)));

    const candidates = await getTopTriggerCandidates({ tenant, limit });

    return res.json({
      tenant,
      limit,
      count: candidates.length,
      candidates
    });

  } catch (err) {
    console.error("AURA Priority Preview Fehler:", err.message);
    return res.status(500).json({ error: err.message });
  }
});



/* =====================================================
   🛡 SEGMENT EXECUTION GATE PREVIEW – PHASE 10.6
   GET /api/aura/segments/gate-preview?tenant=...
===================================================== */

router.get("/segments/gate-preview", async (req, res) => {
  try {
    const tenant = req.query.tenant || null;
    if (!tenant) {
      return res.status(400).json({ error: "tenant fehlt" });
    }

    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 10)));

    // 1️⃣ Top Kandidaten holen
    const candidates = await getTopTriggerCandidates({ tenant, limit });

    // 2️⃣ Systemstatus (für Gate)
    const forecast = await buildForecastV2(tenant);
    const roiGuard = evaluateRoiGuard({ tenant });
    const cooldownResult = handleAuraCooldown({ tenant });
    const cooldownActive = cooldownResult?.cooldown === "true";

    // 3️⃣ Durch Gate schicken
    const evaluated = candidates.map(c => {
      const gate = shouldExecuteTrigger({
        triggerType: c.triggerType,
        priority: c.priority,
        roiBlocked: roiGuard?.blocked,
        cooldownActive
      });

      return {
        customerKey: c.customerKey,
        segment: c.segment,
        triggerType: c.triggerType,
        priority: c.priority,
        gateDecision: gate.decision,
        gateReason: gate.reason
      };
    });

    return res.json({
      tenant,
      roiBlocked: roiGuard?.blocked || false,
      cooldownActive,
      count: evaluated.length,
      evaluated
    });

  } catch (err) {
    console.error("AURA Gate Preview Fehler:", err.message);
    return res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   🚀 SEGMENT EXECUTION PIPELINE PREVIEW – PHASE 10.7
   GET /api/aura/segments/pipeline-preview?tenant=...
===================================================== */

router.get("/segments/pipeline-preview", async (req, res) => {
  try {
    const tenant = req.query.tenant || null;
    if (!tenant) {
      return res.status(400).json({ error: "tenant fehlt" });
    }

    const limit = Math.max(1, Math.min(10, Number(req.query.limit || 3)));

    // 🔒 Sicherheitsmodus
    const DRY_RUN = false;

    if (DRY_RUN) {
      return res.json({
        tenant,
        dryRun: true,
        message: "Pipeline würde jetzt Trigger ausführen (Simulation aktiv)"
      });
    }

    const results = await executeApprovedTriggers({ tenant, limit });

    return res.json({
      tenant,
      dryRun: false,
      results
    });

  } catch (err) {
    console.error("AURA Pipeline Preview Fehler:", err.message);
    return res.status(500).json({ error: err.message });
  }
});



/* =====================================================
   🔎 SYSTEM MONITOR – PHASE 11.1 + Auto-Expire
   GET /api/aura/system/monitor?tenant=...
===================================================== */

router.get("/system/monitor", (req, res) => {
  try {
    const tenant = req.query.tenant;
    if (!tenant) {
      return res.status(400).json({ error: "tenant fehlt" });
    }

    // ===================================================
    // 🔄 PHASE 11.1 – Auto Expire (5 Tage)
    // ===================================================
    const expireResult = expireOldGeneratedMarketingActions({
      tenant,
      days: 5
    });

    const killSwitchActive = process.env.AURA_KILL_SWITCH === "true";

    // ===================================================
    // 📊 Aktionen heute
    // ===================================================
    const todayActions = getAuraActionLogs(tenant) || [];

    const executedToday = todayActions.filter(a => a.status === "executed").length;
    const blockedToday = todayActions.filter(a => a.status === "blocked").length;

    // ===================================================
    // 📈 Marketing Status
    // ===================================================
    const generated = getAuraMarketingHistory({
      tenant,
      limit: 50,
      status: "generated"
    });

    const executed = getAuraMarketingHistory({
      tenant,
      limit: 50,
      status: "executed"
    });

    const roiGuard = evaluateRoiGuard({ tenant });
    const cooldown = handleAuraCooldown({ tenant });

    return res.json({
      tenant,

      // 🔄 Wartungsinfo
      maintenance: {
        expiredNow: expireResult.expiredCount
      },

      system: {
        killSwitchActive,
        roiGuardBlocked: roiGuard?.blocked || false,
        roiScore: roiGuard?.roiScore ?? null,
        cooldownActive: cooldown?.cooldown === "true"
      },

      today: {
        executedActions: executedToday,
        blockedActions: blockedToday
      },

      marketing: {
        openGenerated: generated.length,
        executedTotal: executed.length
      }
    });

  } catch (err) {
    console.error("AURA System Monitor Fehler:", err.message);
    res.status(500).json({ error: err.message });
  }
});




/* =====================================================
   RECOMMENDATIONS – PHASE 4.3 + 6.4.4
===================================================== */

router.get("/recommendations", async (req, res) => {
  const period = req.query.period || "today";
  const tenant = req.query.tenant || null;

  handleAuraCooldown({ tenant });

  const summary = await getAuraSummary(period, tenant);
  const insights = (await getAuraInsights(period, tenant))?.insights || [];

  res.json(getAuraRecommendations(summary, insights));
});

/* =====================================================
   DECISION – PHASE 4.4
===================================================== */

router.get("/decision", async (req, res) => {
  const summary = await getAuraSummary(
    req.query.period || "today",
    req.query.tenant || null
  );
  const insights = (await getAuraInsights(
    req.query.period || "today",
    req.query.tenant || null
  ))?.insights || [];

  const rec = getAuraRecommendations(summary, insights);
  res.json(decideAura(summary, rec?.recommendations || []));
});

/* =====================================================
   ACTION TEMPLATE – PHASE 5.2
===================================================== */

router.get("/action-template", (req, res) => {
  const template = getAuraActionTemplate(req.query.id, req.query || {});
  if (!template) return res.status(404).json({ error: "Template nicht gefunden" });
  res.json(template);
});

/* =====================================================
   ACTION EXECUTION – PHASE 5.3.2
===================================================== */

router.post("/actions/execute", async (req, res) => {
  const result = await executeAuraAction(req.body || {});
  res.json(result);
});

/* =====================================================
   ACTION HISTORY – PHASE 5.3.3
===================================================== */

router.get("/actions/history", (req, res) => {
  try {
    const tenant = req.query.tenant || null;
    const limit = Number(req.query.limit || 50);

    const records = getAuraMarketingHistory({
      tenant,
      limit,
      status: null,
    });

    res.json({
      tenant,
      count: records.length,
      history: records,
    });

  } catch (err) {
    console.error("AURA Actions History Fehler:", err.message);
    res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   ACTION FEEDBACK – PHASE 5.5
===================================================== */

router.post("/action-feedback", (req, res) => {
  const ok = recordAuraActionFeedback(req.body || {});
  res.json({ success: true, saved: ok === true });
});

router.get("/action-feedback", (req, res) => {
  const tenant = req.query.tenant || null;
  const logs = getAuraActionLogs(tenant);
  res.json({ tenant, count: logs.length, logs });
});

/* =====================================================
   LEARNING – PHASE 6.1 🧠
===================================================== */

router.get("/learning", async (req, res) => {
  const tenant = req.query.tenant || null;
  const learning = await learnFromAuraActions({ tenant });
  res.json(learning);
});



/* =====================================================
   MARKETING OUTPUT – PHASE 6.5 🚀 + Phase 9.0 Autopilot Light
===================================================== */

router.get("/marketing", async (req, res) => {
  try {
    const tenant = req.query.tenant;
    if (!tenant) return res.status(400).json({ error: "tenant fehlt" });

    const summary = await getAuraSummary("today", tenant);
    const insights = (await getAuraInsights("today", tenant))?.insights || [];
    const recommendations =
      getAuraRecommendations(summary, insights)?.recommendations || [];
    const learning = await learnFromAuraActions({ tenant });
    const context = getAuraContext(tenant);

    // 🔥 PHASE 9.0 – Forecast in Marketing einspeisen
    const history = getAuraDailyKpis({ tenant, days: 60 });
    const forecast = history.length ? buildForecastV2(history, 7) : null;

    const marketing = generateMarketingOutput({
      tenant,
      summary,
      insights,
      recommendations,
      learning: learning?.learned_actions || [],
      context,
      forecast, // 🔥 NEU
    });

    // ✅ WICHTIG: EXAKT die marketing_id aus dem Output speichern
    insertAuraMarketingAction({
      id: marketing.marketing_id,
      tenant,
      headline: marketing.headline,
      channels: marketing.channels || [],
      offers: marketing.offers || [],
      cta: marketing.cta || null,
      confidence: marketing.confidence ?? null,
      reason: marketing.reason || null,
      status: "generated",
    });

    res.json(marketing);
  } catch (err) {
    console.error("AURA Marketing Fehler:", err.message);
    res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   🤖 AUTOPILOT – Phase 9.1 (manuell triggerbar)
===================================================== */

router.post("/autopilot/run", async (req, res) => {
  try {
    const tenant = req.body?.tenant || req.query?.tenant;
    if (!tenant) return res.status(400).json({ error: "tenant fehlt" });

    const result = await runAuraAutopilot({ tenant });
    res.json(result);
  } catch (err) {
    console.error("AURA Autopilot Fehler:", err.message);
    res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   MARKETING ACTION – Phase 6.5.3 (Dashboard Buttons)
   POST /api/aura/marketing/action
===================================================== */

router.post("/marketing/action", (req, res) => {
  try {
    const { tenant, marketing_id, action, notes } = req.body || {};

    if (!tenant) return res.status(400).json({ error: "tenant fehlt" });
    if (!marketing_id) return res.status(400).json({ error: "marketing_id fehlt" });
    if (!action) return res.status(400).json({ error: "action fehlt" });

    const allowed = new Set(["executed", "ignored"]);
    if (!allowed.has(action)) {
      return res.status(400).json({
        error: "Ungültige action. Erlaubt: executed | ignored",
      });
    }

    const ok = updateAuraMarketingStatus({
      id: marketing_id,   // ✅ passt jetzt zur gespeicherten ID
      tenant,
      status: action,
      notes: notes ?? null,
    });

    if (!ok) return res.status(404).json({ error: "Nicht gefunden" });

    res.json({ success: true, updated: true });
  } catch (err) {
    console.error("AURA Marketing Action Fehler:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   MARKETING HISTORY – Phase 6.5.3 (Dashboard)
   GET /api/aura/marketing/history?tenant=...&limit=30&status=posted
===================================================== */

router.get("/marketing/history", (req, res) => {
  try {
    const tenant = req.query.tenant;
    if (!tenant) return res.status(400).json({ error: "tenant fehlt" });

    const limit = Number(req.query.limit || 30);
    const status = req.query.status || null;

    const records = getAuraMarketingHistory({ tenant, limit, status });
    res.json({ tenant, count: records.length, records });
  } catch (err) {
    console.error("AURA Marketing History Fehler:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   CHAT & CAMPAIGN
===================================================== */

router.post("/chat", async (req, res) => {
  const result = await auraChat(req.body.message, req.body.context || {});
  res.json({ reply: result?.reply ?? String(result) });
});

router.post("/campaign", (req, res) => {
  res.json(auraCreateCampaign(req.body.goal, req.body.data || {}));
});

/* =====================================================
   MARKETING ACTIVE – Intelligent Decision Gate
   Zeigt nur relevante Empfehlungen (Confidence + ROI)
===================================================== */

router.get("/marketing/active", (req, res) => {
  try {
    const tenant = req.query.tenant;
    if (!tenant) {
      return res.status(400).json({ error: "tenant fehlt" });
    }

    // ✅ Nur offene (generated) Aktionen laden
    const records = getAuraMarketingHistory({
      tenant,
      limit: 1,
      status: "generated",
    });

    if (!records || records.length === 0) {
      return res.json({ show: false });
    }

    const m = records[0];
    const conf = Number(m.confidence ?? 0);
    const roi = m.roi_score !== null ? Number(m.roi_score) : null;

    // ===================================================
    // 🧠 DECISION GATE – Business Logik
    // ===================================================

    // 1️⃣ Confidence zu niedrig → nicht anzeigen
    if (conf < 0.45) {
      console.log("🚫 Marketing versteckt (Confidence zu niedrig)", {
        confidence: conf,
      });
      return res.json({ show: false });
    }

    // 2️⃣ Negativer ROI → vorsichtig behandeln
    if (roi !== null && roi < 0) {
      console.log("🚫 Marketing versteckt (Negativer ROI)", {
        roi,
      });
      return res.json({ show: false });
    }

    // ===================================================
    // ✅ Empfehlung freigeben
    // ===================================================

    return res.json({
      show: true,

      id: m.id,
      marketing_id: m.id,
      headline: m.headline,
      channels: m.channels || [],
      offers: m.offers || [],
      cta: m.cta || "Jetzt Termin buchen",
      confidence: conf,
      reason: m.reason || [],
      status: m.status,
      created_at: m.created_at,

      metrics: {
        impactRevenue: m.impact_revenue ?? 0,
        impactBookings: m.impact_bookings ?? 0,
        roiScore: roi,
      },
    });

  } catch (err) {
    console.error("AURA Marketing Active Fehler:", err.message);
    res.status(500).json({ error: err.message });
  }
});


/* =====================================================
   📈 PHASE 8.4 – Forecast Route
   + 🔥 Phase 8.6 – Controlled Auto Marketing
   + 🧪 Phase 8.7 – Force Trigger Debug Mode
   + 🔒 Phase 8.8 – Duplicate Protection
   + ⏳ Phase 8.9 – Cooldown Protection (7 Tage)
   + 🧠 Phase 9.0 – Severity Intelligence
   + 🛑 Phase 9.2 – ROI Guard Learning Layer
   + 🔄 Phase 9.3 – Adaptive Severity Adjustment
   + 💰 Phase 9.4 – ROI-Aware Offer Switching
===================================================== */

router.get("/forecast", (req, res) => {
  try {
    const tenant = req.query.tenant;
    const days = Number(req.query.days || 60);
    const forceTrigger = req.query.forceTrigger === "true";

    if (!tenant) {
      return res.status(400).json({ error: "tenant fehlt" });
    }

    const history = getAuraDailyKpis({ tenant, days });

    if (!history.length) {
      return res.json({
        tenant,
        days,
        history: [],
        forecast: null
      });
    }

    const forecast = buildForecastV2(history, 7);

    // ==============================================
    // 🧪 Force Trigger
    // ==============================================

    if (forceTrigger) {
      forecast.trigger = {
        type: "forecast_drop_prevention",
        severity: "medium",
        baseline: 3,
        forecastAvg: 1.5,
        dropPct: -0.5,
        message: "Debug Force Trigger aktiv"
      };

      console.log("🧪 FORCE TRIGGER aktiv – Testkampagne wird geprüft");
    }

    // ==============================================
    // 🔥 Auto Marketing Engine
    // ==============================================

    if (
      forecast?.trigger &&
      (forecast.trigger.severity === "medium" ||
       forecast.trigger.severity === "high")
    ) {

      // 🛑 ROI GUARD CHECK
      const guardActive = isRoiGuardActive({ tenant });

      if (guardActive.active) {
        console.log("🛑 ROI Guard aktiv – blockiert bis:", guardActive.until);

        return res.json({
          tenant,
          days,
          history,
          forecast,
          roiGuard: guardActive
        });
      }

      const guardEval = evaluateRoiGuard({ tenant });

      if (guardEval.blocked) {
        console.log("🛑 ROI Guard neu gesetzt:", guardEval);

        return res.json({
          tenant,
          days,
          history,
          forecast,
          roiGuard: guardEval
        });
      }

      // ==========================================
      // 🔄 PHASE 9.3 – Adaptive Severity
      // ==========================================

      const originalSeverity = forecast.trigger.severity;

      const adaptedSeverity = applyAdaptiveSeverity({
        tenant,
        severity: originalSeverity
      });

      forecast.trigger.severity = adaptedSeverity;

      if (originalSeverity !== adaptedSeverity) {
        console.log("🔄 Severity angepasst:", {
          original: originalSeverity,
          adapted: adaptedSeverity
        });
      }

      // ==========================================
      // 💰 PHASE 9.4 – ROI-Aware Offer Mode
      // ==========================================

      const roiScore = guardEval?.roiScore ?? null;

      let offerMode = "standard";

      if (roiScore !== null) {
        if (roiScore < 0) {
          offerMode = "value_protect";
          console.log("💰 ROI negativ – Wechsel in Value-Protect-Modus");
        }
      }

      // ==========================================
      // 🔒 Duplicate + Cooldown
      // ==========================================

      const existing = getAuraMarketingHistory({
        tenant,
        limit: 20,
        status: "generated"
      });

      const now = new Date();
      const cooldownDays = 7;
      const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;

      let duplicateSeverity = false;
      let cooldownActive = false;

      existing.forEach(m => {
        if (!m.reason) return;

        if (m.reason.source === "forecast_trigger") {

          if (m.reason.severity === adaptedSeverity) {
            duplicateSeverity = true;
          }

          if (m.created_at) {
            const created = new Date(m.created_at);
            if (now - created < cooldownMs) {
              cooldownActive = true;
            }
          }
        }
      });

      if (duplicateSeverity) {

        console.log("🛑 Forecast-Kampagne mit gleicher Severity existiert bereits");

      } else if (cooldownActive) {

        console.log("⏳ Forecast-Cooldown aktiv – letzte Kampagne < 7 Tage");

      } else {

        // 🧠 Severity Preset (inkl. ROI-Mode)
        const preset = buildSeverityCampaignPreset({
          severity: adaptedSeverity,
          dropPct: forecast.trigger.dropPct,
          mode: offerMode
        });

        const campaign = auraCreateCampaign("forecast_recovery", {
          severity: adaptedSeverity,
          drop: forecast.trigger.dropPct
        });

        insertAuraMarketingAction({
          id: randomUUID(),
          tenant,
          headline: preset.headline,
          channels: campaign?.channelSuggestions || [],
          offers: preset.offers,
          cta: preset.cta,
          confidence: forecast.confidence ?? null,
          reason: {
            source: "forecast_trigger",
            severity: adaptedSeverity,
            dropPct: forecast.trigger.dropPct,
            strength: preset.strength,
            adapted: originalSeverity !== adaptedSeverity,
            offerMode
          },
          status: "generated"
        });

        console.log("🔥 Adaptive ROI-aware Kampagne erzeugt", {
          tenant,
          originalSeverity,
          adaptedSeverity,
          offerMode,
          strength: preset.strength
        });
      }
    }

    return res.json({
      tenant,
      days,
      history,
      forecast
    });

  } catch (err) {
    console.error("AURA Forecast Fehler:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
