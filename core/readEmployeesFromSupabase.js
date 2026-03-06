import { getSupabase, isSupabaseEnabled } from "./supabase.js";

// 🔒 Feste Studio-ID (Phase 2 – bewusst hart codiert)
const STUDIO_ID = "f3bcd2bf-89c3-4891-b01c-ef1693df674c";

export async function readEmployeesFromSupabase() {
  if (!isSupabaseEnabled()) {
    console.log("ℹ️ Supabase nicht aktiv – skip read");
    return [];
  }

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("employees")
    .select("id, name, external_id")
    .eq("studio_id", STUDIO_ID);

  if (error) {
    console.warn("⚠️ Supabase read employees failed:", error.message);
    return [];
  }

  console.log(
    "👥 Employees READ from Supabase:",
    data.map(e => ({
      id: e.id,
      name: e.name,
      external_id: e.external_id,
    }))
  );

  return data;
}

