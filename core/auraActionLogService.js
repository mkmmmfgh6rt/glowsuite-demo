// core/auraActionLogService.js

import { getDb } from "./db.js";

/**
 * Speichert eine ausgeführte AURA-Aktion
 */
export function saveAuraActionLog({
  action_id,
  decision,
  tenant,
  context = {},
  status = "executed",
}) {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO aura_action_logs
    (action_id, decision, tenant, context, status, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  stmt.run(
    action_id,
    decision,
    tenant,
    JSON.stringify(context),
    status
  );

  return { ok: true };
}
