// =======================================================
// bookingManager.js v8 — STABLE CORE (PDF + ICS safe)
// =======================================================
import { getAllBookings, deleteBooking, updateBooking } from "./db.js";
import { createBookingPDF } from "./pdf.js";
import fs from "fs";
import path from "path";

// ---------- Helpers ----------
function roundToQuarterHour(date) {
  const ms = 15 * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

function toBerlinISO(date) {
  const d = new Date(
    date.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
  );
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// ---------- Find booking ----------
function findBookingByDate(inputDateStr) {
  const nums = inputDateStr.match(/\d+/g);
  if (!nums || nums.length < 5) return null;

  const [day, month, year, hour, minute] = nums.map(Number);
  const input = new Date(year, month - 1, day, hour, minute);
  const iso = toBerlinISO(input);

  return getAllBookings().find(
    (b) => toBerlinISO(new Date(b.dateTime)) === iso
  );
}

// ---------- Cleanup ----------
function cleanupFiles(booking) {
  const tenant = booking.tenant || "beauty_lounge";
  const dirs = [
    path.join(process.cwd(), "public", "pdf"),
    path.join(process.cwd(), "public", "ics"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach((f) => {
      if (f.includes(booking.id)) {
        fs.unlinkSync(path.join(dir, f));
        console.log("🗑️ Datei entfernt:", f);
      }
    });
  });
}

// =======================================================
// ❌ STORNIEREN
// =======================================================
export async function cancelBooking(input) {
  try {
    const match = input.match(/\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/);
    if (!match)
      return "❌ Bitte Datum im Format TT.MM.JJJJ HH:MM angeben.";

    const booking = findBookingByDate(match[0]);
    if (!booking) return "❌ Kein Termin gefunden.";

    await deleteBooking(booking.id);
    cleanupFiles(booking);

    return `✅ Termin am ${match[0]} storniert.`;
  } catch (err) {
    console.error(err);
    return "❌ Fehler beim Stornieren.";
  }
}

// =======================================================
// 🔁 VERSCHIEBEN
// =======================================================
export async function rescheduleBooking(input) {
  try {
    const matches = input.match(/\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/g);
    if (!matches || matches.length < 2)
      return "❌ Bitte altes UND neues Datum angeben.";

    const oldBooking = findBookingByDate(matches[0]);
    if (!oldBooking) return "❌ Alter Termin nicht gefunden.";

    const nums = matches[1].match(/\d+/g).map(Number);
    const newDate = roundToQuarterHour(
      new Date(nums[2], nums[1] - 1, nums[0], nums[3], nums[4])
    );

    const newISO = toBerlinISO(newDate);

    await updateBooking(
      oldBooking.id,
      newISO,
      oldBooking.employeeId || null
    );

    cleanupFiles(oldBooking);

    const { pdfUrl, icsUrl } = await createBookingPDF({
      ...oldBooking,
      dateTime: newISO,
    });

    return (
      `✅ Termin verschoben\n` +
      `📅 ${matches[0]} → ${matches[1]}\n` +
      `📄 PDF: ${pdfUrl}\n` +
      `🗓️ Kalender: ${icsUrl}`
    );
  } catch (err) {
    console.error(err);
    return "❌ Fehler beim Verschieben.";
  }
}
