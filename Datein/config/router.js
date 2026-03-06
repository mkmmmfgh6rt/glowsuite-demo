// router.js
import { Router } from "express";
import { runAgent } from "./agent.js";
import { authMiddleware } from "./auth.js";
import { getAllBookings, deleteBookingByPhone, updateBookingDate } from "./db.js";

const router = Router();

// In-memory Session-Kontexte
const sessions = new Map();

function genSessionId() {
  return "s_" + Math.random().toString(36).slice(2, 10);
}

// =======================
// ✅ Chat-Endpunkt (offen für Kunden)
// =======================
router.post("/chat", async (req, res) => {
  try {
    const { message, channel = "web" } = req.body || {};
    if (!message) return res.status(400).json({ error: "message is required" });

    let sessionId = req.headers["x-session-id"] || req.body.sessionId;
    if (!sessionId) {
      sessionId = genSessionId();
      sessions.set(sessionId, []);
    }
    if (!sessions.has(sessionId)) sessions.set(sessionId, []);

    const context = sessions.get(sessionId);

    // Historie speichern
    context.push({ role: "user", content: message });

    // Agent ausführen
    const result = await runAgent({
      message,
      sender: sessionId,
      sessionId,
      channel
    });

    const reply = result?.reply || "Entschuldigung, keine Antwort möglich.";
    context.push({ role: "assistant", content: reply });
    sessions.set(sessionId, context);

    res.json({ reply, sessionId, data: result?.data || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Agent error" });
  }
});

// =======================
// ✅ Admin-API (Login nötig)
// =======================

// Alle Buchungen abrufen
router.get("/api/bookings", authMiddleware, (req, res) => {
  try {
    const bookings = getAllBookings();
    res.json(bookings);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// Termin stornieren (per Telefon-Nummer)
router.delete("/api/bookings/:phone", authMiddleware, (req, res) => {
  try {
    const { phone } = req.params;
    const success = deleteBookingByPhone(phone);
    if (!success) {
      return res.status(404).json({ error: "Kein Termin gefunden" });
    }
    res.json({ status: "ok", message: "Termin gelöscht" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

// Termin verschieben
router.put("/api/bookings/:phone", authMiddleware, (req, res) => {
  try {
    const { phone } = req.params;
    const { newDate } = req.body;
    if (!newDate) {
      return res.status(400).json({ error: "newDate erforderlich" });
    }

    const success = updateBookingDate(phone, newDate);
    if (!success) {
      return res.status(404).json({ error: "Kein Termin gefunden" });
    }

    res.json({
      status: "ok",
      message: `Termin verschoben auf ${new Date(newDate).toLocaleString("de-DE")}`
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
