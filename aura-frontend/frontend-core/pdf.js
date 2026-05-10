export async function createAppointmentPDF(booking) {

  console.log("📄 PDF START");
  console.log("📄 BOOKING:", booking);

  return {
    success: true,
    pdfUrl: "/test.pdf",
    icsUrl: "/test.ics"
  };

}