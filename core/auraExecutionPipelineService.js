// =======================================================
// 🚀 AURA Execution Pipeline – Phase 10.9 (INTELLIGENT CONTROL)
// Gate + Confidence + Limits + Controlled Execution
// =======================================================

import { v4 as uuidv4 } from "uuid";
import { getTopTriggerCandidates } from "./auraSegmentPriorityService.js";
import { shouldExecuteTrigger } from "./auraExecutionGateService.js";
import { insertAuraMarketingAction } from "./db.js";
import { executeAuraAction } from "./auraActionExecutionService.js";
import { recordAuraActionFeedback } from "./auraActionFeedbackService.js";
import { isExecutionBlockedByLimits } from "./auraExecutionLimitsService.js";

export async function executeApprovedTriggers({ tenant, limit = 5 }) {

  if (!tenant) throw new Error("tenant fehlt");

  const results = [];

  const candidates =
    (await getTopTriggerCandidates({ tenant, limit })) || [];

  for (const candidate of candidates) {

    if (!candidate?.customerKey) {
      results.push({
        status: "skipped",
        reason: ["candidate ohne customerKey"]
      });
      continue;
    }

    // ===================================================
    // 1️⃣ EXECUTION GATE
    // ===================================================

    const gate = shouldExecuteTrigger({
      triggerType: candidate.triggerType,
      priority: candidate.priority
    });

    if (!gate || gate.decision !== "EXECUTE") {
      results.push({
        customerKey: candidate.customerKey,
        status: "skipped",
        reason: gate?.reason || ["Gate blockiert"]
      });
      continue;
    }

    // ===================================================
    // 2️⃣ CONFIDENCE FILTER
    // ===================================================

    const confidence =
      typeof candidate.confidence === "number"
        ? candidate.confidence
        : 0.5;

    if (confidence < 0.6) {
      results.push({
        customerKey: candidate.customerKey,
        status: "skipped",
        reason: [`Confidence zu niedrig (${confidence})`]
      });
      continue;
    }

    // ===================================================
    // 3️⃣ EXECUTION LIMITS
    // ===================================================

    const limits = isExecutionBlockedByLimits({
      tenant,
      customerKey: candidate.customerKey,
      maxPerDayTenant: 10,
      maxPerDayCustomer: 2,
      killSwitch: false
    });

    if (limits?.blocked) {
      results.push({
        customerKey: candidate.customerKey,
        status: "blocked",
        reason: limits.reason || ["Execution limit erreicht"],
        metrics: {
          tenantCount: limits?.tenantCount ?? 0,
          customerCount: limits?.customerCount ?? 0
        }
      });
      continue;
    }

    try {

      // ===================================================
      // 4️⃣ ACTION ID GENERIEREN
      // ===================================================

      const actionId = uuidv4();

      // ===================================================
      // 5️⃣ MARKETING ACTION SPEICHERN
      // ===================================================

      const inserted = insertAuraMarketingAction({
        id: actionId,
        tenant,
        headline: candidate.triggerType || "unknown_trigger",
        channels: [candidate.channel || "app"],
        offers: [],
        cta: "Jetzt Termin buchen",
        confidence,
        reason: candidate.reason || [],
        status: "generated"
      });

      if (!inserted) {
        throw new Error("Marketing Action konnte nicht gespeichert werden");
      }

      // ===================================================
      // 6️⃣ ACTION EXECUTION
      // ===================================================

      const executionResult = await executeAuraAction({
        action_id: actionId,
        decision: "auto",
        tenant,
        context: {
          mode: "pipeline",
          customerKey: candidate.customerKey,
          triggerType: candidate.triggerType,
          confidence
        }
      });

      // ===================================================
      // 7️⃣ FEEDBACK LEARNING
      // ===================================================

      recordAuraActionFeedback({
        action_log_id: actionId,
        success: true,
        impact: "unknown",
        notes: "pipeline-execution",
        tenant
      });

      results.push({
        customerKey: candidate.customerKey,
        status: "executed",
        actionId,
        confidence,
        executionResult
      });

    } catch (err) {

      results.push({
        customerKey: candidate.customerKey,
        status: "error",
        error: err.message
      });

    }

  }

  return results;

}