import beautyData from "../public/data/beauty_lounge.json" assert { type: "json" };

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