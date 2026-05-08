import beautyData from "../public/data/beauty_lounge.json";

// import { calculateSlotsForEmployee } from "../core/availabilityEngine.js";

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

function generateMockSlots(date) {

  return [
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
  ];

}

export default async function handler(req, res) {

  console.log("METHOD:", req.method);
  console.log("BODY:", req.body);

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {

    const {
      date,
      employeeId,
      serviceId
    } = req.body || {};

    console.log("DATE:", date);
    console.log("EMPLOYEE:", employeeId);
    console.log("SERVICE:", serviceId);

    if (!date) {
      return res.status(400).json({
        success: false,
        error: "Missing date"
      });
    }

    // 🔥 Service suchen
    const service = beautyData.services.find(
      (s) =>
        s.name.toLowerCase() ===
        String(serviceId || "").toLowerCase()
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service not found"
      });
    }

    // 🔥 Mitarbeiter bestimmen
    const employee =
      employeeId === "auto"
        ? employees[0]
        : employees.find((e) => e.id === employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // 🔥 TEMP STABILIZATION
    const slots = generateMockSlots(date);

    console.log("SLOTS:", slots);

    return res.status(200).json({
      success: true,
      slots
    });

  } catch (error) {

    console.error("SLOTS API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }

}