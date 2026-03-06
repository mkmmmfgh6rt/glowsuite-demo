import { saveAuraActionLog } from "./auraActionLogService.js";
import { updateContextAfterAction } from "./auraContextUpdater.js";

export async function executeAuraAction({
  action_id,
  decision,
  tenant = null,
  context = {},
}) {
  if (!action_id) {
    throw new Error("action_id fehlt");
  }

  const executedAt = new Date().toISOString();

  // 🔐 Aktion loggen (mit STATUS für Limit-Tracking)
  saveAuraActionLog({
    action_id,
    decision: decision || null,
    tenant,
    context: context || {},
    status: "executed",        // 🔥 WICHTIG für Daily-Limit
  });

  // 🧠 Kontext nach Aktion aktualisieren
  if (tenant) {
    updateContextAfterAction({
      tenant,
      action_id,
      mode: context?.mode || "campaign",
    });
  }

  return {
    status: "executed",
    action_id,
    executed_at: executedAt,
  };
}
