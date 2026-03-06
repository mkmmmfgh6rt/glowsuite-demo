// =======================================================
// 📅 kalender.js v7 — Beauty Agent Pro Edition
// ICS-Erstellung mit automatischem Browser-Link + DSGVO-Safe
// =======================================================

import ical from "ical-generator";
import path from "path";
import fs from "fs";
import { loadTenantConfig } from "./utils.js";

// =======================================================
// 🧾 ICS-Datei generieren (Termin-Eintrag)
// =======================================================
export async function generateICS(booking, fileName) {
  try {
    const tenant = booking.tenant || process.env.TENANT_DEFAULT || "beauty_lounge";
    const { branding } = loadTenantConfig(tenant);

    // === ICS Objekt erstellen ===
    const cal = ical({
      name: `${branding.brandName || "Beauty Lounge"} – Terminübersicht`,
      timezone: "Europe/Berlin",
      prodId: { company: "Beauty Agent", product: "BookingSystem", language: "DE" },
    });

    const startDate = new Date(booking.dateTime);
    const endDate = new Date(startDate.getTime() + (booking.duration || 60) * 60000);

    // === Event hinzufügen ===
    cal.createEvent({
      start: startDate,
      end: endDate,
      summary: `Termin: ${booking.service || "Behandlung"}`,
      description:
        `Ihr Termin bei ${branding.brandName || "Beauty Lounge"}\n\n` +
        `👤 Kunde: ${booking.name}\n` +
        `📞 Kontakt: ${booking.phone || "Keine Angabe"}\n` +
        `💅 Service: ${booking.service}\n` +
        `💶 Preis: ${booking.price ? booking.price + " €" : "-"}\n\n` +
        `Vielen Dank für Ihre Buchung! Wir freuen uns auf Sie.`,
      location: branding.address || "Beauty Lounge, Musterstraße 1, 12345 Musterstadt",
      organizer: {
        name: branding.brandName || "Beauty Lounge",
        email: branding.email || "info@beauty-lounge.de",
      },
      url: branding.website || "https://beauty-lounge.de",
      uid: `booking_${booking.id}@${tenant}.de`,
      timestamp: new Date(),
    });

    // === Speicherort vorbereiten ===
    const tenantDir = path.join(process.cwd(), "public", "ics", tenant);
    if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });

    const filePath = path.join(tenantDir, fileName);
    fs.writeFileSync(filePath, cal.toString(), "utf8");

    console.log(`✅ [${tenant}] ICS erstellt: ${filePath}`);

    // === Relativen Pfad zurückgeben (für Browser-Link) ===
    return `/ics/${tenant}/${fileName}`;
  } catch (err) {
    console.error("❌ Fehler in generateICS:", err);
    return null;
  }
}

// =======================================================
// 📩 addEventToCalendar() – öffentliche Hauptfunktion
// =======================================================
export async function addEventToCalendar(booking) {
  try {
    const fileName = `termin_${booking.id}.ics`;
    return await generateICS(booking, fileName);
  } catch (err) {
    console.error("❌ Fehler in addEventToCalendar:", err);
    return null;
  }
}
