import {
  getAllBookings,
  hasMarketingConsent
} from "../../../core/db.js";
import twilio from "twilio";
import fs from "fs";
import path from "path";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const PUBLIC_BOOKING_URL =
  process.env.PUBLIC_BOOKING_URL || "https://www.glowsuite-ai.de";

// nach wie vielen Tagen erinnert werden soll
const REBOOK_DAYS = 35;

// Log Datei für bereits gesendete Reminder
const logPath = path.join(process.cwd(), "data", "rebooking_log.json");

function loadLog() {

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, JSON.stringify({}, null, 2));
  }

  return JSON.parse(fs.readFileSync(logPath));

}

function saveLog(log) {

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));

}

export async function runRebookingCheck({ tenant } = {}) {

  const tenantId = String(tenant || "").trim();

  if (!tenantId) {
    console.warn("🔒 Rebooking übersprungen: tenant fehlt");
    return {
      success: false,
      error: "tenant_required",
      sent: 0
    };
  }

  const bookings = (getAllBookings() || []).filter(b =>
    String(b?.tenant || "").trim() === tenantId &&
    String(b?.phone || "").trim()
  );

  const customers = {};

  const log = loadLog();

  // letzte Buchung pro Kunde finden
  for (const b of bookings) {

    const phone = b.phone;

    if (!phone) continue;

    if (!customers[phone]) {
      customers[phone] = b;
    }

    const existing = customers[phone];

    if (new Date(b.dateTime) > new Date(existing.dateTime)) {
      customers[phone] = b;
    }

  }

  const now = new Date();
  let sent = 0;

  for (const phone in customers) {

    const booking = customers[phone];

    if (!hasMarketingConsent({
      tenant: tenantId,
      phone
    })) {
      continue;
    }

    const lastVisit = new Date(booking.dateTime);

    const diffDays = Math.floor(
      (now - lastVisit) / (1000 * 60 * 60 * 24)
    );

    const logKey = `${tenantId}:${phone}`;
    const alreadySent = log[logKey];

    if (diffDays >= REBOOK_DAYS && !alreadySent) {

      const delivered = await sendRebookingReminder(phone);

      if (delivered) {
        log[logKey] = {
          tenant: tenantId,
          phone,
          sentAt: new Date().toISOString(),
          lastVisit: booking.dateTime
        };
        sent += 1;
      }

    }

  }

  saveLog(log);

  return {
    success: true,
    tenant: tenantId,
    sent
  };

}


// WhatsApp Reminder senden
async function sendRebookingReminder(phone) {

  try {

    await client.messages.create({
      from: WHATSAPP_FROM,
      to: `whatsapp:${phone}`,
      body: `Hi ✨

wir haben dich länger nicht gesehen.

Zeit für deine nächste Behandlung 💅

Buche dir deinen Termin hier:
${PUBLIC_BOOKING_URL}`
    });

    console.log("Rebooking Reminder gesendet:", phone);

    return true;

  } catch (err) {

    console.error("Rebooking Fehler:", err.message);

    return false;

  }

}
