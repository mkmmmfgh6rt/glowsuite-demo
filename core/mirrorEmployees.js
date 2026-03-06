// core/mirrorEmployees.js
import { getSupabase, isSupabaseEnabled } from "./supabase.js";
import { getAllEmployees } from "./db.js";

export async function mirrorEmployeesToSupabase(studioId) {
  if (!isSupabaseEnabled()) return;
  if (process.env.SUPABASE_MIRROR_MODE !== "read_only") return;

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const employees = getAllEmployees(studioId);
    if (!Array.isArray(employees) || employees.length === 0) return;

    const payload = employees.map((e) => ({
      studio_id: studioId,
      name: e.name,
      phone: e.phone ?? null,
      active: Boolean(e.active),
      external_source: "sqlite",
      external_id: String(e.id),
    }));

    const { error } = await supabase
      .from("employees")
      .upsert(payload, { onConflict: "external_id" });

    if (error) {
      console.warn("⚠️ Mirror employees failed:", error.message);
    } else {
      console.log(`🔁 Mirror employees ok (${payload.length})`);
    }
  } catch (err) {
    console.warn("⚠️ Mirror employees exception:", err.message);
  }
}

