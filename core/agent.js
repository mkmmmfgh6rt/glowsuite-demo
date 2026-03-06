// =========================================================
// 🤖 agent.js v7 – STABLE / SERVER-SAFE
// =========================================================

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

import { insertBooking, getBookingByDate } from "./db.js";
import { createAppointmentPDF } from "./pdf.js";

// === Cache ===
const tenantCache = new Map();
const userContexts = new Map();

// =========================================================
// Tenant Config
// =========================================================
function loadTenantConfig(tenant = process.env.TENANT_DEFAULT || "beauty_lounge") {
  if (tenantCache.has(tenant)) return tenantCache.get(tenant);

  const base = path.join(process.cwd(), "config", "kunden", tenant);
  const brandingPath = path.join(base, "branding.json");
  const servicesPath = path.join(base, "services.json");

  let branding = {
    brandName: tenant,
    openingHours: { start: 9, end: 18 }
  };

  let services = {};

  if (fs.existsSync(brandingPath)) {
    branding = { ...branding, ...JSON.parse(fs.readFileSync(brandingPath, "utf8")) };
  }

  if (fs.existsSync(servicesPath)) {
    services = JSON.parse(fs.readFileSync(servicesPath, "utf8")) || {};
  }

  const cfg = { branding, services };
  tenantCache.set(tenant, cfg);
  return cfg;
}

// =========================================================
// Helpers
// =========================================================
function roundTo15(date) {
  const ms = 15 * 60 * 1000;
  return new Date(Math.round(date.getTime() / ms) * ms);
}

function isWithinHours(date, h = { start: 9, end: 18 }) {
  const hour = date.getHours();
  return hour >= h.start && hour < h.end;
}

// =========================================================
// Save Booking (DB + optional PDF)
// =========================================================
async function saveBooking({ name, phone, service, dateTime, tenant }) {
  const { services } = loadTenantConfig(tenant);
  const s = services[service];

  if (!s) throw new Error("Service unbekannt.");

  const iso = dateTime.toISOString();

  if (getBookingByDate(service, iso)) {
    throw new Error("Termin bereits vergeben.");
  }

  const booking = {
    id: uuidv4(),
    name,
    phone,
    service,
    price: Number(s.price || 0),
    duration: Number(s.duration || 60),
    dateTime: iso,
    tenant
  };

  if (!insertBooking(booking)) {
    throw new Error("DB-Fehler");
  }

  // PDF optional (niemals crashen!)
  let pdfUrl = null;
  try {
    const result = await createAppointmentPDF(booking.id);
    pdfUrl = result?.pdfUrl || null;
  } catch {
    /* absichtlich leer */
  }

  return { ...booking, pdfUrl };
}

// =========================================================
// MAIN AGENT
// =========================================================
export async function runAgent(userId, input, tenant = process.env.TENANT_DEFAULT || "beauty_lounge") {
  const { branding, services } = loadTenantConfig(tenant);
  input = (input || "").trim();

  let ctx = userContexts.get(userId) || { step: 0, data: {} };

  try {
    if (/abbrechen|reset/i.test(input)) {
      userContexts.delete(userId);
      return "❌ Vorgang abgebrochen.";
    }

    if (ctx.step === 0) {
      ctx.step = 1;
      userContexts.set(userId, ctx);
      return `👋 Willkommen bei ${branding.brandName}! Wie ist Ihr Vorname?`;
    }

    if (ctx.step === 1) {
      ctx.data.first = input;
      ctx.step = 2;
      return "Nachname?";
    }

    if (ctx.step === 2) {
      ctx.data.last = input;
      ctx.step = 3;
      return "Telefonnummer?";
    }

    if (ctx.step === 3) {
      ctx.data.phone = input.replace(/\s+/g, "");
      ctx.step = 4;

      return (
        "Welchen Service wünschen Sie?\n\n" +
        Object.entries(services)
          .map(([k, v]) => `• ${k} (${v.price} €, ${v.duration} Min.)`)
          .join("\n")
      );
    }

    if (ctx.step === 4) {
      if (!services[input]) return "Service nicht erkannt.";
      ctx.data.service = input;
      ctx.step = 5;
      return "Datum & Uhrzeit (TT.MM.JJJJ HH:MM)";
    }

    if (ctx.step === 5) {
      const nums = input.match(/\d+/g);
      if (!nums || nums.length < 4) return "Format ungültig.";

      let [d, m, y, h, min = 0] = nums.map(Number);
      if (y < 100) y += 2000;

      const date = roundTo15(new Date(y, m - 1, d, h, min));
      if (!isWithinHours(date, branding.openingHours)) {
        return "Außerhalb der Öffnungszeiten.";
      }

      const booking = await saveBooking({
        name: `${ctx.data.first} ${ctx.data.last}`,
        phone: ctx.data.phone,
        service: ctx.data.service,
        dateTime: date,
        tenant
      });

      userContexts.delete(userId);

      return (
        `✅ Termin bestätigt!\n\n` +
        `💅 ${booking.service}\n` +
        `📆 ${date.toLocaleString("de-DE")}\n` +
        (booking.pdfUrl ? `📄 PDF: ${booking.pdfUrl}` : "")
      );
    }

    return "Bitte neu starten.";
  } catch (err) {
    console.error(err);
    userContexts.delete(userId);
    return "❌ Interner Fehler.";
  }
}
