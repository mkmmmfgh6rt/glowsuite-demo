export default async function handler(req, res) {

  try {

    const data = {
      success: true,
      slots: [
        "10:00",
        "11:00",
        "12:00"
      ]
    };

    return res.status(200).json(data);

  } catch (error) {

    console.error("SLOTS ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}