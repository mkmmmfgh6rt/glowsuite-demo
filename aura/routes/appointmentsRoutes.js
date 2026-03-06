import express from "express";
import {
  assertValidStatusTransition,
  getEffectiveStatus,
  assertStatusIsMutable,
  assertNoOverlap,
  assertTimeIsMutable,
} from "../engine/appointmentEngine.js";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

let supabase = null;

/* ===========================
   SUPABASE (SERVICE ROLE)
=========================== */
function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Supabase ENV fehlt (SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY)");
    }

    supabase = createClient(url, key);
  }
  return supabase;
}

/* ===========================
   HELPERS
=========================== */
function buildDateTime(dateYYYYMMDD, timeHHMMSS) {
  const [h, m, s] = String(timeHHMMSS).split(":").map(Number);
  const d = new Date(`${dateYYYYMMDD}T00:00:00.000Z`);
  d.setUTCHours(h || 0, m || 0, s || 0, 0);
  return d;
}

function isWorkingDay(dateYYYYMMDD, workingDays) {
  if (!workingDays) return true;

  const day = new Date(`${dateYYYYMMDD}T00:00:00.000Z`).getUTCDay(); // 0=Sun
  if (day === 0) return false; // Sonntag immer zu

  const norm = String(workingDays).trim().toUpperCase();
  if (norm === "MO-FR") return day >= 1 && day <= 5;
  if (norm === "MO-SA") return day >= 1 && day <= 6;

  // Zukunftssicher: unbekannt blockiert nicht
  return true;
}

function parseISODateTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/* =====================================================
   GET APPOINTMENTS (A2.6 – effective status)
===================================================== */
router.get("/", async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) throw error;

    const enriched = (data || []).map((a) => ({
      ...a,
      status: getEffectiveStatus(a),
    }));

    return res.json(enriched);
  } catch (err) {
    console.error("Fetch appointments error:", err.message);
    return res.status(500).json({ error: "Appointments laden fehlgeschlagen" });
  }
});

/* =====================================================
   CREATE APPOINTMENT (4.1 / A3.x)
===================================================== */
router.post("/", async (req, res) => {
  try {
    const supabase = getSupabase();

    const {
      studio_id,
      employee_id,
      customer_id,
      start_time,
      duration_minutes,
      price,
      notes,
    } = req.body || {};

    // Pflichtfelder
    if (!studio_id || !employee_id || !start_time || duration_minutes == null) {
      return res.status(400).json({
        error: "Pflichtfelder fehlen (studio_id, employee_id, start_time, duration_minutes)",
      });
    }

    const duration = Number(duration_minutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      return res.status(422).json({ error: "duration_minutes muss > 0 sein" });
    }

    const start = parseISODateTime(start_time);
    if (!start) {
      return res.status(422).json({ error: "start_time ist kein gültiges ISO-Datum" });
    }

    // Wir rechnen konsistent in ISO/UTC weiter
    const dateOnly = start.toISOString().slice(0, 10); // YYYY-MM-DD
    const end = new Date(start.getTime() + duration * 60000);

    /* ===== 1) EMPLOYEE LOAD ===== */
    const { data: emp, error: empError } = await supabase
      .from("employees")
      .select("id, studio_id, active, work_start, work_end, working_days")
      .eq("id", employee_id)
      .single();

    if (empError) throw empError;
    if (!emp) return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
    if (!emp.active) return res.status(400).json({ error: "Mitarbeiter ist inaktiv" });
    if (emp.studio_id !== studio_id) {
      return res.status(403).json({ error: "Mitarbeiter gehört nicht zu diesem Studio" });
    }

    if (!isWorkingDay(dateOnly, emp.working_days)) {
      return res.status(400).json({ error: "Mitarbeiter arbeitet an diesem Tag nicht" });
    }

    if (!emp.work_start || !emp.work_end) {
      return res.status(400).json({ error: "Mitarbeiter-Arbeitszeiten fehlen (work_start/work_end)" });
    }

    const workStart = buildDateTime(dateOnly, emp.work_start);
    const workEnd = buildDateTime(dateOnly, emp.work_end);

    if (start < workStart || end > workEnd) {
      return res.status(400).json({ error: "Termin liegt außerhalb der Arbeitszeit" });
    }

    /* ===== 2) LOGICAL OVERLAP CHECK (nur Tagesbereich) ===== */
    const dayStart = `${dateOnly}T00:00:00.000Z`;
    const dayEnd = `${dateOnly}T23:59:59.999Z`;

    const { data: existing, error: exError } = await supabase
      .from("appointments")
      .select("start_time, end_time, status")
      .eq("studio_id", studio_id)
      .eq("employee_id", employee_id)
      .gte("start_time", dayStart)
      .lte("end_time", dayEnd);

    if (exError) throw exError;

    const blocking = (existing || []).filter((a) => a.status !== "cancelled");

    // UX-Fehler vorher abfangen (freundliche Meldung)
    assertNoOverlap(
      { start_time: start.toISOString(), end_time: end.toISOString() },
      blocking
    );

    /* ===== 3) INSERT (A3.9A – DB Hard Lock) ===== */
    const payload = {
      studio_id,
      employee_id,
      customer_id: customer_id || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: duration,
      price: price ?? null,
      notes: notes || null,
      status: "pending",
    };

    const { data, error: insertError } = await supabase
      .from("appointments")
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      // 23P01 = exclusion constraint violation (bei EXCLUDE USING gist)
      if (insertError.code === "23P01") {
        return res.status(409).json({
          error: "Slot ist bereits gebucht (Doppelbuchung verhindert).",
        });
      }
      throw insertError;
    }

    return res.status(201).json({ success: true, appointment: data });
  } catch (err) {
    console.error("Create appointment error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

/* =====================================================
   RESCHEDULE (DRAG & DROP) – pending-only
   PATCH /api/appointments/:id/reschedule
   Body: { start_time: ISO, end_time: ISO }
===================================================== */
router.patch("/:id/reschedule", async (req, res) => {
  try {
    const supabase = getSupabase();
    const appointmentId = req.params.id;

    const { start_time, end_time } = req.body || {};
    if (!start_time || !end_time) {
      return res.status(400).json({ error: "start_time und end_time sind erforderlich" });
    }

    const newStart = parseISODateTime(start_time);
    const newEnd = parseISODateTime(end_time);
    if (!newStart || !newEnd || newEnd <= newStart) {
      return res.status(422).json({ error: "Ungültige Zeiten (ISO) oder end_time <= start_time" });
    }

    // Keine Cross-Day Termine zulassen (Arbeitszeitmodell ist tagesbasiert)
    const startDateOnly = newStart.toISOString().slice(0, 10);
    const endDateOnly = newEnd.toISOString().slice(0, 10);
    if (startDateOnly !== endDateOnly) {
      return res.status(400).json({ error: "Termin darf nicht über Mitternacht gehen" });
    }

    // 1) Termin laden
    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("id, studio_id, employee_id, status")
      .eq("id", appointmentId)
      .single();

    if (apptError) throw apptError;
    if (!appt) return res.status(404).json({ error: "Termin nicht gefunden" });

    // 2) Nur pending darf verschoben werden
    assertTimeIsMutable(appt.status);

    // 3) Employee laden + Arbeitszeit/Tag prüfen
    const { data: emp, error: empError } = await supabase
      .from("employees")
      .select("id, studio_id, active, work_start, work_end, working_days")
      .eq("id", appt.employee_id)
      .single();

    if (empError) throw empError;
    if (!emp) return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
    if (!emp.active) return res.status(400).json({ error: "Mitarbeiter ist inaktiv" });
    if (String(emp.studio_id) !== String(appt.studio_id)) {
      return res.status(403).json({ error: "Mitarbeiter gehört nicht zu diesem Studio" });
    }

    if (!isWorkingDay(startDateOnly, emp.working_days)) {
      return res.status(400).json({ error: "Mitarbeiter arbeitet an diesem Tag nicht" });
    }

    if (!emp.work_start || !emp.work_end) {
      return res.status(400).json({ error: "Mitarbeiter-Arbeitszeiten fehlen (work_start/work_end)" });
    }

    const workStart = buildDateTime(startDateOnly, emp.work_start);
    const workEnd = buildDateTime(startDateOnly, emp.work_end);

    if (newStart < workStart || newEnd > workEnd) {
      return res.status(400).json({ error: "Termin liegt außerhalb der Arbeitszeit" });
    }

    // 4) Overlap Check (präzise: alle möglichen Überschneidungen)
    const newStartISO = newStart.toISOString();
    const newEndISO = newEnd.toISOString();

    const { data: existing, error: exError } = await supabase
      .from("appointments")
      .select("id, start_time, end_time, status")
      .eq("studio_id", appt.studio_id)
      .eq("employee_id", appt.employee_id)
      .neq("status", "cancelled")
      .lt("start_time", newEndISO)
      .gt("end_time", newStartISO);

    if (exError) throw exError;

    const others = (existing || []).filter((x) => String(x.id) !== String(appt.id));

    assertNoOverlap(
      { start_time: newStartISO, end_time: newEndISO },
      others
    );

    // 5) Update (DB Hard Lock beachten)
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ start_time: newStartISO, end_time: newEndISO })
      .eq("id", appointmentId);

    if (updateError) {
      if (updateError.code === "23P01") {
        return res.status(409).json({
          error: "Slot ist bereits gebucht (Doppelbuchung verhindert).",
        });
      }
      throw updateError;
    }

    return res.json({ success: true, message: "Termin verschoben" });
  } catch (err) {
    console.error("Reschedule error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

/* =====================================================
   UPDATE APPOINTMENT TIME (A3.3 – guarded)
===================================================== */
router.patch("/:id/time", async (req, res) => {
  try {
    const supabase = getSupabase();
    const appointmentId = req.params.id;

    const { start_time, end_time } = req.body || {};
    if (!start_time || !end_time) {
      return res.status(400).json({ error: "start_time und end_time sind erforderlich" });
    }

    const start = parseISODateTime(start_time);
    const end = parseISODateTime(end_time);
    if (!start || !end || end <= start) {
      return res.status(422).json({ error: "Ungültige Zeiten (ISO) oder end_time <= start_time" });
    }

    const { data: appt, error } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("id", appointmentId)
      .single();

    if (error || !appt) return res.status(404).json({ error: "Termin nicht gefunden" });

    assertTimeIsMutable(appt.status);

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ start_time: start.toISOString(), end_time: end.toISOString() })
      .eq("id", appointmentId);

    if (updateError) throw updateError;

    return res.json({ success: true, message: "Terminzeit aktualisiert" });
  } catch (err) {
    console.error("Update appointment time error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

/* =====================================================
   RESCHEDULE APPOINTMENT (Alias für Kalender Drag & Drop)
   -> nutzt exakt dieselbe Logik wie /:id/time
===================================================== */
router.patch("/:id/reschedule", async (req, res) => {
  try {
    const supabase = getSupabase();
    const appointmentId = req.params.id;

    const { start_time, end_time } = req.body || {};
    if (!start_time || !end_time) {
      return res.status(400).json({
        error: "start_time und end_time sind erforderlich",
      });
    }

    const start = parseISODateTime(start_time);
    const end = parseISODateTime(end_time);
    if (!start || !end || end <= start) {
      return res.status(422).json({
        error: "Ungültige Zeiten (ISO) oder end_time <= start_time",
      });
    }

    // Termin laden
    const { data: appt, error } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("id", appointmentId)
      .single();

    if (error || !appt) {
      return res.status(404).json({ error: "Termin nicht gefunden" });
    }

    // 🔒 A3.3 – nur pending darf verschoben werden
    assertTimeIsMutable(appt.status);

    // Update
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      .eq("id", appointmentId);

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: "Termin erfolgreich verschoben",
    });
  } catch (err) {
    console.error("Reschedule appointment error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

/* =====================================================
   UPDATE APPOINTMENT STATUS (A2 – guarded)
===================================================== */
router.patch("/:id/status", async (req, res) => {
  try {
    const supabase = getSupabase();
    const appointmentId = req.params.id;

    const { status: nextStatus } = req.body || {};
    if (!nextStatus) return res.status(400).json({ error: "status fehlt" });

    const { data: appt, error } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("id", appointmentId)
      .single();

    if (error || !appt) return res.status(404).json({ error: "Termin nicht gefunden" });

    assertStatusIsMutable(appt.status);
    assertValidStatusTransition(appt.status, nextStatus);

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: nextStatus })
      .eq("id", appointmentId);

    if (updateError) throw updateError;

    return res.json({ success: true, from: appt.status, to: nextStatus });
  } catch (err) {
    console.error("Update appointment status error:", err.message);
    return res.status(400).json({ error: err.message });
  }
});

export default router;
