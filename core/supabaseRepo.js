// core/supabaseRepo.js
import { getSupabase, isSupabaseEnabled } from "./supabase.js";

/**
 * Phase 2: Supabase ist nur ein Read-Only-Spiegel.
 * SQLite bleibt Master. Supabase darf niemals den Flow blockieren.
 */

export async function fetchEmployeesFromSupabase(studioId) {
  if (!isSupabaseEnabled()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("studio_id", studioId);

  if (error) {
    console.warn("⚠️ Supabase employees read:", error.message);
    return null;
  }

  return data || [];
}

export async function fetchAppointmentsFromSupabase(studioId) {
  if (!isSupabaseEnabled()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("studio_id", studioId);

  if (error) {
    console.warn("⚠️ Supabase appointments read:", error.message);
    return null;
  }

  return data || [];
}

