// =======================================================
// 🧠 Availability Engine – SINGLE SOURCE OF TRUTH
// Phase 3.5 + 4.0.1 – Core Logic + Slot Signature
// =======================================================

import crypto from "crypto";
import { getAllBookings } from "./db.js";

/**
 * Prüft, ob ein Mitarbeiter an einem Datum grundsätzlich verfügbar ist
 */
export function isEmployeeAvailableOnDate(emp, dayDate) {
  if (!emp || emp.active != 1) return false;

  const allowedDays = normalizeEmployeeDays(emp.days);
  if (!allowedDays.includes(dayDate.getDay())) return false;

  if (emp.sick_until && new Date(emp.sick_until) >= dayDate) return false;

  if (emp.vacation_start && emp.vacation_end) {
    const vs = new Date(emp.vacation_start);
    const ve = new Date(emp.vacation_end);
    if (dayDate >= vs && dayDate <= ve) return false;
  }

  return true;
}

/**
 * Wandelt "Mo,Di,Mi" oder "Mo-Fr" in [1,2,3]
 */
export function normalizeEmployeeDays(daysRaw) {
  if (!daysRaw) return [];

  const map = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };

  if (daysRaw.includes("-")) {
    const [from, to] = daysRaw.split("-").map(s => s.trim());
    if (map[from] == null || map[to] == null) return [];

    const res = [];
    let cur = map[from];
    while (true) {
      res.push(cur);
      if (cur === map[to]) break;
      cur = (cur + 1) % 7;
    }
    return res;
  }

  return daysRaw
    .split(",")
    .map(d => map[d.trim()])
    .filter(d => d !== undefined);
}

// =======================================================
// 🔐 SLOT SIGNATURE (Anti-Manipulation)
// =======================================================

function signSlot({ date, time, employeeId, serviceDuration, tenant }) {
  const secret = process.env.SLOT_SECRET || "dev-secret";
  const raw = `${tenant}|${employeeId}|${date}|${time}|${serviceDuration}`;

  return crypto
    .createHmac("sha256", secret)
    .update(raw)
    .digest("hex");
}

export function verifySlotSignature({
  date,
  time,
  employeeId,
  serviceDuration,
  tenant,
  signature,
}) {
  if (!signature) return false;

  const expected = signSlot({
    date,
    time,
    employeeId,
    serviceDuration,
    tenant,
  });

  return expected === signature;
}

// =======================================================
// ⏱️ SLOT-BERECHNUNG (zentral)
// =======================================================

export function calculateSlotsForEmployee({
  emp,
  serviceDuration,
  date,
  tenant,
}) {
  if (!emp) return [];

  const dayDate = new Date(date);
  if (isNaN(dayDate)) return [];

  if (!isEmployeeAvailableOnDate(emp, dayDate)) return [];

  const buffer = Number(emp.buffer || 15);
  const duration = Number(serviceDuration || 60);
  const dateStr = dayDate.toISOString().slice(0, 10);

  const [wsH, wsM] = (emp.work_start || "09:00").split(":").map(Number);
  const [weH, weM] = (emp.work_end || "18:00").split(":").map(Number);

  let start = new Date(`${dateStr}T${pad(wsH)}:${pad(wsM)}:00`);
  const end = new Date(`${dateStr}T${pad(weH)}:${pad(weM)}:00`);

  const now = new Date();
  if (dateStr === now.toISOString().slice(0, 10) && now > start) {
    start = new Date(
      Math.ceil(now.getTime() / (buffer * 60000)) * buffer * 60000
    );
  }

  const bookings = getAllBookings().filter(
    b => b.employeeId === emp.id && b.dateTime.startsWith(dateStr)
  );

  const slots = [];
  let cur = new Date(start);

  while (cur.getTime() + duration * 60000 <= end.getTime()) {
    const timeStr = cur.toTimeString().slice(0, 5);

    const newStart = cur.getTime();
    const newEnd = newStart + duration * 60000;

    const conflict = bookings.some(b => {
      const bt = new Date(b.dateTime).getTime();
      const be = bt + (Number(b.duration || 0) + buffer) * 60000;
      return !(newEnd <= bt || newStart >= be);
    });

    if (!conflict) {
      slots.push({
        date: dateStr,
        time: timeStr,
        employeeId: emp.id,

        // ✅ Phase 4.4 – Mitarbeiter-Farbe für UI
        employeeColor: emp.color || null,

        signature: signSlot({
          date: dateStr,
          time: timeStr,
          employeeId: emp.id,
          serviceDuration: duration,
          tenant,
        }),
      });
    }

    cur = new Date(cur.getTime() + buffer * 60000);
  }

  return slots;
}

// =======================================================
// 🔧 Helpers
// =======================================================

function pad(n) {
  return String(n).padStart(2, "0");
}

