// resetAll.js — löscht Datenbank + PDFs + ICS-Dateien
import fs from "fs";
import path from "path";

// --- DB-Datei löschen ---
function resetDB() {
  const dbFile = process.env.TEST_MODE === "true" ? "bookings_test.db" : "bookings.db";
  const dbPath = path.join(process.cwd(), dbFile);

  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("🗑️ Datenbank gelöscht:", dbPath);
  } else {
    console.log("ℹ️ Keine Datenbank gefunden:", dbPath);
  }
}

// --- Ordner leeren ---
function clearDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const filePath = path.join(dir, f);
    fs.unlinkSync(filePath);
  }
  console.log(`🗑️ Ordner geleert: ${dir}`);
}

function resetFiles() {
  const pdfDir = path.join(process.cwd(), "pdf");
  const icsDir = path.join(process.cwd(), "ics");

  clearDir(pdfDir);
  clearDir(icsDir);
}

// --- Alles zurücksetzen ---
resetDB();
resetFiles();

console.log("✅ Komplettes Reset abgeschlossen!");
