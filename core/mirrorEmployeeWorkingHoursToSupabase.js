import { getSupabase, isSupabaseEnabled } from "./supabase.js";
import { getAllEmployees } from "./db.js";

/**
 * Spiegel employee_working_hours von SQLite → Supabase
 * - pro Mitarbeiter genau 1 Datensatz
 * - Idempotent via employee_id (Supabase UUID!)
 * - Best-effort (niemals crashen)
 */
export async function mirrorEmployeeWorkingHoursToSupabase(studioId) {
  if (!isSupabaseEnabled()) return;
  if (process.env.SUPABASE_MIRROR_MODE !== "read_only") return;

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const employees = getAllEmployees(studioId);
    if (!Array.isArray(employees) || employees.length === 0) return;

    for (const e of employees) {
      if (!e.id) continue;

      // 1️⃣ Supabase Employee via external_id finden
      const { data: emp, error: empErr } = await supabase
        .from("employees")
        .select("id")
        .eq("external_id", String(e.id))
        .single();

      if (empErr || !emp) {
        console.warn("⚠️ employee not found for working_hours:", e.name);
        continue;
      }

      // 2️⃣ working_hours upserten (MIT Supabase UUID)
      const payload = {
        employee_id: emp.id,              // ✅ RICHTIG
        studio_id: studioId,
        work_start: e.work_start || "09:00",
        work_end: e.work_end || "18:00",
        working_days: e.days || "Mo-Fr",
        buffer_minutes: Number(e.buffer ?? 15),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("employee_working_hours")
        .upsert(payload, {
          onConflict: "employee_id",
        });

      if (error) {
        console.warn(
          `⚠️ working_hours mirror failed for ${e.name}:`,
          error.message
        );
      } else {
        console.log(`⏱️ working_hours mirrored for ${e.name}`);
      }
    }
  } catch (err) {
    console.warn("⚠️ working_hours mirror exception:", err.message);
  }
}


