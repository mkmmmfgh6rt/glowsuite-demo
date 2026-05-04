// =======================================================
// 📢 AURA Broadcast Engine
// Erkennt freie Slots und startet Broadcast Kampagnen
// =======================================================

import { getAllBookings } from "./db.js";

export async function detectBroadcastCandidates({ tenant }) {

  const bookings = await getAllBookings();

  if (!bookings || bookings.length === 0) {
    return [];
  }

  // ============================================
  // Analyse freie Slots
  // ============================================

  const today = new Date();

  const upcomingBookings = bookings.filter(b => {
    const d = new Date(b.dateTime);
    return d > today;
  });

  // Wenn viele zukünftige Termine → kein Broadcast
  if (upcomingBookings.length > 10) {
    return [];
  }

  // ============================================
  // Kunden aus Buchungen ableiten
  // ============================================

  const customersMap = new Map();

  bookings.forEach(b => {
    if (b.phone && !customersMap.has(b.phone)) {
      customersMap.set(b.phone, {
        name: b.name,
        phone: b.phone
      });
    }
  });

  const selectedCustomers = Array.from(customersMap.values()).slice(0, 20);

  if (selectedCustomers.length === 0) {
    return [];
  }

  // ============================================
  // Broadcast Trigger
  // ============================================

  return [{
    customerKey: "broadcast_segment",
    segment: "broadcast",
    triggerType: "broadcast_campaign",
    channel: "whatsapp",
    priority: 2,
    reason: ["freie_slots_erkannt"],
    confidence: 0.8,
    customers: selectedCustomers
  }];

}