// =======================================================
// 🧠 AURA Action Feedback Service – Phase 5.5 / 6.1
// =======================================================

import { randomUUID } from "crypto";
import { getDb } from "./db.js";

/**
 * WRITE – Feedback speichern
 */
export function recordAuraActionFeedback({
  action_log_id,
  success,
  impact = "medium",
  notes = "",
  tenant = null,
}) {
  if (!action_log_id || typeof success !== "boolean") {
    throw new Error("action_log_id oder success fehlt");
  }

  const db = getDb();

  db.prepare(`
    INSERT INTO action_feedback (
      id, action_log_id, success, impact, notes, tenant
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    action_log_id,
    success ? 1 : 0,
    impact,
    notes,
    tenant
  );

  return true;
}

/**
 * READ – Feedback abrufen (für Learning)
 */
export function getAuraActionFeedback({ tenant = null } = {}) {
  const db = getDb();

  const rows = db.prepare(`
    SELECT *
    FROM action_feedback
    ${tenant ? "WHERE tenant = ?" : ""}
    ORDER BY created_at DESC
  `).all(tenant ? [tenant] : []);

  return rows;
}
