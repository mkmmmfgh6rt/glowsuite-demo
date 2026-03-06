// ===========================================
// whatsapp-bot.js v6 — STABLE / WINDOWS-SAFE
// ===========================================
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { runAgent } from "../core/agent.js";

// ================= CONFIG =================
const TEST_MODE = String(process.env.WHATSAPP_TEST || "false").toLowerCase() === "true";
const HEADLESS = String(process.env.PUPPETEER_HEADLESS ?? "true").toLowerCase() !== "false";
const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();
const TENANT_DEFAULT = process.env.TENANT_DEFAULT || "beauty_lounge";

// 🔒 EXTERNER SESSION-PFAD (WINDOWS-SAFE)
const SESSIONS_PATH = "C:/whatsapp-sessions";

// ================= LOG =================
function log(level, ...args) {
  const order = { debug: 10, info: 20, warn: 30, error: 40 };
  if (order[level] >= order[LOG_LEVEL]) {
    console[level === "debug" ? "log" : level](...args);
  }
}

// ================= START =================
export function startWhatsAppBot() {
  log("info", "🚀 Starte WhatsApp-Bot (STABLE MODE)");

  if (!fs.existsSync(SESSIONS_PATH)) {
    fs.mkdirSync(SESSIONS_PATH, { recursive: true });
    log("info", "📁 Session-Ordner erstellt:", SESSIONS_PATH);
  }

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: "multi_studio_bot",
      dataPath: SESSIONS_PATH,
    }),
    puppeteer: {
      headless: HEADLESS,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  });

  // ================= EVENTS =================
  client.on("qr", (qr) => {
    log("info", "📱 QR-Code erhalten – bitte scannen");
    qrcode.generate(qr, { small: true });
  });

  client.on("authenticated", () => {
    log("info", "🔐 Authentifizierung erfolgreich");
  });

  client.on("ready", () => {
    log("info", "✅ WhatsApp-Bot verbunden & bereit!");
  });

  client.on("auth_failure", (msg) => {
    log("error", "❌ Auth-Fehler:", msg);
  });

  client.on("disconnected", (reason) => {
    log("warn", "⚠️ Verbindung getrennt:", reason);
    log("warn", "🛑 Bot bleibt gestoppt – bitte manuell neu starten");
  });

  // ================= MESSAGE =================
  client.on("message", async (msg) => {
    try {
      if (!msg?.body) return;
      if (msg.from === "status@broadcast") return;
      if (msg.from.endsWith("@g.us")) return;

      log("info", `📩 ${msg.from}: ${msg.body}`);

      if (TEST_MODE) {
        await msg.reply("🤖 Testmodus aktiv.");
        return;
      }

      const reply = await runAgent(msg.from, msg.body, TENANT_DEFAULT);
      if (reply) await msg.reply(reply);
    } catch (err) {
      log("error", "❌ Message-Fehler:", err);
      try {
        await msg.reply("⚠️ Es gab einen technischen Fehler. Bitte erneut versuchen.");
      } catch {}
    }
  });

  // ================= START CLIENT =================
  client.initialize().catch((err) => {
    log("error", "❌ Initialisierungsfehler:", err);
  });

  // ================= SHUTDOWN =================
  async function shutdown() {
    try {
      log("info", "🛑 Shutdown WhatsApp-Bot");
      await client.destroy();
    } catch {}
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
