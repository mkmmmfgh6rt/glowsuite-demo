import employees from "../data/employees.js";
import services from "../data/services.js";

import {
  calculateSlotsForEmployee,
} from "../core/availabilityEngine.js";

export default async function handler(req, res) {

  try {

    const {
      employeeId,
      serviceId,
      date,
      tenant = "beauty_lounge"
    } = req.query;

    if (!employeeId || !serviceId || !date) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters"
      });
    }

    const employee = employees.find(
      e => String(e.id) === String(employeeId)
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    const service = services.find(
      s => String(s.id) === String(serviceId)
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: "Service not found"
      });
    }

    const slots = calculateSlotsForEmployee({
      emp: employee,
      serviceDuration: service.duration,
      date,
      tenant
    });

    return res.status(200).json({
      success: true,
      slots
    });

  } catch (err) {

    console.error("❌ SLOTS API ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });

  }

}