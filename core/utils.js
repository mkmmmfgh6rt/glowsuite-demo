// =====================================================
// 🧠 utils.js – zentrale Helferfunktionen (v3 stabil)
// =====================================================

import fs from "fs";
import path from "path";

// -----------------------------------------------------
// 🔧 Tenant-Konfiguration laden (für Multi-Studio-System)
// -----------------------------------------------------
export function loadTenantConfig(tenant = "beauty_lounge") {
  const basePath = path.resolve("./config/kunden");
  const filePath = path.join(basePath, `${tenant}.json`);

  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return {
        tenant,
        branding: data.branding || {
          brandName: "Beauty Lounge",
          brandColor: "#C8A97E",
          logo: "/favicon.ico",
        },
        services: data.services || [],
      };
    } else {
      console.warn(`⚠️ Kein Config-File gefunden für Tenant "${tenant}" → Fallback aktiv`);
      return {
        tenant,
        branding: {
          brandName: "Beauty Lounge",
          brandColor: "#C8A97E",
          logo: "/favicon.ico",
        },
        services: [],
      };
    }
  } catch (err) {
    console.error("❌ Fehler beim Laden der Tenant-Konfiguration:", err);
    return {
      tenant,
      branding: {
        brandName: "Beauty Lounge",
        brandColor: "#C8A97E",
        logo: "/favicon.ico",
      },
      services: [],
    };
  }
}

// -----------------------------------------------------
// 🕒 Zeit- und Format-Helfer
// -----------------------------------------------------
export function formatDateTimeDE(dateTime) {
  const d = new Date(dateTime);
  return d.toLocaleString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// -----------------------------------------------------
// 💾 JSON speichern (z. B. für Logs, Exporte, DSGVO)
// -----------------------------------------------------
export function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`✅ Gespeichert: ${filePath}`);
  } catch (err) {
    console.error("❌ Fehler beim Speichern der JSON-Datei:", err);
  }
}

// -----------------------------------------------------
// 🧩 ID-Generator (z. B. für Buchungen, Sessions)
// -----------------------------------------------------
import { v4 as uuidv4 } from "uuid";
export const genId = () => uuidv4();

// -----------------------------------------------------
// 🔒 Sichere Datei-Erstellung
// -----------------------------------------------------
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}


