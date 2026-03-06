// testBookingManager.js
import { insertBooking, getAllBookings } from "./db.js";
import { cancelBooking, rescheduleBooking } from "./bookingManager.js";
import { services } from "./agent.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

// ==== Hilfsfunktion: Dummy-Termin anlegen ====
function createTestBooking({ name, phone, service, dateTime }) {
  const s = services[service];
  if (!s) throw new Error("Unbekannter Service im Test!");

  const bookingData = {
    id: uuidv4(),
    name,
    phone,
    service,
    price: s.price,
    duration: s.duration,
    dateTime: dateTime.toISOString().slice(0, 19).replace("T", " "),
  };

  insertBooking(bookingData);
  console.log("✅ Test-Termin erstellt:", bookingData);
  return bookingData;
}

// ==== Hilfsfunktion: Dateien prüfen ====
function checkFiles(bookingId, label) {
  const pdfDir = path.join(process.cwd(), "pdf");
  const icsDir = path.join(process.cwd(), "ics");

  const pdfExists = fs
    .readdirSync(pdfDir)
    .some((f) => f.includes(bookingId));
  const icsExists = fs
    .readdirSync(icsDir)
    .some((f) => f.includes(bookingId));

  console.log(
    `📂 Check [${label}] → PDF: ${pdfExists ? "✅ vorhanden" : "❌ fehlt"}, ICS: ${
      icsExists ? "✅ vorhanden" : "❌ fehlt"
    }`
  );
}

// ==== Tests ====
async function runTests() {
  console.log("\n=== 1) Test: Termin erstellen ===");
  const booking = createTestBooking({
    name: "Max Mustermann",
    phone: "0123456789",
    service: "Haarschnitt Damen",
    dateTime: new Date(2025, 8, 12, 12, 0), // 12.09.2025 12:00 Uhr
  });

  checkFiles(booking.id, "nach Erstellen");

  console.log("\n=== 2) Test: Termin verschieben ===");
  const verschiebeAntwort = await rescheduleBooking(
    `Bitte verschiebe meinen Termin von 12.09.2025 12:00 auf 13.09.2025 14:00`
  );
  console.log(verschiebeAntwort);

  checkFiles(booking.id, "nach Verschieben");

  console.log("\n=== 3) Test: Termin stornieren ===");
  const stornoAntwort = cancelBooking(
    `Ich möchte den Termin am 13.09.2025 14:00 stornieren`
  );
  console.log(stornoAntwort);

  checkFiles(booking.id, "nach Stornieren");

  console.log("\n=== 4) Test: Alle Buchungen in DB ===");
  console.log(getAllBookings());
}

runTests();

