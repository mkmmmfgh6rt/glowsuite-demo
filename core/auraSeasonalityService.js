// core/auraSeasonalityService.js

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function detectWeeklySeasonality(history = []) {
  if (!Array.isArray(history) || history.length < 14) {
    return {
      pattern: "none",
      adjustments: {},
      strength: 0,
      confidenceImpact: 0,
    };
  }

  const byWeekday = {};
  history.forEach(d => {
    const wd = new Date(d.day).getDay();
    byWeekday[wd] = byWeekday[wd] || [];
    byWeekday[wd].push(Number(d.bookings || 0));
  });

  const allBookings = history.map(d => Number(d.bookings || 0));
  const overallAvg = mean(allBookings);

  const adjustments = {};
  const weekdayIndexes = [];

  Object.entries(byWeekday).forEach(([wd, values]) => {
    // Mindestdaten pro Wochentag
    if (values.length < 3) return;

    const avg = mean(values);
    const index = overallAvg > 0 ? (avg - overallAvg) / overallAvg : 0;

    adjustments[wd] = Number(index.toFixed(3));
    weekdayIndexes.push(index);
  });

  if (!weekdayIndexes.length) {
    return {
      pattern: "weak",
      adjustments: {},
      strength: 0,
      confidenceImpact: 0,
    };
  }

  const maxIndex = Math.max(...weekdayIndexes);
  const minIndex = Math.min(...weekdayIndexes);

  const strength = clamp(Math.abs(maxIndex - minIndex), 0, 1);

  let pattern = "weekly";
  if (strength < 0.15) pattern = "weak";

  // Confidence leicht senken bei sehr starkem Muster
  const confidenceImpact = strength > 0.4 ? -0.05 : 0;

  return {
    pattern,
    adjustments,
    strength: Number(strength.toFixed(3)),
    confidenceImpact,
  };
}

export function applySeasonality(forecast = [], seasonality) {
  if (!seasonality?.adjustments) return forecast;

  const today = new Date();

  return forecast.map((f, i) => {
    const d = new Date(today.getTime() + (i + 1) * 86400000);
    const wd = d.getDay();

    const rawAdj = seasonality.adjustments[wd] || 0;

    // Blending-Faktor (nur 40% Einfluss)
    const blendedAdj = rawAdj * 0.4;

    return {
      ...f,
      adjusted_bookings: Number(
        (f.predicted_bookings * (1 + blendedAdj)).toFixed(2)
      ),
      adjusted_revenue: Number(
        (f.predicted_revenue * (1 + blendedAdj)).toFixed(2)
      ),
    };
  });
}