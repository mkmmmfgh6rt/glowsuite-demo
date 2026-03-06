// core/storageMode.js
// zentrale Storage- / Read-Policy
// STORAGE_MODE: sqlite | supabase | dual  (allgemeiner Modus)
// READ_MODE: sqlite | supabase | unified  (nur Lesen, kontrollierter Phase-4-Switch)

export const STORAGE_MODE = process.env.STORAGE_MODE || "sqlite";
// sqlite | supabase | dual

export const READ_MODE = process.env.READ_MODE || "unified";
// sqlite | supabase | unified

export const isSupabaseEnabled = !!(
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
