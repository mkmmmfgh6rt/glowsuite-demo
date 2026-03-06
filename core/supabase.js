// core/supabase.js
import { createClient } from "@supabase/supabase-js";

let supabase = null;
let enabledCache = null;

function initSupabaseIfNeeded() {
  if (enabledCache !== null) return;

  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ENABLED,
    SUPABASE_MIRROR_MODE,
  } = process.env;

  const isEnabled =
    SUPABASE_ENABLED === "true" &&
    !!SUPABASE_URL &&
    !!SUPABASE_SERVICE_ROLE_KEY;

  enabledCache = isEnabled;

  if (isEnabled) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log(
      `🟢 Supabase aktiv | Mode=${SUPABASE_MIRROR_MODE || "undefined"}`
    );
  } else {
    console.log("🔵 Supabase deaktiviert (SQLite Master aktiv)");
  }
}

export function getSupabase() {
  initSupabaseIfNeeded();
  return supabase;
}

export function isSupabaseEnabled() {
  initSupabaseIfNeeded();
  return enabledCache === true;
}
