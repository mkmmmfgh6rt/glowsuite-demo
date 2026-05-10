import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createEvent } from "ics";

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
    // BASE64 KONVERTIERUNG
    // =====================================================

    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    const icsBase64 = Buffer.from(icsEvent).toString("base64");

    console.log("✅ PDF + ICS erfolgreich generiert");

    // =====================================================
    // RETURN
    // =====================================================

    return {
      success: true,

      pdfBase64,

      icsBase64
    };

  } catch (error) {

    console.error("❌ PDF ERROR:", error);

    return {
      success: false,
      error: error.message
    };

  }

}