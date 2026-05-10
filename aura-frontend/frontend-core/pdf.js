import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createEvent } from "ics";
import fs from "fs";
import path from "path";

export async function createAppointmentPDF(booking) {

  console.log("📄 PDF START");
  console.log("📄 BOOKING:", booking);

  try {

    // =====================================================
    // PDF ERSTELLEN
    // =====================================================

    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([600, 400]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText("GlowSuite AI Terminbestätigung", {
      x: 50,
      y: 350,
      size: 22,
      font,
      color: rgb(0.8, 0.5, 0.2)
    });

    page.drawText(`Name: ${booking.name}`, {
      x: 50,
      y: 300,
      size: 14,
      font
    });

    page.drawText(`Service: ${booking.service}`, {
      x: 50,
      y: 270,
      size: 14,
      font
    });

    page.drawText(`Mitarbeiter: ${booking.employee}`, {
      x: 50,
      y: 240,
      size: 14,
      font
    });

    page.drawText(`Termin: ${booking.dateTime}`, {
      x: 50,
      y: 210,
      size: 14,
      font
    });

    page.drawText(`Preis: ${booking.price}€`, {
      x: 50,
      y: 180,
      size: 14,
      font
    });

    const pdfBytes = await pdfDoc.save();

    // =====================================================
    // ICS ERSTELLEN
    // =====================================================

    const bookingDate = new Date(booking.dateTime);

    const icsEvent = await new Promise((resolve, reject) => {

      createEvent(
        {
          title: `GlowSuite Termin - ${booking.service}`,
          description: `Termin bei ${booking.employee}`,
          start: [
            bookingDate.getFullYear(),
            bookingDate.getMonth() + 1,
            bookingDate.getDate(),
            bookingDate.getHours(),
            bookingDate.getMinutes()
          ],
          duration: {
            minutes: booking.duration || 60
          }
        },
        (error, value) => {

          if (error) {
            reject(error);
          } else {
            resolve(value);
          }

        }
      );

    });

    // =====================================================
    // DATEINAMEN
    // =====================================================

    const fileId = `booking_${Date.now()}`;

    const pdfFileName = `${fileId}.pdf`;
    const icsFileName = `${fileId}.ics`;

    // =====================================================
    // SPEICHERPFAD
    // =====================================================

    const outputDir = path.join(process.cwd(), "public", "generated");

    // Ordner erstellen falls nicht vorhanden
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const pdfPath = path.join(outputDir, pdfFileName);
    const icsPath = path.join(outputDir, icsFileName);

    // =====================================================
    // DATEIEN SPEICHERN
    // =====================================================

    fs.writeFileSync(pdfPath, pdfBytes);
    fs.writeFileSync(icsPath, icsEvent);

    console.log("✅ PDF gespeichert:", pdfPath);
    console.log("✅ ICS gespeichert:", icsPath);

    // =====================================================
    // RETURN
    // =====================================================

    return {
      success: true,

      pdfUrl: `/generated/${pdfFileName}`,

      icsUrl: `/generated/${icsFileName}`
    };

  } catch (error) {

    console.error("❌ PDF ERROR:", error);

    return {
      success: false,
      error: error.message
    };

  }

}