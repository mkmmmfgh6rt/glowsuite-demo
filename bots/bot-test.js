// bot-test.js — simuliert WhatsApp-Nachrichten über die API
import fetch from "node-fetch";

const BASE_URL = "http://localhost:8083/chat";

// Hilfsfunktion: Nachricht senden
async function sendMessage(message, sender = "testuser@local") {
  console.log(`\n📤 Sende: ${message}`);
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, sender }),
    });
    const data = await res.json();
    console.log("📩 Antwort:", data);
  } catch (err) {
    console.error("❌ Fehler beim Test:", err);
  }
}

async function runTests() {
  console.log("🚀 Starte Bot-Test...");

  // 1. Ping-Test
  await sendMessage("ping");

  // 2. Einfacher Service
  await sendMessage("Pediküre");

  // 3. Doppelbuchung testen
  await sendMessage("Pediküre");
  await sendMessage("Pediküre"); // gleiche Anfrage direkt nochmal

  // 4. Datum-Test
  await sendMessage("12.10.2025");

  // 5. Ungültiges Datum
  await sendMessage("31.02.2025");

  // 6. Test PDF/Preisliste
  await sendMessage("Preisliste");

  // 7. Abbruch
  await sendMessage("Abbrechen");

  console.log("\n✅ Tests abgeschlossen!");
}

runTests();
