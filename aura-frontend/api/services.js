import fs from "fs";
import path from "path";

const jsonPath = path.join(
  process.cwd(),
  "public",
  "data",
  "beauty_lounge.json"
);

const beautyData = JSON.parse(
  fs.readFileSync(jsonPath, "utf8")
);

export default function handler(req, res) {
  try {

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