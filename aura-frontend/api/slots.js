export default function handler(req, res) {

  console.log("🔥 NEW API FILE WORKS");

  return res.status(200).json({
    success: true,
    message: "NEW API FILE WORKS"
  });

}