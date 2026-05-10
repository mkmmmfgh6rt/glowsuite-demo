import beautyData from "../public/data/beauty_lounge.json" assert { type: "json" };

import {
  calculateSlotsForEmployee
} from "../frontend-core/availabilityEngine.js";

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

    // =====================================================
    // BODY
    // =====================================================

    const {
      date,
      employeeId,
      serviceId
    } = req.body || {};

    console.log("📅 DATE:", date);
    console.log("👤 EMPLOYEE:", employeeId);
    console.log("💅 SERVICE:", serviceId);

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!date) {

      return res.status(400).json({
        success: false,
        error: "Missing date"
      });

    }

    if (!serviceId) {

      return res.status(400).json({
        success: false,
        error: "Missing serviceId"
      });

    }

    // =====================================================
    // SERVICE FINDEN
    // =====================================================

    const service = beautyData.services.find(
      (s) =>
        s.name.toLowerCase() ===
        String(serviceId || "").toLowerCase()
    );

    console.log("🧾 FOUND SERVICE:", service);

    if (!service) {

      return res.status(404).json({
        success: false,
        error: "Service not found"
      });

    }

    // =====================================================
    // EMPLOYEE FINDEN
    // =====================================================

    const employee =
      employeeId === "auto"
        ? employees[0]
        : employees.find((e) => e.id === employeeId);

    console.log("👨‍💼 FOUND EMPLOYEE:", employee);

    if (!employee) {

      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });

    }

    // =====================================================
    // SLOTS GENERIEREN
    // =====================================================

    const slots = calculateSlotsForEmployee({
      emp: employee,
      serviceDuration: service.duration,
      date,
      tenant: "beauty_lounge"
    });

    console.log("✅ GENERATED SLOTS:", slots);

    // =====================================================
    // RESPONSE
    // =====================================================

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