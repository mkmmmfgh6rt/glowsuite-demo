import express from "express";
import {
  getAllBookings,
  getAllEmployees,
  updateBooking,
} from "../../core/db.js";

const router = express.Router();

/* =====================================================
   GET CALENDAR (READ MODEL)
   SQLITE = MASTER (Phase 2)
===================================================== */
router.get("/", async (req, res) => {
  try {
    const tenant = req.query.tenant || null;

    // SQLite ist der Master
    const employees = getAllEmployees(tenant);
    const bookings = getAllBookings();

    const employeeMap = new Map(
      employees.map((e) => [String(e.id), e])
    );

    const events = bookings.map((b) => {
      const emp = b.employeeId
        ? employeeMap.get(String(b.employeeId))
        : null;

      const start = new Date(b.dateTime || b.start_time);
      const end = b.end_time
        ? new Date(b.end_time)
        : new Date(start.getTime() + Number(b.duration || 60) * 60000);

      return {
        id: String(b.id),
        title: `${b.name || b.customer_name || "Kunde"} – ${b.service || "Termin"}`,
        start: start.toISOString(),
        end: end.toISOString(),
        status: b.status || "confirmed",

        employeeId: b.employeeId || b.employee_id || null,
        employeeName: emp?.name || "Beliebig",
        employeeColor: emp?.color || null,

        phone: b.phone || null,
        price: b.price || 0,
        duration: Number(b.duration || 60),
      };
    });

    const employeesOut = employees.map((e) => ({
      id: String(e.id),
      name: e.name || "Mitarbeiter/in",
      color: e.color || null,
      active: e.active ?? 1,
    }));

    res.json({
      success: true,
      employees: employeesOut,
      events,
    });
  } catch (err) {
    console.error("❌ /api/calendar:", err.message);
    res.status(500).json({
      success: false,
      error: "Kalender konnte nicht geladen werden",
    });
  }
});

/* =====================================================
   RESCHEDULE – SQLITE
===================================================== */
router.patch("/appointments/:id/reschedule", (req, res) => {
  try {
    const { id } = req.params;
    const { start_time } = req.body || {};

    if (!start_time) {
      return res.status(400).json({
        success: false,
        error: "start_time fehlt",
      });
    }

    const booking = getAllBookings().find((b) => b.id === id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking nicht gefunden",
      });
    }

    const ok = updateBooking(
      id,
      start_time,
      booking.employeeId ?? null,
      booking.duration ?? 60
    );

    if (!ok) {
      return res.status(500).json({
        success: false,
        error: "Update fehlgeschlagen",
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Reschedule:", err.message);
    res.status(500).json({
      success: false,
      error: "Reschedule fehlgeschlagen",
    });
  }
});

/* =====================================================
   UPDATE APPOINTMENT – SQLITE
===================================================== */
router.patch("/appointments/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, duration, employee_id } = req.body || {};

    if (!start_time || !duration) {
      return res.status(400).json({
        success: false,
        error: "start_time oder duration fehlt",
      });
    }

    const booking = getAllBookings().find((b) => b.id === id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking nicht gefunden",
      });
    }

    const ok = updateBooking(
      id,
      start_time,
      employee_id ?? null,
      duration
    );

    if (!ok) {
      return res.status(500).json({
        success: false,
        error: "Update fehlgeschlagen",
      });
    }

    res.json({
      success: true,
      id,
      start_time,
      duration,
      employee_id: employee_id ?? null,
    });
  } catch (err) {
    console.error("❌ Update Appointment:", err.message);
    res.status(500).json({
      success: false,
      error: "Termin-Update fehlgeschlagen",
    });
  }
});

export default router;
