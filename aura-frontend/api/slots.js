import beautyData from "../public/data/beauty_lounge.json";

import {
  calculateSlotsForEmployee
} from "../core/availabilityEngine.js";

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

export default async function handler(req, res) {

  console.log("🔥 SLOTS API START");

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

    // 🔥 SERVICE SUCHEN

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

    // 🔥 MITARBEITER SUCHEN

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

    // 🔥 ECHTE SLOT ENGINE

    const slots = calculateSlotsForEmployee({
      employee,
      service,
      date
    });

    console.log("✅ GENERATED SLOTS:", slots);

    return res.status(200).json({
      success: true,
      slots
    });

  } catch (error) {

    console.error("❌ SLOTS API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });

  }

}