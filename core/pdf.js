// =======================================================
// 📄 pdf.js v5.2 – SQLITE-FIRST (MVP SAFE, NO SUPABASE)
// =======================================================

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { loadTenantConfig } from "./utils.js";

/* ===============================
   📅 ICS GENERATOR
=============================== */
function createICS(appointment) {
  const icsDir = path.join(process.cwd(), "public", "ics");
  if (!fs.existsSync(icsDir)) fs.mkdirSync(icsDir, { recursive: true });

  const start = new Date(appointment.start_time);
  const end = new Date(appointment.end_time);

  const fmt = (d) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const tenant = appointment.studios?.slug || "studio";
  const fileName = `${tenant}_${appointment.id}.ics`;
  const filePath = path.join(icsDir, fileName);

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Beauty Agent AURA//DE
BEGIN:VEVENT
UID:${appointment.id}
DTSTAMP:${fmt(new Date())}
DTSTART:${fmt(start)}
DTEND:${fmt(end)}
SUMMARY:Termin
DESCRIPTION:${appointment.notes || ""}
LOCATION:${tenant}
END:VEVENT
END:VCALENDAR`.trim();

  fs.writeFileSync(filePath, icsContent, "utf8");
  return `/ics/${fileName}`;
}

/* ===============================
   📄 PDF GENERATOR (SQLITE)
=============================== */
export async function createAppointmentPDF(booking) {
  try {
    if (!booking || !booking.id || !booking.dateTime) {
      throw new Error("Ungültige Buchungsdaten für PDF");
    }

    // ===============================
    // SQLITE → APPOINTMENT MAPPING
    // ===============================
    const start = new Date(booking.dateTime);
    const end = new Date(
      start.getTime() + Number(booking.duration || 60) * 60000
    );

    const appointment = {
      id: booking.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: booking.duration || 60,
      price: booking.price || 0,
      notes: booking.service || "",
      employees: {
        name: booking.employee || "Beliebig",
      },
      studios: {
        slug:
          booking.tenant ||
          process.env.TENANT_DEFAULT ||
          "studio",
        name: booking.tenant || "Studio",
      },
    };

    const tenant = appointment.studios.slug;
    const { branding } = loadTenantConfig(tenant);

    // ===============================
    // PATHS
    // ===============================
    const pdfDir = path.join(process.cwd(), "public", "pdf");
    if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

    const fileName = `${tenant}_${appointment.id}_termin.pdf`;
    const pdfPath = path.join(pdfDir, fileName);

    // ===============================
    // PDF BUILD
    // ===============================
    const doc = new PDFDocument({
      margin: 60,
      size: "A4",
      info: {
        Title: "Terminbestätigung",
        Author: branding.brandName || "Beauty Agent AURA",
      },
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fdfbf7");
    doc.fillColor("#1e1c19");

    doc
      .moveDown(4)
      .fontSize(22)
      .fillColor("#bfa06b")
      .text(branding.brandName || "Beauty Agent AURA", {
        align: "center",
      })
      .moveDown(0.5)
      .fontSize(14)
      .text("Terminbestätigung", { align: "center" })
      .moveDown(2);

    doc
      .fontSize(12)
      .fillColor("#1e1c19")
      .text(`Mitarbeiter: ${appointment.employees.name}`)
      .moveDown(0.4)
      .text(
        `Zeit: ${start.toLocaleDateString("de-DE")} ` +
          `${start.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })} – ` +
          `${end.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}`
      )
      .moveDown(0.4)
      .text(`Dauer: ${appointment.duration_minutes} Minuten`)
      .moveDown(0.4)
      .text(
        `Preis: ${Number(appointment.price).toFixed(2)} €`
      )
      .moveDown(1.5);

    doc
      .fontSize(13)
      .text("Wir freuen uns auf Ihren Besuch!", {
        align: "center",
      })
      .moveDown(1)
      .fontSize(11)
      .fillColor("#bfa06b")
      .text(
        `${branding.brandName || "Beauty Agent AURA"} – Ihre Schönheit in besten Händen`,
        { align: "center" }
      );

    doc.end();

    return await new Promise((resolve, reject) => {
      stream.on("finish", () => {
        resolve({
          pdfUrl: `/pdf/${fileName}`,
          icsUrl: createICS(appointment),
        });
      });
      stream.on("error", reject);
    });
  } catch (err) {
    console.error("❌ PDF Fehler:", err.message);
    return null;
  }
}
