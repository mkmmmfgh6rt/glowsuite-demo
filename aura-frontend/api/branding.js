import fs from "fs";
import path from "path";

export default function handler(req, res) {

  try {

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "beauty_lounge.json"
    );

    const raw = fs.readFileSync(filePath, "utf8");

    const json = JSON.parse(raw);

    return res.status(200).json({
      success: true,
      tenant: "beauty_lounge",
      branding: json.branding || {}
    });

  } catch (error) {

    console.error("BRANDING API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}