// =======================================================
// 🧠 AURA Context-aware Decision Service – Phase 6.4.2
// =======================================================

/**
 * Entscheidet, welche Aktion AURA vorschlagen darf
 * (Context + Learning + Mode)
 */
export function applyContextRules({
  actions = [],
  context = {},
  learning = [],
  mode = "analysis", // analysis | campaign | dashboard
}) {
  if (!Array.isArray(actions) || actions.length === 0) return [];

  let candidates = [...actions];

  // ---------------------------------------------------
  // ❌ 1. Gleiche Aktion nicht wiederholen
  // ---------------------------------------------------
  if (context.last_action) {
    candidates = candidates.filter(
      a => a.id !== context.last_action
    );
  }

  // ---------------------------------------------------
  // ❌ 2. Cooldown aktiv → keine Push-/Campaign-Aktionen
  // ---------------------------------------------------
  if (context.cooldown === "true") {
    candidates = candidates.filter(
      a => a.type !== "campaign"
    );
  }

  // ---------------------------------------------------
  // 🎯 3. Mode-basierte Filterung
  // ---------------------------------------------------
  if (mode === "dashboard") {
    // Dashboard = nur Hinweise, keine Aktionen
    candidates = candidates.filter(
      a => a.type === "insight"
    );
  }

  if (mode === "campaign") {
    // Campaign-Mode = nur Marketing-Aktionen
    candidates = candidates.filter(
      a => a.type === "campaign"
    );
  }

  // ---------------------------------------------------
  // 🧠 4. Lernen berücksichtigen (Erfolgsquote)
  // ---------------------------------------------------
  if (Array.isArray(learning) && learning.length > 0) {
    candidates.sort((a, b) => {
      const la = learning.find(l => l.action_id === a.id);
      const lb = learning.find(l => l.action_id === b.id);

      const sa = la?.success_rate ?? 0;
      const sb = lb?.success_rate ?? 0;

      return sb - sa;
    });
  }

  // ---------------------------------------------------
  // ⭐ 5. Finale Entscheidung
  // → AURA schlägt MAXIMAL 1 Aktion vor
  // ---------------------------------------------------
  return candidates.slice(0, 1);
}
