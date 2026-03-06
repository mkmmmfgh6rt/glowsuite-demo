// =======================================================
// 🛡 AURA Execution Gate – Phase 10.5
// Zentrale Kontrollinstanz für Trigger-Ausführung
// =======================================================

export function shouldExecuteTrigger({
  triggerType,
  priority,
  roiBlocked = false,
  cooldownActive = false
}) {

  // 1️⃣ Kein Trigger vorhanden
  if (!triggerType || triggerType === "none") {
    return {
      decision: "IGNORE",
      reason: ["Kein gültiger Trigger"]
    };
  }

  // 2️⃣ ROI Guard blockiert aggressive Trigger
  const aggressiveTriggers = ["winback_strong"];

  if (roiBlocked && aggressiveTriggers.includes(triggerType)) {
    return {
      decision: "BLOCK",
      reason: ["ROI Guard blockiert aggressiven Trigger"]
    };
  }

  // 3️⃣ Cooldown aktiv → WhatsApp verzögern
  if (cooldownActive && triggerType !== "loyalty_bonus") {
    return {
      decision: "DELAY",
      reason: ["Cooldown aktiv – Trigger verschoben"]
    };
  }

  // 4️⃣ Niedrige Priorität ignorieren (Schutz gegen Spam)
  if (priority > 4) {
    return {
      decision: "IGNORE",
      reason: ["Priorität zu niedrig"]
    };
  }

  // 5️⃣ Alles in Ordnung → Ausführen erlaubt
  return {
    decision: "EXECUTE",
    reason: ["Gate freigegeben"]
  };
}