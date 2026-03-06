// =======================================================
// 🧠 AURA Context Memory Service – Phase 6.3.1
// Kurzzeitgedächtnis (situativer Zustand)
// =======================================================

import {
  setAuraContext,
  getAuraContext,
  clearAuraContext,
} from "./db.js";

/**
 * Setzt einen Context-Wert (z.B. mode, last_action)
 */
export function writeAuraContext({ tenant, key, value }) {
  if (!tenant || !key) {
    throw new Error("tenant oder key fehlt");
  }
  return setAuraContext({ tenant, key, value });
}

/**
 * Holt kompletten aktuellen Context eines Tenants
 */
export function readAuraContext(tenant) {
  if (!tenant) return {};
  return getAuraContext(tenant);
}

/**
 * Löscht Context (optional nur einen Key)
 */
export function resetAuraContext({ tenant, key = null }) {
  if (!tenant) return false;
  return clearAuraContext({ tenant, key });
}
