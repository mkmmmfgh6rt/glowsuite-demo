export default async function handler(req, res) {

  console.log("BOOKING METHOD:", req.method);
  console.log("BOOKING BODY:", req.body);

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const bookingId = `booking_${Date.now()}`;

    return res.status(200).json({
      success: true,
      bookingId,
      message: "Booking created successfully"
    });

  } catch (error) {

    console.error("BOOKING API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}