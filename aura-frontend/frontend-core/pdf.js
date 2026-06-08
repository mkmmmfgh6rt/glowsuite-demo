// =======================================================
// 📄 pdf.js v5.5 – STABLE LAYOUT FIX
// =======================================================

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

/* ===============================
   📅 ICS GENERATOR
=============================== */
function createICS(appointment) {

  const icsDir = "/tmp";

  if (!fs.existsSync(icsDir)) {
    fs.mkdirSync(icsDir, { recursive: true });
  }

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
   📄 PDF GENERATOR
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

    const branding = {
      brandName: "TEST PDF 123",
      logo: "assets/logo-glowsuite.jpg"
    };

    // ===============================
    // PATHS
    // ===============================

    const pdfDir = "/tmp";

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

    // =====================================================
    // PREMIUM BACKGROUND
    // =====================================================

    // Base Background
    doc
      .rect(0, 0, doc.page.width, doc.page.height)
      .fill("#120d0b");

    // Soft Luxury Glow Top
    doc
      .save()
      .opacity(0.08)
      .circle(doc.page.width / 2, 120, 220)
      .fill("#d4b07b")
      .restore();

    // Warm Middle Gradient Feel
    doc
      .save()
      .opacity(0.06)
      .roundedRect(
        40,
        160,
        doc.page.width - 80,
        520,
        40
      )
      .fill("#a37a47")
      .restore();

    // Bottom Ambient Glow
    doc
      .save()
      .opacity(0.03)
      .circle(doc.page.width / 2, 760, 260)
      .fill("#d4b07b")
      .restore();

    doc.fillColor("#f5efe6");

    // =====================================================
    // HEADER
    // =====================================================

    console.log("========== PDF LOGO DEBUG ==========");
    console.log("TENANT:", tenant);
    console.log("BRANDING:", branding);
    console.log("BRANDING.LOGO:", branding?.logo);

    if (branding?.logo) {

      try {

        const logoPath = path.join(
          process.cwd(),
          "public",
          branding.logo
        );

        console.log("LOGOPFAD:", logoPath);
        console.log("LOGO EXISTIERT:", fs.existsSync(logoPath));

        if (fs.existsSync(logoPath)) {

          const logoSize = 72;

          const logoBuffer = fs.readFileSync(logoPath);

          doc.image(
            logoBuffer,
            (doc.page.width / 2) - (logoSize / 2),
            34,
            {
              width: logoSize
            }
          );

          console.log("✅ LOGO ALS BUFFER EINGEFÜGT");

        }

      } catch (err) {

        console.error("❌ LOGO FEHLER:", err);

      }

    }
    // =====================================================
    // TITLE
    // =====================================================

    doc
      .fontSize(24)
      .fillColor("#d4b07b")
      .text(
        branding.brandName || "GlowSuite AI",
        26,
        128,
        {
          align: "center",
          characterSpacing: 0.5
        }
      );

    doc
      .fontSize(11)
      .fillColor("#f5efe6")
      .text(
        "Premium Terminbestätigung",
        20,
        172,
        {
          align: "center",
        }
      );

    // =====================================================
    // MAIN CARD
    // =====================================================

    const cardX = 84;
    const cardY = 222;
    const cardWidth = doc.page.width - 164;
    const cardHeight = 305;
    const cardCenter = cardX + (cardWidth / 2);

    // =====================================================
    // GOLD LINE
    // =====================================================

    doc
      .strokeColor("#b8905a")
      .lineWidth(1)
      .moveTo(cardCenter - 145, 202)
      .lineTo(cardCenter + 120, 202)
      .stroke();

    doc
      .roundedRect(
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        18
      )
      .fillAndStroke("#1c1714", "#8f6a3c");

    // =====================================================
    // CONTENT
    // =====================================================

    const leftX = 112;
    const rightX = 350;

    const labelColor = "#b8905a";
    const textColor = "#f5efe6";

    // TITLE

    doc
      .fontSize(10)
      .fillColor("#a58b6b")
      .text(
        "DEIN TERMIN",
        leftX,
        cardY + 28,
        {
          lineBreak: false
        }
      );

    doc
      .fontSize(24)
      .fillColor(textColor)
      .text(
        appointment.notes || "-",
        leftX,
        cardY + 60,
        {
          lineBreak: false
        }
      );

    // ROW 1

    const row1Y = cardY + 128;

    doc
      .fontSize(10)
      .fillColor(labelColor)
      .text(
        "Mitarbeiter",
        leftX,
        row1Y,
        {
          lineBreak: false
        }
      );

    doc
      .fontSize(14)
      .fillColor(textColor)
      .text(
        appointment.employees.name,
        leftX,
        row1Y + 18,
        {
          lineBreak: false
        }
      );

    doc
      .fontSize(10)
      .fillColor(labelColor)
      .text(
        "Telefon",
        rightX,
        row1Y,
        {
          lineBreak: false
        }
      );

    doc
      .fontSize(14)
      .fillColor(textColor)
      .text(
        appointment.phone,
        rightX,
        row1Y + 18,
        {
          lineBreak: false
        }
      );

    // ROW 2

    const row2Y = cardY + 175;

    doc
      .fontSize(10)
      .fillColor(labelColor)
      .text(
        "Datum",
        leftX,
        row2Y,
        {
          lineBreak: false
        }
      );

    doc
      .fontSize(16)
      .fillColor(textColor)
      .text(
        start.toLocaleDateString("de-DE"),
        leftX,
        row2Y + 18,
        {
          lineBreak: false
        }
      );

    doc
      .fontSize(10)
      .fillColor(labelColor)
      .text(
        "Uhrzeit",
        rightX,
        row2Y,
        {
          lineBreak: false
        }
      );

    doc
      .fontSize(16)
      .fillColor(textColor)
      .text(
        `${start.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })} – ${end.toLocaleTimeString("de-DE", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        rightX,
        row2Y + 18,
        {
          lineBreak: false
        }
      );

    // PRICE

    const priceX = leftX;
    const priceY = cardY + 185;

    doc
      .fontSize(10)
      .fillColor(labelColor)
      .text(
        "Preis",
        priceX,
        priceY + 62,
        {
          lineBreak: false
        }
      );

    doc
      .fontSize(18)
      .fillColor(textColor)
      .text(
        `${Number(appointment.price).toFixed(2)} €`,
        priceX,
        priceY + 80,
        {
          lineBreak: false
        }
      );

    // =====================================================
    // MESSAGE
    // =====================================================

    doc
      .fontSize(12)
      .fillColor("#f5efe6")
      .text(
        "Wir freuen uns auf Ihren Besuch",
        58,
        538,
        {
          align: "center",
        }
      );

    // =====================================================
    // QR SECTION
    // =====================================================

    try {

      const calendarUrl = `/ics/${appointment.id}.ics`;

      const qrData = await QRCode.toDataURL(calendarUrl);

      const qrBase64 = qrData.replace(
        /^data:image\/png;base64,/,
        ""
      );

      const qrBuffer = Buffer.from(qrBase64, "base64");

      const qrCardWidth = 270;
      const qrCardHeight = 200;

      const qrCardX = cardCenter - (qrCardWidth / 2) - 8;

      const qrCardY = 560;

      doc
        .roundedRect(
          qrCardX,
          qrCardY,
          qrCardWidth,
          qrCardHeight,
          16
        )
        .fillAndStroke("#1c1714", "#705433");

      doc
        .fontSize(11)
        .fillColor("#d4b07b")
        .text(
          "Kalender speichern",
          qrCardX + 10,
          qrCardY + 18,
          {
            width: qrCardWidth - 20,
            align: "center",
          }
        );

      const qrSize = 112;

      const qrX =
        qrCardX + (qrCardWidth / 2) - (qrSize / 2);

      doc.image(
        qrBuffer,
        qrX,
        qrCardY + 42,
        {
          width: qrSize
        }
      );

      const googleLink =
        "https://calendar.google.com/calendar/render?action=TEMPLATE" +
        `&text=Termin` +
        `&dates=${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/` +
        `${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

      doc
        .fontSize(7)
        .fillColor("#f5efe6")
        .text(
          "Google Kalender öffnen",
          qrCardX + 10,
          qrCardY + 168,
          {
            width: qrCardWidth - 20,
            align: "center",
            link: googleLink,
            underline: true,
          }
        );

    } catch (err) {

      console.warn("QR Code Fehler");

    }

    // =====================================================
    // FOOTER
    // =====================================================

    doc
      .fontSize(10)
      .fillColor("#b8905a")
      .text(
        `Autonomous Salon OS`,
        cardCenter - 148,
        748,
        {
          width: 276,
          align: "center",
        }
      );

    doc
      .fontSize(8)
      .fillColor("#74695e")
      .text(
        "Powered by A.U.R.A",
        cardCenter - 148,
        772,
        {
          width: 276,
          align: "center",
        }
      );

    // =====================================================
    // FINALIZE
    // =====================================================

    doc.end();

    return await new Promise((resolve, reject) => {

      stream.on("finish", () => {

        try {

          const pdfBase64 = fs
            .readFileSync(pdfPath)
            .toString("base64");

          const icsUrl = createICS(appointment);

          const icsPath = path.join(
            "/tmp",
            path.basename(icsUrl)
          );

          const icsBase64 = fs
            .readFileSync(icsPath)
            .toString("base64");

          resolve({
            pdfBase64,
            icsBase64,
            pdfUrl: null,
            icsUrl: null,
          });

        } catch (err) {

          console.error(
            "❌ BASE64 FEHLER:",
            err.message
          );

          reject(err);

        }

      });

      stream.on("error", reject);

    });

  } catch (err) {

    console.error("❌ PDF Fehler:", err.message);

    return null;

  }

}
