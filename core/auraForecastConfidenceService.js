// core/auraForecastConfidenceService.js

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return mean(arr.map(v => (v - m) ** 2));
}

function stdDev(arr) {
  return Math.sqrt(variance(arr));
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function mad(arr) {
  // Median Absolute Deviation (robust)
  if (!arr.length) return 0;
  const m = median(arr);
  const dev = arr.map(v => Math.abs(v - m));
  return median(dev);
}

function r2Lite(values) {
  // Fit line y = a + b*x to values indexed by x=0..n-1
  const n = values.length;
  if (n < 3) return 0;

  const xs = Array.from({ length: n }, (_, i) => i);
  const xBar = mean(xs);
  const yBar = mean(values);

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i] - xBar;
    const y = values[i] - yBar;
    num += x * y;
    den += x * x;
  }
  const b = den === 0 ? 0 : num / den;
  const a = yBar - b * xBar;

  const yHat = values.map((_, i) => a + b * i);
  const ssRes = mean(values.map((y, i) => (y - yHat[i]) ** 2));
  const ssTot = variance(values);

  if (ssTot === 0) return 0.5; // constant series: neutral-ish
  const r2 = 1 - ssRes / ssTot;
  return clamp(r2, 0, 1);
}

function signConsistency(deltas) {
  // 1 = stable sign, 0 = flipping constantly
  if (deltas.length < 2) return 0.5;
  let flips = 0;
  let prevSign = Math.sign(deltas[0]);
  for (let i = 1; i < deltas.length; i++) {
    const s = Math.sign(deltas[i]);
    if (s !== 0 && prevSign !== 0 && s !== prevSign) flips++;
    if (s !== 0) prevSign = s;
  }
  const maxFlips = Math.max(1, deltas.length - 1);
  return clamp(1 - flips / maxFlips, 0, 1);
}

export function computeForecastConfidence(history = []) {
  // Backwards compatible fields: confidence + reliability
  // New: breakdown + flags + reasons
  if (!Array.isArray(history) || history.length < 5) {
    return {
      confidence: 0.4,
      reliability: "low",
      breakdown: {
        data_quality: 0,
        volatility_score: 0,
        trend_stability: 0,
        fit_quality: 0,
        outlier_score: 0,
      },
      flags: ["INSUFFICIENT_HISTORY"],
      reasons: ["Zu wenig historische Daten für belastbare Prognose."],
    };
  }

  const window = history.slice(-14);
  const bookings = window.map(d => Number(d.bookings || 0));
  const revenues = window.map(d => Number(d.revenue || 0));

  // A) Data quality
  const coverage = clamp(window.length / 14, 0, 1); // 0..1
  const data_quality = coverage;

  // B) Volatility (normalized)
  const bAvg = mean(bookings) || 1;
  const bVol = stdDev(bookings);
  const normalizedVol = clamp(bVol / bAvg, 0, 2);     // allow >1 then clamp later
  const volatility_score = clamp(1 - normalizedVol, 0, 1);

  // C) Trend stability (based on deltas sign flips)
  const deltas = bookings.slice(1).map((v, i) => v - bookings[i]);
  const trend_stability = signConsistency(deltas);

  // D) Fit quality (R²-lite on bookings)
  const fit_quality = r2Lite(bookings);

  // E) Outlier score (robust using MAD)
  const m = median(bookings);
  const mMAD = mad(bookings) || 0;
  // Define outlier if far beyond median by factor
  const threshold = Math.max(2, 3 * mMAD); // keep sane when MAD is tiny
  const outliers = bookings.filter(v => Math.abs(v - m) > threshold).length;
  const outlier_rate = bookings.length ? outliers / bookings.length : 0;
  const outlier_score = clamp(1 - outlier_rate, 0, 1);

  // Weights (v3)
  const confidenceRaw =
    0.20 * data_quality +
    0.30 * volatility_score +
    0.20 * trend_stability +
    0.20 * fit_quality +
    0.10 * outlier_score;

  const confidence = clamp(confidenceRaw, 0.3, 0.95);

  // Reliability logic
  let reliability = "low";
  if (confidence >= 0.78 && data_quality >= 0.85) reliability = "high";
  else if (confidence >= 0.62 && data_quality >= 0.6) reliability = "medium";

  // Flags + reasons
  const flags = [];
  const reasons = [];

  if (coverage < 0.6) {
    flags.push("LOW_COVERAGE");
    reasons.push("Wenig Daten in den letzten 14 Tagen (Coverage niedrig).");
  }
  if (volatility_score < 0.45) {
    flags.push("HIGH_VOLATILITY");
    reasons.push("Buchungen schwanken stark (Volatilität hoch).");
  }
  if (trend_stability < 0.45) {
    flags.push("CHOPPY_TREND");
    reasons.push("Trend ist instabil (häufige Richtungswechsel).");
  }
  if (fit_quality < 0.35) {
    flags.push("WEAK_FIT");
    reasons.push("Lineares Trendmodell erklärt die Daten nur schwach (Fit niedrig).");
  }
  if (outlier_rate > 0.2) {
    flags.push("MANY_OUTLIERS");
    reasons.push("Viele Ausreißer-Tage in den letzten 14 Tagen.");
  }

  // Revenue sanity check (light)
  const rAvg = mean(revenues);
  if (rAvg > 0 && mean(bookings) > 0) {
    const avgTicket = rAvg / (mean(bookings) || 1);
    if (!Number.isFinite(avgTicket) || avgTicket <= 0) {
      flags.push("REVENUE_INCONSISTENT");
      reasons.push("Umsatzdaten wirken inkonsistent (Durchschnittsbon unplausibel).");
    }
  }

  return {
    confidence: Number(confidence.toFixed(3)),
    reliability,
    breakdown: {
      data_quality: Number(data_quality.toFixed(3)),
      volatility_score: Number(volatility_score.toFixed(3)),
      trend_stability: Number(trend_stability.toFixed(3)),
      fit_quality: Number(fit_quality.toFixed(3)),
      outlier_score: Number(outlier_score.toFixed(3)),
    },
    flags,
    reasons,
  };
}