// kalender.js
import ical from "ical-generator";
import path from "path";
import fs from "fs";

/**
 * Erstellt eine ICS-Datei für einen Termin und speichert sie lokal ab.
 * @param {object} booking - Buchungsobjekt mit { id, name, service, dateTime, duration }
 * @param {string} fileName - Dateiname der ICS-Datei
 * @returns {string|null} Relativer Pfad zur ICS-Datei oder null bei Fehler
 */
export async function generateICS(booking, fileName) {
  try {
    const cal = ical({ name: "Beauty Lounge Termine", timezone: "Europe/Berlin" });

    const startDate = new Date(booking.dateTime);
    const endDate = new Date(startDate.getTime() + (booking.duration || 60) * 60000);

    cal.createEvent({
      start: startDate,
      end: endDate,
      summary: `Termin: ${booking.service}`,
      description: `Ihr Termin im Kosmetikstudio Beauty Lounge.\n\nService: ${booking.service}\nKunde: ${booking.name}`,
      location: "Beauty Lounge, Musterstraße 1, 12345 Musterstadt",
      uid: `termin_${booking.id}@beauty-lounge.de`,
      timestamp: new Date(),
    });

    const dir = path.join(process.cwd(), "ics");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, fileName);

    // Neu: statt saveSync → mit toString() speichern
    fs.writeFileSync(filePath, cal.toString(), "utf8");

    console.log(`✅ ICS gespeichert: ${filePath}`);
    return `/ics/${fileName}`;
  } catch (err) {
    console.error("❌ Fehler beim Erzeugen der ICS:", err);
    return null;
  }
}

/**
 * Fügt ein Event zum Kalender hinzu und speichert eine ICS-Datei.
 * @param {object} booking - { id, name, service, dateTime, duration }
 * @returns {Promise<string|null>} Pfad zur gespeicherten ICS-Datei
 */
export async function addEventToCalendar(booking) {
  try {
    const fileName = `termin_${booking.id}.ics`;
    return await generateICS(booking, fileName);
  } catch (err) {
    console.error("❌ Fehler in addEventToCalendar:", err);
    return null;
  }
}
