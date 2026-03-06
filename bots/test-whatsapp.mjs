import dotenv from "dotenv";
import twilio from "twilio";
import fetch from "node-fetch";

// ENV laden
dotenv.config({ path: "../config/.env" });

// Twilio-Daten
const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_WHATSAPP_FROM;

// Deine WhatsApp-Nummer
const TO = "whatsapp:+49DEINE_NUMMER"; // <- anpassen!

if (!SID || !TOKEN) {
  console.error("❌ TWILIO_ACCOUNT_SID oder TWILIO_AUTH_TOKEN fehlt");
  process.exit(1);
}

const client = twilio(SID, TOKEN);

// API-URL (lokaler Server)
const BASE = "http://localhost:8083";

// Hilfsfunktion – 2 Minuten in der Zukunft
function getDateTimeIn2Minutes() {
  const t = new Date(Date.now() + 2 * 60000);
  return {
    date: t.toISOString().split("T")[0],
    time: t.toTimeString().slice(0, 5),
  };
}

(async () => {
  try {
    const { date, time } = getDateTimeIn2Minutes();

    console.log("📅 Erstelle Testtermin für:", date, time);

    // Testbuchung anlegen
    const res = await fetch(`${BASE}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant": "beauty_lounge",
        "authorization": "Basic " + Buffer.from("admin:geheim123").toString("base64")
      },
      body: JSON.stringify({
        name: "Test Reminder",
        phone: TO.replace("whatsapp:", ""),
        service: "Testservice",
        price: 0,
        duration: 30,
        date: date,
        time: time,
        tenant: "beauty_lounge",
      }),
    });

    const data = await res.json();
    if (!data.success) {
      console.error("❌ Fehler beim Anlegen des Testtermins:", data);
      return;
    }

    console.log("✅ Testtermin angelegt:", data.booking.id);

    console.log("⏳ Reminder wird in ~60 Sekunden ausgelöst …");
    console.log("📲 Du bekommst gleich eine WhatsApp-Nachricht!");

  } catch (err) {
    console.error("❌ Test-Reminder Fehler:", err);
  }
})();
