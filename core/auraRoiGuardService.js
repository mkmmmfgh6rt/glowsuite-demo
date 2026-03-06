// core/auraRoiGuardService.js
import { getAuraMarketingHistory, setAuraContext, getAuraContext } from "./db.js";

function daysToMs(d) {
  return d * 24 * 60 * 60 * 1000;
}

export function evaluateRoiGuard({ tenant }) {
  if (!tenant) return { blocked: false };

  // letzte ausgeführte Kampagnen prüfen
  const executed = getAuraMarketingHistory({
    tenant,
    limit: 30,
    status: "executed"
  });

  const now = Date.now();
  const lookbackMs = daysToMs(7);

  const recent = executed.filter(m => {
    if (!m.created_at) return false;
    const created = new Date(m.created_at).getTime();
    return now - created <= lookbackMs;
  });

  // nur Forecast Trigger Kampagnen bewerten
  const forecastOnes = recent.filter(m => m?.reason?.source === "forecast_trigger");

  if (!forecastOnes.length) return { blocked: false };

  // schlechteste Kampagne in Zeitraum
  const worst = forecastOnes.reduce((w, m) => {
    const roi = Number(m.roi_score ?? 0);
    return roi < Number(w.roi_score ?? 0) ? m : w;
  }, forecastOnes[0]);

  const roi = Number(worst.roi_score ?? 0);
  const impactRev = Number(worst.impact_revenue ?? 0);

  const isBad =
    roi <= -0.3 ||
    impactRev <= -200;

  if (!isBad) return { blocked: false };

  // block für 7 tage (kannst du später dynamisch machen)
  const blockDays = 7;
  const blockedUntil = new Date(Date.now() + daysToMs(blockDays)).toISOString();

  setAuraContext({
    tenant,
    key: "roi_guard_blocked_until",
    value: blockedUntil
  });

  return {
    blocked: true,
    blockedUntil,
    reason: {
      roi,
      impactRev
    }
  };
}

export function isRoiGuardActive({ tenant }) {
  if (!tenant) return { active: false };

  const ctx = getAuraContext(tenant);
  const until = ctx?.roi_guard_blocked_until;

  if (!until) return { active: false };

  const t = new Date(until).getTime();
  if (Date.now() >= t) return { active: false };

  return { active: true, until };
}