// =======================================================
// 📅 AURA Availability Service
// erkennt freie Termine im Studio
// =======================================================

import { getAllEmployees, getAllBookings } from "./db.js";

export function detectFreeSlots({ tenant }) {

  const employees = getAllEmployees(tenant) || [];
  const bookings = getAllBookings() || [];

  const freeSlots = [];

  const today = new Date();
  const nextDays = 5;

  for (let d = 0; d < nextDays; d++) {

    const day = new Date(today);
    day.setDate(today.getDate() + d);

    const dateStr = day.toISOString().slice(0,10);

    for (const emp of employees) {

      const start = emp.work_start || "09:00";
      const end = emp.work_end || "18:00";

      const bookedTimes = bookings
        .filter(b => b.employeeId === emp.id && b.dateTime.startsWith(dateStr))
        .map(b => b.dateTime.slice(11,16));

      const hours = [];

      let current = start;

      while (current < end) {

        if (!bookedTimes.includes(current)) {

          freeSlots.push({
            employee: emp.name,
            employeeId: emp.id,
            date: dateStr,
            time: current
          });

        }

        const [h,m] = current.split(":").map(Number);
        const next = new Date();
        next.setHours(h);
        next.setMinutes(m + 60);

        current =
          next.getHours().toString().padStart(2,"0") +
          ":" +
          next.getMinutes().toString().padStart(2,"0");
      }

    }

  }

  return freeSlots;

}