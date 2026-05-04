// =======================================================
// 📢 AURA Smart Broadcast Engine – Phase 11
// erkennt viele freie Termine und schlägt Broadcast vor
// =======================================================

import { detectFreeSlots } from "./auraAvailabilityService.js";

export function detectBroadcastCandidates({ tenant }) {

  if (!tenant) return [];

  const freeSlots = detectFreeSlots({ tenant }) || [];

  const candidates = [];

  // wenn viele freie Termine existieren
  if (freeSlots.length >= 5) {

    candidates.push({

      customerKey: "segment_general",

      segment: "broadcast",

      recency: 0,

      frequency: 0,

      monetary: 0,

      triggerType: "free_slot_broadcast",

      channel: "whatsapp",

      priority: 1,

      reason: [
        `${freeSlots.length} freie Termine erkannt`
      ],

      confidence: 0.75

    });

  }

  return candidates;

}