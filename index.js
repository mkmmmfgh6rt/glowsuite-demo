// index.js
import "dotenv/config";                // .env laden
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import router from "./router.js";      // default export verwenden
import { authMiddleware } from "./auth.js";

// Optional: WhatsApp Bot
let startWhatsAppBot = null;
if (process.env.ENABLE_WHATSAPP === "true") {
  try {
    const botModule = await import("./whatsapp-bot.js");
    startWhatsAppBot = botModule.startWhatsAppBot;
  } catch (e) {
    console.error("❌ Konnte WhatsApp-Bot nicht laden:", e.message);
  }
}

// --- Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8083;

// --- Middlewares ---
app.use(bodyParser.json());
app.use("/", router);

// 👉 Widget-Frontend (frei zugänglich)
app.get("/widget.html", (_req, res) => {
  res.sendFile(path.join(__dirname, "widget.html"));
});

// 👉 Admin-Panel (geschützt durch Basic Auth)
app.get("/admin.html", authMiddleware, (_req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`🚀 Server läuft auf:     http://localhost:${PORT}`);
  console.log(`💬 Chat-Widget:         http://localhost:${PORT}/widget.html`);
  console.log(`🔐 Admin-Panel (Login): http://localhost:${PORT}/admin.html`);
  if (process.env.ENABLE_WHATSAPP === "true") {
    console.log(`🤖 WhatsApp-Bot:        aktiviert`);
  } else {
    console.log(`🤖 WhatsApp-Bot:        deaktiviert`);
  }
  console.log("=====================================");
});

// --- WhatsApp Bot starten (nur wenn aktiviert) ---
if (startWhatsAppBot) {
  console.log("🚀 Starte WhatsApp-Bot...");
  startWhatsAppBot();
}
