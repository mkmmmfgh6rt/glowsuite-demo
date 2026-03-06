// =======================================================
// 🧠 AURA Context Updater – Phase 6.4.3 (FINAL)
// =======================================================

import { setAuraContext } from "./db.js";

/**
 * Aktualisiert den AURA Context nach einer Aktion
 */
export function updateContextAfterAction({
  tenant,
  action_id,
  mode = "campaign",
}) {
  if (!tenant || !action_id) return false;

  try {
    setAuraContext({
      tenant,
      key: "last_action",
      value: action_id,
    });

    setAuraContext({
      tenant,
      key: "last_action_at",
      value: new Date().toISOString(),
    });

    setAuraContext({
      tenant,
      key: "mode",
      value: mode,
    });

    setAuraContext({
      tenant,
      key: "cooldown",
      value: "true",
    });

    return true;
  } catch (err) {
    console.error("❌ updateContextAfterAction:", err.message);
    return false;
  }
}
