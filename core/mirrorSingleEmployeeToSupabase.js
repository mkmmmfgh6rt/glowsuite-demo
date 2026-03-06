import { getSupabase, isSupabaseEnabled } from "./supabase.js";

/**
 * Spiegel einen einzelnen Mitarbeiter (Stammdaten) von SQLite → Supabase employees
 * Arbeitszeiten kommen NICHT hier rein.
 */
export async function mirrorSingleEmployeeToSupabase(employee, studioId) {
  if (!isSupabaseEnabled()) return;
  if (process.env.SUPABASE_MIRROR_MODE !== "read_only") return;

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const payload = {
      studio_id: studioId,
      name: employee.name,
      role: employee.role ?? null,
      email: employee.email ?? null,
      phone: employee.phone ?? null,
      active: Boolean(employee.active),
      external_source: "sqlite",
      external_id: String(employee.id),
    };

    const { error } = await supabase
      .from("employees")
      .upsert(payload, { onConflict: "external_id" });

    if (error) {
      console.warn("⚠️ Mirror single employee failed:", error.message);
    } else {
      console.log(`🔁 Employee mirrored (employees): ${employee.name}`);
    }
  } catch (err) {
    console.warn("⚠️ Mirror single employee exception:", err.message);
  }
}

