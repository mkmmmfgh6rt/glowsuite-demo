export default function handler(req, res) {

  if (req.method === "GET") {

    return res.status(200).json({
      success: true,
      data: [
        {
          id: "any",
          name: "Beliebig",
          role: "Studio Team",
          active: true
        }
      ]
    });

  }

  return res.status(405).json({
    success: false,
    error: "Method not allowed"
  });

}