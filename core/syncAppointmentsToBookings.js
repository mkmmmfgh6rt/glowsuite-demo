import { createClient } from "@supabase/supabase-js";
import db from "./db.js"; // dein SQLite-DB-Handle

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function syncAppointmentsToBookings({ studio_id, tenant }) {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, start_time, price, employee_id, studio_id, status")
    .eq("studio_id", studio_id)
    .eq("status", "confirmed"); // nur echte Buchungen

  if (error) throw error;

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO bookings (id, tenant, dateTime, price, employee_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const a of data) {
    stmt.run(
      a.id,
      tenant,
      a.start_time,
      a.price,
      a.employee_id
    );
  }

  return { synced: data.length };
}