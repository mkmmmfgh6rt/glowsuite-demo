// MUSS GANZ OBEN STEHEN
import dotenv from "dotenv";

// EXAKTER PFAD zu deiner env
dotenv.config({ path: "../config/.env" });

import express from "express";
import cors from "cors";

import auraRoutes from "./routes/auraRoutes.js";
import appointmentsRoutes from "./routes/appointmentsRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import pdfRouter from "./routes/pdfRouter.js";

// ✅ NEU: Calendar API
import calendarRoutes from "./routes/calendarRoutes.js";

// ✅ APP ERSTELLEN
const app = express();

// ✅ CORS korrekt für Frontend :3000
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ✅ PDF ROUTE
app.use("/api/pdf", pdfRouter);

// DEBUG – kann später raus
console.log("ENV CHECK:", {
  PORT: process.env.PORT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  HAS_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

// APIs
app.use("/api/aura", auraRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/calendar", calendarRoutes);

// ✅ ROOT ROUTE (Railway braucht das)
app.get("/", (req, res) => {
  res.send("GlowSuite Backend läuft 🚀");
});

// ✅ WICHTIG FÜR RAILWAY
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 A.U.R.A Backend läuft auf Port ${PORT}`);
});