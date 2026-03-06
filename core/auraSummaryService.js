// Datein/core/auraSummaryService.js
import { getAppointmentsUnified } from "./getAppointmentsUnified.js";
import { getEmployeeUnified } from "./getEmployeesUnified.js";

/* =========================================
   Zeitfilter
========================================= */

function isWithinPeriod(dateISO, period) {
  if (!dateISO) return false;

  const d = new Date(dateISO);
  const now = new Date();

  switch (period) {
    case "last_30_days": {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      return d >= start && d <= now;
    }
    case "next_7_days": {
      const end = new Date();
      end.setDate(now.getDate() + 7);
      return d >= now && d <= end;
    }
    case "today":
    default: {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    }
  }
}

/* =========================================
   AURA SUMMARY – Optimiert (Studio Utilization robust)
========================================= */

export async function getAuraSummary(period = "today", tenant = null) {
  const appointments = await getAppointmentsUnified(tenant);

  // ---------- FILTER ----------
  const filtered = appointments.filter(a =>
    isWithinPeriod(a.dateTime, period)
  );

  // ---------- STUDIO SUMMARY ----------
  const revenue = filtered.reduce(
    (sum, a) => sum + (a.price || 0),
    0
  );

  const DEFAULT_DURATION_MIN = 60;

  const totalBookedMinutes = filtered.reduce((sum, a) => {
    const dur =
      typeof a.duration === "number" && a.duration > 0
        ? a.duration
        : DEFAULT_DURATION_MIN;
    return sum + dur;
  }, 0);

  let days = 1;
  if (period === "last_30_days") days = 30;
  if (period === "next_7_days") days = 7;

  const WORK_MINUTES_PER_DAY = 8 * 60;

  // ---------- EMPLOYEE STATS (optional) ----------
  const employeeIds = [
    ...new Set(
      filtered
        .map(a => a.employeeId)
        .filter(Boolean)
    ),
  ];

  const employeeStats = [];

  for (const empId of employeeIds) {
    const emp = await getEmployeeUnified(empId);
    if (!emp) continue;

    const empAppointments = filtered.filter(
      a => String(a.employeeId) === String(empId)
    );

    const bookedMinutes = empAppointments.reduce((sum, a) => {
      const dur =
        typeof a.duration === "number" && a.duration > 0
          ? a.duration
          : DEFAULT_DURATION_MIN;
      return sum + dur;
    }, 0);

    const availableMinutes = days * WORK_MINUTES_PER_DAY;

    const utilization = availableMinutes
      ? Math.round((bookedMinutes / availableMinutes) * 100)
      : 0;

    employeeStats.push({
      id: emp.id,
      name: emp.name,
      appointments: empAppointments.length,
      booked_minutes: bookedMinutes,
      available_minutes: availableMinutes,
      utilization_percent: utilization,
      source: emp.source,
    });
  }

  // ---------- STUDIO UTILIZATION (robust & unabhängig) ----------
  const effectiveEmployeeCount =
    employeeStats.length > 0 ? employeeStats.length : 1;

  const totalAvailableMinutes =
    effectiveEmployeeCount * days * WORK_MINUTES_PER_DAY;

  const studioUtilization = totalAvailableMinutes
    ? Math.round((totalBookedMinutes / totalAvailableMinutes) * 100)
    : 0;

  // ---------- RETURN ----------
  return {
    period,
    studio: {
      count: filtered.length,
      revenue,
      avg_booking_value: filtered.length
        ? Math.round((revenue / filtered.length) * 100) / 100
        : 0,
      utilization: studioUtilization,
    },
    employees: employeeStats,
  };
}




