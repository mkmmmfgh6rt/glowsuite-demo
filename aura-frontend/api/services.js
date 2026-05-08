import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function handler(req, res) {

  try {

    const filePath = path.join(
      __dirname,
      "..",
      "public",
      "data",
      "beauty_lounge.json"
    );

    const jsonData = fs.readFileSync(filePath, "utf8");

    const beautyData = JSON.parse(jsonData);

    return res.status(200).json({
      success: true,
      services: beautyData.services || []
    });

  } catch (error) {

    console.error("SERVICES API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}