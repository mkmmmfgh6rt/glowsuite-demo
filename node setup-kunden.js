// setup-kunden.js — Erstellt automatisch Beispiel-Kundenstruktur
import fs from "fs";
import path from "path";

const kundenDir = path.resolve("./config/kunden");
const studios = [
  {
    id: "beauty_lounge",
    name: "Beauty Lounge",
    color: "#C38B5F",
    logo: "/favicon.ico",
    openingHours: { start: 9, end: 18 },
    services: {
      "Haarschnitt Damen": { price: 45, duration: 60, description: "Waschen, Schneiden & Föhnen" },
      "Haarschnitt Herren": { price: 30, duration: 45, description: "Schnitt & Styling für Herren" },
      "Maniküre": { price: 25, duration: 30, description: "Pflege & Lackierung der Nägel" },
      "Pediküre": { price: 35, duration: 45, description: "Fußpflege & Wellness für die Füße" },
      "Wimpernlifting": { price: 45, duration: 45, description: "Schöne, geschwungene Wimpern" },
      "Gesichtsbehandlung": { price: 60, duration: 60, description: "Tiefenreinigung & Pflege für strahlende Haut" },
    },
  },
  {
    id: "hair_by_sarah",
    name: "Hair by Sarah",
    color: "#A37C4A",
    logo: "/favicon.ico",
    openingHours: { start: 10, end: 19 },
    services: {
      "Haarschnitt Damen": { price: 50, duration: 60, description: "Luxus Haarschnitt inkl. Styling" },
      "Haarschnitt Herren": { price: 35, duration: 45, description: "Moderner Schnitt für Herren" },
      "Färben & Tönen": { price: 70, duration: 90, description: "Professionelle Haarfarbe mit Pflege" },
      "Strähnchen": { price: 90, duration: 120, description: "Feine oder breite Strähnen nach Wunsch" },
      "Balayage": { price: 120, duration: 150, description: "Natürliches Farbspiel für besonderen Look" },
      "Styling & Make-up": { price: 60, duration: 60, description: "Styling für besondere Anlässe" },
    },
  },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("📁 Erstellt:", dir);
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  console.log("✅ Datei erstellt:", file);
}

function setupStudios() {
  ensureDir(kundenDir);

  for (const studio of studios) {
    const studioDir = path.join(kundenDir, studio.id);
    ensureDir(studioDir);

    const branding = {
      brandName: studio.name,
      brandColor: studio.color,
      logo: studio.logo,
      openingHours: studio.openingHours,
    };
    const services = studio.services;

    writeJSON(path.join(studioDir, "branding.json"), branding);
    writeJSON(path.join(studioDir, "services.json"), services);
  }

  console.log("\n✨ Fertig! Beide Studios wurden angelegt:");
  console.log(" - config/kunden/beauty_lounge/");
  console.log(" - config/kunden/hair_by_sarah/");
  console.log("\nDu kannst die Dateien jetzt individuell anpassen.\n");
}

setupStudios();
