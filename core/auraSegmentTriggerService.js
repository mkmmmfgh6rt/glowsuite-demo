// =======================================================
// 🧠 AURA Segment Trigger Service – Phase 10.2
// Segment → Trigger-Vorschlag (Read-Only)
// =======================================================

export function getSegmentTriggerSuggestion({
  segment,
  forecast = null,
  roiGuard = { blocked: false },
  cooldownActive = false
}) {

  if (!segment) return null;

  let triggerType = null;
  let channel = "WhatsApp";
  let priority = 3;
  let reason = [];

  // ROI Guard blockiert aggressive Aktionen
  if (roiGuard?.blocked) {
    reason.push("ROI Guard aktiv – aggressive Trigger deaktiviert");
  }

  // Cooldown reduziert WhatsApp
  if (cooldownActive) {
    channel = "Instagram";
    reason.push("Cooldown aktiv – WhatsApp reduziert");
  }

  switch (segment) {

    case "VIP":
      triggerType = "loyalty_bonus";
      priority = 1;
      reason.push("VIP-Kunde – Bindung priorisieren");
      break;

    case "Aktiv":
      triggerType = "reminder_soft";
      priority = 2;
      reason.push("Aktiver Kunde – sanfte Erinnerung sinnvoll");
      break;

    case "Potenziell":
      triggerType = "nurture_followup";
      priority = 3;
      reason.push("Neukunde – Zweittermin fördern");
      break;

    case "Risiko":
      triggerType = "winback_soft";
      priority = 4;
      reason.push("Kunde zeigt Abwanderungsrisiko");
      break;

    case "Verloren":
      if (!roiGuard?.blocked) {
        triggerType = "winback_strong";
        priority = 5;
        reason.push("Verlorener Kunde – Reaktivierung versuchen");
      } else {
        triggerType = "none";
        reason.push("Verloren, aber ROI Guard blockiert starke Aktion");
      }
      break;

    default:
      triggerType = "none";
      reason.push("Kein passender Trigger");
  }

  // Forecast Drop → Priorität erhöhen
  if (forecast?.trigger?.type === "forecast_drop_prevention") {
    priority = Math.max(1, priority - 1);
    reason.push("Forecast Drop erkannt – Priorität erhöht");
  }

  return {
    segment,
    triggerType,
    channel,
    priority,
    reason
  };
}