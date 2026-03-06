// core/auraForecastTriggerService.js

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function detectForecastDropTrigger({
  history = [],
  adjustedForecast = [],
  confidence
}) {

  // 1️⃣ Mindestanforderungen
  if (!history.length || history.length < 7) return null;
  if (!adjustedForecast.length) return null;
  if (confidence < 0.65) return null;

  const recent = history.slice(-14);
  const baseline =
    mean(recent.map(d => Number(d.bookings || 0)));

  const forecastAvg =
    mean(adjustedForecast.map(f =>
      Number(f.adjusted_bookings ?? f.predicted_bookings ?? 0)
    ));

  if (baseline <= 0) return null;

  const dropPct = (forecastAvg - baseline) / baseline;

  // 2️⃣ Nur signifikante Drops berücksichtigen
  if (dropPct > -0.15) return null;

  // 3️⃣ Severity bestimmen
  let severity = "low";

  if (dropPct <= -0.5) severity = "high";
  else if (dropPct <= -0.3) severity = "medium";

  return {
    type: "forecast_drop_prevention",
    severity,
    baseline: Number(baseline.toFixed(2)),
    forecastAvg: Number(forecastAvg.toFixed(2)),
    dropPct: Number(dropPct.toFixed(3)),
    message: `Forecast zeigt ${Math.round(dropPct * 100)}% Rückgang (${severity})`
  };
}