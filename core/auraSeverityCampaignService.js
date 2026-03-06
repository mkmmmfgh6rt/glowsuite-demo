// core/auraSeverityCampaignService.js

function pickBySeverity(severity, low, medium, high) {
  if (severity === "high") return high;
  if (severity === "medium") return medium;
  return low;
}

export function buildSeverityCampaignPreset({ severity = "low", dropPct = 0 } = {}) {
  const offer = pickBySeverity(
    severity,
    ["Wir vermissen dich ✨ (nur Erinnerung)", "Kostenlose Beratung / Check-in"],
    ["10 % Rabatt", "Upgrade beim nächsten Termin"],
    ["20 % Last-Minute Rabatt", "2 für 1 Add-on (nur diese Woche)"]
  );

  const headline = pickBySeverity(
    severity,
    "Kleiner Reminder ✨ – sichere dir deinen Termin",
    "Freie Termine diese Woche – jetzt sichern ✨",
    "🚨 Kurzfristig freie Slots – nur 48h verfügbar!"
  );

  const cta = pickBySeverity(
    severity,
    "Termin anfragen",
    "Jetzt Termin sichern",
    "Sofort buchen – Plätze begrenzt"
  );

  // kleine Meta-Infos (kannst du später für Learning nutzen)
  const strength = pickBySeverity(severity, "soft", "medium", "hard");

  return {
    strength,
    headline,
    offers: Array.isArray(offer) ? offer : [offer],
    cta,
    note: {
      severity,
      dropPct
    }
  };
}