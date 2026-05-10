import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {

  try {

    // =====================================================
    // JSON DATEI LADEN
    // =====================================================

    const filePath = path.join(
      __dirname,
      "..",
      "public",
      "data",
      "beauty_lounge.json"
    );

    console.log("📂 BRANDING JSON PATH:", filePath);
    console.log("📂 EXISTS:", fs.existsSync(filePath));

    const raw = fs.readFileSync(filePath, "utf8");

    const json = JSON.parse(raw);

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      tenant: "beauty_lounge",
      branding: json.branding || {}
    });

  } catch (error) {

    console.error("❌ BRANDING API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });

  }

}