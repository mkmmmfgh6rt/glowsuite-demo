import { openai, MODEL } from "./openai.js";
import fs from "fs";

export async function answerBeautyQuestion(question) {

  if (!openai) {
    return "KI momentan nicht verfügbar.";
  }

  const services = JSON.parse(
    fs.readFileSync("./public/services.json", "utf8")
  );

  const serviceList = services
    .map(s => `${s.name} – ${s.price || ""}€ – ${s.duration || ""}min`)
    .join("\n");

  const prompt = `
Du bist ein freundlicher Beauty Studio Assistent.

Studio Services:
${serviceList}

Beantworte Kundenfragen kurz und freundlich.

Wenn der Kunde nach einem Service fragt:
- Preis nennen
- Dauer nennen
- am Ende fragen ob Termin gebucht werden soll

Kundenfrage:
"${question}"
`;

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "Du bist ein Beauty Studio Assistent." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });

  return completion.choices[0].message.content.trim();
}