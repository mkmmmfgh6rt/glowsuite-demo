// time.js – Datum/Zeit & Öffnungszeiten
import * as chrono from "chrono-node";

export function detectDateTime(message) {
  if (!message) return null;
  const now = new Date();

  const regex = /(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{4}))?\s*(?:um\s*)?(\d{1,2})(?::(\d{2}))?/;
  const match = message.match(regex);
  if (match) {
    let [, d, m, y, h, min] = match;
    const year = y ? parseInt(y, 10) : now.getFullYear();
    const date = new Date(year, m - 1, d, h, min || 0);
    return adjustFutureDate(date);
  }

  try {
    const results = chrono.de.parse(message, now);
    if (results.length > 0 && results[0].start) return adjustFutureDate(results[0].start.date());
  } catch (e) {
    console.warn("chrono parsing error:", e);
  }
  return null;
}

export function adjustFutureDate(date) {
  const now = new Date();
  if (date < now) date.setDate(date.getDate() + 7);
  return date;
}

export function formatDateForDb(date) {
  const pad = (n) => (n < 10 ? "0" + n : n);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:00`;
}

export function isWithinOpeningHours(date) {
  const d = date.getDay(), h = date.getHours();
  if (d >= 1 && d <= 5) return h >= 9 && h < 18;
  if (d === 6) return h >= 10 && h < 14;
  return false;
}
