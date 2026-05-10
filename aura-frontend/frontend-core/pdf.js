import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createEvent } from "ics";

export async function createAppointmentPDF(booking) {

  console.log("📄 PDF START");
  console.log("📄 BOOKING:", booking);

  try {

    // =====================================================
    // DATUM FORMATIEREN
    // =====================================================

    const bookingDate = new Date(booking.dateTime);

    const formattedDate =
      bookingDate.toLocaleDateString("de-DE");

    const formattedTime =
      bookingDate.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
      });

    // =====================================================
    // PDF ERSTELLEN
    // =====================================================

    const pdfDoc = await PDFDocument.create();

    const page = pdfDoc.addPage([600, 400]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Hintergrund
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 600,
      height: 400,
      color: rgb(0.98, 0.96, 0.93)
    });

    // Titel
    page.drawText("GlowSuite AI Terminbestätigung", {
      x: 50,
      y: 350,
      size: 22,
      font,
      color: rgb(0.72, 0.52, 0.28)
    });

    // Linie
    page.drawLine({
      start: { x: 50, y: 335 },
      end: { x: 550, y: 335 },
      thickness: 2,
      color: rgb(0.85, 0.75, 0.6)
    });

    // Inhalte
    page.drawText(`Name: ${booking.name || "-"}`, {
      x: 50,
      y: 290,
      size: 14,
      font
    });

    page.drawText(`Service: ${booking.service || "-"}`, {
      x: 50,
      y: 255,
      size: 14,
      font
    });

    page.drawText(`Mitarbeiter: ${booking.employee || "Beliebig"}`, {
      x: 50,
      y: 220,
      size: 14,
      font
    });

    page.drawText(`Datum: ${formattedDate}`, {
      x: 50,
      y: 185,
      size: 14,
      font
    });

    page.drawText(`Uhrzeit: ${formattedTime}`, {
      x: 50,
      y: 150,
      size: 14,
      font
    });

    page.drawText(`Preis: ${booking.price || 0} €`, {
      x: 50,
      y: 115,
      size: 14,
      font
    });

    page.drawText(
      "Vielen Dank für deine Buchung 💎",
      {
        x: 50,
        y: 60,
        size: 16,
        font,
        color: rgb(0.72, 0.52, 0.28)
      }
    );

    const pdfBytes = await pdfDoc.save();

    // =====================================================
    // ICS ERSTELLEN
    // =====================================================

    const icsEvent = await new Promise((resolve, reject) => {

      createEvent(
        {
          title: `GlowSuite Termin - ${booking.service}`,
          description:
            `Termin bei ${booking.employee || "GlowSuite AI"}`,

          start: [
            bookingDate.getFullYear(),
            bookingDate.getMonth() + 1,
            bookingDate.getDate(),
            bookingDate.getHours(),
            bookingDate.getMinutes()
          ],

          duration: {
            minutes: booking.duration || 60
          },

          status: "CONFIRMED",
          busyStatus: "BUSY",
          organizer: {
            name: "GlowSuite AI",
            email: "info@glowsuite-ai.de"
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
    // BASE64
    // =====================================================

    const pdfBase64 =
      Buffer.from(pdfBytes).toString("base64");

    const icsBase64 =
      Buffer.from(icsEvent).toString("base64");

    console.log("✅ PDF + ICS erfolgreich generiert");

    // =====================================================
    // RETURN
    // =====================================================

    return {

      success: true,

      pdfUrl:
        `data:application/pdf;base64,${pdfBase64}`,

      icsUrl:
        `data:text/calendar;base64,${icsBase64}`,

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