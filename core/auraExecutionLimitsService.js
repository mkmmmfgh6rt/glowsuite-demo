// =======================================================
// 🛡 AURA Execution Limits Service – Phase 10.9 (HARD CONTROL)
// Globaler KillSwitch + Tageslimits pro Tenant & Kunde
// =======================================================

import { getDb } from "./db.js";

// ✅ Globaler System-KillSwitch (über ENV steuerbar)
const GLOBAL_KILL_SWITCH = process.env.AURA_KILL_SWITCH === "true";

export function isExecutionBlockedByLimits({
  tenant,
  customerKey,
  maxPerDayTenant = 10,
  maxPerDayCustomer = 3,
  killSwitch = false // optionaler lokaler Override
}) {
  const db = getDb();

  // ===================================================
  // 🛑 1️⃣ GLOBALER KILLSWITCH (höchste Priorität)
  // ===================================================
  if (GLOBAL_KILL_SWITCH) {
    return {
      blocked: true,
      reason: ["Global KillSwitch aktiv"],
      tenantCount: 0,
      customerCount: 0
    };
  }

  // ===================================================
  // 🛑 2️⃣ LOKALER KILLSWITCH (z. B. aus Pipeline)
  // ===================================================
  if (killSwitch) {
    return {
      blocked: true,
      reason: ["Lokaler KillSwitch aktiviert"],
      tenantCount: 0,
      customerCount: 0
    };
  }

  // ===================================================
  // 🧮 3️⃣ TENANT TAGESZÄHLUNG
  // ===================================================
  const tenantCountRow = db.prepare(`
    SELECT COUNT(*) as count
    FROM aura_action_logs
    WHERE tenant = ?
      AND status = 'executed'
      AND DATE(created_at) = DATE('now')
  `).get(tenant);

  const tenantCount = tenantCountRow?.count ?? 0;

  if (tenantCount >= maxPerDayTenant) {
    return {
      blocked: true,
      reason: [
        `Tenant Tageslimit erreicht (${tenantCount}/${maxPerDayTenant})`
      ],
      tenantCount,
      customerCount: 0
    };
  }

  // ===================================================
  // 👤 4️⃣ CUSTOMER TAGESZÄHLUNG
  // ===================================================
  const customerCountRow = db.prepare(`
    SELECT COUNT(*) as count
    FROM aura_action_logs
    WHERE tenant = ?
      AND status = 'executed'
      AND context LIKE ?
      AND DATE(created_at) = DATE('now')
  `).get(
    tenant,
    `%${customerKey}%`
  );

  const customerCount = customerCountRow?.count ?? 0;

  if (customerCount >= maxPerDayCustomer) {
    return {
      blocked: true,
      reason: [
        `Customer Tageslimit erreicht (${customerCount}/${maxPerDayCustomer})`
      ],
      tenantCount,
      customerCount
    };
  }

  // ===================================================
  // ✅ FREIGEGEBEN
  // ===================================================
  return {
    blocked: false,
    reason: [],
    tenantCount,
    customerCount
  };
}