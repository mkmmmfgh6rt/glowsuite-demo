import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();
let supabase = null;

/* ===========================
   SUPABASE INIT
=========================== */
function getSupabase() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase ENV fehlt");
    }

    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

/* ===========================
   HELPERS
=========================== */
function buildDateTime(dateStr, timeStr) {
  const [h, m, s] = String(timeStr).split(":").map(Number);
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h || 0, m || 0, s || 0, 0);
  return d;
}

function isWorkingDay(dateStr, workingDays) {
  if (!workingDays) return true;

  const day = new Date(`${dateStr}T00:00:00`).getDay(); // 0 = Sonntag
  if (day === 0) return false;

  const norm = workingDays.trim().toUpperCase();
  if (norm === "MO-FR") return day >= 1 && day <= 5;
  if (norm === "MO-SA") return day >= 1 && day <= 6;

  return true;
}

/* ===========================
   GET AVAILABILITY (A3.12 + A3.13)
   /api/availability?studio_id=...&date=YYYY-MM-DD&duration=60
=========================== */
router.get("/", async (req, res) => {
  try {
    const { studio_id, date, duration } = req.query;

    if (!studio_id || !date || !duration) {
      return res.status(400).json({
        error: "studio_id, date und duration sind erforderlich",
      });
    }

    const slotMinutes = Number(duration);
    if (!Number.isFinite(slotMinutes) || slotMinutes <= 0) {
      return res.status(400).json({ error: "duration muss > 0 sein" });
    }

    const supabase = getSupabase();

    /* ========= 1) EMPLOYEES ========= */
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select(
        "id, work_start, work_end, buffer_minutes, working_days, active"
      )
      .eq("studio_id", studio_id)
      .eq("active", true);

    if (empError) throw empError;
    if (!employees || employees.length === 0) return res.json([]);

    /* ========= 2) APPOINTMENTS (DAY) ========= */
    const dayStart = `${date}T00:00:00`;
    const dayEnd = `${date}T23:59:59`;

    const { data: appointments, error: appError } = await supabase
      .from("appointments")
      .select("employee_id, start_time, end_time, status")
      .eq("studio_id", studio_id)
      .gte("start_time", dayStart)
      .lte("end_time", dayEnd);

    if (appError) throw appError;

    const apptsByEmployee = new Map();
    for (const a of appointments || []) {
      if (a.status === "cancelled") continue;

      if (!apptsByEmployee.has(a.employee_id)) {
        apptsByEmployee.set(a.employee_id, []);
      }
      apptsByEmployee.get(a.employee_id).push({
        start: new Date(a.start_time),
        end: new Date(a.end_time),
      });
    }

    /* ========= 3) SLOT BERECHNUNG (SMART BUFFER) ========= */
    const slotsByEmployee = new Map();

    for (const emp of employees) {
      if (
        !emp.work_start ||
        !emp.work_end ||
        !isWorkingDay(date, emp.working_days)
      ) {
        continue;
      }

      const buffer = emp.buffer_minutes || 0;
      let cursor = buildDateTime(date, emp.work_start);
      const workEnd = buildDateTime(date, emp.work_end);

      const empAppts = (apptsByEmployee.get(emp.id) || []).sort(
        (a, b) => a.start - b.start
      );

      while (cursor < workEnd) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(
          slotStart.getTime() + slotMinutes * 60000
        );

        if (slotEnd > workEnd) break;

        const overlapping = empAppts.find(
          (a) => slotStart < a.end && slotEnd > a.start
        );

        if (overlapping) {
          cursor = new Date(
            overlapping.end.getTime() + buffer * 60000
          );
          continue;
        }

        if (!slotsByEmployee.has(emp.id)) {
          slotsByEmployee.set(emp.id, []);
        }

        slotsByEmployee.get(emp.id).push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });

        cursor = slotEnd;
      }
    }

    /* ========= 4) RESPONSE (A3.13 – FRONTEND READY) ========= */
    const response = Array.from(slotsByEmployee.entries()).map(
      ([employee_id, slots]) => ({
        employee_id,
        slots,
      })
    );

    return res.json(response);
  } catch (err) {
    console.error("Availability error:", err.message);
    return res.status(500).json({
      error: "Verfügbarkeit konnte nicht berechnet werden",
    });
  }
});

export default router;
