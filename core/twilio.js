// core/twilio.js
import twilio from "twilio";

const ENABLED =
  String(process.env.ENABLE_WHATSAPP || "").toLowerCase() === "true";

let client = null;

function getClient() {
  if (!ENABLED) return null;
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) {
      console.warn("⚠️ Twilio nicht konfiguriert – WhatsApp deaktiviert.");
      return null;
    }
    client = twilio(sid, token);
  }
  return client;
}

export function isTwilioEnabled() {
  return ENABLED && !!getClient();
}

// kleine Helferfunktion: Telefonnummer in WhatsApp-Format bringen
export function normalizeWhatsAppNumber(raw) {
  if (!raw) return null;
  let n = String(raw).replace(/[\s\/\-().]/g, "");
  if (n.startsWith("whatsapp:")) return n;
  if (n.startsWith("+")) return "whatsapp:" + n;
  if (n.startsWith("0")) {
    // grobe Annahme: Deutschland
    return "whatsapp:+49" + n.slice(1);
  }
  // fallback: so wie es ist, aber mit "+"
  if (!n.startsWith("+")) n = "+" + n;
  return "whatsapp:" + n;
}

export async function sendWhatsAppMessage(toNumber, body) {
  const cli = getClient();
  if (!cli) {
    console.warn("⚠️ sendWhatsAppMessage: Twilio-Client nicht aktiv.");
    return null;
  }
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = normalizeWhatsAppNumber(toNumber);

  if (!from || !to) {
    console.warn("⚠️ sendWhatsAppMessage: from/to fehlt.", { from, to });
    return null;
  }

  try {
    const msg = await cli.messages.create({
      from,
      to,
      body,
    });
    console.log("📨 WhatsApp gesendet:", msg.sid);
    return msg;
  } catch (err) {
    console.error("❌ Fehler beim WhatsApp-Versand:", err.message);
    return null;
  }
}
