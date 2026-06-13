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
import Stripe from "stripe";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import multer from "multer";
import schedule from "node-schedule";
import twilio from "twilio";
import cors from "cors";
import crypto from "crypto";
import { logEvent } from "./core/db.js";
import sharp from "sharp";


import {
  isReviewSent,
  markReviewSent,
  insertBooking,
  getAllBookings,
  deleteBooking,
  getBookingByDate,
  updateBooking,
  exportByPhone,
  anonymizeByPhone,
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "./core/db.js";

import { createBooking } from "./core/booking.js";

import { createAppointmentPDF } from "./core/pdf.js";
import { authMiddleware } from "./core/auth.js";
import { loadTenantConfig } from "./core/utils.js";
import auraRoutes from "./aura/routes/auraRoutes.js";
import calendarRoutes from "./aura/routes/calendarRoutes.js";
import { mirrorEmployeesToSupabase } from "./core/mirrorEmployees.js";
import { mirrorSingleEmployeeToSupabase } from "./core/mirrorSingleEmployeeToSupabase.js";
import { mirrorEmployeeWorkingHoursToSupabase } from "./core/mirrorEmployeeWorkingHoursToSupabase.js";
import { updateAuraMarketingStatus } from "./core/db.js";
import { addVisit } from "./Datein/src/loyalty/loyaltyEngine.js";
import loyaltyApi from "./Datein/src/loyalty/loyaltyApi.js";
import { runRebookingCheck } from "./Datein/src/rebooking/rebookingEngine.js";
import { runAuraDailyMonitor } from "./core/auraDailyMonitorService.js";
import { runAuraBusinessOptimizer } from "./core/auraBusinessOptimizerService.js";
import { generateAuraRecommendations } from "./core/auraRecommendationEngine.js";
import { executeAuraCampaign } from "./core/auraCampaignExecutor.js";

import serviceMatchRoute from "./aura/routes/serviceMatchRoute.js";
import beautyChatRoute from "./aura/routes/beautyChatRoute.js";
import aiBookingRoute from "./aura/routes/aiBookingRoute.js";

import {
  calculateSlotsForEmployee,
  isEmployeeAvailableOnDate,
  verifySlotSignature
} from "./core/availabilityEngine.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 TRACKING: fertige Buchungen (für WhatsApp Stop)
const completedBookings = new Set();

// =======================================================
// ⚙️ INIT
// =======================================================
const app = express();
app.use("/api", loyaltyApi);

const upload = multer({
  dest: "public/uploads/"
});

// ❗ WICHTIG:
// express.json() wird später geladen,
// damit Stripe Webhooks den RAW Body bekommen

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("public/uploads"));

// =======================================================
// 🔥 SERVICES API (ZENTRALE QUELLE)
// =======================================================

// 🔹 Service erstellen
app.post("/api/services", upload.single("image"), async (req, res) => {
  try {
    let { name, category, price, duration, description, aliases } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name fehlt" });
    }

    name = name.trim();
    category = category ? category.trim() : "Allgemein";

    let imagePath = "";

    if (req.file) {
      const filename = "service_" + Date.now() + ".jpg";
      const outputPath = "public/uploads/" + filename;

      await sharp(req.file.path)
        .resize(300, 300)
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      fs.unlinkSync(req.file.path);
      imagePath = "/uploads/" + filename;
    }

    const newService = {
      name,
      category,
      price: Number(price) || 0,
      duration: Number(duration) || 0,
      description: description || "",

      // 🔥 Neu: optionale Aliases pro Studio / Service
      aliases: aliases
        ? String(aliases)
          .split(",")
          .map(a => a.trim())
          .filter(Boolean)
        : [],

      image: imagePath
    };

    const filePath = "./Datein/config/kunden/beauty_lounge.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // 🔥 Safety
    if (!Array.isArray(data.categories)) {
      data.categories = [];
    }

    if (!Array.isArray(data.services)) {
      data.services = [];
    }

    // 🔥 Kategorie speichern ohne Duplikate
    if (category && !data.categories.includes(category)) {
      data.categories.push(category);
    }

    data.services.push(newService);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Fehler beim Speichern:", err);
    return res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
});

// 🔹 Service löschen
app.delete("/api/services/:name", (req, res) => {
  try {
    const name = req.params.name;

    const filePath = "./Datein/config/kunden/beauty_lounge.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    data.services = data.services.filter(s => s.name !== name);

    // 🔥 Kategorien sauber halten
    const usedCategories = new Set(
      data.services.map(s => s.category).filter(Boolean)
    );

    data.categories = (data.categories || []).filter(cat =>
      usedCategories.has(cat)
    );

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Fehler beim Löschen:", err);
    res.status(500).json({ error: "Löschen fehlgeschlagen" });
  }
});


// 🔹 Kategorien laden
app.get("/api/categories", (req, res) => {
  try {
    const filePath = "./Datein/config/kunden/beauty_lounge.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    res.json(data.categories || []);

  } catch (err) {
    console.error("❌ Fehler beim Laden der Kategorien:", err);
    res.status(500).json({ error: "Fehler beim Laden" });
  }
});


// 🔹 Service bearbeiten
app.put("/api/services/:name", upload.single("image"), async (req, res) => {
  try {
    const oldName = req.params.name;

    let { name, category, price, duration, description } = req.body;

    name = name ? name.trim() : null;
    category = category ? category.trim() : null;

    const filePath = "./Datein/config/kunden/beauty_lounge.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!data.categories) {
      data.categories = [];
    }

    let imagePath = null;

    if (req.file) {
      const filename = "service_" + Date.now() + ".jpg";
      const outputPath = "public/uploads/" + filename;

      await sharp(req.file.path)
        .resize(300, 300)
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      fs.unlinkSync(req.file.path);
      imagePath = "/uploads/" + filename;
    }

    const service = data.services.find(s => s.name === oldName);

    if (!service) {
      return res.status(404).json({ error: "Service nicht gefunden" });
    }

    // 🔥 UPDATE
    if (name) service.name = name;
    if (category) service.category = category;
    if (price) service.price = Number(price);
    if (duration) service.duration = Number(duration);
    if (description !== undefined) service.description = description;

    if (imagePath) {
      service.image = imagePath;
    }

    // 🔥 Kategorie speichern
    if (service.category && !data.categories.includes(service.category)) {
      data.categories.push(service.category);
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true });

  } catch (err) {
    console.error("❌ Update Fehler:", err);
    res.status(500).json({ error: "Update fehlgeschlagen" });
  }
});

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
// 🔁 WHATSAPP REAKTIVIERUNG (Abgebrochene Buchung)
// =======================================================
app.post("/api/abandoned-booking", async (req, res) => {
  try {

    const { name, phone, service, date, time } = req.body;

    // ❌ keine Nummer
    if (!phone) {
      return res.json({ success: false });
    }

    // 🛑 STOP: Kunde hat bereits gebucht (SOFORT)
    if (completedBookings.has(phone)) {
      console.log("🛑 Kunde hat bereits gebucht:", phone);
      return res.json({ success: false });
    }

    console.log("⚠️ Abgebrochene Buchung erkannt:", name, phone);

    // 🔥 Reaktivierung senden (nach Delay)
    setTimeout(async () => {

      // 🛑 STOP wenn Kunde inzwischen gebucht hat
      if (completedBookings.has(phone)) {
        console.log("🛑 Kunde hat bereits gebucht → KEINE WhatsApp:", phone);
        return;
      }

      try {

        // 🔥 HIGH CONVERSION MESSAGE
        const msg =
          `Hey ${name || ""} 👋\n\n` +

          `du warst gerade kurz davor deinen Termin zu sichern ✨\n\n` +

          (service ? `💅 *${service}*\n` : "") +
          (date ? `📅 ${date}\n` : "") +
          (time ? `⏰ ${time}\n` : "") +

          `\nIch habe dir den Termin kurz freigehalten.\n\n` +

          `👉 Hier kannst du ihn direkt abschließen:\n` +
          `${BASE}\n\n` +

          `Sichere ihn dir, bevor er vergeben ist 💛`;

        await sendWhatsAppReminder(phone, msg);

        console.log("📲 Reaktivierung gesendet an:", phone);

      } catch (err) {
        console.error("❌ Reaktivierung Fehler:", err.message);
      }

    }, 1 * 60 * 1000); // ⏱️ aktuell 1 Minute (Testmodus)

    res.json({ success: true });

  } catch (err) {
    console.error("❌ abandoned-booking error:", err);
    res.status(500).json({ success: false });
  }
});


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

function waTextReviewRequest({ name, studioName, reviewUrl }) {
  return `Hallo ${name} 😊

vielen Dank für deinen Besuch bei *${studioName}*.

Wir hoffen, du bist mit deinem Termin zufrieden und fühlst dich wohl mit dem Ergebnis ✨

Falls du kurz 30 Sekunden Zeit hast, würden wir uns riesig über eine Bewertung freuen:

⭐ ${reviewUrl}

Dein Feedback hilft uns sehr und unterstützt unser Studio.

Vielen Dank und bis bald 💛
${studioName}`;
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

function scheduleReviewReminder(booking, reviewUrl) {
  if (!booking?.phone) return;

  // ⭐ Schutz: Bewertung schon gesendet?
  if (isReviewSent(booking.id)) {
    console.log("⭐ Review bereits gesendet:", booking.id);
    return;
  }

  const bookingTime = new Date(booking.dateTime).getTime();
  const delay = bookingTime + (3 * 60 * 60 * 1000) - Date.now();
  console.log("⭐ Review Reminder geplant:", delay, "ms");

  if (delay <= 0) return;

  setTimeout(async () => {
    try {
      const text = waTextReviewRequest({
        name: booking.name,
        studioName: booking.tenant || "Ihr Studio",
        reviewUrl
      });

      await sendWhatsAppReminder(booking.phone, text);

      // ⭐ Nach Versand speichern
      markReviewSent(booking.id);

      console.log("⭐ Review Reminder gesendet:", booking.id);

    } catch (err) {
      console.error("❌ Review Reminder Fehler:", err.message);
    }
  }, delay);
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
// 📥 WHATSAPP INCOMING
// =======================================================

const sessions = {};
const abandonedWhatsappSessions = new Map();

// ---- Helpers ----
function getTenantServices(tenant = TENANT_DEFAULT) {
  const cfg = loadTenantConfig(tenant);
  return Array.isArray(cfg?.services) ? cfg.services : [];
}


function groupServicesByCategory(services = []) {
  const grouped = {};

  for (const service of services) {
    const category = service.category || "Allgemein";

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(service);
  }

  return grouped;
}

// 🔥 FEHLTEN → JETZT DRIN
function buildCategoryMenu(services) {
  if (!services.length) {
    return "Aktuell sind keine Behandlungen verfügbar.";
  }

  const grouped = groupServicesByCategory(services);
  const categories = Object.keys(grouped);

  let message = "Welche Kategorie möchtest du buchen?\n\n";

  categories.forEach((category, i) => {
    message += `${i + 1}️⃣ ${category}\n`;
  });

  return message;
}

// 🔥 FEHLTEN → JETZT DRIN
function buildServiceMenu(services, categoryName = "Behandlung") {
  if (!services.length) {
    return "Aktuell sind keine Behandlungen verfügbar.";
  }

  const lines = services.map((s, i) => `${i + 1}️⃣ ${s.name}`);
  return `Welche ${categoryName}-Behandlung möchtest du?\n\n${lines.join("\n")}`;
}

// =======================================================
// 🔥 Deutsches Datum sicher parsen (FIX: ohne Jahr + Zukunft)
// =======================================================
function parseGermanDate(input) {
  if (!input) return null;

  const now = new Date();
  const str = String(input).trim();

  // ✅ erkennt:
  // 24.04
  // 24.4
  // 24.04.2026
  const match = str.match(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\b/);

  if (!match) return null;

  let day = parseInt(match[1], 10);
  let month = parseInt(match[2], 10) - 1; // JS Monate 0-11

  // 👉 Jahr bestimmen
  let year = match[3] ? parseInt(match[3], 10) : now.getFullYear();

  let date = new Date(year, month, day);

  // 🔥 WICHTIG:
  // Wenn KEIN Jahr angegeben wurde und Datum in der Vergangenheit liegt → nächstes Jahr
  if (!match[3] && date < now) {
    date.setFullYear(year + 1);
  }

  // 👉 Format YYYY-MM-DD
  const isoDay = String(date.getDate()).padStart(2, "0");
  const isoMonth = String(date.getMonth() + 1).padStart(2, "0");
  const isoYear = date.getFullYear();

  return `${isoYear}-${isoMonth}-${isoDay}`;
}


function parseBookingIntent(message, services, employees) {
  const normalize = (str) =>
    String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const levenshtein = (a, b) => {
    a = String(a || "");
    b = String(b || "");

    const matrix = Array.from({ length: b.length + 1 }, () =>
      Array(a.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    return matrix[b.length][a.length];
  };

  const fuzzyMatchService = (inputMessage, serviceList = []) => {
    const cleanMsg = normalize(inputMessage);

    let bestMatch = null;
    let bestScore = 999;

    for (const service of serviceList) {
      const serviceName = normalize(service.name);

      // 🔥 Aliases laden (optional)
      const aliases = Array.isArray(service.aliases)
        ? service.aliases.map(a => normalize(a))
        : [];

      // ===================================================
      // 🔥 Exakter Service Name
      // ===================================================
      if (cleanMsg.includes(serviceName)) {
        return service;
      }

      // ===================================================
      // 🔥 Exakte Aliases
      // ===================================================
      for (const alias of aliases) {
        if (cleanMsg.includes(alias)) {
          return service;
        }
      }

      const words = cleanMsg.split(/\s+/);

      // ===================================================
      // 🔥 Fuzzy auf Service Name
      // ===================================================
      for (const word of words) {
        const score = levenshtein(word, serviceName);

        if (score < bestScore) {
          bestScore = score;
          bestMatch = service;
        }
      }

      // ===================================================
      // 🔥 Fuzzy auf Aliases
      // ===================================================
      for (const alias of aliases) {
        for (const word of words) {
          const score = levenshtein(word, alias);

          if (score < bestScore) {
            bestScore = score;
            bestMatch = service;
          }
        }
      }
    }

    // 🔥 nur sichere Treffer
    if (bestMatch && bestScore <= 3) {
      return bestMatch;
    }

    return null;
  };

  const msg = normalize(message);

  const result = {
    service: null,
    category: null,
    employee: null,
    date: null,
    time: null
  };

  // =======================================================
  // 🔥 Service erkennen (EXAKT + FUZZY)
  // =======================================================
  const fuzzyService = fuzzyMatchService(message, services);

  if (fuzzyService) {
    result.service = fuzzyService;
  }

  // =======================================================
  // 🔥 Kategorie erkennen (sauber: Kategorie ≠ Service)
  // =======================================================
  if (!result.service) {
    const categories = [...new Set(
      services.map(s => s.category).filter(Boolean)
    )];


    // ===================================================
    // ✅ Nur echte Service Namen / Aliases direkt matchen
    // ===================================================
    for (const service of services) {
      const serviceName = normalize(service.name);

      if (msg.includes(serviceName)) {
        result.service = service;
        result.category = service.category; // 🔥 DAS IST DER FIX
        break;
      }

      const aliases = Array.isArray(service.aliases)
        ? service.aliases.map(a => normalize(a))
        : [];

      const aliasMatched = aliases.some(alias =>
        msg.includes(alias)
      );

      if (aliasMatched) {
        result.service = service;
        result.category = service.category; // 🔥 AUCH HIER
        break;
      }
    }

    // ===================================================
    // ✅ Nur Kategorie erkennen, NICHT Service erzwingen
    // ===================================================
    if (!result.service) {
      for (const category of categories) {
        const cat = normalize(category);

        const matchesSynonym = false;

        if (
          msg.includes(cat) ||
          msg.includes(cat.replace("ä", "a")) ||
          msg.includes(cat.replace("ö", "o")) ||
          msg.includes(cat.replace("ü", "u")) ||
          matchesSynonym
        ) {
          result.category = category;
          break;
        }
      }
    }
  }

  // =======================================================
  // 🔥 Mitarbeiter erkennen
  // =======================================================
  for (const e of employees) {
    if (msg.includes(normalize(e.name))) {
      result.employee = e;
      break;
    }
  }

  // =======================================================
  // 🔥 Datum: heute / morgen / übermorgen
  // =======================================================
  if (msg.includes("heute")) {
    result.date = new Date().toISOString().slice(0, 10);
  }

  if (msg.includes("morgen")) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    result.date = d.toISOString().slice(0, 10);
  }

  if (msg.includes("ubermorgen") || msg.includes("übermorgen")) {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    result.date = d.toISOString().slice(0, 10);
  }

  // =======================================================
  // 🔥 Wochentage erkennen
  // =======================================================
  const weekdays = {
    montag: 1,
    dienstag: 2,
    mittwoch: 3,
    donnerstag: 4,
    freitag: 5,
    samstag: 6,
    sonntag: 0
  };

  for (const [dayName, targetDay] of Object.entries(weekdays)) {
    if (msg.includes(dayName)) {
      const today = new Date();
      const currentDay = today.getDay();

      let diff = targetDay - currentDay;

      if (diff <= 0) {
        diff += 7;
      }

      today.setDate(today.getDate() + diff);
      result.date = today.toISOString().slice(0, 10);

      break;
    }
  }

  // =======================================================
  // 🔥 Deutsches Datum erkennen: 24.06 / 24.06.2026
  // =======================================================
  const parsedGermanDate = parseGermanDate(message);

  if (parsedGermanDate) {
    result.date = parsedGermanDate;
  }

  // =======================================================
  // 🔥 Uhrzeit erkennen (sauber, kein Datum-Bug)
  // =======================================================
  const timeMatch =
    message.match(/\b(\d{1,2}):(\d{2})\b/) ||
    message.match(/\b(\d{1,2})\s*uhr\b/i);

  if (timeMatch) {
    const hour = String(timeMatch[1]).padStart(2, "0");
    const minute = timeMatch[2]
      ? String(timeMatch[2]).padStart(2, "0")
      : "00";

    result.time = `${hour}:${minute}`;
  }

  return result;
}


app.post("/api/whatsapp/incoming", async (req, res) => {
  try {
    const rawMessage = req.body.Body || "";
    const message = rawMessage.toLowerCase().trim();
    const from = req.body.From;

    if (!from) {
      return res.sendStatus(200);
    }

    // 🔥 RESET LOGIK (NEU)
    const msg = message;

    if (
      msg === "hey" ||
      msg === "hallo" ||
      msg === "hi" ||
      msg === "start" ||
      msg === "menu"
    ) {
      sessions[from] = {
        step: "menu"
      };

      const reply =
        "Hallo 👋\n\n" +
        "Wie kann ich dir helfen?\n\n" +
        "1️⃣ Termin buchen\n" +
        "2️⃣ Preise\n" +
        "3️⃣ Öffnungszeiten";

      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: from,
        body: reply,
      });

      return res.sendStatus(200);
    }

    // =======================================================
    // 🚫 STORNO AUSWAHL (Mehrere Termine)
    // =======================================================

    if (sessions[from]?.step === "cancel_selection") {

      const selection = Number(message);

      const options = sessions[from].cancelOptions || [];

      const booking = options[selection - 1];

      if (!booking) {

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: from,
          body:
            "Bitte antworte mit der Nummer des Termins, den du stornieren möchtest."
        });

        return res.sendStatus(200);
      }

      const success = deleteBooking(booking.id);

      if (!success) {

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: from,
          body:
            "Der Termin konnte leider nicht storniert werden."
        });

        delete sessions[from];

        return res.sendStatus(200);
      }

      completedBookings.delete(
        from.replace("whatsapp:", "")
      );

      abandonedWhatsappSessions.delete(from);

      delete sessions[from];

      await twilioClient.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: from,
        body:
          "✅ Dein Termin wurde erfolgreich storniert.\n\n" +
          "Der Platz wurde wieder freigegeben.\n\n" +
          "Falls du einen neuen Termin möchtest:\n" +
          "1️⃣ Termin buchen"
      });

      console.log("🚫 Termin storniert:", booking.id);

      return res.sendStatus(200);
    }

    // =======================================================
    // 🚫 GLOBAL STORNO
    // =======================================================

    if (
      message.includes("storno") ||
      message.includes("absagen") ||
      message.includes("termin absagen")
    ) {

      try {

        const phone = from.replace("whatsapp:", "");

        const upcoming = getAllBookings()
          .filter(b =>
            String(b.phone || "").replace(/\s+/g, "") ===
            String(phone).replace(/\s+/g, "")
          )
          .filter(b => b.status !== "cancelled")
          .filter(b => new Date(b.dateTime).getTime() > Date.now())
          .sort((a, b) =>
            new Date(a.dateTime) - new Date(b.dateTime)
          );

        if (upcoming.length === 1) {

          const booking = upcoming[0];

          const ok = deleteBooking(booking.id);

          if (!ok) {

            await twilioClient.messages.create({
              from: TWILIO_WHATSAPP_FROM,
              to: from,
              body:
                "Der Termin konnte leider nicht storniert werden."
            });

            return res.sendStatus(200);
          }

          completedBookings.delete(phone);
          abandonedWhatsappSessions.delete(from);
          delete sessions[from];

          await twilioClient.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: from,
            body:
              "✅ Dein Termin wurde erfolgreich storniert.\n\n" +
              "Der Platz wurde wieder freigegeben.\n\n" +
              "Falls du einen neuen Termin möchtest:\n" +
              "1️⃣ Termin buchen"
          });

          console.log("🚫 Termin storniert:", booking.id);

          return res.sendStatus(200);
        }

        if (upcoming.length > 1) {

          sessions[from] = {
            step: "cancel_selection",
            cancelOptions: upcoming
          };

          const lines = upcoming
            .map((b, i) => {

              const dt = new Date(b.dateTime);

              const date = dt.toLocaleDateString("de-DE");

              const time = dt.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit"
              });

              return `${i + 1}️⃣ ${b.service}\n📅 ${date} um ${time}`;

            })
            .join("\n\n");

          await twilioClient.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: from,
            body:
              "Ich habe mehrere zukünftige Termine gefunden.\n\n" +
              "Welchen Termin möchtest du stornieren?\n\n" +
              lines +
              "\n\nBitte antworte mit der entsprechenden Nummer."
          });

          return res.sendStatus(200);
        }

        const ok = deleteBooking(booking.id);

        if (!ok) {

          await twilioClient.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: from,
            body:
              "Der Termin konnte leider nicht storniert werden."
          });

          return res.sendStatus(200);
        }

        // 🔥 Cleanup
        completedBookings.delete(phone);
        abandonedWhatsappSessions.delete(from);
        delete sessions[from];

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: from,
          body:
            "✅ Dein Termin wurde erfolgreich storniert.\n\n" +
            "Der Platz wurde wieder freigegeben.\n\n" +
            "Falls du einen neuen Termin möchtest:\n" +
            "1️⃣ Termin buchen"
        });

        console.log("🚫 Termin storniert:", booking.id);

        return res.sendStatus(200);

      } catch (err) {

        console.error("❌ STORNO FEHLER:", err.message);

        return res.sendStatus(500);
      }
    }

    // 🔁 SESSION INIT
    if (!sessions[from]) {
      sessions[from] = { step: "menu" };
    }

    const session = sessions[from];
    let reply = "";

    // =======================================================
    // 🔥 Abbruch-Tracking NUR starten (nicht resetten)
    // =======================================================
    if (session.step !== "menu") {
      abandonedWhatsappSessions.set(from, {
        phone: from.replace("whatsapp:", ""),
        step: session.step,
        service: session.service || null,
        date: session.selectedDate || null,
        time: session.selectedSlot?.time || null,
        lastActivity: Date.now()
      });
    }

    // =======================================================
    // 🔥 MENU START / AI FLOW
    // =======================================================
    if (session.step === "menu") {

      const services = getTenantServices(TENANT_DEFAULT);
      const employees = getAllEmployees(TENANT_DEFAULT) || [];

      const ai = parseBookingIntent(message, services, employees);

      // =======================================================
      // 🔥 Kategorie erkannt → direkt Service-Auswahl
      // =======================================================
      if (ai.category && !ai.service) {
        const grouped = groupServicesByCategory(services);

        session.services = services;
        session.groupedServices = grouped;
        session.category = ai.category;
        session.categoryServices = grouped[ai.category] || [];
        session.step = "service";

        reply = buildServiceMenu(session.categoryServices, ai.category);

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: from,
          body: reply,
        });

        return res.sendStatus(200);
      }

      // =======================================================
      // 🔥 Service erkannt → Schnellflow starten
      // =======================================================
      if (ai.service) {

        session.service = ai.service.name;
        session.duration = Number(ai.service.duration || 60);
        session.aiFlow = true;

        if (ai.employee) {
          session.employee = ai.employee;
          session.employee_id = ai.employee.id;
        }

        if (ai.date) {
          session.selectedDate = ai.date;
        }

        if (ai.time) {
          session.aiTime = ai.time;
        }

        const serviceKey = (session.service || "").toLowerCase().trim();
        const cfg = loadTenantConfig(TENANT_DEFAULT);

        let upsell = (cfg.upsells || {})[serviceKey];

        if (!upsell && cfg.defaultUpsells) {
          upsell = cfg.defaultUpsells[
            Math.floor(Math.random() * cfg.defaultUpsells.length)
          ];
        }


        // 🔥 DEBUG
        console.log("SERVICE:", session.service);
        console.log("KEY:", serviceKey);
        console.log("UPSELL:", upsell);


        // =======================================================
        // 🔥 Upsell zuerst
        // =======================================================
        if (upsell && !session.upsellDone) {

          session.upsell = upsell;
          session.step = "upsell_offer";
          session.upsellDone = true;

          reply =
            `✨ Empfehlung\n\n` +
            `Viele Kundinnen kombinieren das direkt mit:\n\n` +
            `${upsell}\n\n` +
            `👉 spart Zeit & sieht gepflegter aus\n\n` +
            `Möchtest du das dazu?\n\n` +
            `1️⃣ Ja hinzufügen\n` +
            `2️⃣ Nein weiter`;


          await twilioClient.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: from,
            body: reply,
          });

          return res.sendStatus(200);
        }

        // =======================================================
        // 🔥 Mitarbeiter fehlt
        // =======================================================
        if (!session.employee) {

          if (!employees.length) {
            reply = "Aktuell sind keine Mitarbeiter verfügbar.";
            session.step = "menu";
          } else {
            session.employees = employees;
            session.step = "employee_pick";

            const employeeLines = employees
              .map((e, i) => `${i + 1}️⃣ ${e.name}`)
              .join("\n");

            reply =
              `Super 👍 ${session.service}\n\n` +
              `Welcher Mitarbeiter?\n\n` +
              employeeLines;
          }

          await twilioClient.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: from,
            body: reply,
          });

          return res.sendStatus(200);
        }

        // =======================================================
        // 🔥 Datum fehlt
        // =======================================================
        if (!session.selectedDate) {
          session.step = "date_pick";

          reply =
            "Bitte wähle ein Datum:\n\n" +
            "1️⃣ Heute\n" +
            "2️⃣ Morgen\n" +
            "3️⃣ Übermorgen\n\n" +
            "oder schreibe ein Datum:\n" +
            "z.B. 15.03.2026";

          await twilioClient.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: from,
            body: reply,
          });

          return res.sendStatus(200);
        }

        // =======================================================
        // 🔥 Alles erkannt → direkt Slot prüfen
        // =======================================================
        const slots = calculateSlotsForEmployee({
          emp: session.employee,
          serviceDuration: session.duration,
          date: session.selectedDate,
          tenant: TENANT_DEFAULT,
        });

        if (!slots.length) {
          reply = "Leider sind an diesem Tag keine Termine frei.";
          session.step = "menu";

          await twilioClient.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: from,
            body: reply,
          });

          return res.sendStatus(200);
        }

        let matchedSlot = null;

        if (session.aiTime) {
          // ✅ exakte Zeit
          matchedSlot = slots.find(s => s.time === session.aiTime);

          // ✅ fallback → gleiche Stunde
          if (!matchedSlot) {
            const hour = session.aiTime.split(":")[0].padStart(2, "0");

            matchedSlot = slots.find(s =>
              s.time.startsWith(hour)
            );
          }
        }

        if (matchedSlot) {
          session.selectedSlot = matchedSlot;

          const serviceKey = (session.service || "").toLowerCase().trim();
          const cfg = loadTenantConfig(TENANT_DEFAULT);

          let upsell = (cfg.upsells || {})[serviceKey];

          if (!upsell && cfg.defaultUpsells) {
            upsell = cfg.defaultUpsells[
              Math.floor(Math.random() * cfg.defaultUpsells.length)
            ];
          }

          if (upsell && !session.upsellDone) {

            session.upsell = upsell;
            session.upsellDone = true;
            session.step = "upsell_offer";

            reply =
              `✨ Empfehlung\n\n` +
              `Viele Kundinnen kombinieren das direkt mit:\n\n` +
              `${upsell}\n\n` +
              `👉 spart Zeit & sieht gepflegter aus\n\n` +
              `Möchtest du das dazu?\n\n` +
              `1️⃣ Ja hinzufügen\n` +
              `2️⃣ Nein weiter`;

          } else {

            session.step = "ask_name";

            reply =
              `Perfekt 👌\n\n` +
              `${session.service}\n` +
              `${session.selectedDate} um ${matchedSlot.time}\n\n` +
              `Wie heißt du?`;
          }


        } else {
          session.slots = slots.slice(0, 5);
          session.step = "slot_pick";

          const slotLines = session.slots
            .map((s, i) => `${i + 1}️⃣ ${s.time}`)
            .join("\n");

          reply =
            `📅 ${session.selectedDate}\n\n` +
            `Diese Uhrzeiten sind frei:\n\n${slotLines}`;
        }

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: from,
          body: reply,
        });

        return res.sendStatus(200);
      }

      // =======================================================
      // 🔥 Normales Menü
      // =======================================================
      reply =
        "Hallo und willkommen bei GlowSuite.\n\n" +
        "Wie kann ich dir helfen?\n\n" +
        "1️⃣ Termin buchen\n" +
        "2️⃣ Preise\n" +
        "3️⃣ Öffnungszeiten";



      // =======================================================
      // 🔥 NORMALER ZAHLEN FLOW (BLEIBT WIE ER IST)
      // =======================================================
      if (message === "1" || message.includes("termin")) {
        const grouped = groupServicesByCategory(services);
        const categories = Object.keys(grouped);

        session.services = services;
        session.groupedServices = grouped;
        session.categories = categories;

        let matchedCategory = categories.find(c =>
          message.includes(c.toLowerCase())
        );

        if (matchedCategory) {
          session.category = matchedCategory;
          session.categoryServices = grouped[matchedCategory];
          session.step = "service";

          reply = buildServiceMenu(session.categoryServices, matchedCategory);
        } else {
          session.step = "category_pick";
          reply = buildCategoryMenu(services);
        }

      } else if (message === "2" || message.includes("preis")) {

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: from,
          body: "Hier ist unsere aktuelle Preisliste:",
          mediaUrl: [`${BASE}/preisliste/current`],
        });

        return res.sendStatus(200);

      } else if (message === "3" || message.includes("öff")) {

        reply =
          "Unsere Öffnungszeiten\n\n" +
          "Montag – Freitag\n09:00 – 18:00\n\n" +
          "Samstag\n09:00 – 14:00\n\n" +
          "1️⃣ Termin buchen";

      } else {

        reply =
          "Hallo und willkommen bei GlowSuite.\n\n" +
          "Wie kann ich dir helfen?\n\n" +
          "1️⃣ Termin buchen\n" +
          "2️⃣ Preise\n" +
          "3️⃣ Öffnungszeiten";
      }
    }

    else if (session.step === "category_pick") {
      const categories = session.categories || [];

      let selectedCategory = categories[Number(message) - 1];

      if (!selectedCategory) {
        selectedCategory = categories.find(c =>
          c.toLowerCase().includes(message)
        );
      }

      if (!selectedCategory) {
        reply = buildCategoryMenu(session.services || []);
      } else {
        session.category = selectedCategory;
        session.categoryServices = session.groupedServices?.[selectedCategory] || [];
        session.step = "service";

        reply = buildServiceMenu(session.categoryServices, selectedCategory);
      }
    }

    else if (session.step === "service") {
      const services = session.categoryServices || [];

      let selected = services[Number(message) - 1];

      if (!selected) {
        selected = services.find(s =>
          s.name.toLowerCase().includes(message)
        );
      }

      if (!selected) {
        reply = buildServiceMenu(services, session.category || "Behandlung");
      } else {
        session.service = selected.name;
        session.duration = Number(selected.duration || 60);
        session.upsell = null;
        session.upsellSelected = null;

        const serviceKey = (session.service || "").toLowerCase().trim();
        const cfg = loadTenantConfig(TENANT_DEFAULT);

        let upsell = (cfg.upsells || {})[serviceKey];

        if (!upsell && cfg.defaultUpsells) {
          upsell = cfg.defaultUpsells[
            Math.floor(Math.random() * cfg.defaultUpsells.length)
          ];
        }

        if (upsell && !session.upsellDone) {
          session.upsell = upsell;
          session.step = "upsell_offer";
          session.upsellDone = true;

          reply =
            `✨ Empfehlung\n\n` +
            `Viele Kundinnen kombinieren das direkt mit:\n\n` +
            `${upsell}\n\n` +
            `👉 spart Zeit & sieht gepflegter aus\n\n` +
            `Möchtest du das dazu?\n\n` +
            `1️⃣ Ja hinzufügen\n` +
            `2️⃣ Nein weiter`;

        } else {
          const employees = getAllEmployees(TENANT_DEFAULT) || [];

          if (!employees.length) {
            reply = "Aktuell sind keine Mitarbeiter verfügbar.";
            session.step = "menu";
          } else {
            session.employees = employees;
            session.step = "employee_pick";

            const employeeLines = employees
              .map((e, i) => `${i + 1}️⃣ ${e.name}`)
              .join("\n");

            reply =
              `Super 👍 ${session.service}\n\n` +
              `Welcher Mitarbeiter?\n\n` +
              employeeLines;
          }
        }
      }
    }

    else if (session.step === "upsell_offer") {
      if (message === "1") {
        session.upsellSelected = session.upsell;
      } else {
        session.upsellSelected = null;
      }

      const employees = getAllEmployees(TENANT_DEFAULT) || [];


      // =======================================================
      // 🔥 AI FLOW: Mitarbeiter schon erkannt
      // =======================================================
      if (session.aiFlow && session.employee && session.selectedDate) {

        const slots = calculateSlotsForEmployee({
          emp: session.employee,
          serviceDuration: session.duration,
          date: session.selectedDate,
          tenant: TENANT_DEFAULT,
        });

        if (!slots.length) {
          reply = "Leider sind an diesem Tag keine Termine frei.";
          session.step = "menu";

        } else {

          let matchedSlot = null;

          if (session.aiTime) {

            // ✅ exakte Zeit
            matchedSlot = slots.find(s => s.time === session.aiTime);

            // ✅ fallback → gleiche Stunde
            if (!matchedSlot) {
              const hour = session.aiTime.split(":")[0].padStart(2, "0");

              matchedSlot = slots.find(s =>
                s.time.startsWith(hour)
              );
            }
          }


          if (matchedSlot) {
            session.selectedSlot = matchedSlot;

            const serviceKey = (session.service || "").toLowerCase().trim();
            const cfg = loadTenantConfig(TENANT_DEFAULT);

            let upsell = (cfg.upsells || {})[serviceKey];

            if (!upsell && cfg.defaultUpsells) {
              upsell = cfg.defaultUpsells[
                Math.floor(Math.random() * cfg.defaultUpsells.length)
              ];
            }

            console.log("🔥 SERVICE:", session.service);
            console.log("🔥 UPSELL:", upsell);

            if (upsell && !session.upsellDone) {

              session.upsell = upsell;
              session.upsellDone = true;
              session.step = "upsell_offer";

              reply =
                `✨ Empfehlung\n\n` +
                `Viele Kundinnen kombinieren das direkt mit:\n\n` +
                `${upsell}\n\n` +
                `👉 spart Zeit & sieht gepflegter aus\n\n` +
                `Möchtest du das dazu?\n\n` +
                `1️⃣ Ja hinzufügen\n` +
                `2️⃣ Nein weiter`;

            } else {

              session.step = "ask_name";

              reply =
                `Perfekt 👌\n\n` +
                `${session.service}\n` +
                `${session.selectedDate} um ${matchedSlot.time}\n\n` +
                `Wie heißt du?`;
            }

          } else {

            session.slots = slots.slice(0, 5);
            session.step = "slot_pick";

            const slotLines = session.slots
              .map((s, i) => `${i + 1}️⃣ ${s.time}`)
              .join("\n");

            reply =
              `Diese Uhrzeiten sind frei:\n\n${slotLines}`;
          }
        }

      }

      // =======================================================
      // 🔥 Mitarbeiter fehlt → normal fragen
      // =======================================================
      else if (!session.employee) {

        if (!employees.length) {
          reply = "Aktuell sind keine Mitarbeiter verfügbar.";
          session.step = "menu";

        } else {

          session.employees = employees;
          session.step = "employee_pick";

          const employeeLines = employees
            .map((e, i) => `${i + 1}️⃣ ${e.name}`)
            .join("\n");

          reply =
            `Super 👍 ${session.service}\n\n` +
            `Welcher Mitarbeiter?\n\n` +
            employeeLines;
        }

      }

      // =======================================================
      // 🔥 Mitarbeiter da, aber Datum fehlt
      // =======================================================
      else {

        session.step = "date_pick";

        reply =
          "Bitte wähle ein Datum:\n\n" +
          "1️⃣ Heute\n" +
          "2️⃣ Morgen\n" +
          "3️⃣ Übermorgen\n\n" +
          "oder schreibe ein Datum:\n" +
          "z.B. 15.03.2026";
      }
    }


    else if (session.step === "employee_pick") {
      const employees = session.employees || [];

      let emp = employees[Number(message) - 1];

      if (!emp) {
        emp = employees.find(e =>
          e.name.toLowerCase().includes(message)
        );
      }

      if (!emp) {
        const employeeLines = employees
          .map((e, i) => `${i + 1}️⃣ ${e.name}`)
          .join("\n");

        reply =
          "Bitte wähle einen Mitarbeiter.\n\n" +
          employeeLines;

      } else {
        session.employee = emp;
        session.employee_id = emp.id;

        // 🔥 Falls Datum aus AI-Flow schon vorhanden ist
        if (session.selectedDate) {
          const slots = calculateSlotsForEmployee({
            emp: session.employee,
            serviceDuration: session.duration,
            date: session.selectedDate,
            tenant: TENANT_DEFAULT,
          });

          if (!slots.length) {
            reply = "Leider sind an diesem Tag keine Termine frei.";
            session.step = "menu";

          } else if (session.aiTime) {
            let matchedSlot = slots.find(s => s.time === session.aiTime);

            if (!matchedSlot) {
              matchedSlot = slots.find(s =>
                s.time.startsWith(session.aiTime.slice(0, 2))
              );
            }

            if (matchedSlot) {
              session.selectedSlot = matchedSlot;
              session.step = "ask_name";

              reply =
                `Perfekt 👌\n\n` +
                `${session.service}\n` +
                `${session.selectedDate} um ${matchedSlot.time}\n\n` +
                `Wie heißt du?`;

            } else {
              session.slots = slots.slice(0, 5);
              session.step = "slot_pick";

              const slotLines = session.slots
                .map((s, i) => `${i + 1}️⃣ ${s.time}`)
                .join("\n");

              reply =
                `📅 ${session.selectedDate}\n\n` +
                `Die Uhrzeit ${session.aiTime} ist leider nicht frei.\n\n` +
                "Diese Uhrzeiten sind frei:\n\n" +
                slotLines;
            }

          } else {
            session.slots = slots.slice(0, 5);
            session.step = "slot_pick";

            const slotLines = session.slots
              .map((s, i) => `${i + 1}️⃣ ${s.time}`)
              .join("\n");

            reply =
              `📅 ${session.selectedDate}\n\n` +
              "Diese Uhrzeiten sind frei:\n\n" +
              slotLines;
          }

        } else {
          session.step = "date_pick";

          reply =
            "Bitte wähle ein Datum:\n\n" +
            "1️⃣ Heute\n" +
            "2️⃣ Morgen\n" +
            "3️⃣ Übermorgen\n\n" +
            "oder schreibe ein Datum:\n" +
            "z.B. 15.03.2026";
        }
      }
    }

    else if (session.step === "date_pick") {
      let dateStr = null;
      const rawDateInput = rawMessage.trim();

      let wishedTime = null;

      const timeMatch =
        rawDateInput.match(/\b(\d{1,2}):(\d{2})\b/) ||
        rawDateInput.match(/\b(\d{1,2})\s*uhr\b/i);

      if (timeMatch) {
        const hour = String(timeMatch[1]).padStart(2, "0");
        const minute = timeMatch[2]
          ? String(timeMatch[2]).padStart(2, "0")
          : "00";

        wishedTime = `${hour}:${minute}`;
        session.aiTime = wishedTime;
      }

      if (message === "1" || message.includes("heute")) {
        dateStr = new Date().toISOString().slice(0, 10);
      }
      else if (message === "2" || message.includes("morgen")) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        dateStr = d.toISOString().slice(0, 10);
      }
      else if (message === "3" || message.includes("übermorgen")) {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        dateStr = d.toISOString().slice(0, 10);
      }
      else {
        dateStr = parseGermanDate(rawDateInput);
      }

      if (!dateStr) {
        reply =
          "Bitte Datum eingeben:\n" +
          "z.B. 15.03.2026";
      } else {
        const slots = calculateSlotsForEmployee({
          emp: session.employee,
          serviceDuration: session.duration,
          date: dateStr,
          tenant: TENANT_DEFAULT,
        });

        if (!slots.length) {
          reply = "Leider sind aktuell keine Termine verfügbar.";
        } else {
          session.selectedDate = dateStr;

          if (wishedTime) {
            let matchedSlot = slots.find(s => s.time === wishedTime);

            if (!matchedSlot) {
              matchedSlot = slots.find(s =>
                s.time.startsWith(wishedTime.slice(0, 2))
              );
            }

            if (matchedSlot) {
              session.selectedSlot = matchedSlot;

              const serviceKey = (session.service || "").toLowerCase().trim();
              const cfg = loadTenantConfig(TENANT_DEFAULT);

              let upsell = (cfg.upsells || {})[serviceKey];

              if (!upsell && cfg.defaultUpsells) {
                upsell = cfg.defaultUpsells[
                  Math.floor(Math.random() * cfg.defaultUpsells.length)
                ];
              }

              if (upsell && !session.upsellDone) {

                session.upsell = upsell;
                session.upsellDone = true;
                session.step = "upsell_offer";

                reply =
                  `✨ Empfehlung\n\n` +
                  `Viele Kundinnen kombinieren das direkt mit:\n\n` +
                  `${upsell}\n\n` +
                  `👉 spart Zeit & sieht gepflegter aus\n\n` +
                  `Möchtest du das dazu?\n\n` +
                  `1️⃣ Ja hinzufügen\n` +
                  `2️⃣ Nein weiter`;

              } else {

                session.step = "ask_name";

                reply =
                  `Perfekt 👌\n\n` +
                  `${session.service}\n` +
                  `${dateStr} um ${matchedSlot.time}\n\n` +
                  `Wie heißt du?`;
              }

            } else {
              session.slots = slots.slice(0, 5);
              session.step = "slot_pick";

              const slotLines = session.slots
                .map((s, i) => `${i + 1}️⃣ ${s.time}`)
                .join("\n");

              reply =
                `📅 ${dateStr}\n\n` +
                `Die Uhrzeit ${wishedTime} ist leider nicht frei.\n\n` +
                "Diese Uhrzeiten sind frei:\n\n" +
                slotLines;
            }
          }
        }
      }
    }

    else if (session.step === "slot_pick") {
      let slot = null;
      // 🔥 ALLE Slots neu berechnen (nicht nur Top 5)
      const allSlots = calculateSlotsForEmployee({
        emp: session.employee,
        serviceDuration: session.duration,
        date: session.selectedDate,
        tenant: TENANT_DEFAULT,
      });

      let cleanMessage = message
        .toLowerCase()
        .replace(/uhr/g, "")
        .replace(/\./g, ":")
        .replace(/\s+/g, "")
        .trim();

      // ✅ Auswahl per Zahl (Top 5)
      if (!isNaN(cleanMessage)) {
        slot = session.slots?.[Number(cleanMessage) - 1];
      }

      // ✅ Exakte Uhrzeit (z.B. 09:00)
      if (!slot && cleanMessage.includes(":")) {
        slot = allSlots.find(s => s.time === cleanMessage);
      }

      // ✅ Stunde (z.B. "9" → 09:00)
      if (!slot) {
        const hourMatch = cleanMessage.match(/\d{1,2}/);
        if (hourMatch) {
          const hour = hourMatch[0].padStart(2, "0");
          slot = allSlots.find(s => s.time.startsWith(hour));


        }
      }

      if (!slot) {
        const slotLines = (session.slots || [])
          .map((s, i) => `${i + 1}️⃣ ${s.time}`)
          .join("\n");

        reply =
          `Diese Uhrzeit ist leider nicht verfügbar.\n\n` +
          `Bitte wähle eine dieser Zeiten:\n\n` +
          slotLines;
      } else {
        session.selectedSlot = slot;
        session.step = "ask_name";

        reply =
          `Termin ${slot.time}\n\n` +
          "Wie heißt du?";
      }
    }

    // 🔥 NUR HIER FIX
    else if (session.step === "ask_name") {
      const name = rawMessage.trim();

      if (name.length < 2) {
        reply = "Bitte gib deinen Namen ein.";
      } else {
        session.customerName = name;
        const phone = from.replace("whatsapp:", "");

        const valid = verifySlotSignature({
          date: session.selectedDate,
          time: session.selectedSlot?.time,
          employeeId: session.employee_id,
          serviceDuration: session.duration,
          tenant: TENANT_DEFAULT,
          signature: session.selectedSlot?.signature,
        });

        if (!valid) {
          reply =
            "Dieser Termin wurde gerade vergeben.\n\n" +
            "Bitte wähle einen anderen Termin.";

          session.step = "date_pick";
        } else {
          try {
            const dateTime = `${session.selectedDate}T${session.selectedSlot.time}:00`;

            const services = getTenantServices(TENANT_DEFAULT);
            const matchedService = services.find(s =>
              s.name.toLowerCase().trim() === session.service.toLowerCase().trim()
            );

            if (!matchedService) {
              reply = "Bitte wähle die Behandlung erneut.";
              session.step = "service";
            } else {

              console.log("CREATE BOOKING PAYLOAD:", {
                name: session.customerName,
                phone,
                service: matchedService.name,
                extras: session.upsellSelected || null,
                dateTime,
                employee_id: session.employee_id,
              });
              const booking = await createBooking({
                name: session.customerName,
                phone,
                service: matchedService.name,
                extras: session.upsellSelected || null,
                dateTime,
                employee_id: session.employee_id,
              });

              console.log("BOOKING RESULT:", booking);

              if (!booking || booking.status === "error") {
                console.error("❌ BOOKING FAILED:", booking);

                reply =
                  "Der Termin konnte nicht gespeichert werden.\n" +
                  "Bitte versuche es erneut.";

                session.step = "menu";
              } else {
                if (phone) {
                  completedBookings.add(phone);
                }

                logEvent({
                  tenant: TENANT_DEFAULT,
                  event_type: "booking_created",
                  value: matchedService.name,
                  meta: {
                    employee: session.employee_id,
                    date: session.selectedDate,
                    time: session.selectedSlot.time,
                    upsell: session.upsellSelected || null,
                  },
                });

                await addVisit({
                  tenant: TENANT_DEFAULT,
                  phone,
                });

                const bookingId =
                  booking?.appointment?.id ||
                  booking?.booking?.id ||
                  booking?.id ||
                  booking?.appointmentId ||
                  null;

                if (!bookingId) {
                  console.error("❌ BOOKING OHNE ID:", booking);

                  reply =
                    "Der Termin wurde angelegt, aber es konnte keine Bestätigungs-ID ermittelt werden.\n" +
                    "Bitte prüfe den Termin im Adminbereich.";

                  session.step = "done";
                  setTimeout(() => {
                    delete sessions[from];
                  }, 2000);
                } else {
                  const pdfLink = `${BASE}/api/bookings/${bookingId}/pdf`;
                  const icsLink = `${BASE}/api/bookings/${bookingId}/ics`;

                  reply =
                    `Dein Termin wurde erfolgreich eingetragen!\n\n` +
                    `Service: ${matchedService.name}\n` +
                    (session.upsellSelected ? `Extra: ${session.upsellSelected}\n` : "") +
                    `Datum: ${session.selectedDate}\n` +
                    `Uhrzeit: ${session.selectedSlot.time}\n\n` +
                    `PDF:\n${pdfLink}\n\n` +
                    `Kalender:\n${icsLink}`;

                  session.step = "done";
                  setTimeout(() => {
                    delete sessions[from];
                  }, 2000);
                }
              }
            }
          } catch (err) {
            console.error("Booking Error:", err);

            reply =
              "Beim Speichern des Termins ist ein Fehler aufgetreten.\n" +
              "Bitte versuche es erneut.";

            session.step = "menu";
          }
        }
      }
    }

    // =========================
    // DONE
    // =========================
    else if (session.step === "done") {
      reply =
        "Dein Termin ist bereits gespeichert.\n\n" +
        "1️⃣ Neuer Termin\n" +
        "2️⃣ Preise\n" +
        "3️⃣ Öffnungszeiten";

      session.step = "menu";
    }

    // =========================
    // FALLBACK
    // =========================
    if (!reply || reply.trim() === "") {
      reply =
        "Ich habe das nicht verstanden.\n\n" +
        "1️⃣ Termin buchen\n" +
        "2️⃣ Preise\n" +
        "3️⃣ Öffnungszeiten";

      session.step = "menu";
    }

    await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: from,
      body: reply,
    });

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ WhatsApp Fehler:", err);
    res.sendStatus(500);
  }
});

// =======================================================
// 🔥 WHATSAPP ABANDON ENGINE (SMART FIX)
// =======================================================

setInterval(async () => {

  const now = Date.now();

  abandonedWhatsappSessions.forEach(async (data, key) => {
    console.log("ABANDON STEP:", data.step);

    const diff = now - data.lastActivity;

    if (diff > 2 * 60 * 1000) {

      console.log("⚠️ WhatsApp Abbruch erkannt:", data.phone);

      // 🛑 STOP wenn schon gebucht
      if (completedBookings.has(data.phone)) {
        abandonedWhatsappSessions.delete(key);
        return;
      }

      try {

        let msg = "Hey 👋\n\n";

        // =======================================================
        // 🔥 SMART REAKTIVIERUNG (NICHT NUR STEP!)
        // =======================================================

        // 🔥 Kategorie
        if (data.step === "category_pick") {
          msg +=
            "du wolltest gerade eine Kategorie auswählen ✨\n\n" +
            "👉 Was möchtest du buchen?";
        }

        // 🔥 Service
        else if (data.step === "service") {
          msg +=
            `du hast dich für "${data.service || "eine Behandlung"}" interessiert ✨\n\n` +
            "👉 Wähle einfach die passende Behandlung aus.";
        }

        // 🔥 Upsell
        else if (data.step === "upsell_offer") {
          msg +=
            "du warst gerade bei einer Empfehlung 👇\n\n" +
            "👉 Möchtest du das noch dazu buchen oder weitermachen?";
        }

        // 🔥 Mitarbeiter fehlt
        else if (data.step === "employee_pick") {
          msg +=
            "👩‍🔬 Dir fehlt nur noch der passende Mitarbeiter.\n\n" +
            "👉 Wer soll dich behandeln?";
        }

        // 🔥 DATUM → NUR WENN WIRKLICH KEINS DA IST
        else if (data.step === "date_pick") {

          if (!data.date) {
            msg +=
              "📅 Dir fehlt nur noch ein Datum für deinen Termin.\n\n" +
              "👉 Schreib einfach z.B. *morgen* oder *24.04*";
          } else {
            msg +=
              `📅 Dein Datum steht schon (${data.date})\n\n` +
              "👉 Wähle jetzt nur noch eine Uhrzeit.";
          }

        }

        // 🔥 SLOT / UHRZEIT
        else if (data.step === "slot_pick") {

          if (data.date) {
            msg +=
              `📅 ${data.date}\n\n` +
              "⏰ Dir fehlt nur noch die Uhrzeit.\n\n" +
              "👉 Welche Zeit passt dir?";
          } else {
            msg +=
              "⏰ Nur noch die Uhrzeit auswählen und dein Termin ist fast fertig!\n\n" +
              "👉 Welche Zeit passt dir?";
          }

        }

        // 🔥 NAME
        else if (data.step === "ask_name") {
          msg +=
            "✍️ Fast geschafft!\n\n" +
            "👉 Wie heißt du?";
        }

        // 🔥 FALLBACK (SMART)
        else {

          if (data.service && data.date && data.time) {
            msg +=
              `du warst kurz davor deinen Termin zu sichern ✨\n\n` +
              `💅 ${data.service}\n` +
              `📅 ${data.date}\n` +
              `⏰ ${data.time}\n\n` +
              "👉 Möchtest du weitermachen?";
          }

          else if (data.service && data.date) {
            msg +=
              `du warst schon weit ✨\n\n` +
              `💅 ${data.service}\n` +
              `📅 ${data.date}\n\n` +
              "👉 Es fehlt nur noch die Uhrzeit.";
          }

          else if (data.service) {
            msg +=
              `du hast dich für "${data.service}" entschieden ✨\n\n` +
              "👉 Lass uns den Termin fertig machen.";
          }

          else {
            msg +=
              "du warst gerade dabei deinen Termin zu buchen ✨\n\n" +
              "👉 Möchtest du weitermachen?";
          }
        }

        // =======================================================
        // 🔥 FOOTER (BLEIBT)
        // =======================================================
        msg +=
          "\n\nIch habe dir deinen Termin kurz freigehalten.\n\n" +
          "👉 Schreib einfach weiter oder buche hier:\n" +
          `${BASE}\n\n` +
          "Sichere ihn dir, bevor er weg ist 💛";

        await sendWhatsAppReminder(data.phone, msg);

        console.log("📲 WhatsApp Reaktivierung gesendet:", data.phone);

        // ❗ WICHTIG: löschen → kein Spam
        abandonedWhatsappSessions.delete(key);

      } catch (err) {
        console.error("❌ WhatsApp Reaktivierung Fehler:", err.message);
      }

    }

  });

}, 30 * 1000);


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
  <div style="
    font-family: Arial, Helvetica, sans-serif;
    max-width: 620px;
    margin: 0 auto;
    padding: 32px;
    background: #f7f4ef;
    border: 1px solid #eee;
    border-radius: 14px;
  ">
    <h2 style="
      margin: 0 0 10px;
      color: #BC3B5F;
      text-align: center;
    ">
      GlowSuite AI – Neue Online-Buchung
    </h2>

    <p style="
      margin: 0 0 22px;
      color: #666;
      text-align: center;
      font-size: 14px;
    ">
      Es wurde soeben ein neuer Termin online gebucht.
    </p>

    <div style="
      background: #ffffff;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 18px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.04);
    ">
      <p style="margin: 0 0 10px;"><b>Kundin/Kunde:</b><br>${booking.name || "Unbekannt"}</p>
      <p style="margin: 0 0 10px;"><b>Telefon:</b><br>${booking.phone || "-"}</p>
      <p style="margin: 0 0 10px;"><b>Service:</b><br>${booking.service || "-"}</p>
      <p style="margin: 0 0 10px;"><b>Datum:</b><br>${d}</p>
      <p style="margin: 0 0 10px;"><b>Uhrzeit:</b><br>${t}</p>
      <p style="margin: 0 0 10px;"><b>Dauer:</b><br>${booking.duration || 60} Minuten</p>
      <p style="margin: 0 0 10px;"><b>Preis:</b><br>${price} €</p>
      ${booking.employee
      ? `<p style="margin: 0;"><b>Mitarbeiter/in:</b><br>${booking.employee}</p>`
      : ""
    }
    </div>

    <div style="
      background: #fff;
      border: 1px solid #f0e4dc;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
      text-align: center;
      color: #666;
      font-size: 14px;
    ">
      Die PDF-Bestätigung und ggf. die ICS-Datei sind als Anhang beigefügt.
    </div>

    <p style="
      margin: 18px 0 0;
      text-align: center;
      color: #999;
      font-size: 12px;
    ">
      Powered by GlowSuite AI
    </p>
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

const CONFIG_BASE = path.resolve("Datein/config/kunden");

console.log("CONFIG_BASE =", CONFIG_BASE);

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



// =======================================================
// ADMIN – ALLE STUDIOS
// =======================================================

app.get("/api/admin/studios", authMiddleware, (req, res) => {

  try {

    const files = fs.readdirSync(CONFIG_BASE);

    const studios = [];

    for (const file of files) {

      if (!file.endsWith(".json")) continue;

      const config = JSON.parse(
        fs.readFileSync(path.join(CONFIG_BASE, file), "utf8")
      );

      studios.push({

        tenant: file.replace(".json", ""),

        name: config?.branding?.brandName || "Studio",

        status: config?.stripe?.status || "inactive",

        // 🌍 neue Felder für Map / Analytics
        city: config?.location?.city || null,

        country: config?.location?.country || null

      });

    }

    res.json({
      success: true,
      studios
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

});


// =======================================================
// 📊 SUPER ADMIN – ANALYTICS
// =======================================================

app.get("/api/admin/analytics", authMiddleware, (req, res) => {

  try {

    const files = fs.readdirSync(CONFIG_BASE);

    let studios = 0;
    let activeStudios = 0;
    let inactiveStudios = 0;

    for (const file of files) {

      if (!file.endsWith(".json")) continue;

      studios++;

      let config = {};

      try {
        config = JSON.parse(
          fs.readFileSync(path.join(CONFIG_BASE, file), "utf8")
        );
      } catch (e) {
        console.warn("⚠️ Config Fehler:", file);
        continue;
      }

      if (config?.stripe?.status === "active") {
        activeStudios++;
      } else {
        inactiveStudios++;
      }

    }

    const bookings = getAllBookings() || [];

    res.json({
      success: true,
      stats: {
        studios,
        activeStudios,
        inactiveStudios,
        totalBookings: bookings.length
      }
    });

  } catch (err) {

    console.error("❌ Analytics Fehler:", err);

    res.status(500).json({
      success: false
    });

  }

});


// =======================================================
// STUDIO SIGNUP
// =======================================================

app.post("/api/studio/signup", (req, res) => {

  try {

    // 🔥 erweitert um city + country
    const { studio, email, city, country } = req.body;

    if (!studio) {
      return res.status(400).json({
        success: false,
        message: "Studio Name fehlt"
      });
    }

    const tenantId = studio
      .toLowerCase()
      .replace(/\s/g, "_");

    const filePath = path.join(CONFIG_BASE, `${tenantId}.json`);

    if (fs.existsSync(filePath)) {
      return res.json({
        success: false,
        message: "Studio existiert bereits"
      });
    }

    // 🔐 Login generieren
    const password = Math.random().toString(36).slice(-8);

    const config = {

      branding: {
        brandName: studio
      },

      // 🌍 Standort (für SaaS Map / Analytics)
      location: {
        city: city || "unknown",
        country: country || "DE"
      },

      // 📧 Studio Kontakt
      contact: {
        email: email || null
      },

      // 🔐 Studio Login
      auth: {
        user: tenantId,
        password: password
      },

      // 💳 Stripe Platzhalter (wird später gefüllt)
      stripe: {
        customer_id: null,
        subscription_id: null,
        status: "inactive"
      },

      services: [

        { name: "Gesichtsbehandlung", duration: 60, price: 60 },
        { name: "Wimpern", duration: 45, price: 50 },
        { name: "Nägel", duration: 60, price: 55 }

      ]

    };

    fs.writeFileSync(
      filePath,
      JSON.stringify(config, null, 2)
    );

    res.json({
      success: true,
      message: "Studio erstellt",
      tenant: tenantId,

      // 🔐 Login Daten zurückgeben
      login: {
        user: tenantId,
        password: password
      }

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false
    });

  }

});


// =======================================================
// 💳 STRIPE CHECKOUT
// =======================================================

app.get("/api/stripe/checkout", async (req, res) => {

  try {

    // optionaler Email Parameter
    const email = req.query.email || "test@glowsuite.ai";

    const session = await stripe.checkout.sessions.create({

      mode: "subscription",

      customer_email: email,

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],

      success_url: `${BASE}/admin.html`,
      cancel_url: `${BASE}/signup.html`

    });

    // Direkt zu Stripe weiterleiten
    res.redirect(session.url);

  } catch (err) {

    console.error("❌ Stripe Checkout Error:", err);

    res.status(500).send("Stripe Checkout Fehler");

  }

});



// =======================================================
// 🏢 AUTO CREATE STUDIO FROM STRIPE
// =======================================================

function createStudioFromStripe(email, customerId = null, subscriptionId = null) {

  try {

    if (!email) return;

    const studioName = email.split("@")[0];

    const tenantId = studioName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    const filePath = path.join(CONFIG_BASE, `${tenantId}.json`);

    // Falls Studio schon existiert → nichts tun
    if (fs.existsSync(filePath)) {
      console.log("ℹ️ Studio existiert bereits:", tenantId);
      return;
    }

    const config = {

      branding: {
        brandName: studioName
      },

      // 💳 Stripe Infos speichern
      stripe: {
        customer_id: customerId,
        subscription_id: subscriptionId,
        status: "active"
      },

      services: [
        { name: "Gesichtsbehandlung", duration: 60, price: 60 },
        { name: "Wimpern", duration: 45, price: 50 },
        { name: "Nägel", duration: 60, price: 55 }
      ]

    };

    fs.writeFileSync(
      filePath,
      JSON.stringify(config, null, 2)
    );

    console.log("🏢 Neues Studio automatisch erstellt:", tenantId);

  } catch (err) {

    console.error("❌ Studio Auto-Creation Fehler:", err.message);

  }

}



// =======================================================
// 🔒 DEACTIVATE STUDIO (Stripe Abo beendet)
// =======================================================

function deactivateStudioByCustomer(customerId) {

  try {

    const files = fs.readdirSync(CONFIG_BASE);

    for (const file of files) {

      const filePath = path.join(CONFIG_BASE, file);
      const data = JSON.parse(fs.readFileSync(filePath));

      if (data?.stripe?.customer_id === customerId) {

        data.stripe.status = "inactive";

        fs.writeFileSync(
          filePath,
          JSON.stringify(data, null, 2)
        );

        console.log("🔒 Studio deaktiviert:", file);
        return;

      }

    }

  } catch (err) {

    console.error("❌ Deactivate Studio Fehler:", err.message);

  }

}



// =======================================================
// 🔔 STRIPE WEBHOOK
// =======================================================

app.post("/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {

    const sig = req.headers["stripe-signature"];

    let event;

    try {

      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

    } catch (err) {

      console.error("⚠️ Stripe Webhook Fehler:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);

    }

    console.log("📦 Stripe Event:", event.type);

    // =======================================================
    // ✅ Neue Subscription erstellt
    // =======================================================

    if (event.type === "checkout.session.completed") {

      const session = event.data.object;

      const email = session.customer_email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      console.log("💰 Neue Subscription:", email);
      console.log("Stripe Customer:", customerId);
      console.log("Stripe Subscription:", subscriptionId);

      try {
        createStudioFromStripe(email, customerId, subscriptionId);
      } catch (err) {
        console.error("❌ Studio Erstellung fehlgeschlagen:", err.message);
      }

    }

    // =======================================================
    // ❌ Abo wurde beendet
    // =======================================================

    if (event.type === "customer.subscription.deleted") {

      const subscription = event.data.object;
      const customerId = subscription.customer;

      console.log("❌ Subscription beendet:", customerId);

      try {
        deactivateStudioByCustomer(customerId);
      } catch (err) {
        console.error("❌ Studio Deaktivierung fehlgeschlagen:", err.message);
      }

    }

    res.json({ received: true });

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


app.get("/api/bookings/:id/ics", authMiddleware, async (req, res) => {
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

    if (!result || !result.icsUrl) {
      return res.status(500).send("Fehler bei ICS-Erstellung.");
    }

    res.redirect(result.icsUrl);
  } catch (err) {
    console.error("❌ /api/bookings/:id/ics:", err);
    res.status(500).send("Fehler beim Laden der ICS Datei.");
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

    // 💾 Booking speichern
    insertBooking(booking);

    // 🔥 STOP-SYSTEM (sehr wichtig)
    if (booking.phone) {
      completedBookings.add(booking.phone);

      setTimeout(() => {
        completedBookings.delete(booking.phone);
      }, 24 * 60 * 60 * 1000);
    }

    // 📲 WhatsApp Bestätigung + Reminder
    await sendWhatsAppBookingConfirmation(booking);
    scheduleWhatsAppReminders(booking);

    // ⭐ Google Review Reminder planen
    const cfg = loadTenantConfig(tenantId);
    const reviewUrl = cfg?.branding?.contact?.googleReviewUrl;

    if (reviewUrl) {
      scheduleReviewReminder(booking, reviewUrl);
    }

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
// 🎁 LOYALTY BONUSKARTE
// =======================================================

app.get("/api/loyalty/:phone", (req, res) => {

  const phone = req.params.phone;

  const dataPath = path.join(dataDir, "loyalty_cards.json");

  if (!fs.existsSync(dataPath)) {
    return res.json({ visits: 0 });
  }

  const cards = JSON.parse(fs.readFileSync(dataPath));

  const card = cards.find(c => c.phone === phone);

  res.json(card || { visits: 0 });

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

app.post("/api/bookings/:id/move", authMiddleware, async (req, res) => {
  try {
    const { date, time } = req.body || {};

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        error: "Missing date/time"
      });
    }

    const all = getAllBookings();
    const booking = all.find(b => b.id === req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    const iso = toISO(String(date), String(time));
    const empId = booking.employeeId || null;

    const newStart = new Date(iso).getTime();
    const duration = Number(booking.duration || 60);

    let buffer = 15;

    if (empId) {
      const emp = getEmployee(empId);

      if (emp && emp.buffer != null) {
        const n = Number(emp.buffer);
        if (Number.isFinite(n)) {
          buffer = n;
        }
      }
    }

    const newEnd = newStart + duration * 60000;

    const hasConflict = all
      .filter(b => b.id !== req.params.id)
      .filter(b => (b.employeeId || null) === empId)
      .some(b => {
        const start = new Date(b.dateTime).getTime();
        const end =
          start + (Number(b.duration || 60) + buffer) * 60000;

        return !(newEnd <= start || newStart >= end);
      });

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        error: "CONFLICT",
        message: "Dieser Zeitraum ist bereits belegt."
      });
    }

    const ok = updateBooking(req.params.id, iso, empId);

    if (!ok) {
      return res.status(500).json({
        success: false,
        error: "Update failed"
      });
    }

    // ============================
    // WhatsApp Info bei Verschiebung
    // ============================
    try {
      const phone = String(booking.phone || "").trim();

      if (phone) {
        const moveDate = new Date(iso);

        const formattedDate = moveDate.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });

        const formattedTime = moveDate.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit"
        });

        const customerName = booking.name || "dein Termin";

        await twilioClient.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: `whatsapp:${phone}`,
          body:
            `Hallo ${customerName} 👋\n\n` +
            `dein Termin wurde verschoben:\n\n` +
            `📅 ${formattedDate}\n` +
            `🕐 ${formattedTime} Uhr\n\n` +
            `Falls dir der Termin nicht passt, melde dich bitte kurz.`
        });
      }
    } catch (waErr) {
      console.warn("⚠️ WhatsApp Move Info fehlgeschlagen:", waErr.message);
    }

    log(
      `📆 Termin verschoben: ${req.params.id} → ${iso} (Mitarbeiter: ${empId})`
    );

    return res.json({
      success: true,
      newDateTime: iso
    });

  } catch (err) {
    console.error("❌ Move Error:", err.message);

    return res.status(500).json({
      success: false,
      error: "Serverfehler"
    });
  }
});


// =======================================================
// ❌ BOOKING STORNIEREN (SOFT CANCEL)
// =======================================================
app.delete("/api/bookings/:id", async (req, res) => {

  try {

    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Booking ID fehlt"
      });
    }

    console.log("🗑️ DELETE BOOKING:", id);
    console.log("🧪 DELETE REQUEST ID:", id);

    const success = deleteBooking(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Termin nicht gefunden"
      });
    }

    return res.json({
      success: true,
      message: "Termin storniert"
    });

  } catch (err) {

    console.error("❌ DELETE BOOKING ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "Termin konnte nicht storniert werden"
    });

  }

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

    const hasPhone = !!String(booking.phone || "").trim();

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

      if (hasPhone) {
        try {
          await sendWhatsAppBookingConfirmation(booking);
          scheduleWhatsAppReminders(booking);

          const waExtras = [];

          if (pdfResult?.pdfUrl) {
            waExtras.push(`PDF:\n${BASE}${pdfResult.pdfUrl}`);
          }

          if (pdfResult?.icsUrl) {
            waExtras.push(`Kalender:\n${BASE}${pdfResult.icsUrl}`);
          }

          if (waExtras.length) {
            await sendWhatsAppReminder(
              booking.phone,
              `Deine Termin-Unterlagen:\n\n${waExtras.join("\n\n")}`
            );
          }
        } catch (waErr) {
          console.warn(
            "⚠️ Admin WhatsApp Bestätigung/Reminder fehlgeschlagen:",
            waErr.message
          );
        }
      }

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
  console.log("SLOTS REQUEST BODY:", req.body);
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

    const active = new Set(
      all.map((b) => b.phone),
    ).size;

    const load = ((month.length / 30) * 100).toFixed(1);

    const byService = {};

    month.forEach((b) => {
      if (b.service) {
        byService[b.service] =
          (byService[b.service] || 0) + 1;
      }
    });

    const top5 = Object.entries(byService)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        total,
        revenue,
        avg,
        active,
        load,
        top5,
      },
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
// 🤖 SERVICE MATCHING API (KI Service Finder)
// =======================================================
app.use("/api/service-match", serviceMatchRoute);


// BEAUTY CHAT AI
app.use("/api/chat", beautyChatRoute);
app.use("/api/ai-booking", aiBookingRoute);

// ======================================
// AURA DAILY MONITOR
// ======================================

app.get("/api/aura/monitor", async (req, res) => {

  const result = await runAuraDailyMonitor({
    tenant: TENANT_DEFAULT
  });

  res.json(result);

});


// -------------------------------------------------------
// AURA BUSINESS OPTIMIZER
// -------------------------------------------------------

app.get("/api/aura/optimize", async (req, res) => {

  const result = await runAuraBusinessOptimizer({
    tenant: TENANT_DEFAULT
  });

  res.json(result);

});


// -------------------------------------------------------
// AURA CAMPAIGN EXECUTOR
// -------------------------------------------------------

app.all("/api/aura/execute", async (req, res) => {

  try {

    const { action } = req.body;

    const result = await executeAuraCampaign({
      tenant: TENANT_DEFAULT,
      action
    });

    res.json(result);

  } catch (err) {

    console.error("❌ AURA execute error:", err.message);

    res.status(500).json({
      success: false
    });

  }

});


// -------------------------------------------------------
// AURA RECOMMENDATIONS
// -------------------------------------------------------

app.get("/api/aura/recommendations", async (req, res) => {

  try {

    const recommendations = await generateAuraRecommendations({
      tenant: TENANT_DEFAULT,
      limit: 5
    });

    res.json({
      success: true,
      recommendations
    });

  } catch (err) {

    console.error("❌ AURA recommendations error:", err.message);

    res.status(500).json({
      success: false,
      error: "recommendations_failed"
    });

  }

});


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
    `💅 Services:     ${Array.isArray(cfg.services) ? cfg.services.length : 0
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

      console.log("🔄 Initial Employee Mirror gestartet");

    } catch (err) {
      console.warn("⚠️ Initial mirror failed:", err.message);
    }
  }, 2000);

  // =======================================================
  // WhatsApp System
  // =======================================================
  // Der alte whatsapp-web.js Bot wurde entfernt.
  // GlowSuite nutzt ausschließlich Twilio WhatsApp API.
  // Antworten und Reminder laufen über:
  // sendWhatsAppReminder()
  // sendWhatsAppBookingConfirmation()

  console.log("📲 WhatsApp System: Twilio API aktiv (kein QR Bot)");

  // =======================================================
  // 🔁 AUTO REBOOKING CHECK (täglich)
  // =======================================================

  setInterval(() => {

    try {

      runRebookingCheck();

      console.log("🔁 Rebooking Check ausgeführt");

    } catch (err) {

      console.error("❌ Rebooking Fehler:", err.message);

    }

  }, 1000 * 60 * 60 * 24);
});