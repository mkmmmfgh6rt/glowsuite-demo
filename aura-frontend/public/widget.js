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
let chosenExtras = [];
let chosenDate = null;
let chosenTime = null;
let chosenSlotSignature = null;

let userData = {
  phone: null,
  name: null,
  email: null
};

window.bookingActive = false;
let bookingPhase = null;
window.lastUserActivity = Date.now();
let tenantId = "beauty_lounge";

let abandonSent = false;
let bookingSubmitting = false;
let softCloseShown = false;

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

// =======================================================
// 🔥 NEW: HUMAN-LIKE BOT REPLY (MIT TYPING EFFECT)
// =======================================================
function botReply(html, delay = 500) {
  const typing = document.createElement("div");
  typing.className = "msg bot typing";
  typing.innerHTML = `<span></span><span></span><span></span>`;

  messagesEl.appendChild(typing);
  scrollMessagesToBottom();

  setTimeout(() => {
    typing.remove();
    $msg(html, "bot");
  }, delay);
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
// SMART SERVICE MATCH
// =======================================================
function smartServiceMatch(query, services) {

  if (!query || !services) return null;

  const q = query.toLowerCase();

  for (const s of services) {

    const name = s.name.toLowerCase();

    // exakter Treffer
    if (name === q) return s;

    // Teiltreffer
    if (name.includes(q)) return s;
    if (q.includes(name)) return s;

    // Beauty Synonyme
    if (q.includes("wimper") && name.includes("wimper")) return s;
    if (q.includes("lash") && name.includes("wimper")) return s;

    if (q.includes("nagel") && name.includes("manik")) return s;
    if (q.includes("manik") && name.includes("manik")) return s;

    if (q.includes("pedik") && name.includes("pedik")) return s;
    if (q.includes("fuß") && name.includes("pedik")) return s;

    if (q.includes("gesicht") && name.includes("gesicht")) return s;
    if (q.includes("facial") && name.includes("gesicht")) return s;

    if (q.includes("haar") && name.includes("haar")) return s;
    if (q.includes("cut") && name.includes("haar")) return s;

  }

  return null;
}

// =======================================================
// 🔥 DYNAMIC CATEGORY DETECTION (FINAL FIXED + NORMALIZED)
// =======================================================

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function detectCategory(text) {

  const t = normalize(text);

  if (!services || !services.length) return null;

  const categoryMap = {};

  // 🔥 Kategorien + Synonyme sammeln
  services.forEach(s => {

    if (!s.category) return;

    if (!categoryMap[s.category]) {
      categoryMap[s.category] = new Set();
    }

    // 👉 Kategorie selbst
    categoryMap[s.category].add(normalize(s.category));

    // 👉 Service Name
    categoryMap[s.category].add(normalize(s.name));

    // 👉 🔥 Aliases aus Config
    if (s.aliases && Array.isArray(s.aliases)) {
      s.aliases.forEach(a => {
        categoryMap[s.category].add(normalize(a));
      });
    }

  });

  // 🔥 MATCHING
  for (const cat in categoryMap) {

    const keywords = Array.from(categoryMap[cat]);

    for (const k of keywords) {

      // ✅ exakter Treffer
      if (t.includes(k)) {
        return cat;
      }

      // 🔥 SMART PARTIAL MATCH (WICHTIG!)
      if (k.length > 4 && t.includes(k.slice(0, 5))) {
        return cat;
      }

    }
  }

  return null;
}

// =======================================================
// AI TEXT PARSER
// =======================================================
function parseBookingIntent(text) {

  const t = text.toLowerCase();

  // 🔥 MULTI SERVICE DETECTION (NEU)
  let foundServices = services.filter(s =>
    t.includes(s.name.toLowerCase())
  );

  let service = null;
  let extras = [];

  if (foundServices.length) {
    service = foundServices[0]; // Hauptservice

    if (foundServices.length > 1) {
      extras = foundServices.slice(1); // Zusatzservices
    }
  } else {
    // 🔥 NUR SMART MATCH – KEIN CATEGORY AUTO PICK
    service = smartServiceMatch(t, services);
  }

  // 🔥 Kategorie separat erkennen (WICHTIG)
  let category = detectCategory(t);
  console.log("🔥 CATEGORY DETECTED:", category);

  // 🔥 FINAL FIX: Kategorie ≠ Service unterscheiden
  if (!service && category) {

    let aliasMatch = false;

    services.forEach(s => {
      if (s.aliases && Array.isArray(s.aliases)) {
        s.aliases.forEach(a => {
          if (t.includes(a.toLowerCase())) {
            aliasMatch = true;
          }
        });
      }
    });

    // 👉 NUR wenn Alias → Service setzen
    if (aliasMatch) {

      const categoryServices = services.filter(
        s => s.category === category
      );

      if (categoryServices.length) {
        service = categoryServices[0];
        console.log("🔥 AUTO SERVICE (ALIAS):", service.name);
      }

    } else {

      // 👉 WICHTIG: Kategorie bleibt → KEIN Service setzen
      console.log("🔥 NUR KATEGORIE → Auswahl anzeigen");
    }
  }

  let date = null;
  let time = null;
  let employee = null;

  const today = new Date();

  // -------------------------
  // DATUM (heute / morgen / übermorgen)
  // -------------------------
  if (t.includes("übermorgen")) {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    date = d.toISOString().split("T")[0];
  }

  else if (t.includes("morgen")) {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    date = d.toISOString().split("T")[0];
  }

  else if (t.includes("heute")) {
    date = today.toISOString().split("T")[0];
  }

  // -------------------------
  // DATUM (FORMAT: 20.03.2026)
  // -------------------------
  const fullDateMatch = t.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);

  if (fullDateMatch) {
    const d = fullDateMatch[1].padStart(2, "0");
    const m = fullDateMatch[2].padStart(2, "0");
    const y = fullDateMatch[3];

    date = `${y}-${m}-${d}`;
  }

  // -------------------------
  // 🔥 NEU: DATUM (FORMAT: 04.05 → aktuelles Jahr)
  // -------------------------
  const shortDotDate = t.match(/\b(\d{1,2})\.(\d{1,2})\b/);

  if (shortDotDate && !fullDateMatch) {

    const d = shortDotDate[1].padStart(2, "0");
    const m = shortDotDate[2].padStart(2, "0");
    const y = today.getFullYear();

    date = `${y}-${m}-${d}`;
  }

  // -------------------------
  // DATUM (FORMAT: 15/04)
  // -------------------------
  const shortDateMatch = t.match(/(\d{1,2})\/(\d{1,2})/);

  if (shortDateMatch && !t.includes(":")) {
    const d = shortDateMatch[1].padStart(2, "0");
    const m = shortDateMatch[2].padStart(2, "0");

    const y = today.getFullYear();

    date = `${y}-${m}-${d}`;
  }

  // -------------------------
  // 🔥 UHRZEIT ERKENNUNG (FIX FINAL)
  // -------------------------

  // 👉 DATUM ENTFERNEN (WICHTIG!)
  const cleanedText = t.replace(/\b\d{1,2}\.\d{1,2}\b/g, "");

  // 👉 12:00 oder 12.00
  const fullTime = cleanedText.match(/\b([01]?\d|2[0-3])[:\.]([0-5]\d)\b/);

  if (fullTime) {
    let h = fullTime[1].padStart(2, "0");
    let m = fullTime[2];
    time = `${h}:${m}`;
  }

  // 👉 12 uhr
  else {
    const hourOnly = cleanedText.match(/\b([01]?\d|2[0-3])\s*uhr\b/);

    if (hourOnly) {
      let h = hourOnly[1].padStart(2, "0");
      time = `${h}:00`;
    }
  }

  // -------------------------
  // MITARBEITER ERKENNEN
  // -------------------------
  if (employees && employees.length) {

    for (const e of employees) {

      if (t.includes(e.name.toLowerCase())) {
        employee = e;
        break;
      }

    }
  }

  return {
    service,
    extras,
    category,
    date,
    time,
    employee
  };
}

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

    // 🔥 FIX
    if (Array.isArray(j)) {
      services = j;
    } else if (Array.isArray(j.services)) {
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

      serviceSearchIndex[s.name] =
        `${s.name} ${desc} ${kw}`.toLowerCase();
    });
    console.log("🔥 SERVICES GELADEN:", services);
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

  // 👉 Bot Antwort mit Animation (VERKAUFSTEXT)
  botReply(
    `${goldIcon(ICONS.welcome)}<b>Willkommen bei ${name} 👋</b><br><br>
     Ich bin dein automatischer Beauty-Agent 🤖<br><br>
     ✔ buche Termine für dich<br>
     ✔ beantworte Kundenfragen<br>
     ✔ arbeite 24/7 für dein Studio<br><br>
     👉 Teste jetzt einfach eine Buchung`,
    600
  );

  // 👉 Buttons minimal verzögert (Flow bleibt gleich)
  setTimeout(() => {

    const box = $msg("");

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

  }, 650);
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
  chosenSlotSignature = null;
  userData = {};
  window.bookingActive = false;
  bookingPhase = null;
  chosenExtras = [];
  bookingSubmitting = false; // ✅ wichtig: Submit-Lock zurücksetzen
}

function startBookingFlow() {

  resetBookingState();

  window.bookingActive = true;
  bookingPhase = "phone";

  window.bookingStartedAt = Date.now();

  showPhoneStep();
}

// --- Mitarbeiterwahl ---
function showEmployeeChoice() {
  const box = $msg(
    `${goldIcon(ICONS.employee)}Mit wem möchtest du den Termin buchen?`
  );

  const row = document.createElement("div");
  row.className = "row";

  // 👉 BELIEBIG
  const any = document.createElement("button");
  any.className = "pill alt";
  any.innerHTML = `${goldIcon(ICONS.employee)}Beliebig`;

  any.onclick = () => {

    window.lastUserActivity = Date.now();
    chosenEmployee = "auto";

    $msg(
      `<span class="tag">${goldIcon(ICONS.employee)}Beliebig gewählt</span>`
    );

    // 🔥 FIX: Upsell nur wenn alles da ist
    if (chosenService && chosenDate && chosenTime) {

      suggestUpsell(chosenService, () => {
        askUserDetails();
      });

      return;
    }

    if (!chosenCategory) {
      showCategoryChoice();
      return;
    }

    if (!chosenService) {
      showServicesByCategory(chosenCategory);
      return;
    }

    if (!chosenDate) {
      showDateChoice();
      return;
    }

    if (!chosenTime) {
      showTimeChoice();
      return;
    }

  };

  row.appendChild(any);

  // 👉 MITARBEITER LISTE (NUR EINMAL!)
  employees.forEach((e) => {

    const b = document.createElement("button");
    b.className = "pill";
    b.innerHTML = `${goldIcon(ICONS.employee)}${e.name}`;

    b.onclick = () => {

      window.lastUserActivity = Date.now();
      chosenEmployee = e;

      $msg(
        `<span class="tag">${goldIcon(ICONS.employee)}${e.name}</span>`
      );

      // 🔥 FIX: Upsell nur wenn komplett
      if (chosenService && chosenDate && chosenTime) {

        suggestUpsell(chosenService, () => {
          askUserDetails();
        });

        return;
      }

      if (!chosenCategory) {
        showCategoryChoice();
        return;
      }

      if (!chosenService) {
        showServicesByCategory(chosenCategory);
        return;
      }

      if (!chosenDate) {
        showDateChoice();
        return;
      }

      if (!chosenTime) {
        showTimeChoice();
        return;
      }

    };

    row.appendChild(b);
  });

  box.appendChild(row);
}


function showPhoneStep() {

  bookingPhase = "phone";

  const box = $msg(
    `${goldIcon(ICONS.person)}Fast geschafft!<br>
     Gib kurz deine WhatsApp-Nummer ein, damit wir deine Auswahl speichern können:<br><br>

     <div class="muted-small" style="margin-top:10px;">
       Mit der Buchung erklärst du dich einverstanden,
       per WhatsApp Nachrichten (Erinnerungen & Termininfos) zu erhalten.
     </div>`
  );

  const input = document.createElement("input");
  input.placeholder = "0177...";

  const btn = document.createElement("button");
  btn.className = "pill";
  btn.textContent = "Weiter";

  btn.onclick = () => {

    const phone = input.value.trim();

    if (!phone || phone.length < 8) {
      alert("Bitte gültige Nummer eingeben");
      return;
    }

    userData.phone = phone;
    window.lastUserActivity = Date.now();

    $msg(`<span class="tag">📱 ${phone}</span>`);

    // 🔥 INTENT FLOW
    if (window.pendingIntent) {

      const intent = window.pendingIntent;

      console.log("🔥 PHONE → INTENT FLOW:", intent);

      // 🔥 WICHTIG: Intent danach löschen
      window.pendingIntent = null;

      // -------------------------
      // 👉 DATEN SETZEN
      // -------------------------

      if (intent.category && !chosenCategory) {
        chosenCategory = intent.category;
        $msg(`<span class="tag">${goldIcon(ICONS.service)}${intent.category}</span>`);
      }

      if (intent.service && !chosenService) {
        chosenService = intent.service;
        $msg(`<span class="tag">${goldIcon(ICONS.service)}${intent.service.name}</span>`);
      }

      if (intent.employee && !chosenEmployee) {
        chosenEmployee = intent.employee;
        $msg(`<span class="tag">${goldIcon(ICONS.employee)}${intent.employee.name}</span>`);
      }

      if (intent.date && !chosenDate) {
        chosenDate = intent.date;
        $msg(`<span class="tag">${goldIcon(ICONS.calendar)}${formatDateDE(chosenDate)}</span>`);
      }

      if (intent.time && !chosenTime) {
        chosenTime = intent.time;
        $msg(`<span class="tag">${goldIcon(ICONS.time)}${intent.time}</span>`);
      }

      // -------------------------
      // 🔥 FLOW LOGIK (FIXED FINAL)
      // -------------------------

      // 👉 1. Kategorie ohne Service
      if (chosenCategory && !chosenService) {
        showServicesByCategory(chosenCategory);
        return;
      }

      // 👉 🔥 WICHTIGSTER FIX
      // Service + Datum + Zeit + Mitarbeiter → IMMER SLOT CHECK
      if (chosenService && chosenDate && chosenTime && chosenEmployee) {
        suggestUpsell(chosenService, () => {
          showTimeChoice(); // 🔥 NICHT mehr askUserDetails
        });
        return;
      }

      // 👉 Mitarbeiter fehlt
      if (chosenService && chosenDate && chosenTime && !chosenEmployee) {
        showEmployeeChoice();
        return;
      }

      // 👉 Datum fehlt
      if (chosenService && !chosenDate) {
        showDateChoice();
        return;
      }

      // 👉 Zeit fehlt
      if (chosenService && chosenDate && !chosenTime) {
        showTimeChoice();
        return;
      }

      // 👉 nur Service
      if (chosenService) {
        showEmployeeChoice();
        return;
      }

      return;
    }

    // 👉 FALLBACK
    showEmployeeChoice();
  };

  box.append(input, btn);
}


// --- Freitext-Eingabe ---
function askForServiceText() {

  bookingPhase = "serviceText";

  $msg(
    `${goldIcon(ICONS.service)}Welche Behandlung möchtest du genau?<br>` +
    `<span class="muted-small">Du kannst einen Service schreiben oder direkt anklicken:</span>`
  );

  showPopularServices();

  inputEl?.focus();
}


// --- Beliebte Services ---
function showPopularServices() {

  if (!services || !services.length) return;

  const box = $msg(
    `${goldIcon(ICONS.service)}Beliebte Behandlungen:`
  );

  const row = document.createElement("div");
  row.className = "row";

  services.slice(0, 4).forEach((s) => {

    const b = document.createElement("button");
    b.className = "pill";

    b.innerHTML = `${goldIcon(ICONS.service)}${s.name}`;

    b.onclick = () => {

      chosenExtras.push(s);
      window.lastUserActivity = Date.now();

      $msg(
        `<span class="tag">${goldIcon(ICONS.service)}${s.name}</span>`
      );

      showDateChoice();

    };

    row.appendChild(b);

  });

  box.appendChild(row);
}


// =======================================================
// 💰 UPSELL SYSTEM (CONFIRM FLOW + CONFIG BASED)
// =======================================================
function suggestUpsell(service, onDone = null) {

  if (!service || !services) {
    if (typeof onDone === "function") onDone();
    return;
  }

  let suggestions = services
    .filter(s =>
      s.category === service.category &&
      s.name !== service.name
    )
    .sort((a, b) => (a.price || 0) - (b.price || 0))
    .slice(0, 2);

  if (!suggestions.length) {
    if (typeof onDone === "function") onDone();
    return;
  }

  const box = $msg(
    `${goldIcon(ICONS.service)}Viele Kunden buchen zusätzlich:<br>
     <span class="muted-small">Möchtest du noch etwas dazubuchen?</span>`
  );

  const row = document.createElement("div");
  row.className = "row";

  suggestions.forEach(s => {

    const wrap = document.createElement("div");
    wrap.className = "upsell-choice";

    const label = document.createElement("div");
    label.className = "muted-small";
    label.innerHTML = `<b>${s.name}</b> (+${s.price}€)`;

    const yes = document.createElement("button");
    yes.className = "pill";
    yes.textContent = "Ja";

    yes.onclick = () => {
      window.lastUserActivity = Date.now();

      if (!chosenExtras.find(x => x.name === s.name)) {
        chosenExtras.push(s);
      }

      $msg(
        `<span class="tag">${goldIcon(ICONS.service)}+ ${s.name}</span>`
      );

      if (typeof onDone === "function") onDone();
    };

    const no = document.createElement("button");
    no.className = "pill alt";
    no.textContent = "Nein";

    no.onclick = () => {
      window.lastUserActivity = Date.now();
      if (typeof onDone === "function") onDone();
    };

    wrap.appendChild(label);
    wrap.appendChild(yes);
    wrap.appendChild(no);
    row.appendChild(wrap);
  });

  box.appendChild(row);
}

// =======================================================
// CATEGORY FLOW (NEU)
// =======================================================

let chosenCategory = null;

function showCategoryChoice() {

  bookingPhase = "category";

  const categories = [...new Set(
    services.map(s => s.category).filter(Boolean)
  )];

  const box = $msg(`${goldIcon(ICONS.service)}Welche Kategorie möchtest du?`);

  const row = document.createElement("div");
  row.className = "row";

  categories.forEach(cat => {

    const b = document.createElement("button");
    b.className = "pill";
    b.textContent = cat;

    b.onclick = () => {
      window.lastUserActivity = Date.now();

      chosenCategory = cat;

      $msg(`<span class="tag">${goldIcon(ICONS.service)}${cat}</span>`);

      showServicesByCategory(cat);

    };

    row.appendChild(b);

  });

  box.appendChild(row);
}


function showServicesByCategory(category) {

  bookingPhase = "service";

  const filtered = services.filter(s => s.category === category);

  const box = $msg(`${goldIcon(ICONS.service)}Wähle deine Behandlung:`);

  const row = document.createElement("div");
  row.className = "row";

  row.style.maxHeight = "180px";
  row.style.overflowY = "auto";

  let selectedServices = [];

  filtered.forEach(s => {

    const b = document.createElement("button");
    b.className = "pill alt";

    b.style.fontSize = "13px";
    b.style.padding = "8px 12px";

    b.innerHTML = `${s.name} (${s.price}€ / ${s.duration}min)`;

    b.onclick = () => {
      window.lastUserActivity = Date.now();

      const exists = selectedServices.find(x => x.name === s.name);

      if (exists) {
        selectedServices = selectedServices.filter(x => x.name !== s.name);
        b.classList.remove("active");
      } else {
        selectedServices.push(s);
        b.classList.add("active");

        $msg(
          `<span class="tag">${goldIcon(ICONS.service)}${s.name}</span>`
        );
      }
    };

    row.appendChild(b);

  });

  box.appendChild(row);

  const next = document.createElement("button");
  next.className = "pill";
  next.textContent = "Weiter";

  next.onclick = () => {
    window.lastUserActivity = Date.now();

    if (!selectedServices.length) {
      alert("Bitte wähle mindestens eine Behandlung");
      return;
    }

    chosenService = selectedServices[0];
    chosenExtras = selectedServices.slice(1);

    // 🔥 FINAL FIX – RICHTIGE FLOW-REIHENFOLGE
    suggestUpsell(chosenService, () => {

      // 👉 1. Mitarbeiter zuerst
      if (!chosenEmployee) {
        showEmployeeChoice();
        return;
      }

      // 👉 2. Datum
      if (!chosenDate) {
        showDateChoice();
        return;
      }

      // 👉 3. Zeit
      if (!chosenTime) {
        showTimeChoice();
        return;
      }

      // 👉 alles vorhanden → Abschluss
      askUserDetails();
    });
  };

  box.appendChild(next);
}

function showServiceSuggestions(q) {

  if (!q || !services || !services.length) return;

  const query = q.toLowerCase();

  let matches = findBestServices(q, serviceSearchIndex, {
    maxResults: 3,
    minScore: 0.15
  });

  // FALLBACK 1
  if (!matches || !matches.length) {

    const fallback = services.filter(s =>
      s.name.toLowerCase().includes(query)
    );

    if (fallback.length) {
      matches = fallback.map(s => ({ key: s.name }));
    }
  }

  // FALLBACK 2
  if (!matches || !matches.length) {

    const smart = smartServiceMatch(query, services);

    if (smart) {
      matches = [{ key: smart.name }];
    }
  }

  if (!matches || !matches.length) {
    $msg(
      `${goldIcon(ICONS.service)}Ich habe nichts Passendes gefunden 🙈<br>` +
      `Versuch es mal mit „Wimpernlifting“ oder „Haarschnitt Damen“.`
    );
    return;
  }

  const box = $msg(
    `${goldIcon(ICONS.service)}Meinst du eine dieser Behandlungen?`
  );

  const row = document.createElement("div");
  row.className = "row";

  matches.forEach((m) => {

    let s = services.find(
      (x) => x.name.toLowerCase() === m.key.toLowerCase()
    );

    if (!s) {
      s = smartServiceMatch(m.key, services);
    }

    if (!s) return;

    const b = document.createElement("button");
    b.className = "pill";

    b.innerHTML =
      `${goldIcon(ICONS.service)}${s.name} (${s.price} € / ${s.duration} Min)`;

    b.onclick = () => {
      window.lastUserActivity = Date.now();

      chosenService = s;

      // ✅ Auswahl anzeigen
      $msg(
        `<span class="tag">${goldIcon(ICONS.service)}${s.name}</span>`
      );

      // 🔥 FIX: Upsell mit Callback
      suggestUpsell(s, () => {
        showDateChoice();
      });

      // ❌ WICHTIG: KEIN setTimeout mehr!
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
    `${goldIcon(ICONS.calendar)}Perfekt 😊 Dann wählen wir jetzt dein Wunschdatum:`
  );

  const input = document.createElement("input");
  input.type = "date";

  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  const max = new Date(Date.now() + 90 * 86400000);
  const maxISO = max.toISOString().split("T")[0];

  input.min = todayISO;
  input.max = maxISO;

  if (chosenDate) {
    input.value = chosenDate;
  } else {
    input.value = todayISO;
    chosenDate = todayISO;
  }

  input.onchange = () => {
    window.lastUserActivity = Date.now();

    chosenDate = input.value;

    $msg(
      `<span class="tag">${goldIcon(ICONS.calendar)}${formatDateDE(chosenDate)}</span>`
    );

    showTimeChoice();
  };

  box.appendChild(input);
}


// --- Uhrzeit ---
async function showTimeChoice() {

  if (!chosenService || !chosenService.name) {
    console.warn("⛔ showTimeChoice ohne gültigen Service");
    return;
  }

  bookingPhase = "time";

  $msg(`${goldIcon(ICONS.time)}⏳ Lade verfügbare Uhrzeiten …`);

  const empId =
    chosenEmployee === "auto"
      ? employees?.[0]?.id
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

    // 🔥 ZEIT VALIDIERUNG
    if (chosenTime) {

      const validSlot = slots.find(s => s.time === chosenTime);

      if (validSlot) {
        chosenSlotSignature = validSlot.signature || null;

        // ❗ KEIN UPSSELL MEHR HIER
        if (!chosenEmployee) {
          showEmployeeChoice();
          return;
        }

        askUserDetails();
        return;
      }

      // ❌ Zeit nicht mehr gültig
      $msg(
        `${goldIcon(ICONS.calendar)}⚠️ Diese Uhrzeit ist leider nicht mehr verfügbar.<br>` +
        `<span class="muted-small">Bitte wähle ein neues Datum.</span>`
      );

      chosenTime = null;
      chosenDate = null;
      chosenSlotSignature = null;

      showDateChoice();
      return;
    }

    // ❌ KEINE SLOTS
    if (!slots.length) {

      $msg(
        `${goldIcon(ICONS.calendar)}❌ An diesem Tag sind keine freien Termine.<br>` +
        `<span class="muted-small">Bitte wähle ein anderes Datum.</span>`
      );

      chosenDate = null;
      showDateChoice();
      return;
    }

    const box = $msg(`${goldIcon(ICONS.time)}Super ✨ Jetzt such dir eine passende Uhrzeit aus:`);

    const row = document.createElement("div");
    row.className = "row";

    slots.forEach((s) => {

      const b = document.createElement("button");
      b.className = "pill";

      b.innerHTML = `${goldIcon(ICONS.time)}${s.time}`;

      b.onclick = () => {
        window.lastUserActivity = Date.now();

        chosenTime = s.time;
        chosenSlotSignature = s.signature || null;

        $msg(
          `<span class="tag">${goldIcon(ICONS.time)}${chosenTime}</span>`
        );

        // ❗ KEIN UPSSELL MEHR HIER
        if (!chosenEmployee) {
          showEmployeeChoice();
          return;
        }

        askUserDetails();
      };

      row.appendChild(b);
    });

    box.appendChild(row);

  } catch (e) {

    console.error("Slot Fehler:", e);

    $msg(
      `${goldIcon(ICONS.info)}⚠️ Die freien Zeiten konnten gerade nicht geladen werden.<br>` +
      `<span class="muted-small">Bitte melde dich kurz telefonisch im Studio.</span>`
    );
  }
}

// =======================================================
// NEXT AVAILABLE SLOT FINDER
// =======================================================
async function findNextAvailableSlot(service) {

  if (!service) return null;

  const today = new Date();

  for (let i = 0; i < 7; i++) {

    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const dateISO = d.toISOString().split("T")[0];

    try {

      const r = await fetch("/api/slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          employeeId: null,
          serviceName: service.name,
          tenant: tenantId,
          date: dateISO
        })
      });

      const j = await r.json();

      const slots = (j.slots || []).filter(
        s => s.date === dateISO
      );

      if (slots.length) {

        return {
          date: dateISO,
          time: slots[0].time
        };

      }

    } catch (e) {

      console.warn("Next Slot Fehler:", e);

    }

  }

  return null;
}

// --- User Daten ---
function askUserDetails() {

  bookingPhase = "userdata";

  const box = $msg(
    `${goldIcon(ICONS.person)}Fast geschafft!<br>
     Bitte gib noch deine Kontaktdaten ein:<br><br>

     <span class="muted-small">
       Mit der Buchung erklärst du dich einverstanden,
       per WhatsApp Nachrichten zu deinem Termin zu erhalten.
     </span>`
  );

  const n = document.createElement("input");
  n.placeholder = "Vorname Nachname";

  const e = document.createElement("input");
  e.placeholder = "E-Mail (optional)";

  const submit = document.createElement("button");
  submit.className = "pill";
  submit.innerHTML = `${goldIcon(ICONS.service)}Termin buchen`;

  submit.onclick = async () => {

    if (bookingSubmitting) return;

    if (!n.value.trim()) {
      alert("Bitte Name eingeben.");
      return;
    }

    bookingSubmitting = true;

    submit.disabled = true;
    submit.style.opacity = "0.7";
    submit.innerHTML = "Wird gebucht...";

    userData = {
      name: n.value.trim(),
      phone: userData.phone,
      email: e.value.trim(),
    };

    window.lastUserActivity = Date.now();

    try {
      await createBooking();
    } catch (err) {
      bookingSubmitting = false;
      submit.disabled = false;
      submit.style.opacity = "1";
      submit.innerHTML = `${goldIcon(ICONS.service)}Termin buchen`;
    }
  };

  box.append(n, e, submit);
}


// --- Termin erstellen ---
async function createBooking() {

  bookingPhase = "final";

  // ❌ STOP: KEIN Service
  if (!chosenService) {
    console.warn("Kein Service gewählt");
    return;
  }

  // ❌ STOP: KEIN MITARBEITER → ABORT
  if (!chosenEmployee) {
    console.warn("❌ BLOCK: NO EMPLOYEE → FLOW FEHLER");
    return;
  }

  // ❌ STOP: KEIN DATUM / ZEIT
  if (!chosenDate || !chosenTime) {
    console.warn("❌ BLOCK: DATE/TIME FEHLT");
    return;
  }

  const extras = chosenExtras || [];

  const totalPrice =
    (chosenService.price || 0) +
    extras.reduce((sum, e) => sum + (e.price || 0), 0);

  const totalDuration =
    (chosenService.duration || 0) +
    extras.reduce((sum, e) => sum + (e.duration || 0), 0);

  const serviceNames = [
    chosenService.name,
    ...extras.map(e => e.name)
  ].join(" + ");

  const payload = {
    name: userData.name,
    phone: userData.phone,
    email: userData.email,
    service: serviceNames,
    price: totalPrice,
    duration: totalDuration,
    date: chosenDate,
    time: chosenTime,
    employeeId:
      chosenEmployee === "auto"
        ? null
        : chosenEmployee?.id || null,
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

    console.log("BOOKING RESPONSE:", j);

    console.log(
      "BOOKING RESPONSE FULL:",
      JSON.stringify(j, null, 2)
    );

    console.log("PDF CHECK:", {
      pdfUrl: j.pdfUrl,
      icsUrl: j.icsUrl,

      pdfBase64: j.pdfBase64
        ? "PDF BASE64 VORHANDEN"
        : "PDF BASE64 FEHLT",

      icsBase64: j.icsBase64
        ? "ICS BASE64 VORHANDEN"
        : "ICS BASE64 FEHLT",

      bookingPdfUrl: j.booking?.pdfUrl,
      bookingIcsUrl: j.booking?.icsUrl,

      bookingPdfBase64: j.booking?.pdfBase64
        ? "BOOKING PDF BASE64 VORHANDEN"
        : "BOOKING PDF BASE64 FEHLT",

      bookingIcsBase64: j.booking?.icsBase64
        ? "BOOKING ICS BASE64 VORHANDEN"
        : "BOOKING ICS BASE64 FEHLT"
    });

    // 🔥 SLOT KONFLIKT
    if (!j.success) {

      if (j.error === "CONFLICT" || j.error === "SLOT_INVALID") {

        $msg(
          `${goldIcon(ICONS.info)}⚠️ Diese Uhrzeit ist nicht mehr verfügbar.<br>` +
          `<span class="muted-small">Bitte wähle eine andere Uhrzeit.</span>`
        );

        chosenTime = null;
        chosenSlotSignature = null;

        showTimeChoice();
        return;
      }

      $msg(
        `${goldIcon(ICONS.info)}⚠️ Es gab ein Problem bei der Buchung.<br>` +
        `<span class="muted-small">Bitte versuche es später noch einmal oder rufe im Studio an.</span>`
      );

      resetBookingState();
      return;
    }

    // ✅ ERFOLG
    window.bookingActive = false;

    // =====================================================
    // PDF + ICS DATEN HOLEN
    // =====================================================

    const pdfData =
      j.pdfBase64 ||
      j.booking?.pdfBase64 ||
      j.pdfUrl ||
      j.booking?.pdfUrl ||
      null;

    const icsData =
      j.icsBase64 ||
      j.booking?.icsBase64 ||
      j.icsUrl ||
      j.booking?.icsUrl ||
      null;

    const bookingId =
      j.booking?.id ||
      j.id ||
      null;

    let extra = "";

    // =====================================================
    // PDF LINK
    // =====================================================

    if (pdfData) {

      const pdfHref =
        pdfData.startsWith("/pdf/")
          ? pdfData
          : pdfData.startsWith("data:")
            ? pdfData
            : `data:application/pdf;base64,${pdfData}`;

      extra += `
    <br><br>
    <a
     href="${pdfHref}"
     download="terminbestaetigung.pdf"
     target="_blank"
     class="download-link"
     style="display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:190px;background:radial-gradient(circle at 30% 0%, #fff8ea, #d9a057 60%, #8a5320 100%);color:#4b2619;text-decoration:none;border-radius:999px;padding:8px 18px;font-size:13px;font-weight:500;margin-top:8px;box-shadow:0 10px 25px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.5);"    >
      📄 PDF herunterladen
    </a>
  `;
    }

    // =====================================================
    // ICS LINK
    // =====================================================

    if (icsData) {

      const icsHref = icsData.startsWith("data:")
        ? icsData
        : `data:text/calendar;base64,${icsData}`;

      extra += `
        <br>
        <a
          href="${icsHref}"
          download="termin.ics"
          class="download-link"
          style="display:inline-flex;align-items:center;justify-content:center;gap:7px;min-width:190px;background:radial-gradient(circle at 30% 0%, #fff8ea, #d9a057 60%, #8a5320 100%);color:#4b2619;text-decoration:none;border-radius:999px;padding:8px 18px;font-size:13px;font-weight:500;margin-top:8px;box-shadow:0 10px 25px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.5);"        >
          📅 Kalender speichern
        </a>
      `;
    }

    // =====================================================
    // STORNIER BUTTON
    // =====================================================

    if (bookingId) {

      extra += `
    <br><br>

    <button
      class="pill alt"
      onclick="
        (async () => {

          const ok = confirm('Termin wirklich stornieren?');

          if (!ok) return;

          try {

            const r = await fetch('/api/bookings/${bookingId}', {
              method: 'DELETE'
            });

            const j = await r.json();

            if (j.success) {

              alert('Termin erfolgreich storniert');

              location.reload();

            } else {

              alert('Stornierung fehlgeschlagen');

            }

          } catch(e) {

            console.error(e);
            alert('Technischer Fehler');

          }

        })()
      "
    >
      ❌ Termin stornieren
    </button>
  `;
    }

    // =====================================================
    // RELOAD BUTTON
    // =====================================================

    extra += `
  <br><br>

  <button
    class="pill"
    style="
      min-width:200px;
      justify-content:center;
    "
    onclick="location.reload()"
  >
    ✨ Neuen Termin buchen
  </button>
`;

    const lastServiceForRepeat = chosenService
      ? { ...chosenService }
      : null;

    $msg(
      `${goldIcon(ICONS.info)}🎉 Dein Termin wurde erfolgreich bestätigt!<br>` +
      `<span class="tag">${serviceNames}</span>` +
      extra
    );

    setTimeout(() => {
      showSoftClose(lastServiceForRepeat);
    }, 1200);

  } catch (e) {

    console.error("Booking Error:", e);

    $msg(
      `${goldIcon(ICONS.info)}⚠️ Technischer Fehler bei der Buchung.<br>` +
      `<span class="muted-small">Bitte vereinbare deinen Termin telefonisch.</span>`
    );
  }

  resetBookingState();
}

function showSoftClose(lastService = null) {

  const box = $msg(
    `${goldIcon(ICONS.info)}✨ Möchtest du direkt deinen nächsten Termin sichern<br>
     <span class="muted-small">✨ Viele Kunden buchen direkt vor, damit sie ihren Wunschslot behalten.</span>`
  );

  const row = document.createElement("div");
  row.className = "row";

  const yes = document.createElement("button");
  yes.className = "pill";
  yes.style.minWidth = "200px";
  yes.style.justifyContent = "center";
  yes.textContent = "Ja, nächsten Termin planen";

  yes.onclick = () => {

    window.lastUserActivity = Date.now();

    // 🔥 KEIN kompletter Reset!
    // 👉 nur relevante Daten zurücksetzen
    chosenDate = null;
    chosenTime = null;
    chosenSlotSignature = null;
    chosenEmployee = null;
    chosenExtras = [];
    bookingSubmitting = false; // ✅ WICHTIG

    window.bookingActive = true;
    bookingPhase = "repeat_choice";

    $msg("Perfekt 💎 Dann planen wir direkt weiter.");

    const choiceBox = $msg("Möchtest du denselben Service erneut buchen?");
    const choiceRow = document.createElement("div");
    choiceRow.className = "row";

    // ✅ gleicher Service
    const sameBtn = document.createElement("button");
    sameBtn.className = "pill";
    sameBtn.innerText = `Ja (${lastService?.name || "Service"})`;

    sameBtn.onclick = () => {

      if (!lastService) {
        console.warn("❌ Kein letzter Service vorhanden");
        return;
      }

      window.lastUserActivity = Date.now();

      // 🔥 WICHTIG: saubere Kopie
      chosenService = { ...lastService };

      $msg(
        `<span class="tag">${goldIcon(ICONS.service)}${chosenService.name}</span>`
      );

      showEmployeeChoice();
    };

    // ✅ anderer Service
    const newBtn = document.createElement("button");
    newBtn.className = "pill alt";
    newBtn.innerText = "Anderen Service wählen";

    newBtn.onclick = () => {

      window.lastUserActivity = Date.now();

      chosenService = null;
      chosenCategory = null;
      chosenEmployee = null;
      chosenDate = null;
      chosenTime = null;
      chosenSlotSignature = null;
      chosenExtras = [];
      bookingSubmitting = false; // ✅ wichtig

      showCategoryChoice();
    };

    choiceRow.appendChild(sameBtn);
    choiceRow.appendChild(newBtn);
    choiceBox.appendChild(choiceRow);
  };

  const later = document.createElement("button");
  later.className = "pill alt";
  later.style.minWidth = "95px";
  later.style.justifyContent = "center";
  later.textContent = "Später";

  later.onclick = () => {
    $msg("Alles klar 😊 Wir erinnern dich automatisch.");
  };

  row.appendChild(yes);
  row.appendChild(later);
  box.appendChild(row);
}

// =======================================================
// USER INPUT
// =======================================================
async function handleUserInput() {

  const text = inputEl.value.trim();
  if (!text) return;

  // 🔥 USER AKTIVITÄT TRACKEN (WICHTIG für Abbruch-Erkennung)
  window.lastUserActivity = Date.now();

  inputEl.value = "";
  addUserMessage(text);

  const t = text.toLowerCase();

  // OPTIONAL (PRO LEVEL)
  // 👉 Falls du später auch Klicks trackst:
  // window.lastUserActivity = Date.now();

  // =====================================================
  // AI BOOKING INTENT
  // =====================================================

  const intent = parseBookingIntent(text);

  // 🔥 SAFETY FIX – IMMER setzen
  if (intent && (intent.service || intent.category)) {
    window.pendingIntent = intent;
  }

  // ---------------------------------------------
  // NEXT FREE SLOT FRAGE
  // ---------------------------------------------

  if (
    !window.bookingActive &&
    t.includes("wann") &&
    (t.includes("termin") || t.includes("zeit") || t.includes("frei"))
  ) {

    const service = smartServiceMatch(t, services);

    if (service) {

      const next = await findNextAvailableSlot(service);

      if (next) {

        $msg(
          `${goldIcon(ICONS.info)}Der nächste freie Termin für <b>${service.name}</b> ist:<br>` +
          `<span class="tag">${goldIcon(ICONS.calendar)}${formatDateDE(next.date)}</span> ` +
          `<span class="tag">${goldIcon(ICONS.time)}${next.time}</span>`
        );

        return;
      }

    }
  }

  // ---------------------------------------------
  // AI BOOKING START (FIXED FINAL - STABLE)
  // ---------------------------------------------
  if ((!window.bookingActive || window.pendingIntent) && intent && (intent.service || intent.category)) {

    if (!userData.phone) {
      resetBookingState();
    }

    window.bookingActive = true;

    if (!userData.phone) {
      bookingPhase = "phone";
      showPhoneStep();
      window.pendingIntent = intent;
      return;
    }

    const savedIntent = window.pendingIntent || intent;
    window.pendingIntent = null;
    console.log("INTENT DEBUG:", savedIntent);

    // -------------------------
    // 🔥 DATEN DIREKT SETZEN
    // -------------------------

    if (savedIntent.employee && !chosenEmployee) {
      chosenEmployee = savedIntent.employee;
      $msg(`<span class="tag">${goldIcon(ICONS.employee)}${savedIntent.employee.name}</span>`);
    }

    if (savedIntent.category && !chosenCategory) {
      chosenCategory = savedIntent.category;
      $msg(`<span class="tag">${goldIcon(ICONS.service)}${savedIntent.category}</span>`);
    }

    // 👉 Kategorie ohne Service → Auswahl
    if (!savedIntent.service && savedIntent.category && !chosenService) {

      const servicesInCategory = services.filter(
        s => s.category === savedIntent.category
      );

      if (servicesInCategory.length) {

        if (savedIntent.date && savedIntent.time) {

          chosenService = servicesInCategory[0];

          $msg(`<span class="tag">${goldIcon(ICONS.service)}${chosenService.name}</span>`);

          console.log("🔥 AUTO SERVICE (CATEGORY COMPLETE)");

        } else {

          if (savedIntent.employee && !chosenEmployee) {
            chosenEmployee = savedIntent.employee;
            $msg(`<span class="tag">${goldIcon(ICONS.employee)}${savedIntent.employee.name}</span>`);
          }

          if (savedIntent.date && !chosenDate) {
            chosenDate = savedIntent.date;
            $msg(`<span class="tag">${goldIcon(ICONS.calendar)}${formatDateDE(chosenDate)}</span>`);
          }

          if (savedIntent.time && !chosenTime) {
            chosenTime = savedIntent.time;
            $msg(`<span class="tag">${goldIcon(ICONS.time)}${savedIntent.time}</span>`);
          }

          showServicesByCategory(savedIntent.category);
          return;
        }
      }
    }

    // -------------------------
    // 🔥🔥🔥 FINAL FIX (Service Flow korrekt)
    // -------------------------
    if (savedIntent.service && !chosenService) {

      chosenService = savedIntent.service;

      $msg(`<span class="tag">${goldIcon(ICONS.service)}${savedIntent.service.name}</span>`);

      // 🔥 ERST UPSELL → DANN FLOW
      suggestUpsell(chosenService, () => {

        // 👉 Mitarbeiter IMMER zuerst
        if (!chosenEmployee) {
          console.log("🔥 SERVICE → MITARBEITER STEP");
          showEmployeeChoice();
          return;
        }

        // 👉 danach normal weiter
        if (!chosenDate) {
          showDateChoice();
          return;
        }

        if (!chosenTime) {
          showTimeChoice();
          return;
        }

      });

      return; // ❗ GANZ WICHTIG
    }

    // -------------------------
    // 🔥 GLOBAL FIX (Backup)
    // -------------------------
    if (chosenService && !chosenEmployee) {
      console.log("EMPLOYEE STATE:", chosenEmployee);
      showEmployeeChoice();
      return;
    }

    // -------------------------
    // DATUM / ZEIT
    // -------------------------

    if (savedIntent.date && !chosenDate) {
      chosenDate = savedIntent.date;
      $msg(`<span class="tag">${goldIcon(ICONS.calendar)}${formatDateDE(chosenDate)}</span>`);
    }

    if (savedIntent.time && !chosenTime) {
      chosenTime = savedIntent.time;
      $msg(`<span class="tag">${goldIcon(ICONS.time)}${savedIntent.time}</span>`);
    }

    // -------------------------
    // 🔥 FLOW ENTSCHEIDUNG
    // -------------------------

    if (chosenService && chosenDate && chosenTime && chosenEmployee) {
      showTimeChoice();
      return;
    }

    if (chosenService && chosenDate && !chosenTime) {

      if (!chosenEmployee) {
        showEmployeeChoice();
        return;
      }

      showTimeChoice();
      return;
    }

    if (chosenService && !chosenDate) {

      if (!chosenEmployee) {
        showEmployeeChoice();
        return;
      }

      showDateChoice();
      return;
    }

    return;
  }

  // =====================================================
  // BOOKING FLOW AKTIV (FIXED FINAL CLEAN)
  // =====================================================

  if (window.bookingActive && !window.pendingIntent && bookingPhase !== "userdata") {

    const intent = parseBookingIntent(text);

    // 👉 MITARBEITER
    if (!chosenEmployee && intent.employee) {
      chosenEmployee = intent.employee;

      $msg(`<span class="tag">${goldIcon(ICONS.employee)}${intent.employee.name}</span>`);

      if (!chosenCategory) {
        showCategoryChoice();
        return;
      }

      if (!chosenService) {
        showServicesByCategory(chosenCategory);
        return;
      }

      if (!chosenDate) {
        showDateChoice();
        return;
      }

      if (!chosenTime) {
        showTimeChoice();
        return;
      }

      showTimeChoice();
      return;
    }

    // 👉 KATEGORIE
    if (!chosenCategory && intent.category) {
      chosenCategory = intent.category;

      $msg(`<span class="tag">${goldIcon(ICONS.service)}${intent.category}</span>`);

      showServicesByCategory(intent.category);
      return;
    }

    // =====================================================
    // 🔥 SERVICE FLOW (Upsell NUR HIER!)
    // =====================================================
    if (!chosenService && intent.service) {

      chosenService = intent.service;

      $msg(`<span class="tag">${goldIcon(ICONS.service)}${intent.service.name}</span>`);

      console.log("🔥 SERVICE SELECTED");

      // 👉 Upsell EINMALIG
      suggestUpsell(intent.service, () => {

        if (!chosenEmployee) {
          showEmployeeChoice();
          return;
        }

        if (!chosenDate) {
          showDateChoice();
          return;
        }

        if (!chosenTime) {
          showTimeChoice();
          return;
        }

        showTimeChoice();
      });

      return;
    }

    // 👉 DATUM
    if (intent.date) {

      const todayISO = new Date().toISOString().split("T")[0];
      const isDefaultToday = chosenDate === todayISO;

      if (!chosenDate || isDefaultToday) {
        chosenDate = intent.date;

        $msg(`<span class="tag">${goldIcon(ICONS.calendar)}${formatDateDE(chosenDate)}</span>`);
      }
    }

    // 👉 ZEIT
    if (intent.time && !chosenTime) {
      chosenTime = intent.time;

      $msg(`<span class="tag">${goldIcon(ICONS.time)}${intent.time}</span>`);
    }

    // =====================================================
    // 🔥 FINAL FLOW (OHNE zweiten Upsell!)
    // =====================================================

    if (chosenService && chosenDate && chosenTime) {

      // 👉 Mitarbeiter fehlt → zuerst
      if (!chosenEmployee) {
        showEmployeeChoice();
        return;
      }

      // 👉 DIREKT weiter – KEIN Upsell mehr
      showTimeChoice();
      return;
    }

    // 👉 Fallbacks
    if (chosenDate && !chosenTime) {
      showTimeChoice();
      return;
    }

    if (!chosenDate) {
      showDateChoice();
      return;
    }

    return;
  }

  // =====================================================
  // KEYWORDS
  // =====================================================

  if (t.includes("termin")) return startBookingFlow();

  if (t.includes("öffnung") || t.includes("geöffnet"))
    return replyOpeningHours();

  if (t.includes("adresse") || t.includes("standort") || t.includes("wo seid"))
    return replyAddress();

  if (t.includes("preis") || t.includes("preisliste") || t.includes("kosten"))
    return replyPriceList();

  // =====================================================
  // DEFAULT
  // =====================================================

  $msg(
    `${goldIcon(ICONS.info)}Ich kann dir helfen mit:<br>` +
    `• <b>Termin buchen</b><br>` +
    `• <b>Öffnungszeiten</b><br>` +
    `• <b>Adresse</b><br>` +
    `• <b>Preisliste</b><br>` +
    `<span class="muted-small">Schreibe z. B. „Ich möchte einen Termin für Wimpernlifting“.</span>`
  );
}

// =======================================================
// 🔁 ABANDON TRACKING (Frontend)
// =======================================================
setInterval(() => {

  if (!window.bookingActive || abandonSent) return;
  if (!userData.phone) return;

  const LIMIT = 2 * 60 * 1000;

  if (Date.now() - window.lastUserActivity < LIMIT) return;

  console.log("⚠️ Abbruch erkannt");

  fetch("/api/abandoned-booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: userData.name,
      phone: userData.phone,
      service: chosenService?.name,
      date: chosenDate,
      time: chosenTime
    })
  });

  // 🔥 HIER REIN
  abandonSent = true;

  window.bookingActive = false;

}, 30000);


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