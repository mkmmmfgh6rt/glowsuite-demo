import fs from "fs";
import path from "path";

const filePath = path.join(
  process.cwd(),
  "public",
  "data",
  "beauty_lounge.json"
);

const beautyData = JSON.parse(
  fs.readFileSync(filePath, "utf8")
);

const employees = [
  {
    id: "anna",
    name: "Anna",
    role: "Kosmetikerin",
    work_start: "09:00",
    work_end: "18:00",
    days: "Mo-Fr",
    buffer: 15,
    active: 1,
    color: "#F4B6C2"
  },
  {
    id: "markus",
    name: "Markus",
    role: "Studioleitung",
    work_start: "09:00",
    work_end: "18:00",
    days: "Mo-Fr",
    buffer: 15,
    active: 1,
    color: "#8FB8DE"
  }
];

function generateMockSlots(date, employeeId) {
  return [
    {
      time: "10:00",
      date,
      employeeId,
      signature: "slot_1000"
    },
    {
      time: "12:00",
      date,
      employeeId,
      signature: "slot_1200"
    },
    {
      time: "14:00",
      date,
      employeeId,
      signature: "slot_1400"
    },
    {
      time: "16:00",
      date,
      employeeId,
      signature: "slot_1600"
    }
  ];
}

export default async function handler(req, res) {

  console.log("🔥 /api/slots called");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const body = req.body || {};

    const date = body.date;
    const employeeId = body.employeeId || "anna";
    const serviceId = body.serviceId || "";
    const serviceName = body.serviceName || "";

    console.log("DATE:", date);
    console.log("EMPLOYEE:", employeeId);
    console.log("SERVICE ID:", serviceId);
    console.log("SERVICE NAME:", serviceName);

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Missing date"
      });
    }

    // 🔥 Service prüfen
    const incomingService =
      String(serviceId || serviceName).toLowerCase();

    const service = beautyData.services.find(
      (s) =>
        s.name.toLowerCase() === incomingService
    );

    if (!service) {

      console.log(
        "AVAILABLE SERVICES:",
        beautyData.services.map((s) => s.name)
      );

      return res.status(404).json({
        success: false,
        error: "Service not found"
      });
    }

    // 🔥 Mitarbeiter prüfen
    const employee = employees.find(
      (e) => e.id === employeeId
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // 🔥 TEMP MOCK SLOTS
    const slots = generateMockSlots(
      date,
      employee.id
    );

    console.log("✅ SLOTS:", slots);

    return res.status(200).json({
      success: true,
      slots
    });

  } catch (error) {

    console.error("❌ SLOTS API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });

  }

}