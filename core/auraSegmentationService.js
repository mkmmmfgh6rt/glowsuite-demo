// =======================================================
// 🧠 AURA Segmentation Service – Phase 10 (V1)
// RFM + Cycle + Segment Classification
// Read-Only Analyse Layer
// =======================================================

import { getDb } from "./db.js";

const LOOKBACK_DAYS = 365;

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function daysBetween(a, b) {
  return Math.floor((a - b) / (1000 * 60 * 60 * 24));
}

function median(values = []) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.floor((sorted[mid - 1] + sorted[mid]) / 2);
}

// -------------------------------------------------------
// 1️⃣ RFM BERECHNUNG
// -------------------------------------------------------

export function getTenantRfm({ tenant }) {
  if (!tenant) return [];

  const db = getDb();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();

  const rows = db.prepare(`
    SELECT *
    FROM bookings
    WHERE tenant = ?
      AND price > 0
      AND dateTime >= ?
    ORDER BY dateTime ASC
  `).all(tenant, since);

  const grouped = {};

  for (const r of rows) {
    const key = r.phone || r.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  const now = new Date();

  return Object.entries(grouped).map(([customerKey, bookings]) => {
    const lastBooking = new Date(bookings[bookings.length - 1].dateTime);
    const recency = daysBetween(now, lastBooking);

    const frequency = bookings.length;

    const monetary = bookings.reduce(
      (sum, b) => sum + Number(b.price || 0),
      0
    );

    return {
      customerKey,
      recency,
      frequency,
      monetary,
      bookings
    };
  });
}

// -------------------------------------------------------
// 2️⃣ ZYKLUS ERKENNUNG
// -------------------------------------------------------

function detectCycle(bookings = []) {
  if (bookings.length < 3) {
    return { cycleDays: null, confidence: "low" };
  }

  const deltas = [];

  for (let i = 1; i < bookings.length; i++) {
    const prev = new Date(bookings[i - 1].dateTime);
    const curr = new Date(bookings[i].dateTime);
    const delta = daysBetween(curr, prev);
    if (delta >= 7 && delta <= 120) deltas.push(delta);
  }

  if (deltas.length < 2) {
    return { cycleDays: null, confidence: "low" };
  }

  return {
    cycleDays: median(deltas),
    confidence: deltas.length >= 3 ? "high" : "medium"
  };
}

// -------------------------------------------------------
// 3️⃣ SEGMENT LOGIK
// -------------------------------------------------------

function classifySegment({ recency, frequency, monetary, cycleDays }) {

  if (frequency >= 6 && monetary >= 400 && recency <= 30) {
    return "VIP";
  }

  if (recency <= 30 && frequency >= 2) {
    return "Aktiv";
  }

  if (recency <= 60 && frequency === 1) {
    return "Potenziell";
  }

  if (recency > 60 && recency <= 120) {
    return "Risiko";
  }

  if (recency > 120) {
    return "Verloren";
  }

  return "Unbekannt";
}

// -------------------------------------------------------
// 4️⃣ HAUPTFUNKTION
// -------------------------------------------------------

export function getTenantSegments({ tenant }) {
  const rfm = getTenantRfm({ tenant });

  return rfm.map(customer => {
    const cycle = detectCycle(customer.bookings);

    const segment = classifySegment({
      recency: customer.recency,
      frequency: customer.frequency,
      monetary: customer.monetary,
      cycleDays: cycle.cycleDays
    });

    return {
      customerKey: customer.customerKey,
      recency: customer.recency,
      frequency: customer.frequency,
      monetary: customer.monetary,
      cycleDays: cycle.cycleDays,
      cycleConfidence: cycle.confidence,
      segment
    };
  });
}