// =======================================================
// 💎 Beauty Agent v10.10 PRO-STABLE (Full Server, E-Mail + PDF+ICS-Anhang)
// - Kompatibel zu admin.js (beide Varianten der Preisliste-Endpoints)
// - To-Do API voll: list/add/toggle/delete/update
// - SMTP-Helper + HTML-Mailtemplate + Mail beim Anlegen einer Buchung
// - Nutzt pdf.js v4.0 (Luxury Spa Edition + PDF + ICS Export)
// - Slots + Doppelbuchungs-Schutz (Server-Seite)
// - Services-Array (Variante B) via utils.loadTenantConfig
// - Option C/B: Twilio WhatsApp-Reminder (24h + 2h vorher) + Bestätigung + PDF/ICS-Link
// =======================================================

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import multer from "multer";
import schedule from "node-schedule";
import twilio from "twilio";
import cors from "cors";
import crypto from "crypto";

import {
  insertBooking,
  getAllBookings,
  deleteBooking,
  updateBooking,
  exportByPhone,
  anonymizeByPhone,
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./core/db.js";

import { createAppointmentPDF } from "./core/pdf.js";
import { authMiddleware } from "./core/auth.js";
import { startWhatsAppBot } from "./bots/whatsapp-bot.js";
import { loadTenantConfig } from "./core/utils.js";
import auraRoutes from "./aura/routes/auraRoutes.js"; 
import calendarRoutes from "./aura/routes/calendarRoutes.js";
import { mirrorEmployeesToSupabase } from "./core/mirrorEmployees.js";
import { mirrorSingleEmployeeToSupabase } from "./core/mirrorSingleEmployeeToSupabase.js";
import { mirrorEmployeeWorkingHoursToSupabase } from "./core/mirrorEmployeeWorkingHoursToSupabase.js";
import { updateAuraMarketingStatus } from "./core/db.js";

import {
  calculateSlotsForEmployee,
  isEmployeeAvailableOnDate,
  verifySlotSignature
} from "./core/availabilityEngine.js";

dotenv.config();

// =======================================================
// ⚙️ INIT
// =======================================================
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "public");
const dataDir = path.join(process.cwd(), "data");
const pdfDir = path.join(publicDir, "pdf");
const icsDir = path.join(publicDir, "ics");
const preislisteDir = path.join(publicDir, "preisliste");

for (const dir of [publicDir, dataDir, pdfDir, icsDir, preislisteDir]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}




// =======================================================
// 🪵 LOGGING
// =======================================================
const logDir = path.join(dataDir, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, "server.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(msg);
}

// =======================================================
// 📲 WHATSAPP REMINDER ENGINE (Twilio – FINAL & STABLE)
// =======================================================

const ENABLE_TWILIO =
  String(process.env.ENABLE_TWILIO_WHATSAPP || "").toLowerCase() === "true";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const TWILIO_WHATSAPP_FROM =
  process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

let twilioClient = null;

if (ENABLE_TWILIO && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    log("✅ Twilio WhatsApp AKTIV");
  } catch (err) {
    console.error("❌ Twilio Init Fehler:", err.message);
  }
} else {
  log("ℹ️ Twilio WhatsApp DEAKTIVIERT");
}

// =======================================================
// 🔧 HELPERS
// =======================================================

function normalizeWhatsAppNumber(phone) {
  if (!phone) return null;
  let p = String(phone).trim().replace(/[\s().-]/g, "");
  if (p.startsWith("whatsapp:")) return p;
  if (p.startsWith("0")) p = "+49" + p.slice(1);
  if (!p.startsWith("+")) p = "+" + p;
  return `whatsapp:${p}`;
}

function formatDEDateTime(iso) {
  const dt = new Date(iso);
  return {
    date: dt.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: dt.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}


// =======================================================
// 📩 TEXT TEMPLATES
// =======================================================

function waTextBookingConfirmation({ name, studioName, service, iso }) {
  const { date, time } = formatDEDateTime(iso);
  return (
    `Hallo ${name || ""} 👋\n\n` +
    `dein Termin bei ${studioName} wurde erfolgreich eingetragen:\n\n` +
    `💅 ${service}\n📅 ${date}\n⏰ ${time}\n\n` +
    `Du erhältst Erinnerungen 24h & 2h vorher.\n\n` +
    `Falls du verhindert bist, gib bitte kurz Bescheid.\n\n` +
    `${studioName}`
  );
}

function waTextReminder24h({ name, studioName, service, iso }) {
  const { date, time } = formatDEDateTime(iso);
  return (
    `Hallo ${name || ""} 👋\n\n` +
    `Erinnerung an deinen Termin morgen bei ${studioName}:\n\n` +
    `💅 ${service}\n📅 ${date}\n⏰ ${time}\n\n` +
    `Wir freuen uns auf dich ✨`
  );
}

function waTextReminder2h({ name, studioName, service, iso }) {
  const { time } = formatDEDateTime(iso);
  return (
    `Hallo ${name || ""} 👋\n\n` +
    `In 2 Stunden beginnt dein Termin bei ${studioName}:\n\n` +
    `💅 ${service}\n⏰ ${time}\n\n` +
    `Bis gleich ✨`
  );
}

// =======================================================
// 📤 SEND FUNCTION
// =======================================================

async function sendWhatsAppReminder(phone, message) {
  if (!twilioClient) return;

  const to = normalizeWhatsAppNumber(phone);
  if (!to) return;

  try {
    const info = await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to,
      body: message,
    });
    log(`📲 WhatsApp gesendet an ${to}: ${info.sid}`);
  } catch (err) {
    console.error("❌ WhatsApp Fehler:", err.message);
  }
}

// =======================================================
// ✅ BOOKING CONFIRMATION
// =======================================================

async function sendWhatsAppBookingConfirmation(booking) {
  if (!twilioClient || !booking?.phone || !booking?.dateTime) return;

  const tenantId = booking.tenant || process.env.TENANT_DEFAULT;
  const cfg = loadTenantConfig(tenantId);
  const studioName = cfg?.branding?.brandName || "Ihr Studio";

  const msg = waTextBookingConfirmation({
    name: booking.name,
    studioName,
    service: booking.service,
    iso: booking.dateTime,
  });

  await sendWhatsAppReminder(booking.phone, msg);
}

// =======================================================
// ⏰ REMINDER SCHEDULER
// =======================================================

function scheduleWhatsAppReminders(booking) {
  if (!twilioClient || !booking?.phone || !booking?.dateTime) return;

  try {
    const start = new Date(booking.dateTime);
    if (isNaN(start.getTime())) return;

    const now = new Date();
    const tenantId = booking.tenant || process.env.TENANT_DEFAULT;
    const cfg = loadTenantConfig(tenantId);
    const studioName = cfg?.branding?.brandName || "Beauty Lounge";

    const msg24 = waTextReminder24h({
      name: booking.name,
      studioName,
      service: booking.service,
      iso: booking.dateTime,
    });

    const msg2 = waTextReminder2h({
      name: booking.name,
      studioName,
      service: booking.service,
      iso: booking.dateTime,
    });

    [
      { offset: 24 * 60 * 60 * 1000, msg: msg24, label: "24h" },
      { offset: 2 * 60 * 60 * 1000, msg: msg2, label: "2h" },
    ].forEach(({ offset, msg, label }) => {
      const runAt = new Date(start.getTime() - offset);
      if (runAt <= now) return;

      schedule.scheduleJob(`wa_${booking.id}_${label}`, () => {
        sendWhatsAppReminder(booking.phone, msg);
      });

      log(`📆 WhatsApp Reminder ${label} geplant (${runAt.toISOString()})`);
    });
  } catch (err) {
    console.error("❌ Reminder Fehler:", err.message);
  }
}

// =======================================================
// 🧪 TEST ENDPOINT
// =======================================================

app.get("/api/whatsapp/test", async (req, res) => {
  if (!twilioClient)
    return res.status(500).json({ success: false, error: "Twilio inaktiv" });

  const to = req.query.to;
  if (!to)
    return res.status(400).json({ success: false, error: "Nummer fehlt" });

  await sendWhatsAppReminder(to, "✅ WhatsApp Test erfolgreich");
  res.json({ success: true });
});


// =======================================================
// 🔒 SECURITY & STATIC
// =======================================================
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.removeHeader("X-Frame-Options");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});

app.use(express.static(publicDir, { maxAge: "1h", etag: true }));


// =======================================================
// 📧 SMTP (mit Helper + Template)
// =======================================================
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });

  transporter.verify((err) => {
    if (err) console.error("❌ SMTP Verify:", err.message);
    else console.log("✅ SMTP verbunden und bereit.");
  });
} else {
  console.warn("⚠️ SMTP nicht konfiguriert – E-Mail Versand deaktiviert.");
}

const FROM_NAME = process.env.FROM_NAME || "Beauty Lounge";
const FROM_EMAIL =
  process.env.FROM_EMAIL || process.env.SMTP_USER || "no-reply@example.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "";

// HTML-Mailtemplate (für Studio-Postfach)
function bookingMailTemplate(booking) {
  const dt = new Date(booking.dateTime);
  const d = dt.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const t = dt.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const price = Number(booking.price || 0).toFixed(2).replace(".", ",");

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#faf7f2;border:1px solid #eee;border-radius:12px;">
    <h2 style="margin:0 0 8px;color:#7c5538;">${FROM_NAME} – Neue Online-Buchung</h2>
    <p style="margin:0 0 16px;color:#666;">Es wurde soeben ein neuer Termin online gebucht:</p>

    <div style="background:#fff;border:1px solid #eee;border-radius:10px;padding:16px;margin-bottom:16px;">
      <p style="margin:0;"><b>Kundin/Kunde:</b> ${booking.name || "Unbekannt"}</p>
      <p style="margin:6px 0;"><b>Telefon:</b> ${booking.phone || "-"}</p>
      <p style="margin:6px 0;"><b>Leistung:</b> ${booking.service}</p>
      <p style="margin:6px 0;"><b>Datum:</b> ${d}</p>
      <p style="margin:6px 0;"><b>Uhrzeit:</b> ${t}</p>
      <p style="margin:6px 0;"><b>Dauer:</b> ${booking.duration || 60} Minuten</p>
      <p style="margin:6px 0;"><b>Preis:</b> ${price} €</p>
      ${
        booking.employee
          ? `<p style="margin:6px 0;"><b>Mitarbeiter/in:</b> ${booking.employee}</p>`
          : ""
      }
    </div>

    <p style="color:#777;margin:0 0 8px;">Die PDF-Bestätigung und ggf. ICS-Datei sind als Anhang beigefügt.</p>
    <p style="color:#999;font-size:12px;">Automatische Nachricht deines Beauty Agent Systems ✨</p>
  </div>`;
}

// SMTP-Helper
async function sendMail({ to, subject, html, attachments = [] }) {
  if (!transporter) throw new Error("SMTP nicht konfiguriert.");
  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  });
  log(`📤 Mail gesendet an ${to}: ${info.messageId}`);
  return info;
}

// Test-Endpoint
app.get("/api/email/test", async (_req, res) => {
  try {
    if (!transporter)
      return res
        .status(500)
        .json({ success: false, error: "SMTP nicht konfiguriert." });

    const info = await sendMail({
      to: ADMIN_EMAIL || FROM_EMAIL,
      subject: "📧 Test-Mail vom Beauty Agent",
      html: "<p>✅ Der E-Mail-Versand funktioniert.</p>",
    });

    res.json({ success: true, id: info.messageId });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});


// =======================================================
// 🧠 TENANT / BRANDING
// =======================================================

const TENANT_DEFAULT = process.env.TENANT_DEFAULT || "beauty_lounge";

// 🔥 Auto-Execution Schwelle (Assisted Mode)
// Wenn Confidence >= Wert → darf automatisch executed werden
const AURA_AUTO_EXECUTE_CONFIDENCE =
  Number(process.env.AURA_AUTO_EXECUTE_CONFIDENCE) || 0.8;

const CONFIG_BASE = path.resolve(".Datein/config/kunden");

function getTenantFromReq(req) {
  return (
    (req.query.tenant || req.headers["x-tenant"] || TENANT_DEFAULT).toString()
  );
}




// =======================================================
// 🌐 FRONTEND ROUTES
// =======================================================
app.get("/", (_req, res) => res.redirect("/widget.html"));
app.get("/admin.html", authMiddleware, (_req, res) =>
  res.sendFile(path.join(publicDir, "admin", "index.html")),
);
app.get("/admin-employees.html", authMiddleware, (_req, res) =>
  res.sendFile(path.join(publicDir, "admin", "employees.html")),
);
app.get("/admin-appointments.html", authMiddleware, (_req, res) =>
  res.sendFile(path.join(publicDir, "admin", "appointments.html")),
);
// 🔥 Neuer geschützter Kalender-Route
app.get("/admin-calendar.html", authMiddleware, (_req, res) =>
  res.sendFile(path.join(publicDir, "admin", "admin-calendar.html")),
);

// =======================================================
// 🎨 BRANDING & SERVICES API
// =======================================================
app.get("/api/branding", authMiddleware, (req, res) => {
  const t = getTenantFromReq(req);
  const { branding } = loadTenantConfig(t);
  res.json({ success: true, tenant: t, branding });
});

app.get("/api/services", authMiddleware, (req, res) => {
  const t = getTenantFromReq(req);
  const { services } = loadTenantConfig(t);
  res.json({ success: true, tenant: t, services });
});

app.get("/api/tenants", authMiddleware, (_req, res) => {
  try {
    if (!fs.existsSync(CONFIG_BASE)) {
      return res.json({ success: true, tenants: [] });
    }
    const tenants = fs
      .readdirSync(CONFIG_BASE)
      .filter((n) => n.endsWith(".json"))
      .map((n) => path.basename(n, ".json"));
    res.json({ success: true, tenants });
  } catch {
    res
      .status(500)
      .json({ success: false, error: "Tenants konnten nicht geladen werden." });
  }
});

app.post("/api/bookings/:id/cancel", authMiddleware, (req, res) => {
  const ok = deleteBooking(req.params.id);
  if (!ok) return res.status(404).json({ success: false });
  log(`🗑️ Termin gelöscht: ${req.params.id}`);
  res.json({ success: true });
});

// --- PDF-Download für eine Buchung (nutzt pdf.js v4) ---
app.get("/api/bookings/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const booking = getAllBookings().find(
      (b) => b.id === req.params.id
    );
    if (!booking) {
      return res.status(404).send("Buchung nicht gefunden.");
    }

    let employeeName = "Beliebig";
    if (booking.employeeId) {
      const emp = getEmployee(booking.employeeId);
      if (emp && emp.name) employeeName = emp.name;
    }

    const result = await createAppointmentPDF({
      ...booking,
      employee: employeeName,
    });

    if (!result || !result.pdfUrl) {
      return res.status(500).send("Fehler bei PDF-Erstellung.");
    }

    res.redirect(result.pdfUrl);
  } catch (err) {
    console.error("❌ /api/bookings/:id/pdf:", err);
    res.status(500).send("Fehler bei PDF-Erstellung.");
  }
});

// =======================================================
// 🌐 PUBLIC / WIDGET – Termin anlegen (MIT PDF + ICS)
// =======================================================
app.post("/api/bookings", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      service,
      price,
      duration,
      date,
      time,
      employeeId,
      tenant,
    } = req.body || {};

    if (!name || !service || !date || !time) {
      return res.status(400).json({
        success: false,
        error: "Pflichtfelder fehlen.",
      });
    }

    const tenantId = tenant || TENANT_DEFAULT;
    const empId = employeeId ? String(employeeId) : null;
    const durMin = Number(duration || 60);
    const iso = toISO(String(date), String(time));

    const booking = {
      id: uuidv4(),
      name: String(name),
      phone: String(phone || ""),
      email: email ? String(email) : null,
      service: String(service),
      price: Number(price || 0),
      duration: durMin,
      dateTime: iso,
      employeeId: empId,
      tenant: tenantId,
      source: "public",
    };

    insertBooking(booking);

    await sendWhatsAppBookingConfirmation(booking);
    scheduleWhatsAppReminders(booking);


    let employeeName = "Beliebig";
    if (empId) {
      const emp = getEmployee(empId);
      if (emp && emp.name) employeeName = emp.name;
    }

    const pdfResult = await createAppointmentPDF({
      ...booking,
      employee: employeeName,
    });

    const attachments = [];

    if (pdfResult?.pdfUrl) {
      const absPdf = path.join(publicDir, pdfResult.pdfUrl.replace(/^\//, ""));
      if (fs.existsSync(absPdf)) {
        attachments.push({ filename: path.basename(absPdf), path: absPdf });
      }
    }

    if (pdfResult?.icsUrl) {
      const absIcs = path.join(publicDir, pdfResult.icsUrl.replace(/^\//, ""));
      if (fs.existsSync(absIcs)) {
        attachments.push({ filename: path.basename(absIcs), path: absIcs });
      }
    }

    if (ADMIN_EMAIL && transporter) {
      await sendMail({
        to: ADMIN_EMAIL,
        subject: `Neuer Online-Termin: ${booking.name} – ${booking.service}`,
        html: bookingMailTemplate({
          ...booking,
          employee: employeeName,
        }),
        attachments,
      });
    }

    res.json({
      success: true,
      booking,
      pdfUrl: pdfResult?.pdfUrl || null,
      icsUrl: pdfResult?.icsUrl || null,
    });
  } catch (err) {
    console.error("❌ /api/bookings [POST]:", err.message);
    res.status(500).json({
      success: false,
      error: "Fehler beim Anlegen des Termins.",
    });
  }
});

// =======================================================
// 📅 BUCHUNGEN API
// =======================================================
app.get("/api/bookings", authMiddleware, (_req, res) => {
  try {
    res.json(getAllBookings());
  } catch (err) {
    log("❌ /api/bookings: " + err);
    res.status(500).json({ success: false });
  }
});

// =======================================================
// 📆 BUCHUNG VERSCHIEBEN – Mitarbeiter bleibt erhalten
// =======================================================
app.post("/api/bookings/:id/move", authMiddleware, (req, res) => {
  const { date, time } = req.body || {};
  if (!date || !time)
    return res.status(400).json({ success: false, error: "Missing date/time" });

  const iso = toISO(date, time);

  // Buchung laden
  const all = getAllBookings();
  const booking = all.find(b => b.id === req.params.id);

  if (!booking)
    return res.status(404).json({ success: false, error: "Booking not found" });

  // Mitarbeiter bleibt gleich
  const empId = booking.employeeId || null;

  const ok = updateBooking(req.params.id, iso, empId);

  if (!ok)
    return res.status(500).json({ success: false, error: "Update failed" });

  log(`📆 Termin verschoben: ${req.params.id} → ${iso} (Mitarbeiter: ${empId})`);
  res.json({ success: true, newDateTime: iso });
});

function toISO(dateInput, timeInput) {
  try {
    if (dateInput.includes(".")) {
      const [dd, mm, yyyy] = dateInput.split(".");
      return new Date(`${yyyy}-${mm}-${dd}T${timeInput}:00`).toISOString();
    }
    return new Date(`${dateInput}T${timeInput}:00`).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

app.post("/api/test-booking", (_req, res) => {
  const now = new Date();

  const booking = {
    id: uuidv4(),
    name: "Testkunde",
    phone: "01511234567",
    service: "Gesichtsbehandlung",
    price: 50.0,
    duration: 60,
    dateTime: now.toISOString(),
    tenant: TENANT_DEFAULT,
    employeeId: null // 🔥 WICHTIG: MUSS REIN, sonst PowerShell-Fehler!
  };

  insertBooking(booking);
  res.json({ success: true, booking });
});

// === ADMIN: Termin manuell anlegen (Dashboard) – ohne Slot-Signatur, aber mit Auth ===
app.post("/api/admin/bookings", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      phone,
      service,
      price,
      duration,
      date,
      time,
      employeeId,
      tenant,
      email,
    } = req.body || {};

    if (!name || !service || !date || !time) {
      return res.status(400).json({
        success: false,
        error: "Pflichtfelder fehlen.",
      });
    }

    const tenantId = tenant || TENANT_DEFAULT;

    const empId = employeeId ? String(employeeId) : null;
    const durMin = Number(duration || 60);

    const iso = toISO(String(date), String(time));

    // === Doppelbuchung verhindern ===
    let buffer = 15;
    if (empId) {
      const emp = getEmployee(empId);
      if (emp && emp.buffer != null) {
        const n = Number(emp.buffer);
        if (Number.isFinite(n)) buffer = n;
      }
    }

    const newStart = new Date(iso).getTime();
    const newEnd = newStart + durMin * 60000;

    if (empId) {
      const bookings = getAllBookings().filter((b) => b.employeeId === empId);
      const hasConflict = bookings.some((b) => {
        const bt = new Date(b.dateTime).getTime();
        const be = bt + (Number(b.duration || 0) + buffer) * 60000;
        return !(newEnd <= bt || newStart >= be);
      });

      if (hasConflict) {
        return res.status(409).json({
          success: false,
          error: "CONFLICT",
          message: "Zeit ist bereits belegt.",
        });
      }
    }

    const booking = {
      id: uuidv4(),
      name: String(name),
      phone: String(phone || ""),
      service: String(service),
      price: Number(price || 0),
      duration: durMin,
      dateTime: iso,
      employeeId: empId,
      tenant: tenantId,
      email: email ? String(email) : null,

      // ✅ Admin-Quelle fest
      source: "admin",
    };

    insertBooking(booking);
    log(`🆕 Admin-Termin angelegt: ${booking.name} (${booking.service})`);

    // Optional: Reminder/Bestätigung nur wenn du willst
    // scheduleWhatsAppReminders(booking);
    // await sendWhatsAppBookingConfirmation(booking);

    // PDF/ICS + Mail ans Studio (gleiches Verhalten wie Public)
    let pdfResult = null;
    try {
      let employeeName = "Beliebig";
      if (empId) {
        const emp = getEmployee(empId);
        if (emp && emp.name) employeeName = emp.name;
      }

      pdfResult = await createAppointmentPDF({
        ...booking,
        employee: employeeName,
      });

      const attachments = [];

      if (pdfResult && pdfResult.pdfUrl) {
        const absPdf = path.join(publicDir, pdfResult.pdfUrl.replace(/^\//, ""));
        if (fs.existsSync(absPdf)) {
          attachments.push({ filename: path.basename(absPdf), path: absPdf });
        }
      }

      if (pdfResult && pdfResult.icsUrl) {
        const absIcs = path.join(publicDir, pdfResult.icsUrl.replace(/^\//, ""));
        if (fs.existsSync(absIcs)) {
          attachments.push({ filename: path.basename(absIcs), path: absIcs });
        }
      }

      const html = bookingMailTemplate({
        ...booking,
        employee: employeeName,
      });

      if (ADMIN_EMAIL && transporter) {
        await sendMail({
          to: ADMIN_EMAIL,
          subject: `Neuer Termin (Admin): ${booking.name} – ${booking.service}`,
          html,
          attachments,
        });
      }
    } catch (mailErr) {
      console.warn("⚠️ Admin Mail-/PDF-/ICS fehlgeschlagen (nicht kritisch):", mailErr.message);
    }

    return res.json({
      success: true,
      booking,
      pdfUrl: pdfResult?.pdfUrl || null,
      icsUrl: pdfResult?.icsUrl || null,
    });
  } catch (err) {
    console.error("❌ /api/admin/bookings [POST]:", err.message);
    return res.status(500).json({ success: false, error: "Fehler beim Anlegen." });
  }
});



// =======================================================
// 🕒 FREIE ZEITEN API – /api/slots (Phase 3.4 – FINAL)
// =======================================================

app.post("/api/slots", (req, res) => {
  try {
    const { employeeId, serviceName, date, tenant } = req.body || {};

    if (!serviceName) {
      return res.status(400).json({
        success: false,
        error: "serviceName fehlt"
      });
    }

    const tenantId = tenant || TENANT_DEFAULT;
    const employees = getAllEmployees(tenantId);
    const targetDate = date ? new Date(date) : new Date();

    const { services } = loadTenantConfig(tenantId);
    const srv = Array.isArray(services)
      ? services.find(s => s?.name === serviceName)
      : services?.[serviceName];

    if (!srv) {
      return res.status(400).json({
        success: false,
        error: "Service nicht gefunden"
      });
    }

    const duration = Number(srv.duration || 60);
    let targetEmp = null;

    if (employeeId && employeeId !== "auto") {
      targetEmp = getEmployee(employeeId);
    } else {
      const candidates = employees.filter(e =>
        isEmployeeAvailableOnDate(e, targetDate)
      );
      targetEmp = candidates[0] || null;
    }

    if (!targetEmp) {
      return res.json({ success: true, slots: [] });
    }

    const rawSlots = calculateSlotsForEmployee({
  emp: targetEmp,
  serviceDuration: duration,
  date: targetDate,
  tenant: tenantId
});

const slots = rawSlots.map(s => ({
  ...s,
  employee: {
    id: targetEmp.id,
    name: targetEmp.name,
    color: targetEmp.color || "#cfa86f"
  }
}));

res.json({ success: true, slots });


  } catch (err) {
    console.error("❌ /api/slots:", err);
    res.status(500).json({
      success: false,
      error: "Serverfehler"
    });
  }
});


// =======================================================
// 🗂️ PREISLISTE – Upload & Status & Redirect
// =======================================================
const uploadMem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const allowedExt = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];

const storageDisk = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, preislisteDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    let out = "preisliste.pdf";
    if (ext === ".png") out = "preisliste.png";
    if (ext === ".jpg" || ext === ".jpeg") out = "preisliste.jpg";
    if (ext === ".docx") out = "preisliste.docx";
    cb(null, out);
  },
});

const uploadDisk = multer({
  storage: storageDisk,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(
      null,
      allowedExt.includes(path.extname(file.originalname).toLowerCase()),
    ),
});

// optional: falls du später auf Disk-Storage wechseln willst – aktuell nutzen wir uploadMem

function cleanupOldPreislisteFiles() {
  const files = fs
    .readdirSync(preislisteDir)
    .filter((f) => /^preisliste\.(pdf|png|jpg|jpeg|docx)$/i.test(f));
  for (const f of files) {
    try {
      fs.unlinkSync(path.join(preislisteDir, f));
    } catch {
      /* ignore */
    }
  }
}

function getCurrentPreisliste() {
  const candidates = [
    "preisliste.pdf",
    "preisliste.jpg",
    "preisliste.png",
    "preisliste.docx",
  ];
  return (
    candidates.find((f) =>
      fs.existsSync(path.join(preislisteDir, f)),
    ) || null
  );
}

app.post(
  "/api/preisliste/upload",
  authMiddleware,
  uploadMem.single("file"),
  (req, res) => {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, error: "Keine Datei erhalten." });

      const mime = req.file.mimetype;
      let targetName = null;
      const map = {
        "application/pdf": "preisliste.pdf",
        "image/jpeg": "preisliste.jpg",
        "image/png": "preisliste.png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          "preisliste.docx",
        "application/msword": "preisliste.docx",
      };
      targetName = map[mime];

      if (!targetName && req.file.originalname) {
        const ext = String(req.file.originalname)
          .toLowerCase()
          .split(".")
          .pop();
        if (["pdf", "png", "jpg", "jpeg", "docx"].includes(ext)) {
          targetName = `preisliste.${ext === "jpeg" ? "jpg" : ext}`;
        }
      }
      if (!targetName) {
        return res.status(415).json({
          success: false,
          error: "Nicht unterstütztes Format. Erlaubt: PDF, JPG, PNG, DOCX.",
        });
      }

      cleanupOldPreislisteFiles();
      fs.writeFileSync(
        path.join(preislisteDir, targetName),
        req.file.buffer,
      );
      const url = `/preisliste/${targetName}`;
      log(`📤 Preisliste aktualisiert: ${url}`);
      res.json({
        success: true,
        url,
        savedAs: targetName,
        name: req.file.originalname,
      });
    } catch (e) {
      console.error("❌ /api/preisliste/upload:", e.message);
      res
        .status(500)
        .json({ success: false, error: "Upload fehlgeschlagen." });
    }
  },
);

// alternative Route (alte URL)
app.post(
  "/api/upload-preisliste",
  authMiddleware,
  uploadMem.single("file"),
  (req, res) => {
    req.url = "/api/preisliste/upload";
    app._router.handle(req, res);
  },
);

app.get("/api/preisliste/info", authMiddleware, (_req, res) => {
  try {
    const f = getCurrentPreisliste();
    if (!f) return res.json({ success: true, found: false });
    const stat = fs.statSync(path.join(preislisteDir, f));
    res.json({
      success: true,
      found: true,
      name: f,
      url: `/preisliste/${f}`,
      size: stat.size,
      updatedAt: stat.mtime,
    });
  } catch (e) {
    console.error("❌ /api/preisliste/info:", e.message);
    res.status(500).json({
      success: false,
      error: "Fehler beim Prüfen der Preisliste.",
    });
  }
});

app.get("/api/preisliste/status", authMiddleware, (_req, res) => {
  try {
    const f = getCurrentPreisliste();
    if (!f) return res.json({ success: true, exists: false });
    return res.json({
      success: true,
      exists: true,
      file: f,
      url: `/preisliste/${f}`,
    });
  } catch (e) {
    console.error("❌ /api/preisliste/status:", e.message);
    res.status(500).json({
      success: false,
      error: "Status konnte nicht ermittelt werden.",
    });
  }
});

app.get("/preisliste/current", (req, res) => {
  const f = getCurrentPreisliste();
  if (!f) return res.status(404).send("Keine Preisliste gefunden.");
  return res.redirect(`/preisliste/${f}`);
});

app.head("/preisliste/current", (req, res) => {
  const f = getCurrentPreisliste();
  if (!f) return res.sendStatus(404);
  return res.sendStatus(200);
});

// =======================================================
// 🔒 DSGVO – Export & Anonymisieren
// =======================================================
app.post("/api/gdpr/export", authMiddleware, (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone)
      return res
        .status(400)
        .json({ success: false, error: "phone fehlt" });
    const data = exportByPhone(phone);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("❌ /api/gdpr/export:", err.message);
    return res
      .status(500)
      .json({ success: false, error: "Fehler beim Export" });
  }
});

app.post("/api/gdpr/anonymize", authMiddleware, (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone)
      return res
        .status(400)
        .json({ success: false, error: "phone fehlt" });
    const ok = anonymizeByPhone(phone);
    return res.json({ success: ok });
  } catch (err) {
    console.error("❌ /api/gdpr/anonymize:", err.message);
    return res.status(500).json({
      success: false,
      error: "Fehler beim Anonymisieren",
    });
  }
});

// =======================================================
// ✅ TO-DO API
// =======================================================
const todoPath = path.join(dataDir, "todos.json");
if (!fs.existsSync(todoPath))
  fs.writeFileSync(todoPath, JSON.stringify([], null, 2));

function readTodos() {
  try {
    return JSON.parse(fs.readFileSync(todoPath, "utf8"));
  } catch {
    return [];
  }
}
function writeTodos(list) {
  fs.writeFileSync(todoPath, JSON.stringify(list, null, 2));
}

app.get("/api/todos", authMiddleware, (_req, res) => {
  try {
    res.json({ success: true, data: readTodos() });
  } catch {
    res.status(500).json({
      success: false,
      error: "Fehler beim Laden der Aufgaben.",
    });
  }
});

app.post("/api/todos", authMiddleware, (req, res) => {
  try {
    const todos = readTodos();
    const todo = {
      id: uuidv4(),
      title: String(req.body.title || "Unbenannte Aufgabe"),
      due_at: req.body.due_at || null,
      priority: Number(req.body.priority || 0),
      done: false,
    };
    todos.push(todo);
    writeTodos(todos);
    log(`📝 To-Do angelegt: ${todo.title} (${todo.id})`);
    res.json({ success: true, data: todo });
  } catch {
    res.status(500).json({
      success: false,
      error: "Fehler beim Speichern.",
    });
  }
});

app.post("/api/todos/:id/toggle", authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const { done } = req.body || {};
    const todos = readTodos();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, error: "Nicht gefunden." });
    todos[idx].done = !!done;
    writeTodos(todos);
    log(`✅ To-Do ${done ? "erledigt" : "reaktiviert"}: ${id}`);
    res.json({ success: true, data: todos[idx] });
  } catch {
    res.status(500).json({
      success: false,
      error: "Fehler beim Aktualisieren.",
    });
  }
});

app.delete("/api/todos/:id", authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const todos = readTodos();
    const next = todos.filter((t) => t.id !== id);
    if (next.length === todos.length)
      return res
        .status(404)
        .json({ success: false, error: "Nicht gefunden." });
    writeTodos(next);
    log(`🗑️ To-Do gelöscht: ${id}`);
    res.json({ success: true });
  } catch {
    res.status(500).json({
      success: false,
      error: "Fehler beim Löschen.",
    });
  }
});

app.put("/api/todos/:id", authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const todos = readTodos();
    const idx = todos.findIndex((t) => t.id === id);
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, error: "Nicht gefunden." });
    const cur = todos[idx];
    todos[idx] = {
      ...cur,
      title: req.body.title ?? cur.title,
      due_at: req.body.due_at ?? cur.due_at,
      priority:
        req.body.priority !== undefined
          ? Number(req.body.priority)
          : cur.priority,
      done:
        req.body.done !== undefined ? !!req.body.done : cur.done,
    };
    writeTodos(todos);
    res.json({ success: true, data: todos[idx] });
  } catch {
    res.status(500).json({
      success: false,
      error: "Fehler beim Update.",
    });
  }
});

// =======================================================
// 📊 DASHBOARD API
// =======================================================
app.get("/api/dashboard", authMiddleware, (_req, res) => {
  try {
    const all = getAllBookings();
    const since30 = new Date(Date.now() - 30 * 864e5);
    const month = all.filter(
      (b) => new Date(b.dateTime) >= since30,
    );
    const total = all.length;
    const revenue = month.reduce(
      (sum, b) => sum + (+b.price || 0),
      0,
    );
    const avg = month.length ? revenue / month.length : 0;
    const active = new Set(all.map((b) => b.phone)).size;
    const load = ((month.length / 30) * 100).toFixed(1);
    const byService = {};
    month.forEach((b) => {
      if (b.service) byService[b.service] = (byService[b.service] || 0) + 1;
    });
    const top5 = Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.json({
      success: true,
      data: { total, revenue, avg, active, load, top5 },
    });
  } catch (err) {
    console.error("❌ /api/dashboard:", err.message);
    res.status(500).json({
      success: false,
      error: "Fehler beim Dashboard.",
    });
  }
});

// 🎨 Mitarbeiter-Farbpalette (stabil & UI-tauglich)
const EMPLOYEE_COLORS = [
  "#cfa86f", // Gold (Brand / Default)
  "#64b5f6", // Soft Blue
  "#7986cb", // Indigo
  "#9575cd", // Lavender / Soft Purple
  "#ba68c8", // Lila
  "#f48fb1", // Rosé
  "#ffb74d", // Warmes Orange
  "#ffcc80", // Soft Apricot
  "#a1887f", // Taupe
  "#90a4ae", // Blue Grey
  "#b0bec5", // Cool Grey
  "#ffd54f", // Soft Yellow (warm, nicht Warnfarbe)
];


function getNextEmployeeColor(tenant) {
  const used = getAllEmployees(tenant)
    .map(e => (e.color || "").trim().toLowerCase())
    .filter(Boolean);

  for (const c of EMPLOYEE_COLORS) {
    if (!used.includes(c.toLowerCase())) {
      return c;
    }
  }

  // Fallback (Rotation)
  return EMPLOYEE_COLORS[used.length % EMPLOYEE_COLORS.length];
}


// =======================================================
// 👥 MITARBEITER API
// =======================================================

function normalizeEmployeePayload(b = {}, existing = {}) {
  const toStr = (v) =>
    v !== undefined && v !== null && v !== "" ? String(v) : null;

  const toInt = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const to01 = (v, fallback = 1) => {
    if (v === undefined || v === null || v === "") return fallback;
    return v == 1 || v === "1" || v === true || v === "true" ? 1 : 0;
  };

  const toDateStr = (v) => (!v ? null : String(v));

  const currentTenant = existing.tenant ?? TENANT_DEFAULT;

return {
  id: toStr(b.id ?? existing.id),
  name: toStr(b.name) ?? existing.name,
  role: toStr(b.role ?? existing.role),
  email: toStr(b.email ?? existing.email),
  phone: toStr(b.phone ?? existing.phone),
  work_start: toStr(b.work_start ?? existing.work_start) || "09:00",
  work_end: toStr(b.work_end ?? existing.work_end) || "18:00",
  days: toStr(b.days ?? existing.days ?? "Mo,Di,Mi,Do,Fr"),
  buffer: toInt(b.buffer ?? existing.buffer ?? 15, 15),
  active: to01(b.active ?? existing.active ?? 1, 1),
  sick_until: toDateStr(b.sick_until ?? existing.sick_until),
  vacation_start: toDateStr(b.vacation_start ?? existing.vacation_start),
  vacation_end: toDateStr(b.vacation_end ?? existing.vacation_end),
  tenant: toStr(b.tenant ?? existing.tenant) || TENANT_DEFAULT,
  color: toStr(b.color ?? existing.color),
  };
}

// =======================================================
// 👥 Employees Unified – STABILER FALLBACK
// =======================================================
async function getEmployeesUnified(tenant) {
  return getAllEmployees(tenant).map(e => ({
    ...e,
    source: "sqlite",
  }));
}

// =======================================================
// 🔹 GET – alle Mitarbeiter
// =======================================================
app.get("/api/employees", authMiddleware, async (req, res) => {
  try {
    const tenant = req.query.tenant || TENANT_DEFAULT;
    const data = await getEmployeesUnified(tenant);
    res.json({ success: true, data });
  } catch (err) {
    log("❌ /api/employees [GET]: " + err.message);
    res.status(500).json({ error: "Fehler" });
  }
});

// =======================================================
// 🔹 GET – einzelner Mitarbeiter
// =======================================================
app.get("/api/employees/:id", authMiddleware, async (req, res) => {
  try {
    const emp = getEmployee(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
    }
    res.json({ success: true, data: emp });
  } catch (err) {
    log("❌ /api/employees/:id [GET]: " + err.message);
    res.status(500).json({ error: "Fehler" });
  }
});

// =======================================================
// ➕ POST – Mitarbeiter anlegen (NEU, mit Auto-Farbe)
// =======================================================
app.post("/api/employees", authMiddleware, (req, res) => {
  try {
    const payload = normalizeEmployeePayload(req.body, {});
    payload.id = crypto.randomUUID();

    if (!payload.name) {
      return res.status(400).json({ error: "Name fehlt" });
    }

    // 🎨 Auto-Farbe NUR wenn keine vorhanden ist
    if (!payload.color) {
      payload.color = getNextEmployeeColor(payload.tenant);
    }

    const ok = createEmployee(payload);
    if (!ok) {
      return res.status(500).json({ error: "Anlegen fehlgeschlagen" });
    }

    res.json({ success: true, data: payload });
  } catch (err) {
    log("❌ /api/employees [POST]: " + err.message);
    res.status(500).json({ error: "Fehler" });
  }
});


// =======================================================
// ✏️ PUT – Mitarbeiter aktualisieren
// =======================================================
app.put("/api/employees/:id", authMiddleware, (req, res) => {
  try {
    const existing = getEmployee(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
    }

    const payload = normalizeEmployeePayload(req.body, existing);
    payload.id = req.params.id;

    const ok = updateEmployee(payload);
    if (!ok) {
      return res.status(500).json({ error: "Update fehlgeschlagen" });
    }

    res.json({ success: true });
  } catch (err) {
    log("❌ /api/employees/:id [PUT]: " + err.message);
    res.status(500).json({ error: "Fehler" });
  }
});

// =======================================================
// 🗑️ DELETE – Mitarbeiter löschen
// =======================================================
app.delete("/api/employees/:id", authMiddleware, (req, res) => {
  try {
    const ok = deleteEmployee(req.params.id);
    if (!ok) {
      return res.status(404).json({ error: "Mitarbeiter nicht gefunden" });
    }
    res.json({ success: true });
  } catch (err) {
    log("❌ /api/employees/:id [DELETE]: " + err.message);
    res.status(500).json({ error: "Fehler" });
  }
});


// =======================================================
// 🚀 SERVER START
// =======================================================
const PORT = process.env.PORT || 8083;

// Railway liefert je nach Setup oft eine dieser Variablen.
// (Wenn keine vorhanden ist, fallback auf localhost)
const RAILWAY_URL =
  process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : process.env.RAILWAY_STATIC_URL || process.env.PUBLIC_URL;

const BASE = process.env.BASE_URL || RAILWAY_URL || `http://localhost:${PORT}`;


    
// =======================================================
// 🌍 CORS – WICHTIG (Frontend läuft auf :3000)
// =======================================================
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// statische HTML Dateien aus /public ausliefern
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("admin/index.html", { root: "public" });
});

// =======================================================
// 📣 AURA MARKETING – Approve Action (Phase 6.6.2)
// =======================================================

app.post("/api/aura/marketing/approve", authMiddleware, (req, res) => {
  try {
    const { id, approved_by } = req.body || {};

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Action ID ist erforderlich",
      });
    }

    const updated = updateAuraMarketingAction(id, {
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: approved_by || "admin",
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Action nicht gefunden",
      });
    }

    console.log("✅ AURA Marketing Action genehmigt:", updated);

    // =======================================================
    // 🚀 AUTO EXECUTE (wenn Confidence hoch genug)
    // =======================================================

    if (
      typeof updated.confidence === "number" &&
      updated.confidence >= AURA_AUTO_EXECUTE_CONFIDENCE
    ) {
      const executed = updateAuraMarketingAction(updated.id, {
        status: "executed",
        executed_at: new Date().toISOString(),
      });

      console.log("🚀 AURA Auto-Executed:", executed);

      return res.json({
        success: true,
        entry: executed,
        auto_executed: true,
      });
    }

    // Standard-Fall (kein Auto-Execute)
    res.json({
      success: true,
      entry: updated,
      auto_executed: false,
    });

  } catch (err) {
    console.error("❌ AURA Approve API Fehler:", err);
    res.status(500).json({
      success: false,
      error: "Genehmigung fehlgeschlagen",
    });
  }
});



// =======================================================
// 🤖 A.U.R.A KI-Agent API
// =======================================================
app.use("/api/aura", auraRoutes);
app.use("/api/calendar", calendarRoutes);


// =======================================================
// ▶️ LISTEN
// =======================================================
app.listen(PORT, "0.0.0.0", () => {
  const t = TENANT_DEFAULT;
  const cfg = loadTenantConfig(t);

  console.log("=====================================");
  console.log(`🌐 Startseite:   ${BASE}`);
  console.log(`🔐 Admin:        ${BASE}/admin.html`);
  console.log(`👥 Mitarbeiter:  ${BASE}/admin-employees.html`);
  console.log(`🗓️ Termine:      ${BASE}/admin-appointments.html`);
  console.log(`📆 Kalender:     ${BASE}/admin-calendar.html`);
  console.log(`📄 Preisliste:   ${BASE}/preisliste/current`);
  console.log(`📧 Mail-Test:    ${BASE}/api/email/test`);
  console.log(`📱 WhatsApp-Test:${BASE}/api/whatsapp/test?to=DEINE_NUMMER`);
  console.log(`✅ Tenant:       ${t}`);
  console.log(`🎨 Brand:        ${cfg.branding.brandName || "Beauty Lounge"}`);
  console.log(
    `💅 Services:     ${
      Array.isArray(cfg.services) ? cfg.services.length : 0
    } geladen`
  );
  console.log("=====================================");

 // =======================================================
// PHASE 2 – Initial Mirror (SQLite → Supabase)
// einmalig, asynchron, best-effort
// =======================================================
setTimeout(() => {
  try {
    const studioId = "f3bcd2bf-89c3-4891-b01c-ef1693df674c";

    mirrorEmployeesToSupabase(studioId);
    mirrorEmployeeWorkingHoursToSupabase(studioId);

  } catch (err) {
    console.warn("⚠️ Initial mirror failed:", err.message);
  }
}, 2000);

  // =====================================================
  // WhatsApp Bot
  // =====================================================
  if (String(process.env.ENABLE_WHATSAPP).toLowerCase() === "true") {
    try {
      console.log("📱 Starte WhatsApp Bot …");
      startWhatsAppBot();
    } catch (err) {
      log("❌ WhatsApp Bot Fehler: " + err);
    }
  }
});