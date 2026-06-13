// =======================================================
// 📘 booking.js — Adapter → appointments (Supabase optional)
// EINZIGE TERMIN-WAHRHEIT: public.appointments
// Supabase läuft optional (Offline-First Safe Mode)
// =======================================================

import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

// 🔁 SQLite Mirror (für RFM / Segmentierung – Phase 10)
// 👉 Pfad ggf. anpassen, z. B. "../core/db.js" oder "./db.js"
import { insertBooking } from "../core/db.js";
import { loadTenantConfig } from "../core/utils.js";

// =====================
// FEATURE FLAGS
// =====================
const USE_SUPABASE = process.env.USE_SUPABASE === "true";

console.log("BOOKING ENV:", process.env.AURA_SQLITE_MIRROR);


// =====================
// SUPABASE INIT (nur wenn aktiv)
// =====================
let supabase = null;

if (USE_SUPABASE) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log("☁️ Supabase Sync aktiviert");
} else {
  console.log("💾 Supabase deaktiviert (Offline-Mode aktiv)");
}

// =====================
// SERVICES AUS TENANT CONFIG
// =====================
function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getConfigService(serviceName, tenant = process.env.TENANT_DEFAULT || "beauty_lounge") {
  const cfg = loadTenantConfig(tenant);
  const list = Array.isArray(cfg?.services) ? cfg.services : [];

  const key = normalizeText(serviceName);

  return list.find((s) => {
    const name = normalizeText(s.name);

    const aliases = Array.isArray(s.aliases)
      ? s.aliases.map(a => normalizeText(a))
      : [];

    return name === key || aliases.includes(key);
  });
}

export function services(tenant = process.env.TENANT_DEFAULT || "beauty_lounge") {
  const cfg = loadTenantConfig(tenant);
  return Array.isArray(cfg?.services)
    ? cfg.services.map((s) => s.name)
    : [];
}

// =====================
// HELPERS
// =====================
function roundTo15(date) {
  const ms = 1000 * 60 * 15;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

function normalizeService(service, tenant = process.env.TENANT_DEFAULT || "beauty_lounge") {
  return getConfigService(service, tenant);
}

// =====================
// CREATE BOOKING
// =====================
export async function createBooking({
  name,
  phone,
  service,
  dateTime,
  employee_id,
  studio_id = process.env.STUDIO_ID || "f3bcd2bf-89c3-4891-b01c-ef1693df674c",
}) {
  if (!name || !service || !dateTime || !employee_id) {
    return {
      status: "error",
      message: "❌ Name, Service, Zeit und Mitarbeiter sind erforderlich.",
    };
  }

  const tenantId = process.env.TENANT_DEFAULT || "beauty_lounge";

  const srv = normalizeService(
    service,
    tenantId
  );

  console.log("🔍 SERVICE SUCHE:", service);
  console.log("🔍 SERVICE AUS CONFIG:", srv);
  console.log("🧪 DURATION:", srv?.duration);
  console.log("🧪 PRICE:", srv?.price);
  console.log("🧪 NAME:", srv?.name);

  if (!srv) {
    return {
      status: "error",
      message: "❌ Unbekannter Service."
    };
  }

  const start = roundTo15(new Date(dateTime));

  if (isNaN(start)) {
    return {
      status: "error",
      message: "❌ Ungültiges Datum."
    };
  }

  const end = new Date(start.getTime() + srv.duration * 60000);

  const payload = {
    id: uuidv4(),
    studio_id,
    employee_id,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    duration_minutes: srv.duration,
    price: srv.price,

    // 🔥 WICHTIG für RFM / WhatsApp / Segmentierung
    customer_name: name,
    customer_phone: phone || null,

    notes: `${name} · ${srv.name} · Tel: ${phone || "-"}`,
    status: "pending",
  };

  try {

    // ==========================
    // OPTIONAL SUPABASE SYNC
    // ==========================
    if (USE_SUPABASE && supabase) {
      const { error } = await supabase
        .from("appointments")
        .insert(payload);

      if (error) throw error;

      console.log("☁️ Supabase Sync erfolgreich");
    }

    // ==========================
    // 🔁 SQLITE MIRROR (OFFLINE-SAFE)
    // ==========================
    if (process.env.AURA_SQLITE_MIRROR === "true") {
      try {

        console.log("🔥 SQLITE MIRROR PAYLOAD:", {
          id: payload.id,
          name: payload.customer_name,
          phone: payload.customer_phone,
          service: srv.name,
          price: payload.price,
          duration: payload.duration_minutes,
          dateTime: payload.start_time,
          employeeId: payload.employee_id,
          tenant: payload.studio_id,
        });

        const sqliteResult = insertBooking({
          id: payload.id,
          name: payload.customer_name,
          phone: payload.customer_phone,
          service: srv.name,
          price: payload.price,
          duration: payload.duration_minutes,
          dateTime: payload.start_time,
          employeeId: payload.employee_id,
          tenant: payload.studio_id, // Studio = Tenant
        });

        console.log("🔥 SQLITE RESULT:", sqliteResult);

        if (!sqliteResult) {
          console.warn("⚠️ SQLite konnte Termin nicht speichern.");
        }

        if (sqliteResult?.error) {
          console.warn("⚠️ SQLite Fehler:", sqliteResult.error);
        }

      } catch (e) {
        console.warn(
          "⚠️ SQLite Mirror fehlgeschlagen (läuft weiter):",
          e.message
        );
      }
    }

    return {
      status: "confirmed",
      message:
        `✅ Termin im Kalender angelegt\n` +
        `👤 ${name}\n` +
        `💅 ${srv.name}\n` +
        `🕒 ${start.toLocaleString("de-DE")}`,
      appointment: payload,
    };

  } catch (err) {

    // 🔥 SYSTEM DARF NICHT STERBEN
    console.error("⚠️ Supabase Sync fehlgeschlagen — läuft offline weiter:", err.message);

    return {
      status: "confirmed",
      message:
        `✅ Termin im Kalender angelegt (Offline-Sync später)\n` +
        `👤 ${name}\n` +
        `💅 ${srv.name}\n` +
        `🕒 ${start.toLocaleString("de-DE")}`,
      appointment: payload,
      sync: "pending",
    };
  }
}

// =====================
// CANCEL BOOKING
// =====================
export async function cancelBooking({ appointment_id }) {
  if (!appointment_id) {
    return { status: "error", message: "❌ appointment_id fehlt." };
  }

  try {
    if (USE_SUPABASE && supabase) {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointment_id);

      if (error) throw error;
    }

    return { status: "cancelled", message: "✅ Termin storniert." };

  } catch (err) {
    console.error("cancelBooking error:", err.message);
    return { status: "error", message: "❌ Stornierung fehlgeschlagen." };
  }
}

// =====================
// RESCHEDULE
// =====================
export async function rescheduleBooking({
  appointment_id,
  newDateTime,
}) {
  if (!appointment_id || !newDateTime) {
    return { status: "error", message: "❌ Daten fehlen." };
  }

  const start = roundTo15(new Date(newDateTime));
  if (isNaN(start)) {
    return { status: "error", message: "❌ Ungültiges Datum." };
  }

  try {

    if (USE_SUPABASE && supabase) {
      const { data: appt } = await supabase
        .from("appointments")
        .select("duration_minutes")
        .eq("id", appointment_id)
        .single();

      if (!appt) throw new Error("Termin nicht gefunden");

      const end = new Date(start.getTime() + appt.duration_minutes * 60000);

      const { error } = await supabase
        .from("appointments")
        .update({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        })
        .eq("id", appointment_id)
        .eq("status", "pending");

      if (error) throw error;
    }

    return {
      status: "rescheduled",
      message: `✅ Termin verschoben auf ${start.toLocaleString("de-DE")}`,
    };

  } catch (err) {
    console.error("rescheduleBooking error:", err.message);
    return {
      status: "error",
      message: "❌ Verschieben nicht möglich.",
    };
  }
}