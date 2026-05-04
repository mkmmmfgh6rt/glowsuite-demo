// =======================================================
// 🧠 AURA Learning Engine – Phase 12
// lernt aus Kampagnen Ergebnissen
// =======================================================

import { getAuraActionLogs } from "./db.js";

export function analyzeAuraLearning({ tenant }) {

  if (!tenant) return null;

  const logs = getAuraActionLogs(tenant) || [];

  if (logs.length === 0) {
    return {
      status: "no_data"
    };
  }

  let success = 0;
  let failed = 0;

  const channelStats = {};

  for (const log of logs) {

    if (log.success === true) {
      success++;
    } else {
      failed++;
    }

    if (!channelStats[log.channel]) {
      channelStats[log.channel] = {
        success: 0,
        total: 0
      };
    }

    channelStats[log.channel].total++;

    if (log.success) {
      channelStats[log.channel].success++;
    }

  }

  const successRate =
    success / (success + failed || 1);

  return {
    status: "learning",
    successRate,
    totalActions: logs.length,
    channelStats
  };

}