import { createAppointmentPDF } from "../frontend-core/pdf.js";

export default async function handler(req, res) {

  try {

    const result = await createAppointmentPDF({
      name: "Markus",
      service: "Wimpernlifting",
      employee: "Anna",
      dateTime: "2026-05-10T14:00:00",
      duration: 60,
      price: 89
    });

    return res.status(200).json({
      success: true,
      result
    });

  } catch (error) {

    console.error("PDF TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}