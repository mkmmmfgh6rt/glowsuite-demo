// =======================================================
// ⏳ AURA Cooldown Service – Phase 6.4.4
// =======================================================

import { getAuraContext, clearAuraContext } from "./db.js";

/**
 * Prüft, ob Cooldown abgelaufen ist und hebt ihn ggf. auf
 * @param {string|null} tenant
 * @param {number} hours
 */
export function handleAuraCooldown({ tenant, hours = 24 }) {
  if (!tenant) return false;

  const ctx = getAuraContext(tenant);
  if (!ctx.cooldown || ctx.cooldown !== "true") return false;

  const lastActionAt = ctx.last_action_at;
  if (!lastActionAt) return false;

  const last = new Date(lastActionAt).getTime();
  const now = Date.now();
  const diffHours = (now - last) / (1000 * 60 * 60);

  if (diffHours >= hours) {
    clearAuraContext({ tenant, key: "cooldown" });
    return true;
  }

  return false;
}
