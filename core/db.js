// =======================================================
// 💾 core/db.js – SQLite API (Bookings + Employees + ToDos)
// Super-Stable | DSGVO Ready | Krank/Urlaub Erweiterung
// =======================================================

import { recordAuraActionFeedback } from "./auraActionFeedbackService.js";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const isTest = process.env.TEST_MODE === "true";
const dbFile = isTest ? "bookings_test.db" : "bookings.db";
const dbPath = path.join(process.cwd(), dbFile);

// --- Datenbank initialisieren ---
if (!fs.existsSync(dbPath)) {
  fs.closeSync(fs.openSync(dbPath, "a"));
  console.log(`📂 Neue Datenbank-Datei erstellt: ${dbFile}`);
} else {
  console.log(`📂 Datenbank geladen: ${dbFile}`);
}

// --- Verbindung ---
const db = new Database(dbPath, { verbose: null });
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

// =======================================================
// 📅 BOOKINGS + employeeId
// =======================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    service TEXT NOT NULL,
    price REAL DEFAULT 0,
    duration INTEGER DEFAULT 0,
    dateTime TEXT NOT NULL,
    employeeId TEXT,                 -- 👈 WICHTIG HINZUGEFÜGT
    tenant TEXT
  );
`);

// Falls employeeId Spalte fehlt → automatisch hinzufügen
const bookingColumns = db.prepare(`PRAGMA table_info(bookings)`).all().map(c => c.name);
if (!bookingColumns.includes("employeeId")) {
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN employeeId TEXT;`);
    console.log("🛠️ Spalte 'employeeId' zu bookings hinzugefügt.");
  } catch (err) {
    console.warn("⚠️ employeeId konnte nicht hinzugefügt werden:", err.message);
  }
}

// =======================================================
// 👥 EMPLOYEES (mit Krank + Urlaub)
// =======================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    email TEXT,
    phone TEXT,
    work_start TEXT DEFAULT '09:00',
    work_end TEXT DEFAULT '18:00',
    days TEXT DEFAULT 'Mo,Di,Mi,Do,Fr',
    buffer INTEGER DEFAULT 15,
    active INTEGER DEFAULT 1,
    sick_until TEXT,
    vacation_start TEXT,
    vacation_end TEXT,
    color TEXT,
    tenant TEXT
  );
`);

const employeeColumns = db.prepare(`PRAGMA table_info(employees)`).all().map(c => c.name);
const missingEmployeeCols = [
  { name: "sick_until", type: "TEXT" },
  { name: "vacation_start", type: "TEXT" },
  { name: "vacation_end", type: "TEXT" }
];

for (const col of missingEmployeeCols) {
  if (!employeeColumns.includes(col.name)) {
    try {
      db.exec(`ALTER TABLE employees ADD COLUMN ${col.name} ${col.type};`);
      console.log(`🛠️ Spalte '${col.name}' hinzugefügt.`);
    } catch (err) {
      console.warn(`⚠️ Fehler beim Hinzufügen von '${col.name}':`, err.message);
    }
  }
}

if (!employeeColumns.includes("color")) {
  try {
    db.exec(`ALTER TABLE employees ADD COLUMN color TEXT;`);
    console.log("🎨 Spalte 'color' zu employees hinzugefügt.");
  } catch (err) {
    console.warn("⚠️ color konnte nicht hinzugefügt werden:", err.message);
  }
}


// =======================================================
// 📝 TODOS
// =======================================================
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    tenant TEXT
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_phone_time ON bookings (phone, dateTime);
  CREATE INDEX IF NOT EXISTS idx_datetime ON bookings (dateTime);
  CREATE INDEX IF NOT EXISTS idx_emp_active ON employees (active);
`);

// Logging
function logAction(action, details = {}) {
  const time = new Date().toISOString();
  console.log(`📝 [${time}] ${action}`, details);
}

// =======================================================
// BOOKINGS – API
// =======================================================
const stmtInsert = db.prepare(`
  INSERT INTO bookings (id,name,phone,service,price,duration,dateTime,employeeId,tenant)
  VALUES (@id,@name,@phone,@service,@price,@duration,@dateTime,@employeeId,@tenant)
`);

const stmtGetAll = db.prepare(`SELECT * FROM bookings ORDER BY dateTime`);
const stmtGetByDate = db.prepare(`SELECT * FROM bookings WHERE service = ? AND dateTime = ?`);
const stmtDelete = db.prepare(`DELETE FROM bookings WHERE id = ?`);
const stmtUpdate = db.prepare(`
  UPDATE bookings 
     SET dateTime = @dateTime,
         employeeId = @employeeId       -- 👈 Mitarbeiter bleibt erhalten
   WHERE id = @id
`);

export function insertBooking(booking) {
  try {
    stmtInsert.run(booking);
    logAction("➕ Neue Buchung", booking);
    return true;
  } catch (err) {
    console.error("❌ insertBooking:", err.message);
    return false;
  }
}

export function getAllBookings() {
  try {
    return stmtGetAll.all();
  } catch (err) {
    console.error("❌ getAllBookings:", err.message);
    return [];
  }
}

export function getBookingByDate(service, dateTime) {
  try {
    return stmtGetByDate.get(service, dateTime) || null;
  } catch (err) {
    console.error("❌ getBookingByDate:", err.message);
    return null;
  }
}

export function deleteBooking(id) {
  try {
    const info = stmtDelete.run(id);
    if (info.changes > 0) logAction("🗑️ Buchung gelöscht", { id });
    return info.changes > 0;
  } catch (err) {
    console.error("❌ deleteBooking:", err.message);
    return false;
  }
}

export function updateBooking(id, newDateTime, employeeId) {
  try {
    const info = stmtUpdate.run({ id, dateTime: newDateTime, employeeId });
    if (info.changes > 0)
      logAction("📆 Termin verschoben", { id, newDateTime, employeeId });
    return info.changes > 0;
  } catch (err) {
    console.error("❌ updateBooking:", err.message);
    return false;
  }
}

export function exportByPhone(phone) {
  try {
    const stmt = db.prepare(`SELECT * FROM bookings WHERE phone = ?`);
    const data = stmt.all(phone);
    logAction("📤 DSGVO-Export", { phone, count: data.length });
    return data;
  } catch (err) {
    console.error("❌ exportByPhone:", err.message);
    return [];
  }
}

export function anonymizeByPhone(phone) {
  try {
    const info = db.prepare(`DELETE FROM bookings WHERE phone = ?`).run(phone);
    logAction("🧺 DSGVO-Löschung", { phone, deleted: info.changes });
    return info.changes > 0;
  } catch (err) {
    console.error("❌ anonymizeByPhone:", err.message);
    return false;
  }
}


// =======================================================
// 📈 ROI Helper – Revenue + Bookings in Zeitraum
// =======================================================
// Erwartung: SQLite Tabelle: bookings
// Spalten: tenant, dateTime, price
export function getRevenueAndBookingsBetween({ tenant, startISO, endISO }) {
  try {
    const row = db
      .prepare(`
        SELECT
          COUNT(*) as bookings,
          COALESCE(SUM(COALESCE(price, 0)), 0) as revenue
        FROM bookings
        WHERE tenant = ?
          AND dateTime >= ?
          AND dateTime < ?
      `)
      .get(String(tenant), String(startISO), String(endISO));

    return {
      bookings: Number(row?.bookings ?? 0),
      revenue: Number(row?.revenue ?? 0),
    };
  } catch (e) {
    console.error("❌ getRevenueAndBookingsBetween:", e.message);
    return { bookings: 0, revenue: 0 };
  }
}


// =======================================================
// EMPLOYEES – API
// =======================================================

const empSelectAll = db.prepare(
  `SELECT * FROM employees ORDER BY name COLLATE NOCASE`
);

const empSelectOne = db.prepare(
  `SELECT * FROM employees WHERE id = ?`
);

const empCount = db.prepare(
  `SELECT COUNT(*) as c FROM employees`
);

const empInsert = db.prepare(`
  INSERT INTO employees (
    id,
    name,
    role,
    email,
    phone,
    work_start,
    work_end,
    days,
    buffer,
    active,
    sick_until,
    vacation_start,
    vacation_end,
    tenant,
    color
  )
  VALUES (
    @id,
    @name,
    @role,
    @email,
    @phone,
    @work_start,
    @work_end,
    @days,
    @buffer,
    @active,
    @sick_until,
    @vacation_start,
    @vacation_end,
    @tenant,
    @color
  )
`);

const empUpdateStmt = db.prepare(`
  UPDATE employees
     SET name=@name,
         role=@role,
         email=@email,
         phone=@phone,
         work_start=@work_start,
         work_end=@work_end,
         days=@days,
         buffer=@buffer,
         active=@active,
         sick_until=@sick_until,
         vacation_start=@vacation_start,
         vacation_end=@vacation_end,
         tenant=@tenant,
         color=@color
   WHERE id=@id
`);

const empDelete = db.prepare(
  `DELETE FROM employees WHERE id = ?`
);

export function getAllEmployees(tenant = null) {
  try {
    const rows = empSelectAll.all();
    return tenant ? rows.filter(r => (r.tenant || null) === tenant) : rows;
  } catch (err) {
    console.error("❌ getAllEmployees:", err.message);
    return [];
  }
}

export function getEmployee(id) {
  try {
    return empSelectOne.get(id) || null;
  } catch (err) {
    console.error("❌ getEmployee:", err.message);
    return null;
  }
}

export function createEmployee(emp) {
  try {
    empInsert.run(emp);
    logAction("👤 Mitarbeiter angelegt", emp);
    return true;
  } catch (err) {
    console.error("❌ createEmployee:", err.message);
    return false;
  }
}

export function updateEmployee(emp) {
  try {
    const safeEmp = {
      ...emp,
      active: emp.active ? 1 : 0,
      buffer: Number(emp.buffer ?? 15),
      tenant: emp.tenant ?? null,
      color: emp.color ?? null,
      sick_until: emp.sick_until ?? null,
      vacation_start: emp.vacation_start ?? null,
      vacation_end: emp.vacation_end ?? null
    };

    const info = empUpdateStmt.run(safeEmp);
    if (info.changes > 0) {
      logAction("✏️ Mitarbeiter aktualisiert", safeEmp);
    }
    return info.changes > 0;
  } catch (err) {
    console.error("❌ updateEmployee:", err.message);
    return false;
  }
}

export function deleteEmployee(id) {
  try {
    const info = empDelete.run(id);
    if (info.changes > 0) {
      logAction("🗑️ Mitarbeiter gelöscht", { id });
    }
    return info.changes > 0;
  } catch (err) {
    console.error("❌ deleteEmployee:", err.message);
    return false;
  }
}


// =======================================================
// TODOS
// =======================================================
const todoInsert = db.prepare(`
  INSERT INTO todos (id, text, done, tenant)
  VALUES (@id, @text, @done, @tenant)
`);
const todoSelectAll = db.prepare(`SELECT * FROM todos ORDER BY created_at DESC`);
const todoUpdate = db.prepare(`UPDATE todos SET text=@text, done=@done WHERE id=@id`);
const todoDelete = db.prepare(`DELETE FROM todos WHERE id = ?`);

export function getAllTodos(tenant = null) {
  try {
    const rows = todoSelectAll.all();
    return tenant ? rows.filter((r) => (r.tenant || null) === tenant) : rows;
  } catch (err) {
    console.error("❌ getAllTodos:", err.message);
    return [];
  }
}

export function createTodo(todo) {
  try {
    todoInsert.run(todo);
    logAction("🆕 ToDo erstellt", todo);
    return true;
  } catch (err) {
    console.error("❌ createTodo:", err.message);
    return false;
  }
}

export function updateTodo(todo) {
  try {
    const info = todoUpdate.run(todo);
    if (info.changes > 0) logAction("✏️ ToDo aktualisiert", todo);
    return info.changes > 0;
  } catch (err) {
    console.error("❌ updateTodo:", err.message);
    return false;
  }
}

export function deleteTodo(id) {
  try {
    const info = todoDelete.run(id);
    if (info.changes > 0) logAction("🗑️ ToDo gelöscht", { id });
    return info.changes > 0;
  } catch (err) {
    console.error("❌ deleteTodo:", err.message);
    return false;
  }
}

// =======================================================
// 🌱 SEED
// =======================================================
export function seedEmployeesIfEmpty(seedList = []) {
  try {
    const { c } = empCount.get();
    if (c > 0) return 0;

    const tx = db.transaction((rows) => {
      rows.forEach((r) => empInsert.run(r));
    });

    tx(seedList);
    logAction("🌱 Mitarbeiter-Seed eingespielt", { count: seedList.length });
    return seedList.length;
  } catch (err) {
    console.error("❌ seedEmployeesIfEmpty:", err.message);
    return 0;
  }
}

export { db, logAction }

// =======================================================
// 🔗 AURA – DB Helper (Phase 5+)
// =======================================================

export function getDb() {
  return db;
}



// =======================================================
// ⚡ AURA ACTION LOGS – FINAL VERSION
// Einheitliches Logging-System
// =======================================================

// DEV-RESET (nur solange wir entwickeln)
db.exec(`DROP TABLE IF EXISTS aura_action_logs;`);

db.exec(`
  CREATE TABLE aura_action_logs (
    id TEXT PRIMARY KEY,
    action_id TEXT NOT NULL,
    tenant TEXT,
    decision TEXT,
    context TEXT,
    status TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_aura_action_logs_tenant_time
  ON aura_action_logs(tenant, created_at);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_aura_action_logs_tenant_time
  ON aura_action_logs(tenant, executed_at);
`);


// =======================================================
// 🔎 AURA ACTION LOGS – Reader API
// =======================================================

const auraActionLogSelect = db.prepare(`
  SELECT *
  FROM aura_action_logs
  WHERE tenant = ?
  ORDER BY created_at DESC
`);

export function getAuraActionLogs(tenant) {
  try {
    return auraActionLogSelect.all(tenant);
  } catch (err) {
    console.error("❌ getAuraActionLogs:", err.message);
    return [];
  }
}

// =======================================================
// 🧠 AURA ACTION FEEDBACK – Phase 5.5
// Lerndaten für Aktionen (Erfolg & Wirkung)
// =======================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS action_feedback (
    id TEXT PRIMARY KEY,
    action_log_id TEXT NOT NULL,
    success INTEGER NOT NULL,          -- 1 = erfolgreich, 0 = nicht erfolgreich
    impact TEXT,                       -- low | medium | high
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    tenant TEXT
  );
`);

const actionFeedbackInsert = db.prepare(`
  INSERT INTO action_feedback (
    id,
    action_log_id,
    success,
    impact,
    notes,
    tenant
  )
  VALUES (
    @id,
    @action_log_id,
    @success,
    @impact,
    @notes,
    @tenant
  )
`);

const actionFeedbackSelectByTenant = db.prepare(`
  SELECT * FROM action_feedback
  WHERE tenant = ?
  ORDER BY created_at DESC
`);

export function saveAuraActionFeedback(feedback) {
  try {
    actionFeedbackInsert.run({
      ...feedback,
      success: feedback.success ? 1 : 0,
    });
    logAction("🧠 AURA Action Feedback gespeichert", feedback);
    return true;
  } catch (err) {
    console.error("❌ saveAuraActionFeedback:", err.message);
    return false;
  }
}

export function getAuraActionFeedback(tenant) {
  try {
    return actionFeedbackSelectByTenant.all(tenant);
  } catch (err) {
    console.error("❌ getAuraActionFeedback:", err.message);
    return [];
  }
  
}
// =======================================================
// 🧠 AURA CONTEXT MEMORY – Phase 6.3.1
// Kurzzeitgedächtnis (situativer Zustand)
// =======================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS aura_context (
    tenant TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (tenant, key)
  );
`);

const auraContextUpsert = db.prepare(`
  INSERT INTO aura_context (tenant, key, value)
  VALUES (@tenant, @key, @value)
  ON CONFLICT(tenant, key)
  DO UPDATE SET value=@value, updated_at=datetime('now')
`);

const auraContextSelect = db.prepare(`
  SELECT key, value
  FROM aura_context
  WHERE tenant = ?
`);

const auraContextDeleteAll = db.prepare(`
  DELETE FROM aura_context
  WHERE tenant = ?
`);

const auraContextDeleteKey = db.prepare(`
  DELETE FROM aura_context
  WHERE tenant = ? AND key = ?
`);

export function setAuraContext({ tenant, key, value }) {
  try {
    auraContextUpsert.run({ tenant, key, value: String(value) });
    return true;
  } catch (err) {
    console.error("❌ setAuraContext:", err.message);
    return false;
  }
}

export function getAuraContext(tenant) {
  try {
    const rows = auraContextSelect.all(tenant);
    const ctx = {};
    rows.forEach(r => (ctx[r.key] = r.value));
    return ctx;
  } catch (err) {
    console.error("❌ getAuraContext:", err.message);
    return {};
  }
}

export function clearAuraContext({ tenant, key = null }) {
  try {
    if (key) {
      auraContextDeleteKey.run(tenant, key);
    } else {
      auraContextDeleteAll.run(tenant);
    }
    return true;
  } catch (err) {
    console.error("❌ clearAuraContext:", err.message);
    return false;
  }
}

// =======================================================
// 📣 AURA MARKETING OUTPUT LOG – Phase 6.5.3 (FIXED)
// =======================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS aura_marketing_actions (
    id TEXT PRIMARY KEY,
    tenant TEXT NOT NULL,

    headline TEXT,
    channels_json TEXT,
    offers_json TEXT,
    cta TEXT,
    confidence REAL,
    reason TEXT,

    status TEXT NOT NULL DEFAULT 'generated',
    created_at TEXT DEFAULT (datetime('now')),
    executed_at TEXT,

    notes TEXT
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_aura_mkt_tenant_created
  ON aura_marketing_actions(tenant, created_at);
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_aura_mkt_tenant_status
  ON aura_marketing_actions(tenant, status);
`);

const mktInsert = db.prepare(`
  INSERT INTO aura_marketing_actions (
    id, tenant, headline, channels_json, offers_json, cta, confidence, reason, status
  ) VALUES (
    @id, @tenant, @headline, @channels_json, @offers_json, @cta, @confidence, @reason, @status
  )
`);

const mktUpdateStatus = db.prepare(`
  UPDATE aura_marketing_actions
     SET status = @status,
         executed_at = datetime('now'),
         notes = COALESCE(@notes, notes)
   WHERE id = @id AND tenant = @tenant
`);

const mktSelectHistory = db.prepare(`
  SELECT *
    FROM aura_marketing_actions
   WHERE tenant = @tenant
   ORDER BY created_at DESC
   LIMIT @limit
`);

const mktSelectHistoryByStatus = db.prepare(`
  SELECT *
    FROM aura_marketing_actions
   WHERE tenant = @tenant AND status = @status
   ORDER BY created_at DESC
   LIMIT @limit
`);

export function insertAuraMarketingAction(record) {
  try {

    // ---------------------------------------------------
    // 🔒 1️⃣ Existenz prüfen (keine Doppel-Inserts mehr)
    // ---------------------------------------------------
    const existing = db.prepare(`
      SELECT id
      FROM aura_marketing_actions
      WHERE id = ? AND tenant = ?
    `).get(record.id, record.tenant);

    if (existing) {
      // Schon vorhanden → NICHT erneut speichern
      return false;
    }

    // ---------------------------------------------------
    // 2️⃣ Insert nur wenn nicht vorhanden
    // ---------------------------------------------------
    mktInsert.run({
      id: record.id,
      tenant: record.tenant,
      headline: record.headline ?? null,
      channels_json: JSON.stringify(record.channels ?? []),
      offers_json: JSON.stringify(record.offers ?? []),
      cta: record.cta ?? null,
      confidence:
        typeof record.confidence === "number"
          ? record.confidence
          : null,

      // 🔥 reason sauber serialisieren
      reason: record.reason
        ? JSON.stringify(record.reason)
        : null,

      status: record.status ?? "generated",
    });

    logAction("📣 AURA Marketing gespeichert", {
      id: record.id,
      tenant: record.tenant,
    });

    return true;

  } catch (err) {
    console.error("❌ insertAuraMarketingAction:", err.message);
    return false;
  }
}


// ROI / IMPACT Felder ergänzen (falls noch nicht vorhanden)
const marketingCols = db.prepare(`
  PRAGMA table_info(aura_marketing_actions)
`).all().map(c => c.name);

const roiCols = [
  { name: "impact_revenue", type: "REAL" },
  { name: "impact_bookings", type: "INTEGER" },
  { name: "roi_score", type: "REAL" }
];

for (const col of roiCols) {
  if (!marketingCols.includes(col.name)) {
    try {
      db.exec(`ALTER TABLE aura_marketing_actions ADD COLUMN ${col.name} ${col.type};`);
      console.log(`📊 ROI-Spalte '${col.name}' hinzugefügt.`);
    } catch (err) {
      console.warn(`⚠️ ROI-Spalte '${col.name}' konnte nicht hinzugefügt werden:`, err.message);
    }
  }
}


// =======================================================
// 📈 PHASE 8.1 – Forecast Dataset (Daily Aggregates)
// =======================================================

export function getAuraDailyKpis({ tenant, days = 60 } = {}) {
  if (!tenant) return [];

  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);

  const rows = db.prepare(`
    SELECT
      substr(dateTime, 1, 10) AS day,
      COUNT(*)               AS bookings,
      SUM(price)             AS revenue,
      CASE 
        WHEN COUNT(*) > 0 THEN (SUM(price) / COUNT(*))
        ELSE 0
      END AS avg_booking_value
    FROM bookings
    WHERE tenant = ?
      AND dateTime >= ?
      AND dateTime <= ?
    GROUP BY substr(dateTime, 1, 10)
    ORDER BY day ASC
  `).all(
    tenant,
    start.toISOString(),
    end.toISOString()
  );

  return rows.map(r => ({
    day: r.day,
    bookings: Number(r.bookings || 0),
    revenue: Number(r.revenue || 0),
    avg_booking_value: Number(r.avg_booking_value || 0),
  }));
}


// =======================================================
// 📈 PHASE 8.3 – Trend Forecast (Simple Linear Trend)
// =======================================================

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Einfache lineare Trend-Steigung (Slope) über die letzten N Punkte
function slope(values) {
  const n = values.length;
  if (n < 2) return 0;

  // x = 0..n-1
  const xs = Array.from({ length: n }, (_, i) => i);
  const xBar = mean(xs);
  const yBar = mean(values);

  let num = 0;
  let den = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i] - xBar;
    const y = values[i] - yBar;
    num += x * y;
    den += x * x;
  }

  return den === 0 ? 0 : num / den; // units: "per day"
}

// Gibt 7-Tage Forecast zurück basierend auf Trend + Baseline
export function buildTrendForecast(history = [], horizonDays = 7) {
  // history: [{day, bookings, revenue, avg_booking_value}]
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  // Nimmt die letzten 14 Tage (oder weniger) für den Trend
  const window = history.slice(-14);
  const bookingsSeries = window.map(d => Number(d.bookings || 0));
  const revenueSeries = window.map(d => Number(d.revenue || 0));

  const baseBookings = mean(bookingsSeries);
  const baseRevenue = mean(revenueSeries);

  const bSlope = slope(bookingsSeries);
  const rSlope = slope(revenueSeries);

  // Stabilitäts-Regeln (damit Forecast nicht "ausrastet")
  const maxBookingsStep = Math.max(1, baseBookings * 0.35); // max 35%/Tag oder mind. 1
  const maxRevenueStep = Math.max(10, baseRevenue * 0.35);  // max 35%/Tag oder mind. 10€

  const forecast = [];

  for (let i = 1; i <= horizonDays; i++) {
    // Trend: baseline + slope * i
    const predictedBookings = clamp(baseBookings + bSlope * i, 0, baseBookings + maxBookingsStep * i);
    const predictedRevenue = clamp(baseRevenue + rSlope * i, 0, baseRevenue + maxRevenueStep * i);

    forecast.push({
      day_offset: i,
      predicted_bookings: Number(predictedBookings.toFixed(2)),
      predicted_revenue: Number(predictedRevenue.toFixed(2)),
    });
  }

  return forecast;
}

import { computeForecastConfidence } from "./auraForecastConfidenceService.js";
import { detectWeeklySeasonality, applySeasonality } from "./auraSeasonalityService.js";
import { detectForecastDropTrigger } from "./auraForecastTriggerService.js";

export function buildForecastV2(history = [], horizonDays = 7) {
  const baseForecast = buildTrendForecast(history, horizonDays);

  const seasonality = detectWeeklySeasonality(history);
  const adjustedForecast = applySeasonality(baseForecast, seasonality);

  const { confidence, reliability } = computeForecastConfidence(history);

  const trigger = detectForecastDropTrigger({
    history,
    adjustedForecast,
    confidence,
  });

  return {
    model: "trend-linear-v2",
    baseForecast,
    adjustedForecast,
    seasonality,
    confidence,
    reliability,
    trigger,
  };
}


export function updateAuraMarketingStatus({ id, tenant, status, notes = null }) {
  try {

    // ===================================================
    // 1️⃣ Status updaten
    // ===================================================
    const info = db.prepare(`
      UPDATE aura_marketing_actions
         SET status = ?,
             notes = ?
       WHERE id = ?
         AND tenant = ?
    `).run(status, notes, id, tenant);

    if (info.changes === 0) {
      console.warn("⚠️ Kein Marketing-Datensatz gefunden:", { id, tenant });
      return false;
    }

    logAction("✅ AURA Marketing Status update", { id, tenant, status });

    // ===================================================
    // 2️⃣ ROI nur berechnen wenn executed
    // ===================================================
    if (status !== "executed") {
      return true;
    }

    const record = db.prepare(`
      SELECT created_at
      FROM aura_marketing_actions
      WHERE id = ?
        AND tenant = ?
    `).get(id, tenant);

    if (!record?.created_at) {
      console.warn("⚠️ created_at fehlt – ROI nicht berechnet:", { id });
      return true;
    }

    const created = new Date(record.created_at);
    const beforeStart = new Date(created.getTime() - 7 * 86400000);
    const afterEnd = new Date(created.getTime() + 7 * 86400000);

    const before = db.prepare(`
      SELECT SUM(price) as revenue, COUNT(*) as bookings
      FROM bookings
      WHERE tenant = ?
        AND dateTime >= ?
        AND dateTime < ?
    `).get(
      tenant,
      beforeStart.toISOString(),
      created.toISOString()
    );

    const after = db.prepare(`
      SELECT SUM(price) as revenue, COUNT(*) as bookings
      FROM bookings
      WHERE tenant = ?
        AND dateTime >= ?
        AND dateTime <= ?
    `).get(
      tenant,
      created.toISOString(),
      afterEnd.toISOString()
    );

    const beforeRev = Number(before?.revenue || 0);
    const afterRev = Number(after?.revenue || 0);
    const beforeCount = Number(before?.bookings || 0);
    const afterCount = Number(after?.bookings || 0);

    const impactRevenue = afterRev - beforeRev;
    const impactBookings = afterCount - beforeCount;
    const roiScore =
      beforeRev > 0 ? Number((impactRevenue / beforeRev).toFixed(3)) : null;

    // ===================================================
    // 3️⃣ ROI in Marketing Tabelle speichern
    // ===================================================
    db.prepare(`
      UPDATE aura_marketing_actions
         SET impact_revenue = ?,
             impact_bookings = ?,
             roi_score = ?
       WHERE id = ?
         AND tenant = ?
    `).run(
      impactRevenue,
      impactBookings,
      roiScore,
      id,
      tenant
    );

    console.log("📊 ROI berechnet:", {
      impactRevenue,
      impactBookings,
      roiScore
    });

    // ===================================================
    // 4️⃣ 🔥 AUTOMATISCHES LEARNING FEEDBACK
    // ===================================================
    recordAuraActionFeedback({
      action_log_id: id,
      success: roiScore !== null ? roiScore > 0 : false,
      impact:
        roiScore !== null
          ? roiScore > 2
            ? "high"
            : roiScore > 1
              ? "medium"
              : "low"
          : "unknown",
      notes: "auto-roi-evaluation",
      tenant,
      roi: roiScore,
      impact_revenue: impactRevenue,
      impact_bookings: impactBookings
    });

    return true;

  } catch (err) {
    console.error("❌ updateAuraMarketingStatus:", err.message);
    return false;
  }
}



// =======================================================
// 📜 AURA MARKETING HISTORY – DB API (FEHLTE!)
// =======================================================

export function getAuraMarketingHistory({ tenant, limit = 30, status = null }) {
  try {
    const lim = Math.max(1, Math.min(200, Number(limit) || 30));

    const rows = status
      ? mktSelectHistoryByStatus.all({ tenant, status, limit: lim })
      : mktSelectHistory.all({ tenant, limit: lim });

    return rows.map((r) => ({
      ...r,
      channels: safeJsonParse(r.channels_json, []),
      offers: safeJsonParse(r.offers_json, []),
      reason: safeJsonParse(r.reason, r.reason),
      impact_revenue: r.impact_revenue ?? null,
      impact_bookings: r.impact_bookings ?? null,
      roi_score: r.roi_score ?? null,
    }));
  } catch (err) {
    console.error("❌ getAuraMarketingHistory:", err.message);
    return [];
  }
}

function safeJsonParse(value, fallback) {
  try {
    if (value == null) return fallback;
    if (typeof value === "object") return value;
    if (typeof value !== "string") return fallback;

    const s = value.trim();
    if (!s) return fallback;

    if (s.startsWith("[") || s.startsWith("{")) {
      return JSON.parse(s);
    }

    return value;
  } catch {
    return fallback;
  }
}


// =======================================================
// 🔄 PHASE 11.1 – Auto Expire Generated Marketing Actions
// Läuft passiv bei Monitor-Aufruf
// =======================================================

export function expireOldGeneratedMarketingActions({
  tenant,
  days = 5
}) {
  if (!tenant) return { expiredCount: 0 };

  try {
    const result = db.prepare(`
      UPDATE aura_marketing_actions
         SET status = 'expired'
       WHERE tenant = ?
         AND status = 'generated'
         AND created_at <= datetime('now', ?)
    `).run(
      tenant,
      `-${days} days`
    );

    if (result.changes > 0) {
      console.log("🗂️ Auto-Expire ausgeführt:", {
        tenant,
        expired: result.changes
      });
    }

    return {
      expiredCount: result.changes || 0
    };

  } catch (err) {
    console.error("❌ expireOldGeneratedMarketingActions:", err.message);
    return { expiredCount: 0 };
  }
}


