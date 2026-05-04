// =======================================================
// 📅 AURA Free Slot Engine
// erkennt kritische freie Termine und erzeugt Trigger
// =======================================================

import { detectFreeSlots } from "./auraAvailabilityService.js";

export function detectFreeSlotCandidates({ tenant }) {

  const freeSlots = detectFreeSlots({ tenant }) || [];

  if (!freeSlots.length) return [];

  const groupedByDate = {};

  for (const slot of freeSlots) {
    if (!groupedByDate[slot.date]) {
      groupedByDate[slot.date] = [];
    }
    groupedByDate[slot.date].push(slot);
  }

  const candidates = [];

  for (const [date, slots] of Object.entries(groupedByDate)) {

    if (slots.length >= 5) {
      candidates.push({
        customerKey: `free_slots_${date}`,
        segment: "system",
        recency: 0,
        frequency: 0,
        monetary: 0,
        triggerType: "low_occupancy",
        channel: "whatsapp",
        priority: 2,
        reason: [
          `${slots.length} freie Termine am ${date} erkannt`
        ],
        confidence: 0.72
      });
    }

  }

  return candidates;

}