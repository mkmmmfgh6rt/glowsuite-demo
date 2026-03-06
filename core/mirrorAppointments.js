// core/mirrorAppointments.js
import { getSupabase, isSupabaseEnabled } from "./supabase.js";
import { getAllBookings } from "./db.js";

/**
 * Spiegel appointments von SQLite nach Supabase.
 * - Best-effort
 * - Asynchron
 * - Idempotent via external_id
 */
export async function mirrorAppointmentsToSupabase(studioId) {
  if (!isSupabaseEnabled()) return;
  if (process.env.SUPABASE_MIRROR_MODE !== "read_only") return;

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const bookings = getAllBookings();
    if (!Array.isArray(bookings) || bookings.length === 0) return;

    const payload = bookings.map((b) => ({
      studio_id: studioId,
      employee_id: b.employeeId ?? null,

      start_time: b.start_time ?? b.dateTime ?? null,
      end_time: b.end_time ?? null,
      duration_minutes: Number(b.duration ?? 60),

      price: Number(b.price ?? 0),
      status: b.status ?? "confirmed",
      notes: b.notes ?? null,

      external_source: "sqlite",
      external_id: String(b.id),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("appointments")
      .upsert(payload, {
        onConflict: "external_id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.warn("⚠️ Mirror appointments failed:", error.message);
    } else {
      console.log(`🔁 Mirror appointments ok (${payload.length})`);
    }
  } catch (err) {
    console.warn("⚠️ Mirror appointments exception:", err.message);
  }
}

