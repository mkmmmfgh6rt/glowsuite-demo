export default function handler(req, res) {

  if (req.method === "GET") {

    return res.status(200).json({
      success: true,
      data: [
        {
          id: "anna",
          name: "Anna",
          role: "Kosmetikerin",
          active: 1,

          work_start: "09:00",
          work_end: "18:00",

          days: "Mo-Fr",

          buffer: 15,

          color: "#F4B6C2"
        },

        {
          id: "markus",
          name: "Markus",
          role: "Studioleitung",
          active: 1,

          work_start: "09:00",
          work_end: "18:00",

          days: "Mo-Fr",

          buffer: 15,

          color: "#8FB8DE"
        }
      ]
    });

  }

  return res.status(405).json({
    success: false,
    error: "Method not allowed"
  });

}