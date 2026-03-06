// =======================================================
// 💬 Beauty Agent Widget v15 – Gold Line Ultra (Server-Services + PDF/ICS-Links)
// - Services aus /api/services (beauty_lounge.json)
// - Mitarbeiterwahl
// - Service-Freitext + KI-Vorschläge
// - Slot-API /api/slots
// - Doppelbuchungs-Feedback (CONFLICT)
// - Zeigt PDF & ICS Links nach der Buchung im Chat an
// - Option C: Hinweis auf WhatsApp-Reminder (24h + 2h vorher)
// =======================================================

import { findBestServices } from "/serviceFinder.js";

const messagesEl = document.getElementById("messages");
const themeBtn = document.getElementById("themeBtn");
const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const titleEl = document.getElementById("chatTitle");
const subtitleEl = document.getElementById("chatSubtitle");

// --- State ---
let employees = [];
let services = [];
let serviceSearchIndex = {};
let branding = {};
let chosenEmployee = null;
let chosenService = null;
let chosenDate = null;
let chosenTime = null;
let chosenSlotSignature = null;
let userData = {};
let bookingActive = false;
let bookingPhase = null;
let tenantId = "beauty_lounge";

// =======================================================
// THEME SWITCH
// =======================================================
(function initTheme() {
  const saved = localStorage.getItem("widget_theme");
  const initial = saved || "light";
  document.documentElement.setAttribute("data-theme", initial);
  if (themeBtn) {
    themeBtn.textContent = initial === "light" ? "🌙" : "☀️";
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("widget_theme", next);
      themeBtn.textContent = next === "light" ? "🌙" : "☀️";
    });
  }
})();

// =======================================================
// ICONS
// =======================================================
const ICONS = {
  welcome: "⚜",
  employee: "🜁",
  service: "✦",
  calendar: "🜂",
  time: "⌁",
  address: "🜄",
  price: "◎",
  person: "❀",
  info: "✨",
};

const goldIcon = (c) => `<span class="ba-icon">${c}</span>`;

// =======================================================
// HELPERS
// =======================================================
function scrollMessagesToBottom() {
  requestAnimationFrame(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}

function $msg(html, cls = "bot") {
  const div = document.createElement("div");
  div.className = `msg ${cls}`;
  div.innerHTML = html;
  messagesEl.appendChild(div);
  scrollMessagesToBottom();
  return div;
}

function addUserMessage(t) {
  if (t) $msg(t, "user");
}

function formatDateDE(iso) {
  const p = iso.split("-");
  if (p.length !== 3) return iso;
  return `${p[2]}.${p[1]}.${p[0]}`;
}

// =======================================================
// SERVICE KEYWORDS
// =======================================================
const SERVICE_KEYWORDS = {
  "Haarschnitt Damen": "haare frisur damen haarschnitt frauen haircut",
  "Haarschnitt Herren": "haare herren barber schnitt männer haircut",
  Maniküre: "nägel manicure nagelstudio handnägel",
  Pediküre: "füße pediküre wellness footcare",
  Augenbrauenlifting: "augenbrauen brow lifting brauen",
  Wimpernlifting: "wimpern lashes lifting augen",
  Gesichtsbehandlung: "facial gesicht pflege poren reinigung skincare",
};

// =======================================================
// LOADING BRANDING
// =======================================================
async function loadBranding() {
  try {
    const r = await fetch("/api/branding");
    const j = await r.json();
    if (!j.success) return;

    branding = j.branding || {};
    tenantId = j.tenant || tenantId;

    if (branding.brandColor)
      document.documentElement.style.setProperty("--brand", branding.brandColor);
    if (branding.brandDark)
      document.documentElement.style.setProperty("--brandDark", branding.brandDark);

    if (titleEl)
      titleEl.textContent = `${branding.brandName || "Beauty Lounge"} – Beauty Agent`;
    if (subtitleEl) subtitleEl.textContent = "Online-Termin & Fragen";
  } catch (e) {
    console.warn("Branding Fehler:", e);
  }
}

// =======================================================
// LOAD EMPLOYEES
// =======================================================
async function loadEmployees() {
  try {
    const r = await fetch("/api/employees");
    const j = await r.json();
    employees = (j.data || []).filter((e) => e.active == 1);
  } catch (e) {
    console.warn("Mitarbeiter Fehler:", e);
    employees = [];
  }
}

// =======================================================
// LOAD SERVICES (aus Server)
// =======================================================
async function loadServices() {
  try {
    const r = await fetch("/api/services");
    const j = await r.json();

    if (j.success && Array.isArray(j.services)) {
      services = j.services;
    } else {
      services = [];
    }

    // Suchindex bauen
    serviceSearchIndex = {};
    services.forEach((s) => {
      if (!s || !s.name) return;
      const desc = s.description || "";
      const kw = SERVICE_KEYWORDS[s.name] || "";
      serviceSearchIndex[s.name] = `${s.name} ${desc} ${kw}`.toLowerCase();
    });
  } catch (e) {
    console.warn("Service Load Error:", e);
    services = [];
    serviceSearchIndex = {};
  }
}

// =======================================================
// WELCOME
// =======================================================
function showWelcome() {
  const name = branding.brandName || "Beauty Lounge";

  const box = $msg(
    `${goldIcon(ICONS.welcome)}Willkommen bei <b>${name}</b>!<br>
     <span class="muted-small">Ich helfe dir bei:</span><br>
     • Termin buchen<br>
     • Öffnungszeiten<br>
     • Adresse<br>
     • Preisliste`,
  );

  const row = document.createElement("div");
  row.className = "row";

  const btn = (txt, fn, icon, primary = false) => {
    const b = document.createElement("button");
    b.className = "pill" + (primary ? " pill--primary" : "");
    b.innerHTML = `${goldIcon(icon)}${txt}`;
    b.onclick = fn;
    row.appendChild(b);
  };

  btn("Termin buchen", startBookingFlow, ICONS.service, true);
  btn("Öffnungszeiten", replyOpeningHours, ICONS.calendar);
  btn("Adresse", replyAddress, ICONS.address);
  btn("Preisliste", replyPriceList, ICONS.price);

  box.appendChild(row);
}

// =======================================================
// INFO FUNCTIONS
// =======================================================
function replyOpeningHours() {
  const oh = branding.openingHours || branding.opening;
  if (!oh) {
    $msg(
      `${goldIcon(ICONS.calendar)}Unsere Öffnungszeiten findest du bei Google oder Instagram.`,
    );
    return;
  }
  if (typeof oh === "object") {
    $msg(
      `${goldIcon(ICONS.calendar)}Unsere Öffnungszeiten:<br>` +
        `<b>${oh.start}:00 – ${oh.end}:00 Uhr</b>`,
    );
  } else {
    $msg(`${goldIcon(ICONS.calendar)}Unsere Öffnungszeiten:<br><b>${oh}</b>`);
  }
}

function replyAddress() {
  const a = branding.address || branding.adresse;
  if (!a) {
    $msg(
      `${goldIcon(ICONS.address)}Die genaue Adresse findest du im Impressum.`,
    );
    return;
  }
  if (typeof a === "object") {
    $msg(
      `${goldIcon(ICONS.address)}Unsere Adresse:<br>` +
        `<b>${a.street || ""}</b><br>` +
        `${a.postalCode || ""} ${a.city || ""}<br>` +
        `${a.country || ""}`,
    );
  } else {
    $msg(`${goldIcon(ICONS.address)}Unsere Adresse:<br><b>${a}</b>`);
  }
}

function replyPriceList() {
  $msg(
    `${goldIcon(ICONS.price)}Unsere aktuelle Preisliste:<br>` +
      `<a href="/preisliste/current" target="_blank">Jetzt Preisliste öffnen</a>`,
  );
}

// =======================================================
// BOOKING FLOW
// =======================================================
function resetBookingState() {
  chosenEmployee = null;
  chosenService = null;
  chosenDate = null;
  chosenTime = null;
  chosenSlotSignature = null; // ✅ WICHTIG: Slot-Signatur zurücksetzen
  userData = {};
  bookingActive = false;
  bookingPhase = null;
}

function startBookingFlow() {
  resetBookingState();
  bookingActive = true;
  bookingPhase = "employee";
  showEmployeeChoice();
}

// --- Mitarbeiterwahl ---
function showEmployeeChoice() {
  const box = $msg(
    `${goldIcon(ICONS.employee)}Mit wem möchtest du den Termin buchen?`
  );

  const row = document.createElement("div");
  row.className = "row";

  // beliebig
  const any = document.createElement("button");
  any.className = "pill alt";
  any.innerHTML = `${goldIcon(ICONS.employee)}Beliebig`;
  any.onclick = () => {
    chosenEmployee = "auto";
    $msg(
      `<span class="tag">${goldIcon(ICONS.employee)}Beliebig gewählt</span>`
    );
    askForServiceText();
  };
  row.appendChild(any);

  employees.forEach((e) => {
    const b = document.createElement("button");
    b.className = "pill";
    b.innerHTML = `${goldIcon(ICONS.employee)}${e.name}`;
    b.onclick = () => {
      chosenEmployee = e;
      $msg(
        `<span class="tag">${goldIcon(ICONS.employee)}${e.name}</span>`
      );
      askForServiceText();
    };
    row.appendChild(b);
  });

  box.appendChild(row);
}


// --- Freitext-Eingabe ---
function askForServiceText() {
  bookingPhase = "serviceText";
  $msg(
    `${goldIcon(ICONS.service)}Welche Behandlung möchtest du genau?<br>` +
      `<span class="muted-small">z. B. „Wimpernlifting“, „Haarschnitt Herren“, „Nägel machen“ …</span>`,
  );
  inputEl?.focus();
}

// --- Vorschläge ---
function showServiceSuggestions(q) {
  const matches = findBestServices(q, serviceSearchIndex, {
    maxResults: 3,
    minScore: 0.35,
  });

  if (!matches.length) {
    $msg(
      `${goldIcon(ICONS.service)}Ich habe nichts Passendes gefunden 🙈<br>` +
        `Versuch es mal mit dem genauen Namen, z. B. „Wimpernlifting“ oder „Haarschnitt Damen“.`,
    );
    return;
  }

  const box = $msg(
    `${goldIcon(ICONS.service)}Meinst du eine dieser Behandlungen?`,
  );
  const row = document.createElement("div");
  row.className = "row";

  matches.forEach((m) => {
    const s = services.find((x) => x.name === m.key);
    if (!s) return;

    const b = document.createElement("button");
    b.className = "pill";
    b.innerHTML = `${goldIcon(ICONS.service)}${s.name} (${s.price} € / ${s.duration} Min)`;
    b.onclick = () => {
      chosenService = s;
      $msg(
        `<span class="tag">${goldIcon(ICONS.service)}${s.name}</span>`,
      );
      showDateChoice();
    };
    row.appendChild(b);
  });

  box.appendChild(row);
  bookingPhase = "servicePick";
}

// --- Datum ---
function showDateChoice() {
  bookingPhase = "date";

  const box = $msg(
    `${goldIcon(ICONS.calendar)}Bitte wähle ein Datum:`,
  );

  const input = document.createElement("input");
  input.type = "date";

  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];
  const max = new Date(Date.now() + 90 * 86400000);
  const maxISO = max.toISOString().split("T")[0];

  input.min = todayISO;
  input.max = maxISO;
  input.value = todayISO;
  chosenDate = todayISO;

  input.onchange = () => {
    chosenDate = input.value;
    $msg(
      `<span class="tag">${goldIcon(ICONS.calendar)}${formatDateDE(
        chosenDate,
      )}</span>`,
    );
    showTimeChoice();
  };

  box.appendChild(input);
}

// --- Uhrzeit ---
async function showTimeChoice() {
  // ✅ SCHRITT 2 – ABSICHERUNG
  if (!chosenService || !chosenService.name) {
    console.warn("⛔ showTimeChoice ohne gültigen Service aufgerufen");
    return;
  }

  bookingPhase = "time";

  $msg(`${goldIcon(ICONS.time)}⏳ Lade verfügbare Uhrzeiten …`);

  const empId =
    chosenEmployee === "auto"
      ? employees[0]?.id
      : chosenEmployee?.id || null;

  try {
    const r = await fetch("/api/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: empId,
        serviceName: chosenService.name,
        tenant: tenantId,
        date: chosenDate,
      }),
    });

    const j = await r.json();
    const slots = (j.slots || []).filter(
      (s) => s.date === chosenDate
    );

    if (!slots.length) {
      $msg(
        `${goldIcon(ICONS.time)}❌ An diesem Tag sind aktuell keine freien Zeiten verfügbar.<br>` +
          `<span class="muted-small">Bitte probiere ein anderes Datum oder rufe direkt im Studio an.</span>`
      );
      return; // ❗ KEIN resetBookingState()
    }

    const box = $msg(
      `${goldIcon(ICONS.time)}Wähle eine Uhrzeit:`
    );
    const row = document.createElement("div");
    row.className = "row";

    slots.forEach((s) => {
      const b = document.createElement("button");
      b.className = "pill";
      b.innerHTML = `${goldIcon(ICONS.time)}${s.time}`;

      b.onclick = () => {
        chosenTime = s.time;
        chosenSlotSignature = s.signature || null;

        $msg(
          `<span class="tag">${goldIcon(ICONS.time)}${chosenTime}</span>`
        );

        askUserDetails();
      };

      row.appendChild(b);
    });

    box.appendChild(row);
  } catch (e) {
    console.error("Slot-Fehler:", e);
    $msg(
      `${goldIcon(ICONS.info)}⚠️ Die freien Zeiten konnten gerade nicht geladen werden.<br>` +
        `<span class="muted-small">Bitte melde dich kurz telefonisch im Studio.</span>`
    );
  }
}

// --- User Daten ---
function askUserDetails() {
  bookingPhase = "userdata";

  const box = $msg(
    `${goldIcon(ICONS.person)}Fast geschafft!<br>` +
      `Bitte gib noch deine Kontaktdaten ein:`,
  );

  const n = document.createElement("input");
  n.placeholder = "Vorname Nachname";

  const p = document.createElement("input");
  p.placeholder = "Telefonnummer";

  const e = document.createElement("input");
  e.placeholder = "E-Mail (optional)";

  const submit = document.createElement("button");
  submit.className = "pill";
  submit.innerHTML = `${goldIcon(ICONS.service)}Termin buchen`;

  submit.onclick = () => {
    if (!n.value.trim() || !p.value.trim()) {
      alert("Bitte Name und Telefonnummer eingeben.");
      return;
    }

    userData = {
      name: n.value.trim(),
      phone: p.value.trim(),
      email: e.value.trim(),
    };

    createBooking();
  };

  box.append(n, p, e, submit);
}

// --- Termin erstellen ---
async function createBooking() {
  bookingPhase = "final";

  const payload = {
    name: userData.name,
    phone: userData.phone,
    email: userData.email,
    service: chosenService.name,
    price: chosenService.price,
    duration: chosenService.duration,
    date: chosenDate,
    time: chosenTime,
    employeeId: chosenEmployee === "auto" ? null : chosenEmployee?.id || null,
    tenant: tenantId,
    slotSignature: chosenSlotSignature,
    source: "widget",
  };

  try {
    const r = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const j = await r.json();

    if (!j.success) {
      if (j.error === "CONFLICT") {
        $msg(
          `${goldIcon(ICONS.info)}⚠️ Diese Uhrzeit ist gerade belegt worden.<br>` +
            `<span class="muted-small">Bitte wähle eine andere Uhrzeit.</span>`,
        );
      } else {
        $msg(
          `${goldIcon(ICONS.info)}⚠️ Es gab ein Problem bei der Buchung.<br>` +
            `<span class="muted-small">Bitte versuche es später noch einmal oder rufe im Studio an.</span>`,
        );
      }
      resetBookingState();
      return;
    }

    const pdfUrl = j.pdfUrl || j.booking?.pdfUrl || null;
    const icsUrl = j.icsUrl || j.booking?.icsUrl || null;

    let extra = "";
    if (pdfUrl) {
      extra += `<br><a href="${pdfUrl}" target="_blank">📄 Bestätigung als PDF herunterladen</a>`;
    }
    if (icsUrl) {
      extra += `<br><a href="${icsUrl}" target="_blank">📅 Termin in Kalender speichern (ICS)</a>`;
    }

    const whatsappHint = userData.phone
      ? `<br><span class="muted-small">Du erhältst zusätzlich eine WhatsApp-Erinnerung 24h und 2h vor deinem Termin an <b>${userData.phone}</b>.</span>`
      : "";

    $msg(
      `${goldIcon(ICONS.info)}✅ Dein Termin wurde erfolgreich eingetragen!<br>` +
        `<span class="muted-small">Speichere dir den Termin direkt hier:</span>` +
        extra +
        whatsappHint,
    );
  } catch (e) {
    console.error("Booking Error:", e);
    $msg(
      `${goldIcon(ICONS.info)}⚠️ Technischer Fehler bei der Buchung.<br>` +
        `<span class="muted-small">Bitte vereinbare deinen Termin kurz telefonisch.</span>`,
    );
  }

  resetBookingState();
}

// =======================================================
// USER INPUT
// =======================================================
async function handleUserInput() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  addUserMessage(text);

  if (bookingActive) {
    if (bookingPhase === "serviceText") {
      showServiceSuggestions(text);
      return;
    }
    $msg(
      `${goldIcon(ICONS.info)}Für die Terminbuchung nutze bitte die Buttons unten 😊`,
    );
    return;
  }

  const t = text.toLowerCase();

  if (t.includes("termin")) return startBookingFlow();
  if (t.includes("öffnung") || t.includes("geöffnet"))
    return replyOpeningHours();
  if (t.includes("adresse") || t.includes("standort") || t.includes("wo seid"))
    return replyAddress();
  if (t.includes("preis") || t.includes("preisliste") || t.includes("kosten"))
    return replyPriceList();

  $msg(
    `${goldIcon(ICONS.info)}Ich kann dir helfen mit:<br>` +
      `• <b>Termin buchen</b><br>` +
      `• <b>Öffnungszeiten</b><br>` +
      `• <b>Adresse</b><br>` +
      `• <b>Preisliste</b><br>` +
      `<span class="muted-small">Schreibe z. B. „Ich möchte einen Termin für Wimpernlifting“.</span>`,
  );
}

// =======================================================
// INIT
// =======================================================
(async function init() {
  await Promise.all([loadBranding(), loadEmployees(), loadServices()]);
  showWelcome();
})();

if (sendBtn && inputEl) {
  sendBtn.addEventListener("click", handleUserInput);
  inputEl.addEventListener(
    "keydown",
    (e) => e.key === "Enter" && handleUserInput(),
  );
}