import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  calculateSlotsForEmployee
} from "../frontend-core/availabilityEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // JSON LADEN
    // =====================================================

    const filePath = path.join(
      __dirname,
      "..",
      "public",
      "data",
      "beauty_lounge.json"
    );

    console.log("📂 JSON PATH:", filePath);
    console.log("📂 EXISTS:", fs.existsSync(filePath));

    const jsonData = fs.readFileSync(filePath, "utf8");

    const beautyData = JSON.parse(jsonData);

    // =====================================================
    // BODY
    // =====================================================

    const {
      date,
      employeeId,
      serviceId,
      serviceName
    } = req.body || {};

    console.log("📅 DATE:", date);
    console.log("👤 EMPLOYEE:", employeeId);
    console.log("💅 SERVICE:", serviceId || serviceName);

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!date) {

      return res.status(400).json({
        success: false,
        error: "Missing date"
      });

    }

    const finalServiceName = serviceId || serviceName;

    if (!finalServiceName) {

      return res.status(400).json({
        success: false,
        error: "Missing service"
      });

    }

    // =====================================================
    // SERVICE FINDEN
    // =====================================================

    const service = beautyData.services.find(
      (s) =>
        s.name.toLowerCase() ===
        String(finalServiceName).toLowerCase()
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
      employeeId === "auto" || !employeeId
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