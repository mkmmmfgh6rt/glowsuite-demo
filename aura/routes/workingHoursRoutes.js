import express from "express";
import { getSupabase, isSupabaseEnabled } from "../../core/supabase.js";
import { authMiddleware } from "../../core/auth.js";

const router = express.Router();

/*
=======================================================
WORKING HOURS ROUTE – GEPLANT / GEPAUKT (OPTION A)
-------------------------------------------------------
Phase-Status:
- SQLite = WRITE-MASTER (Employees)
- Supabase = READ / FUTURE EXTENSION

AKTUELLER STAND (bewusst so):
- Diese Route wird NICHT vom Dashboard genutzt
- Keine Zeiten (Start/Ende) werden hier gepflegt
- Ausschließlich gedacht für spätere Premium-Logik
  (z. B. unterschiedliche Arbeitstage, Sondermodelle)

Aktive Basislogik im System:
- Studio-Öffnungszeiten gelten global (z. B. 09–19 Uhr)
- Mitarbeiter-Tage kommen aktuell aus employees.days (SQLite)
- working_hours ist technisch vorbereitet, aber „geparkt“
=======================================================
*/

/*
PUT /api/working-hours/:employeeId

Body:
{
  active: true,
  days: ["mo","di","mi","do","fr"]
}
*/

const DAY_MAP = {
  mo: 1,
  di: 2,
  mi: 3,
  do: 4,
  fr: 5,
  sa: 6,
  so: 7,
};

router.put("/:employeeId", authMiddleware, async (req, res) => {
  try {
    // 🔒 Schutz: Route nur aktiv, wenn Supabase bewusst eingeschaltet ist
    if (!isSupabaseEnabled()) {
      return res.status(503).json({
        error: "Supabase not enabled (SQLite Master active)",
      });
    }

    const supabase = getSupabase();
    const employeeId = req.params.employeeId;
    const { days = [], active = true } = req.body;

    if (!employeeId || !Array.isArray(days)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Tage normalisieren (mo–so → 1–7)
    const selectedDays = new Set(
      days
        .map(d => String(d).toLowerCase())
        .map(d => DAY_MAP[d])
        .filter(Boolean)
    );

    // 🔥 Vorherigen Zustand komplett entfernen
    const { error: delErr } = await supabase
      .from("employee_working_hours")
      .delete()
      .eq("employee_id", employeeId);

    if (delErr) {
      return res.status(500).json({ error: delErr.message });
    }

    // 🧱 Woche vollständig neu schreiben (Mo–So)
    const rows = [];
    for (let weekday = 1; weekday <= 7; weekday++) {
      rows.push({
        employee_id: employeeId,
        weekday,
        active: active === true && selectedDays.has(weekday),
      });
    }

    const { error: insErr } = await supabase
      .from("employee_working_hours")
      .insert(rows);

    if (insErr) {
      return res.status(500).json({ error: insErr.message });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("working-hours error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
