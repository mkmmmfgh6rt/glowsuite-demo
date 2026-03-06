import { getAuraMarketingHistory } from "./db.js";

export function applyAdaptiveSeverity({ tenant, severity }) {
  if (!tenant || !severity) return severity;

  const executed = getAuraMarketingHistory({
    tenant,
    limit: 20,
    status: "executed"
  });

  const forecastOnes = executed.filter(
    m => m?.reason?.source === "forecast_trigger"
  );

  if (!forecastOnes.length) return severity;

  const worst = forecastOnes.reduce((w, m) => {
    const roi = Number(m.roi_score ?? 0);
    return roi < Number(w.roi_score ?? 0) ? m : w;
  }, forecastOnes[0]);

  const roi = Number(worst.roi_score ?? 0);

  if (roi <= -0.8) {
    return downgrade(downgrade(severity));
  }

  if (roi <= -0.3) {
    return downgrade(severity);
  }

  return severity;
}

function downgrade(level) {
  if (level === "high") return "medium";
  if (level === "medium") return "low";
  return "low";
}