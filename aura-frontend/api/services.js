import fs from "fs";
import path from "path";

export default function handler(req, res) {

  try {

    const filePath = path.join(
      process.cwd(),
      "..",
      "Datein",
      "config",
      "kunden",
      "beauty_lounge.json"
    );

    const rawData = fs.readFileSync(filePath, "utf8");

    const json = JSON.parse(rawData);

    return res.status(200).json({
      success: true,
      services: json.services || []
    });

  } catch (error) {

    console.error("SERVICES API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}