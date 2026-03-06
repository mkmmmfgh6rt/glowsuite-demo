import { getAllBookings } from "./db.js";
import { getSupabase, isSupabaseEnabled } from "./supabase.js";
import { READ_MODE } from "./storageMode.js";

// =======================================================
// 🕒 Hilfsfunktion – Datum normalisieren
// =======================================================
function toISO(v) {
  if (!v) return null;
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString();
  return String(v);
}

// =======================================================
// 📅 Appointments – Unified Reader
// =======================================================
export async function getAppointmentsUnified(tenant) {
  // ===============================
  // 🟤 SQLITE ONLY (Debug / Notfall)
  // ===============================
  if (READ_MODE === "sqlite") {
    console.log("🟤 Appointments READ_MODE = sqlite");
    return readFromSQLite(tenant);
  }

  // ===============================
  // 🔵 SUPABASE ONLY
  // ===============================
  if (READ_MODE === "supabase") {
    if (!isSupabaseEnabled()) {
      console.warn("⚠️ Supabase nicht verfügbar – fallback SQLite");
      return readFromSQLite(tenant);
    }

    const data = await readFromSupabase(tenant);
    if (data.length > 0) {
      console.log("🔵 Appointments READ_MODE = supabase");
      return data;
    }

    console.warn("⚠️ Supabase leer – fallback SQLite");
    return readFromSQLite(tenant);
  }

  // ===============================
  // 🟢 UNIFIED (Standard)
  // ===============================
  if (READ_MODE === "unified") {
    if (isSupabaseEnabled()) {
      const data = await readFromSupabase(tenant);
      if (data.length > 0) {
        console.log("🟢 Appointments READ_MODE = unified (supabase)");
        return data;
      }
      console.warn("⚠️ Supabase leer – fallback SQLite");
    }

    console.log("🟡 Appointments READ_MODE = unified (sqlite)");
    return readFromSQLite(tenant);
  }

  console.warn("⚠️ Unbekannter READ_MODE – fallback SQLite");
  return readFromSQLite(tenant);
}

// =======================================================
// 🔽 SQLITE
// =======================================================
function readFromSQLite(tenant) {
  const rows = getAllBookings() || [];
  const filtered = tenant
    ? rows.filter(r => (r.tenant || null) === tenant)
    : rows;

  return filtered.map(b => ({
    id: b.id,
    name: b.name || "",
    phone: b.phone || "",
    service: b.service || "",
    price: Number(b.price || 0),
    duration: Number(b.duration || 0),
    dateTime: toISO(b.dateTime),
    employeeId: b.employeeId || null,
    tenant: b.tenant || tenant || null,
    source: "sqlite",
  }));
}

// =======================================================
// 🔵 SUPABASE (Read-Only, Phase 4.1)
// =======================================================
async function readFromSupabase(tenant) {
  try {
    const supabase = getSupabase();

    let q = supabase
      .from("appointments")
      .select(`
        id,
        price,
        status,
        start_time,
        end_time,
        duration_minutes,
        employee_id,
        external_id
      `);

    const { data, error } = await q;

    if (error || !Array.isArray(data)) {
      console.warn(
        "⚠️ Supabase appointments read error:",
        error?.message
      );
      return [];
    }

    return data.map(a => ({
      id: a.id,
      name: "", // Phase 4.2 (customers)
      phone: "",
      service: "",
      price: Number(a.price || 0),
      duration: Number(a.duration_minutes || 0),
      dateTime: toISO(a.start_time),
      employeeId: a.employee_id || null,
      tenant,
      source: "supabase",
    }));
  } catch (err) {
    console.warn("⚠️ Supabase appointments exception:", err.message);
    return [];
  }
}
