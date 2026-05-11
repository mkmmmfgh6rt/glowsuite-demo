import { createAppointmentPDF } from "../frontend-core/pdf.js";

export default async function handler(req, res) {

  console.log("BOOKING METHOD:", req.method);
  console.log("BOOKING BODY:", req.body);

  if (req.method !== "POST") {

    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });

  }

  try {

    const {
      name,
      email,
      phone,
      service,
      employee,
      date,
      time,
      duration,
      price
    } = req.body;

    // =====================================================
    // 🔥 DATETIME FIX
    // =====================================================

    const dateTime =
      date && time
        ? `${date}T${time}:00`
        : null;

    console.log("🔥 GENERATED DATETIME:", dateTime);

    const bookingId = `booking_${Date.now()}`;

    // =====================================================
    // BOOKING OBJECT
    // =====================================================

    const booking = {
      id: bookingId,
      name: name || "",
      email: email || "",
      phone: phone || "",
      service: service || "",
      employee: employee || "Mitarbeiter",
      dateTime,
      duration: duration || 60,
      price: price || 0,
      tenant: "beauty_lounge"
    };

    console.log("✅ BOOKING CREATED:", booking);

    // =====================================================
    // PDF TEST
    // =====================================================

    const files = await createAppointmentPDF(booking);

    console.log("📄 PDF RESULT:", files);

    // =====================================================
    // 🔥 BASE64 FIX
    // =====================================================

    const pdfBase64 = files?.pdfBase64 || null;
    const icsBase64 = files?.icsBase64 || null;

    console.log("🔥 PDF BASE64:", pdfBase64 ? "VORHANDEN" : "FEHLT");
    console.log("🔥 ICS BASE64:", icsBase64 ? "VORHANDEN" : "FEHLT");

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      bookingId,

      booking: {
        ...booking,

        pdfBase64,
        icsBase64,

        pdfUrl: files?.pdfUrl || null,
        icsUrl: files?.icsUrl || null
      },

      pdfBase64,
      icsBase64,

      pdfUrl: files?.pdfUrl || null,
      icsUrl: files?.icsUrl || null,

      message: "Booking created successfully"
    });

  } catch (error) {

    console.error("BOOKING API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });

  }

}