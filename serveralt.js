// =======================================================
// 💎 Beauty Agent v10.10 PRO-STABLE
// Fixes & Verbesserungen:
//  ✅ Terminverwaltung-API integriert
//  ✅ Routing für /admin-appointments.html
//  ✅ Upload-API für Preisliste (PDF/JPG/PNG/DOCX) mit festen Namen
//  ✅ Status-Endpoint & /preisliste/current Redirect
//  ✅ Logging & Sicherheit verfeinert
//  ✅ Struktur und Tenant-Kompatibilität unverändert
// =======================================================

import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import multer from "multer";

import {
  insertBooking, getAllBookings, deleteBooking, updateBooking,
  exportByPhone, anonymizeByPhone,
  getAllEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee
} from "./core/db.js";

import { createBookingPDF } from "./core/pdf.js";
import { authMiddleware } from "./core/auth.js";
import { startWhatsAppBot } from "./bots/whatsapp-bot.js";

dotenv.config({ path: "./config/.env" });

// =======================================================
// ⚙️ INIT
// =======================================================
const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
// 🔒 SECURITY
// =======================================================
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
});
app.use(express.static(publicDir, { maxAge: "1h", etag: true }));

// =======================================================
// 📧 SMTP (optional)
// =======================================================
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// =======================================================
// 🧠 TENANT / BRANDING
// =======================================================
const TENANT_DEFAULT = process.env.TENANT_DEFAULT || "beauty_lounge";
const CONFIG_BASE = process.env.CONFIG_BASE || "./config/kunden";

function getTenantFromReq(req) {
  return (req.query.tenant || req.headers["x-tenant"] || TENANT_DEFAULT).toString();
}
function loadJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}
function getTenantConfig(tenant) {
  const base = path.resolve(CONFIG_BASE, tenant);
  return {
    tenant,
    brandingPath: path.join(base, "branding.json"),
    servicesPath: path.join(base, "services.json"),
    branding: loadJsonSafe(path.join(base, "branding.json")) || {},
    services: loadJsonSafe(path.join(base, "services.json")) || [],
  };
}

// =======================================================
// 🌐 FRONTEND ROUTES
// =======================================================
app.get("/", (_req, res) => res.redirect("/widget.html"));
app.get("/admin.html", authMiddleware, (_req, res) =>
  res.sendFile(path.join(publicDir, "admin", "index.html"))
);
app.get("/admin-employees.html", authMiddleware, (_req, res) =>
  res.sendFile(path.join(publicDir, "admin", "employees.html"))
);
app.get("/admin-appointments.html", authMiddleware, (_req, res) =>
  res.sendFile(path.join(publicDir, "admin", "appointments.html"))
);

// =======================================================
// 🎨 BRANDING & SERVICES API
// =======================================================
app.get("/api/branding", authMiddleware, (req, res) => {
  const t = getTenantFromReq(req);
  res.json({ success: true, tenant: t, branding: getTenantConfig(t).branding });
});
app.get("/api/services", authMiddleware, (req, res) => {
  const t = getTenantFromReq(req);
  res.json({ success: true, tenant: t, services: getTenantConfig(t).services });
});
app.get("/api/tenants", authMiddleware, (_req, res) => {
  try {
    const root = path.resolve(CONFIG_BASE);
    const tenants = fs.readdirSync(root).filter(n => fs.existsSync(path.join(root, n, "branding.json")));
    res.json({ success: true, tenants });
  } catch {
    res.status(500).json({ success: false, error: "Tenants konnten nicht geladen werden." });
  }
});

// =======================================================
// 📅 BUCHUNGEN API
// =======================================================
app.get("/api/bookings", authMiddleware, (_req, res) => {
  try { res.json(getAllBookings()); }
  catch (err) { log("❌ /api/bookings: " + err); res.status(500).json({ success: false }); }
});

app.post("/api/bookings/:id/cancel", authMiddleware, (req, res) => {
  const ok = deleteBooking(req.params.id);
  if (!ok) return res.status(404).json({ success: false });
  log(`🗑️ Termin gelöscht: ${req.params.id}`);
  res.json({ success: true });
});

app.get("/api/bookings/:id/pdf", authMiddleware, async (req, res) => {
  const booking = getAllBookings().find(b => b.id === req.params.id);
  if (!booking) return res.status(404).send("Buchung nicht gefunden.");
  const pdfUrl = await createBookingPDF(booking);
  if (!pdfUrl) return res.status(500).send("Fehler bei PDF-Erstellung.");
  res.redirect(pdfUrl);
});

app.post("/api/bookings/:id/move", authMiddleware, (req, res) => {
  const { date, time } = req.body || {};
  if (!date || !time) return res.status(400).json({ success: false });
  const iso = toISO(date, time);
  const ok = updateBooking(req.params.id, iso);
  if (!ok) return res.status(404).json({ success: false });
  log(`📆 Termin verschoben: ${req.params.id} → ${iso}`);
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
  };
  insertBooking(booking);
  res.json({ success: true, booking });
});

app.post("/api/bookings", authMiddleware, (req, res) => {
  try {
    const { name, phone, service, price, duration, date, time, employeeId, tenant } = req.body || {};
    if (!name || !phone || !service || !date || !time)
      return res.status(400).json({ success: false, error: "Pflichtfelder fehlen." });

    const iso = toISO(String(date), String(time));
    const booking = {
      id: uuidv4(),
      name: String(name),
      phone: String(phone),
      service: String(service),
      price: Number(price || 0),
      duration: Number(duration || 60),
      dateTime: iso,
      employeeId: employeeId ? String(employeeId) : null,
      tenant: tenant || TENANT_DEFAULT
    };
    insertBooking(booking);
    log(`🆕 Neuer Termin angelegt: ${booking.name} (${booking.service})`);
    res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ /api/bookings [POST]:", err.message);
    res.status(500).json({ success: false, error: "Fehler beim Anlegen." });
  }
});

// =======================================================
// 🗂️ PREISLISTE – Upload & Status & Redirect
// =======================================================

// Multer (Speicher im RAM – wir schreiben selbst auf Platte)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const ALLOWED = {
  "application/pdf": "preisliste.pdf",
  "image/jpeg": "preisliste.jpg",
  "image/png": "preisliste.png",
  // docx: keine eigene MIME-Garantie im Browser bei manchen Clients -> beide prüfen:
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "preisliste.docx",
  "application/msword": "preisliste.docx",
};

// Hilfsfunktion: alle preisliste.* im Ordner löschen (vorher)
function cleanupOldPreislisteFiles() {
  const files = fs.readdirSync(preislisteDir).filter(f => /^preisliste\.(pdf|png|jpg|jpeg|docx)$/i.test(f));
  for (const f of files) {
    try { fs.unlinkSync(path.join(preislisteDir, f)); } catch {}
  }
}

// Upload-API
app.post("/api/upload-preisliste", authMiddleware, upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "Keine Datei erhalten." });

    const mime = req.file.mimetype;
    let targetName = ALLOWED[mime];

    // Fallback: Wenn der Browser einen ungenauen MIME-Type schickt, per Dateiendung mappen
    if (!targetName && req.file.originalname) {
      const ext = String(req.file.originalname).toLowerCase().split(".").pop();
      if (["pdf","png","jpg","jpeg","docx"].includes(ext)) {
        targetName = `preisliste.${ext === "jpeg" ? "jpg" : ext}`;
      }
    }

    if (!targetName) {
      return res.status(415).json({
        success: false,
        error: "Nicht unterstütztes Format. Erlaubt: PDF, JPG, PNG, DOCX."
      });
    }

    // Aufräumen & Schreiben
    cleanupOldPreislisteFiles();
    const dest = path.join(preislisteDir, targetName);
    fs.writeFileSync(dest, req.file.buffer);

    const publicUrl = `/preisliste/${targetName}`;
    log(`📤 Preisliste aktualisiert: ${publicUrl}`);
    return res.json({ success: true, file: targetName, url: publicUrl });
  } catch (err) {
    console.error("❌ /api/upload-preisliste:", err.message);
    return res.status(500).json({ success: false, error: "Upload fehlgeschlagen." });
  }
});

// Status-API (welche Preisliste existiert?)
app.get("/api/preisliste/status", authMiddleware, (_req, res) => {
  try {
    const candidates = ["preisliste.pdf", "preisliste.jpg", "preisliste.png", "preisliste.docx"];
    const found = candidates.find(f => fs.existsSync(path.join(preislisteDir, f)));
    if (!found) return res.json({ success: true, exists: false });
    return res.json({ success: true, exists: true, file: found, url: `/preisliste/${found}` });
  } catch (err) {
    console.error("❌ /api/preisliste/status:", err.message);
    return res.status(500).json({ success: false, error: "Status konnte nicht ermittelt werden." });
  }
});

// Universeller Redirect auf die aktuelle Preisliste (egal welches Format)
function getCurrentPreisliste() {
  const candidates = ["preisliste.pdf", "preisliste.jpg", "preisliste.png", "preisliste.docx"];
  return candidates.find(f => fs.existsSync(path.join(preislisteDir, f))) || null;
}

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
    if (!phone) return res.status(400).json({ success: false, error: "phone fehlt" });
    const data = exportByPhone(phone);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("❌ /api/gdpr/export:", err.message);
    return res.status(500).json({ success: false, error: "Fehler beim Export" });
  }
});
app.post("/api/gdpr/anonymize", authMiddleware, (req, res) => {
  try {
    const { phone } = req.body || {};
    if (!phone) return res.status(400).json({ success: false, error: "phone fehlt" });
    const ok = anonymizeByPhone(phone);
    return res.json({ success: ok });
  } catch (err) {
    console.error("❌ /api/gdpr/anonymize:", err.message);
    return res.status(500).json({ success: false, error: "Fehler beim Anonymisieren" });
  }
});

// =======================================================
// ✅ TO-DO API
// =======================================================
const todoPath = path.join(dataDir, "todos.json");
if (!fs.existsSync(todoPath)) fs.writeFileSync(todoPath, JSON.stringify([], null, 2));

app.get("/api/todos", authMiddleware, (_req, res) => {
  try {
    const data = loadJsonSafe(todoPath) || [];
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Fehler beim Laden der Aufgaben." });
  }
});

app.post("/api/todos", authMiddleware, (req, res) => {
  try {
    const todos = loadJsonSafe(todoPath) || [];
    const todo = {
      id: uuidv4(),
      title: req.body.title || "Unbenannte Aufgabe",
      due_at: req.body.due_at || null,
      priority: req.body.priority || 0,
      done: false,
    };
    todos.push(todo);
    fs.writeFileSync(todoPath, JSON.stringify(todos, null, 2));
    res.json({ success: true, data: todo });
  } catch {
    res.status(500).json({ success: false, error: "Fehler beim Speichern." });
  }
});

// =======================================================
// 📊 DASHBOARD API (KPIs & Charts)
// =======================================================
app.get("/api/dashboard", authMiddleware, (_req, res) => {
  try {
    const all = getAllBookings();
    const since30 = new Date(Date.now() - 30 * 864e5);
    const month = all.filter(b => new Date(b.dateTime) >= since30);
    const total = all.length;
    const revenue = month.reduce((sum, b) => sum + (+b.price || 0), 0);
    const avg = month.length ? revenue / month.length : 0;
    const active = new Set(all.map(b => b.phone)).size;
    const load = ((month.length / 30) * 100).toFixed(1);
    const byService = {};
    month.forEach(b => { if (b.service) byService[b.service] = (byService[b.service] || 0) + 1; });
    const top5 = Object.entries(byService).sort((a, b) => b[1] - a[1]).slice(0, 5);

    res.json({ success: true, data: { total, revenue, avg, active, load, top5 } });
  } catch (err) {
    console.error("❌ /api/dashboard:", err.message);
    res.status(500).json({ success: false, error: "Fehler beim Dashboard." });
  }
});

// =======================================================
// 👥 MITARBEITER API
// =======================================================
function normalizeEmployeePayload(b = {}, existing = {}) {
  const toStr = v => (v ? String(v) : null);
  const toInt = v => (isNaN(v) ? 0 : Number(v));
  const to01 = v => (v == 1 || v === "1" || v === true || v === "true" ? 1 : 0);
  return {
    id: toStr(b.id ?? existing.id),
    name: toStr(b.name ?? existing.name),
    role: toStr(b.role ?? existing.role),
    email: toStr(b.email ?? existing.email),
    phone: toStr(b.phone ?? existing.phone),
    work_start: toStr(b.work_start ?? existing.work_start) || "09:00",
    work_end: toStr(b.work_end ?? existing.work_end) || "18:00",
    days: toStr(b.days ?? existing.days ?? "Mo,Di,Mi,Do,Fr"),
    buffer: toInt(b.buffer ?? existing.buffer ?? 15),
    active: to01(b.active ?? existing.active ?? 1),
    tenant: TENANT_DEFAULT,
  };
}

app.get("/api/employees", authMiddleware, (req, res) => {
  try {
    const tenant = req.query.tenant || TENANT_DEFAULT;
    const data = getAllEmployees(tenant);
    res.json({ success: true, data });
  } catch (err) {
    log("❌ /api/employees [GET]: " + err);
    res.status(500).json({ error: "Fehler" });
  }
});

app.post("/api/employees", authMiddleware, (req, res) => {
  try {
    const emp = normalizeEmployeePayload(req.body || {});
    if (!emp.id) emp.id = uuidv4();
    const ok = createEmployee(emp);
    if (!ok) return res.status(500).json({ error: "Fehler beim Anlegen." });
    res.json({ success: true, data: emp });
  } catch (err) {
    log("❌ /api/employees [POST]: " + err);
    res.status(500).json({ error: "Fehler" });
  }
});

app.put("/api/employees/:id", authMiddleware, (req, res) => {
  try {
    const id = req.params.id;
    const current = getEmployee(id);
    if (!current) return res.status(404).json({ error: "Nicht gefunden." });
    const merged = normalizeEmployeePayload({ ...req.body, id }, current);
    const ok = updateEmployee(merged);
    if (!ok) return res.status(500).json({ error: "Fehler beim Update." });
    res.json({ success: true, data: merged });
  } catch (err) {
    log("❌ /api/employees [PUT]: " + err);
    res.status(500).json({ error: "Fehler" });
  }
});

app.delete("/api/employees/:id", authMiddleware, (req, res) => {
  try {
    const ok = deleteEmployee(req.params.id);
    if (!ok) return res.status(404).json({ error: "Nicht gefunden." });
    res.json({ success: true });
  } catch (err) {
    log("❌ /api/employees [DELETE]: " + err);
    res.status(500).json({ error: "Fehler" });
  }
});

// =======================================================
// 🚀 SERVER START
// =======================================================
const PORT = process.env.PORT || 8083;
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  const t = TENANT_DEFAULT;
  const cfg = getTenantConfig(t);
  console.log("=====================================");
  console.log(`🌐 Startseite:   ${BASE}`);
  console.log(`🔐 Admin:        ${BASE}/admin.html`);
  console.log(`👥 Mitarbeiter:  ${BASE}/admin-employees.html`);
  console.log(`🗓️ Termine:      ${BASE}/admin-appointments.html`);
  console.log(`📄 Preisliste:   ${BASE}/preisliste/current`);
  console.log(`✅ Tenant:       ${t}`);
  console.log(`🎨 Branding:     ${cfg.brandingPath}`);
  console.log(`💅 Services:     ${cfg.servicesPath}`);
  console.log("=====================================");
  if (String(process.env.ENABLE_WHATSAPP).toLowerCase() === "true") {
    try {
      console.log("📱 Starte WhatsApp Bot …");
      startWhatsAppBot();
    } catch (err) {
      log("❌ WhatsApp Bot Fehler: " + err);
    }
  }
});