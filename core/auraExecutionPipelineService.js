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
  const candidates = await getTopTriggerCandidates({ tenant, limit });

  for (const candidate of candidates) {

    // ===================================================
    // 1️⃣ GATE
    // ===================================================
    const gate = shouldExecuteTrigger({
      triggerType: candidate.triggerType,
      priority: candidate.priority
    });

    if (gate.decision !== "EXECUTE") {
      results.push({
        customerKey: candidate.customerKey,
        status: "skipped",
        reason: gate.reason
      });
      continue;
    }

    // ===================================================
    // 2️⃣ CONFIDENCE FILTER (NEU 🔥)
    // ===================================================
    if (candidate.confidence !== undefined && candidate.confidence < 0.6) {
      results.push({
        customerKey: candidate.customerKey,
        status: "skipped",
        reason: [`Confidence zu niedrig (${candidate.confidence})`]
      });
      continue;
    }

    // ===================================================
    // 3️⃣ LIMITS (MUSS VOR INSERT/EXECUTION)
    // ===================================================
    const limits = isExecutionBlockedByLimits({
      tenant,
      customerKey: candidate.customerKey,
      maxPerDayTenant: 10,
      maxPerDayCustomer: 2,   // leicht erhöht für realistischere Tests
      killSwitch: false
    });

    if (limits?.blocked) {
      results.push({
        customerKey: candidate.customerKey,
        status: "blocked",
        reason: limits.reason || ["Execution limit blocked"],
        metrics: {
          tenantCount: limits.tenantCount ?? 0,
          customerCount: limits.customerCount ?? 0
        }
      });
      continue;
    }

    try {

      // ===================================================
      // 4️⃣ ACTION ID
      // ===================================================
      const actionId = uuidv4();

      // ===================================================
      // 5️⃣ MARKETING ACTION SPEICHERN
      // ===================================================
      const inserted = insertAuraMarketingAction({
        id: actionId,
        tenant,
        headline: candidate.triggerType,
        channels: [candidate.channel],
        offers: [],
        cta: "Jetzt Termin buchen",
        confidence: candidate.confidence ?? 0.5,
        reason: candidate.reason,
        status: "generated"
      });

      if (!inserted) {
        throw new Error("Marketing Action konnte nicht gespeichert werden");
      }

      // ===================================================
      // 6️⃣ EXECUTION
      // ===================================================
      const executionResult = await executeAuraAction({
        action_id: actionId,
        decision: "auto",
        tenant,
        context: {
          mode: "pipeline",
          customerKey: candidate.customerKey,
          triggerType: candidate.triggerType,
          confidence: candidate.confidence
        }
      });

      // ===================================================
      // 7️⃣ FEEDBACK
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
        confidence: candidate.confidence,
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