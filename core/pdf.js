// =======================================================
// 📄 pdf.js v5.2 – SQLITE-FIRST (MVP SAFE, NO SUPABASE)
// =======================================================

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { loadTenantConfig } from "./utils.js";
import QRCode from "qrcode";

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
      phone: booking.phone || "-",
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
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

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
        Author: branding.brandName
      },
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Hintergrund
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fdfbf7");

    doc.fillColor("#1e1c19");

    // ===============================
    // LOGO
    // ===============================
    if (branding.logo) {
      try {
        const logoPath = path.join(process.cwd(), "public", branding.logo);

        if (fs.existsSync(logoPath)) {
          doc.image(
            logoPath,
            doc.page.width / 2 - 40,
            60,
            { width: 80 }
          );
          doc.moveDown(3);
        } else {
          doc.moveDown(3);
        }
      } catch (err) {
        console.warn("Logo konnte nicht geladen werden");
        doc.moveDown(3);
      }
    } else {
      doc.moveDown(3);
    }

    // ===============================
    // HEADER
    // ===============================
    doc
      .fontSize(22)
      .fillColor(branding.brandColor || "#bfa06b")
      .text(branding.brandName, {
        align: "center",
      });

    doc.moveDown(0.6);

    doc
      .fontSize(14)
      .fillColor("#1e1c19")
      .text("Terminbestätigung", { align: "center" });

    doc.moveDown(2.5);

    // ===============================
    // TERMIN DETAILS
    // ===============================
    doc
      .fontSize(10)
      .fillColor("#888")
      .text("Service");

    doc
      .fontSize(13)
      .fillColor("#1e1c19")
      .text(appointment.notes || "-")
      .moveDown(1);

    doc
      .fontSize(12)
      .text(`Mitarbeiter: ${appointment.employees.name}`)
      .moveDown(0.6)
      .text(`Telefon: ${appointment.phone}`)
      .moveDown(0.6)
      .text(`Datum: ${start.toLocaleDateString("de-DE")}`)
      .moveDown(0.6)
      .text(
        `Uhrzeit: ${start.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })} – ${end.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      )
      .moveDown(0.6)
      .text(`Dauer: ${appointment.duration_minutes} Minuten`)
      .moveDown(0.6)
      .text(`Preis: ${Number(appointment.price).toFixed(2)} €`);

    doc.moveDown(2);

    // ===============================
    // MESSAGE
    // ===============================
    doc
      .fontSize(13)
      .fillColor("#1e1c19")
      .text("Wir freuen uns auf Ihren Besuch!", {
        align: "center",
      });

    doc.moveDown(1.5);

    // ===============================
    // FOOTER
    // ===============================
    doc
      .fontSize(11)
      .fillColor(branding.brandColor || "#bfa06b")
      .text(
        `${branding.brandName} – Ihre Schönheit in besten Händen`,
        { align: "center" }
      );

    doc.moveDown(0.5);

    doc
      .fontSize(9)
      .fillColor("#999")
      .text("Powered by GlowSuite AI", {
        align: "center",
      });

    // ===============================
    // QR CODE + GOOGLE LINK
    // ===============================
    try {

      const calendarUrl = `/ics/${appointment.id}.ics`;

      const qrData = await QRCode.toDataURL(calendarUrl);
      const qrBase64 = qrData.replace(/^data:image\/png;base64,/, "");
      const qrBuffer = Buffer.from(qrBase64, "base64");

      doc.moveDown(4);

      // QR Code exakt mittig
      const qrX = (doc.page.width - 90) / 2;
      doc.image(qrBuffer, qrX, doc.y, { width: 90 });

      // Cursor unter QR Code setzen
      doc.y += 100;

      doc
        .fontSize(9)
        .fillColor("#888")
        .text("Termin im Kalender speichern", {
          align: "center",
        });

      doc.moveDown(0.5);

      const googleLink =
        "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        `&text=Termin` +
        `&dates=${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/` +
        `${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

      doc
        .fontSize(9)
        .fillColor("#555")
        .text("Google Kalender öffnen", {
          align: "center",
          link: googleLink,
          underline: true,
        });

    } catch (err) {
      console.warn("QR Code Fehler");
    }

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
