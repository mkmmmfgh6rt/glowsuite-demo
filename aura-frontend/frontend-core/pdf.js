import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createEvent } from "ics";
import QRCode from "qrcode";

const PAGE_W = 595;
const PAGE_H = 842;

const C = {
  bg: rgb(0.071, 0.051, 0.043),
  card: rgb(0.110, 0.090, 0.078),
  gold: rgb(0.831, 0.690, 0.482),
  goldDark: rgb(0.722, 0.565, 0.353),
  goldLine: rgb(0.545, 0.400, 0.227),
  text: rgb(0.961, 0.937, 0.902),
  muted: rgb(0.650, 0.545, 0.420),
  footer: rgb(0.455, 0.412, 0.369),
  white: rgb(1, 1, 1),
};

function fmtDate(d) {
  return d.toLocaleDateString("de-DE");
}

function fmtTime(d) {
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roundedRectPath(x, y, w, h, r) {
  return `
    M ${x + r} ${y}
    L ${x + w - r} ${y}
    Q ${x + w} ${y} ${x + w} ${y + r}
    L ${x + w} ${y + h - r}
    Q ${x + w} ${y + h} ${x + w - r} ${y + h}
    L ${x + r} ${y + h}
    Q ${x} ${y + h} ${x} ${y + h - r}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    Z
  `;
}

function safeText(value, fallback = "-") {
  return String(value || fallback);
}

function findLogoPath() {
  const possible = [
    path.join(process.cwd(), "public", "img", "logo-glowsuite.png"),
    path.join(process.cwd(), "public", "assets", "logo-glowsuite.png"),
    path.join(process.cwd(), "public", "assets", "glowsuite-logo.png"),
    path.join(process.cwd(), "public", "logo-glowsuite.png"),
  ];

  return possible.find((p) => fs.existsSync(p)) || null;
}

async function createICSBase64(booking, start, end) {
  const icsEvent = await new Promise((resolve, reject) => {
    createEvent(
      {
        title: `GlowSuite Termin - ${booking.service || "Termin"}`,
        description: `Termin bei ${booking.employee || "GlowSuite AI"}`,
        start: [
          start.getFullYear(),
          start.getMonth() + 1,
          start.getDate(),
          start.getHours(),
          start.getMinutes(),
        ],
        duration: {
          minutes: Number(booking.duration || 60),
        },
        status: "CONFIRMED",
        busyStatus: "BUSY",
        organizer: {
          name: "GlowSuite AI",
          email: "info@glowsuite-ai.de",
        },
      },
      (error, value) => {
        if (error) reject(error);
        else resolve(value);
      }
    );
  });

  return Buffer.from(icsEvent).toString("base64");
}

export async function createAppointmentPDF(booking) {
  console.log("📄 LUXURY PDF START");
  console.log("📄 BOOKING:", booking);

  try {
    if (!booking || !booking.dateTime) {
      throw new Error("Ungültige Buchungsdaten für PDF");
    }

    const start = new Date(booking.dateTime);
    const end = new Date(
      start.getTime() + Number(booking.duration || 60) * 60000
    );

    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // =====================================================
    // BACKGROUND
    // =====================================================

    page.drawRectangle({
      x: 0,
      y: 0,
      width: PAGE_W,
      height: PAGE_H,
      color: C.bg,
    });

    page.drawEllipse({
      x: PAGE_W / 2,
      y: 750,
      xScale: 220,
      yScale: 220,
      color: C.gold,
      opacity: 0.08,
    });

    page.drawSvgPath(roundedRectPath(40, 200, PAGE_W - 80, 520, 40), {
      color: rgb(0.639, 0.478, 0.278),
      opacity: 0.06,
    });

    page.drawEllipse({
      x: PAGE_W / 2,
      y: 90,
      xScale: 260,
      yScale: 260,
      color: C.gold,
      opacity: 0.03,
    });

    // =====================================================
    // LOGO
    // =====================================================

    const logoPath = findLogoPath();

    if (logoPath) {
      try {
        const logoBytes = fs.readFileSync(logoPath);
        const logo = await pdfDoc.embedPng(logoBytes);

        const logoSize = 72;

        page.drawImage(logo, {
          x: PAGE_W / 2 - logoSize / 2,
          y: 748,
          width: logoSize,
          height: logoSize,
        });
      } catch (err) {
        console.warn("Logo konnte nicht geladen werden:", err.message);
      }
    }

    // =====================================================
    // HEADER
    // =====================================================

    page.drawText("GlowSuite AI", {
      x: 0,
      y: 700,
      size: 24,
      font,
      color: C.gold,
      maxWidth: PAGE_W,
      lineHeight: 28,
    });

    const titleWidth = font.widthOfTextAtSize("GlowSuite AI", 24);
    page.drawText("GlowSuite AI", {
      x: PAGE_W / 2 - titleWidth / 2,
      y: 700,
      size: 24,
      font,
      color: C.gold,
    });

    const sub = "Premium Terminbestätigung";
    const subWidth = font.widthOfTextAtSize(sub, 11);

    page.drawText(sub, {
      x: PAGE_W / 2 - subWidth / 2,
      y: 664,
      size: 11,
      font,
      color: C.text,
    });

    page.drawLine({
      start: { x: PAGE_W / 2 - 135, y: 638 },
      end: { x: PAGE_W / 2 + 130, y: 638 },
      thickness: 1,
      color: C.goldLine,
    });

    // =====================================================
    // MAIN CARD
    // =====================================================

    const cardX = 84;
    const cardY = 315;
    const cardW = PAGE_W - 164;
    const cardH = 305;

    page.drawSvgPath(roundedRectPath(cardX, cardY, cardW, cardH, 18), {
      color: C.card,
      borderColor: C.goldLine,
      borderWidth: 1,
    });

    const leftX = 112;
    const rightX = 350;

    page.drawText("DEIN TERMIN", {
      x: leftX,
      y: cardY + cardH - 38,
      size: 10,
      font,
      color: C.muted,
    });

    page.drawText(safeText(booking.service), {
      x: leftX,
      y: cardY + cardH - 76,
      size: 24,
      font,
      color: C.text,
      maxWidth: cardW - 60,
    });

    // Mitarbeiter
    page.drawText("Mitarbeiter", {
      x: leftX,
      y: cardY + 172,
      size: 10,
      font,
      color: C.goldDark,
    });

    page.drawText(safeText(booking.employee, "Beliebig"), {
      x: leftX,
      y: cardY + 150,
      size: 14,
      font,
      color: C.text,
    });

    // Telefon
    page.drawText("Telefon", {
      x: rightX,
      y: cardY + 172,
      size: 10,
      font,
      color: C.goldDark,
    });

    page.drawText(safeText(booking.phone), {
      x: rightX,
      y: cardY + 150,
      size: 14,
      font,
      color: C.text,
    });

    // Datum
    page.drawText("Datum", {
      x: leftX,
      y: cardY + 122,
      size: 10,
      font,
      color: C.goldDark,
    });

    page.drawText(fmtDate(start), {
      x: leftX,
      y: cardY + 98,
      size: 16,
      font,
      color: C.text,
    });

    // Uhrzeit
    page.drawText("Uhrzeit", {
      x: rightX,
      y: cardY + 122,
      size: 10,
      font,
      color: C.goldDark,
    });

    page.drawText(`${fmtTime(start)} – ${fmtTime(end)}`, {
      x: rightX,
      y: cardY + 98,
      size: 16,
      font,
      color: C.text,
    });

    // Preis
    page.drawText("Preis", {
      x: leftX,
      y: cardY + 50,
      size: 10,
      font,
      color: C.goldDark,
    });

    page.drawText(`${Number(booking.price || 0).toFixed(2)} €`, {
      x: leftX,
      y: cardY + 26,
      size: 18,
      font,
      color: C.text,
    });

    // =====================================================
    // MESSAGE
    // =====================================================

    const msg = "Wir freuen uns auf Ihren Besuch";
    const msgWidth = font.widthOfTextAtSize(msg, 12);

    page.drawText(msg, {
      x: PAGE_W / 2 - msgWidth / 2,
      y: 282,
      size: 12,
      font,
      color: C.text,
    });

    // =====================================================
    // QR CARD
    // =====================================================

    const qrCardW = 270;
    const qrCardH = 190;
    const qrCardX = PAGE_W / 2 - qrCardW / 2;
    const qrCardY = 78;

    page.drawSvgPath(roundedRectPath(qrCardX, qrCardY, qrCardW, qrCardH, 16), {
      color: C.card,
      borderColor: C.goldLine,
      borderWidth: 1,
    });

    const qrTitle = "Kalender speichern";
    const qrTitleWidth = font.widthOfTextAtSize(qrTitle, 11);

    page.drawText(qrTitle, {
      x: PAGE_W / 2 - qrTitleWidth / 2,
      y: qrCardY + qrCardH - 30,
      size: 11,
      font,
      color: C.gold,
    });

    const googleLink =
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=Termin` +
      `&dates=${start.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/` +
      `${end.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;

    try {
      const qrDataUrl = await QRCode.toDataURL(googleLink, {
        margin: 1,
        width: 180,
      });

      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
      const qrBytes = Buffer.from(qrBase64, "base64");
      const qrImage = await pdfDoc.embedPng(qrBytes);

      const qrSize = 112;

      page.drawRectangle({
        x: PAGE_W / 2 - qrSize / 2 - 6,
        y: qrCardY + 68,
        width: qrSize + 12,
        height: qrSize + 12,
        color: C.white,
      });

      page.drawImage(qrImage, {
        x: PAGE_W / 2 - qrSize / 2,
        y: qrCardY + 74,
        width: qrSize,
        height: qrSize,
      });

      const gText = "Google Kalender öffnen";
      const gWidth = font.widthOfTextAtSize(gText, 7);

      page.drawText(gText, {
        x: PAGE_W / 2 - gWidth / 2,
        y: qrCardY + 48,
        size: 7,
        font,
        color: C.text,
      });
    } catch (err) {
      console.warn("QR konnte nicht erstellt werden:", err.message);
    }

    const os = "Autonomous Salon OS";
    const osWidth = font.widthOfTextAtSize(os, 10);

    page.drawText(os, {
      x: PAGE_W / 2 - osWidth / 2,
      y: qrCardY + 28,
      size: 10,
      font,
      color: C.goldDark,
    });

    const powered = "Powered by A.U.R.A";
    const poweredWidth = font.widthOfTextAtSize(powered, 8);

    page.drawText(powered, {
      x: PAGE_W / 2 - poweredWidth / 2,
      y: 42,
      size: 8,
      font,
      color: C.footer,
    });

    // =====================================================
    // SAVE
    // =====================================================

    const pdfBytes = await pdfDoc.save();

    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");
    const icsBase64 = await createICSBase64(booking, start, end);

    console.log("✅ LUXURY PDF + ICS erfolgreich generiert");

    return {
      success: true,

      pdfUrl: `data:application/pdf;base64,${pdfBase64}`,
      icsUrl: `data:text/calendar;base64,${icsBase64}`,

      pdfBase64,
      icsBase64,
    };
  } catch (error) {
    console.error("❌ PDF ERROR:", error);

    return {
      success: false,
      error: error.message,
    };
  }
}