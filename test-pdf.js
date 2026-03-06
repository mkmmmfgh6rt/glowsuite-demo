// test-pdf.js
import { createBookingPDF } from "./pdf.js";

const dummyBooking = {
  id: "12345",
  name: "Maria Beispiel",
  phone: "0176123456",
  service: "Gesichtsbehandlung Deluxe",
  price: 59,
  duration: 60,
  dateTime: "2025-12-01 15:30:00",
};

(async () => {
  try {
    const pdfPath = await createBookingPDF(dummyBooking);
    console.log("✅ Test-PDF erstellt:", pdfPath);
  } catch (err) {
    console.error("❌ Fehler beim Erstellen der Test-PDF:", err);
  }
})();
