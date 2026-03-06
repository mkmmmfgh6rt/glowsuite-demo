// testAgent.js — Finale Test-Suite
import { runAgent } from "./agent.js";
import { getAllBookings } from "./db.js";
import fs from "fs";
import path from "path";

// Hilfsfunktion: Alle Dateien in Ordner auflisten
function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

// Hilfsfunktion für saubere Überschriften
function section(title) {
  console.log("\n==============================");
  console.log("🧪 " + title);
  console.log("==============================");
}

async function runTests() {
  const userId = "testUser";

  // 1) Buchung anlegen
  section("1) Begrüßung");
  console.log(await runAgent(userId, "")); // Start

  section("2) Vorname");
  console.log(await runAgent(userId, "Anna"));

  section("3) Nachname");
  console.log(await runAgent(userId, "Musterfrau"));

  section("4) Telefonnummer");
  console.log(await runAgent(userId, "0170123456"));

  section("5) Service auswählen");
  console.log(await runAgent(userId, "Haarschnitt Damen"));

  section("6) Termin eingeben (gültig)");
  console.log(await runAgent(userId, "12.09.2025 14:00"));

  // 2) Zweite Buchung
  section("7) Neue Buchung starten");
  console.log(await runAgent(userId, "")); // Reset
  console.log(await runAgent(userId, "Anna"));
  console.log(await runAgent(userId, "Musterfrau"));
  console.log(await runAgent(userId, "0170123456"));
  console.log(await runAgent(userId, "Pediküre"));
  console.log(await runAgent(userId, "13.09.2025 15:00"));

  // 3) Tests auf Manager-Funktionen
  section("8) Termin stornieren (erste Buchung)");
  console.log(await runAgent(userId, "Bitte storniere meinen Termin am 12.09.2025 14:00"));

  section("9) Termin verschieben (zweite Buchung)");
  console.log(
    await runAgent(
      userId,
      "Bitte verschiebe meinen Termin vom 13.09.2025 15:00 auf 14.09.2025 16:30"
    )
  );

  // 4) Übersicht aus DB
  section("10) Alle Termine aus DB");
  const bookings = getAllBookings();
  if (bookings.length === 0) {
    console.log("📭 Keine Termine gespeichert.");
  } else {
    bookings.forEach((b, i) => {
      console.log(`#${i + 1} ✅ ${b.service} am ${new Date(b.dateTime).toLocaleString("de-DE")}`);
    });
  }

  // 5) Dateien prüfen
  section("11) Übersicht gespeicherter Dateien");
  const pdfFiles = listFiles(path.join(process.cwd(), "pdf"));
  const icsFiles = listFiles(path.join(process.cwd(), "ics"));

  console.log("📂 PDF-Dateien:");
  if (pdfFiles.length === 0) console.log(" - Keine PDFs gefunden");
  pdfFiles.forEach((f) => console.log(" - " + f));

  console.log("📂 ICS-Dateien:");
  if (icsFiles.length === 0) console.log(" - Keine ICS gefunden");
  icsFiles.forEach((f) => console.log(" - " + f));

  console.log("\n✅ Tests abgeschlossen!");
}

runTests();
