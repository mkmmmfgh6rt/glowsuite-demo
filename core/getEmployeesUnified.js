import { getSupabase, isSupabaseEnabled } from "./supabase.js";
import { getEmployee } from "./db.js";

export async function getEmployeeUnified(employeeId) {
  // 1️⃣ Supabase bevorzugen
  if (isSupabaseEnabled()) {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        name,
        role,
        email,
        phone,
        active,
        employee_working_hours (
          work_start,
          work_end,
          working_days,
          buffer_minutes
        )
      `)
      .eq("id", employeeId)
      .single();

    if (!error && data) {
      const wh = data.employee_working_hours?.[0] || {};

      console.log("👤 Employee MASTER = Supabase");

      return {
        id: data.id,
        name: data.name,
        role: data.role || "",
        email: data.email || "",
        phone: data.phone || "",
        active: data.active ? 1 : 0,
        work_start: wh.work_start || "09:00",
        work_end: wh.work_end || "18:00",
        days: wh.working_days || "Mo,Di,Mi,Do,Fr",
        buffer: wh.buffer_minutes ?? 15,
        source: "supabase",
      };
    }

    console.warn("⚠️ Supabase employee leer – fallback SQLite");
  }

  // 2️⃣ SQLite Fallback
  const emp = getEmployee(employeeId);
  if (!emp) return null;

  console.log("👤 Employee FALLBACK = SQLite");

  return {
    ...emp,
    source: "sqlite",
  };
}

