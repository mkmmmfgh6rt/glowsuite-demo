// core/reminders.js
import fs from "fs";
import path from "path";
import cron from "node-cron";
import { fileURLToPath } from "url";
import { getAllBookings } from "./db.js";
import { sendWhatsAppMessage, isTwilioEnabled } from "./twilio.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const reminderFile = path.join(dataDir, "reminders.json");

// kleines JSON-Log, damit wir wissen, was schon gesendet wurde
function loadReminderState() {
  try {
    if (!fs.existsSync(reminderFile)) return {};
    return JSON.parse(fs.readFileSync(reminderFile, "utf8"));
  } catch {
    return {};
  }
}

function saveReminderState(state) {
  fs.writeFileSync(reminderFile, JSON.stringify(state, null, 2), "utf8");
}

function formatBookingInfo(booking) {
  const dt = new Date(booking.dateTime);
  const d = dt.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const t = dt.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { d, t };
}

// sofort nach Buchung
export async function sendBookingConfirmation(booking) {
  if (!isTwilioEnabled()) return;
  if (!booking.phone) return;

  const { d, t } = formatBookingInfo(booking);
  const brand = booking.tenant || "Ihr Studio";

  const text =
    `Hallo ${booking.name || ""} 👋\n\n` +
    `dein Termin bei ${brand} wurde soeben eingetragen:\n` +
    `• Leistung: ${booking.service}\n` +
    `• Datum: ${d}\n` +
    `• Uhrzeit: ${t}\n\n` +
    `Du erhältst automatisch eine Erinnerung 24h und 2h vor dem Termin per WhatsApp.\n` +
    `Wenn du den Termin nicht wahrnehmen kannst, antworte bitte kurz.`;

  await sendWhatsAppMessage(booking.phone, text);
}

// wird regelmäßig aufgerufen
async function runReminderScan() {
  if (!isTwilioEnabled()) return;

  const all = getAllBookings();
  if (!Array.isArray(all) || all.length === 0) return;

  const state = loadReminderState();
  const now = Date.now();

  for (const b of all) {
    if (!b || !b.id || !b.dateTime || !b.phone) continue;

    const dt = new Date(b.dateTime).getTime();
    if (isNaN(dt) || dt <= now) continue; // nur zukünftige Termine

    const diffMs = dt - now;
    const diffH = diffMs / (1000 * 60 * 60);

    if (!state[b.id]) state[b.id] = { sent24: false, sent2: false };

    const { d, t } = formatBookingInfo(b);
    const brand = b.tenant || "Ihr Studio";

    // 24h Reminder (Toleranzfenster: zwischen 23.5h und 24.5h)
    if (!state[b.id].sent24 && diffH <= 24.5 && diffH >= 23.5) {
      const msg =
        `Erinnerung 📅\n\n` +
        `Du hast morgen einen Termin bei ${brand}:\n` +
        `• Leistung: ${b.service}\n` +
        `• Datum: ${d}\n` +
        `• Uhrzeit: ${t}\n\n` +
        `Wenn du den Termin nicht wahrnehmen kannst, antworte bitte kurz.`;
      await sendWhatsAppMessage(b.phone, msg);
      state[b.id].sent24 = true;
    }

    // 2h Reminder (Toleranzfenster: zwischen 1.5h und 2.5h)
    if (!state[b.id].sent2 && diffH <= 2.5 && diffH >= 1.5) {
      const msg =
        `Kurz vor deinem Termin ⏰\n\n` +
        `Dein Termin bei ${brand} ist in ca. 2 Stunden:\n` +
        `• Uhrzeit: ${t}\n\n` +
        `Wir freuen uns auf dich! 🤍`;
      await sendWhatsAppMessage(b.phone, msg);
      state[b.id].sent2 = true;
    }
  }

  saveReminderState(state);
}

// vom Serverstart aufgerufen
export function initReminderEngine() {
  if (!isTwilioEnabled()) {
    console.log("ℹ️ WhatsApp Reminder Engine ist deaktiviert (ENABLE_WHATSAPP != true).");
    return;
  }

  console.log("✅ WhatsApp Reminder Engine gestartet (alle 5 Minuten Scan).");

  // alle 5 Minuten prüfen
  cron.schedule("*/5 * * * *", () => {
    runReminderScan().catch((err) =>
      console.error("❌ Reminder Scan Fehler:", err)
    );
  });
}
