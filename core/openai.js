import "dotenv/config";
import OpenAI from "openai";

let openaiClient = null;

if (!process.env.OPENAI_API_KEY) {
  console.warn("[WARNUNG] OPENAI_API_KEY ist nicht gesetzt. KI-Funktionen sind deaktiviert.");
} else {
  try {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log("🔑 OpenAI-Client erfolgreich initialisiert.");
  } catch (e) {
    console.error("[FEHLER] OpenAI-Client konnte nicht initialisiert werden:", e.message);
    openaiClient = null;
  }
}

export const openai = openaiClient;
export const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Extrahiert Service + Datum/Uhrzeit aus einer Nachricht mit OpenAI
 * @param {string} message - Kundennachricht
 * @param {string[]} services - Liste verfügbarer Services
 * @returns {Promise<{ service: string|null, dateTime: Date|null }|null>}
 */
export async function extractBookingDetails(message, services) {
  if (!openai) return null;

  try {
    const prompt = `
Analysiere die folgende Kundennachricht und gib NUR ein JSON zurück.

- "service": exakter Name eines Services aus dieser Liste → ${services.join(", ")}
- "dateTime": Datum und Uhrzeit im ISO-Format (z. B. "2025-09-01T14:30:00").
  Falls kein Datum/Uhrzeit genannt wird → null.

Beantworte ausschließlich im JSON-Format.

Nachricht: """${message}"""
`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let text = completion.choices[0].message.content.trim();

    // Falls OpenAI etwas drumherum schreibt, nur JSON herausfiltern
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("⚠️ Kein gültiges JSON von OpenAI erhalten:", text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      service: parsed.service && services.includes(parsed.service) ? parsed.service : null,
      dateTime: parsed.dateTime ? new Date(parsed.dateTime) : null,
    };
  } catch (err) {
    console.error("❌ Fehler bei extractBookingDetails:", err.message);
    return null;
  }
}
