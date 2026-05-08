export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Missing date"
      });
    }

    return res.status(200).json({
      success: true,
      slots: [
        {
          time: "10:00",
          date,
          signature: "slot_1000"
        },
        {
          time: "12:00",
          date,
          signature: "slot_1200"
        },
        {
          time: "14:00",
          date,
          signature: "slot_1400"
        },
        {
          time: "16:00",
          date,
          signature: "slot_1600"
        }
      ]
    });

  } catch (error) {

    console.error("SLOTS API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}