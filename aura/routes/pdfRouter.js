import express from "express";
import { createAppointmentPDF } from "../pdf.js";

const router = express.Router();

/* =====================================================
   GET PDF + ICS für Termin
   GET /api/pdf/:id
===================================================== */
router.get("/:id", async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const result = await createAppointmentPDF(appointmentId);
    if (!result) {
      return res.status(500).json({ error: "PDF konnte nicht erstellt werden" });
    }

    return res.json({
      success: true,
      pdfUrl: result.pdfUrl,
      icsUrl: result.icsUrl,
    });
  } catch (err) {
    console.error("PDF Route Error:", err.message);
    return res.status(500).json({ error: "PDF Fehler", detail: err.message });
  }
});

export default router;
