// =======================================================
// 💎 GlowSuite AI – Admin Calendar (Read-Model) v3
// =======================================================

const $ = (s) => document.querySelector(s);

// ---------- STUDIO CONTEXT ----------
const DEFAULT_STUDIO_ID = "f3bcd2bf-89c3-4891-b01c-ef1693df674c";
function getStudioId() {
  const qs = new URLSearchParams(window.location.search);
  const fromUrl = qs.get("studio_id");
  if (fromUrl) {
    localStorage.setItem("studio_id", fromUrl);
    return fromUrl;
  }
  return localStorage.getItem("studio_id") || DEFAULT_STUDIO_ID;
}
const STUDIO_ID = getStudioId();

// ---------- THEME ----------
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
}
function loadTheme() {
  applyTheme(localStorage.getItem("theme") || "light");
}
function toggleTheme() {
  const next =
    document.documentElement.getAttribute("data-theme") === "light"
      ? "dark"
      : "light";
  applyTheme(next);
  localStorage.setItem("theme", next);
}

// ---------- STATUS ----------
function setStatus(msg) {
  const s = $("#status");
  if (s) s.textContent = msg;
  console.log("ℹ️ STATUS:", msg);
}

// ---------- HELPERS ----------
function hideLoading() {
  const overlay = $("#loadingOverlay");
  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 600);
  }
}

function formatDateTime(date) {
  return {
    date: date.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

const euro = (n) => `${Number(n || 0).toFixed(2)} €`;

// ---------- GLOBAL STATE ----------
let calendar = null;
let employeeMap = new Map();
let cachedEvents = [];
let selectedEvent = null;

// ✅ SCHRITT 1 – Side Panel State (nur UI)
let selectedFcEvent = null;
let panelBackdrop = null;

/* =======================================================
   ✅ SCHRITT 2B – UI Status "canceled" (NUR VISUELL)
   - kein Backend
   - kein echtes Löschen
======================================================= */
function markEventCanceled(fcEvent) {
  if (!fcEvent) return;

  // Status lokal setzen
  fcEvent.setExtendedProp("status", "canceled");

  // Event sofort sperren
  fcEvent.setProp("editable", false);

  // Farben sofort setzen (ohne Reload)
  fcEvent.setProp("backgroundColor", "#e57373");
  fcEvent.setProp("borderColor", "#d32f2f");

  setStatus("🚫 Termin als abgebrochen markiert (nur UI)");
}
/* =======================================================
   ✅ SCHRITT 2B ENDE
======================================================= */

// ---------- LEGEND ----------
function renderLegend() {
  const wrap = $("#calendarLegend");
  if (!wrap) return;

  wrap.innerHTML = "";

  if (!employeeMap.size) {
    wrap.innerHTML = `<span class="muted small">Keine Mitarbeiter</span>`;
    return;
  }

  const group = document.createElement("div");
  group.className = "legend-group";
  group.innerHTML = `<div class="legend-title">Mitarbeiter</div>`;

  const items = document.createElement("div");
  items.className = "legend-items";

  employeeMap.forEach((e) => {
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <span class="legend-dot" style="background:${e.color || "#cfa86f"}"></span>
      <span>${e.name}</span>
    `;
    items.appendChild(item);
  });

  group.appendChild(items);
  wrap.appendChild(group);
}

function refreshEmployeeFilter() {
  const sel = $("#filterEmployee");
  if (!sel) return;

  const current = sel.value || "all";
  sel.innerHTML = `<option value="all">Alle Mitarbeiter</option>`;

  employeeMap.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = String(e.id);
    opt.textContent = e.name;
    sel.appendChild(opt);
  });

  sel.value = [...sel.options].some((o) => o.value === current)
    ? current
    : "all";
}

// ---------- FILTER ----------
function currentEmployeeFilter() {
  return $("#filterEmployee")?.value || "all";
}
function eventPassesFilter(ev) {
  const f = currentEmployeeFilter();
  if (f === "all") return true;
  return String(ev.employeeId || "") === String(f);
}

// ---------- API ----------
async function fetchCalendarRange() {
  const r = await fetch("/api/calendar", { cache: "no-store" });
  if (!r.ok) throw new Error("Calendar API Fehler");
  return r.json();
}

// ---------- MAP EVENTS ----------
function mapApiToFullCalendarEvents(events) {
  const brand =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--brand")
      .trim() || "#cfa86f";

  return (events || [])
    .filter(eventPassesFilter)
    .map((a) => {
      const status = a.status || "confirmed";

      // 🔑 EINZIGE Farbquelle
      const emp = employeeMap.get(String(a.employeeId));
      const baseColor = emp?.color || brand;

      let bg = baseColor;
      let border = baseColor;
      let text = "#111";

      if (status === "pending") {
        bg = "#e0e0e0";
        border = "#d0d0d0";
        text = "#555";
      }

      if (status === "canceled") {
        bg = "#e57373";
        border = "#d32f2f";
        text = "#fff";
      }

      return {
        id: a.id,
        title: a.title,
        start: a.start,
        end: a.end,

        backgroundColor: bg,
        borderColor: border,
        textColor: text,

        editable: status !== "canceled",
        display: "block",

        extendedProps: {
          ...a,
          type: "appointment",
        },

        classNames: [`status-${status}`],
      };
    });
}

// ---------- EVENT DETAILS ----------
function showEventDetails(event) {
  const box = $("#eventDetails");
  if (!box) return;

  const raw = event.extendedProps || {};
  selectedEvent = raw;
  selectedFcEvent = event; // 🔑 wichtig für Löschen + Mitarbeiterwechsel

  const s = formatDateTime(event.start);
  const e = formatDateTime(event.end);

  $("#eventDetailsMain").innerHTML = `
    <strong>${event.title || "Termin"}</strong><br>
    ${s.date}, ${s.time} – ${e.time}
  `;

  const employeeLabel =
    raw.employeeName ||
    employeeMap.get(String(raw.employeeId))?.name ||
    "Beliebig";

  $("#eventDetailsMeta").innerHTML = `
    Mitarbeiter: <strong>${employeeLabel}</strong><br>
    Preis: ${euro(raw.price)}
  `;

  const actions = $("#eventDetailsActions");
  actions.style.display = "block";

  const empSelect = $("#editEmployee");
  empSelect.innerHTML = `<option value="">– kein Mitarbeiter –</option>`;

  employeeMap.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.id;
    opt.textContent = e.name;
    if (String(raw.employeeId) === String(e.id)) opt.selected = true;
    empSelect.appendChild(opt);
  });

  // ✅ Mitarbeiterwechsel sofort in UI spiegeln
  empSelect.onchange = () => {
    if (!selectedFcEvent) return;

    const newId = empSelect.value || null;

    selectedFcEvent.setExtendedProp("employeeId", newId);

    const emp = employeeMap.get(String(newId));
    if (emp?.color) {
      selectedFcEvent.setProp("backgroundColor", emp.color);
      selectedFcEvent.setProp("borderColor", emp.color);
    }

    setStatus("👤 Mitarbeiter geändert (UI)");
  };

// ✅ Löschen/Abbrechen: Backend + UI
const delBtn = $("#btnDeleteEvent");
if (delBtn) {
  delBtn.onclick = async () => {
    if (!selectedFcEvent) return;

    const id = selectedFcEvent.id;
    if (!id) {
      setStatus("❌ Termin-ID fehlt");
      return;
    }

    setStatus("⏳ Termin wird abgebrochen …");

    try {
      const res = await fetch(
        `/api/calendar/appointments/${id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "canceled" }),
        }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      // ✅ UI sofort aktualisieren
      selectedFcEvent.setExtendedProp("status", "canceled");
      selectedFcEvent.setProp("backgroundColor", "#e57373");
      selectedFcEvent.setProp("borderColor", "#d32f2f");
      selectedFcEvent.setProp("editable", false);

      setStatus("🚫 Termin erfolgreich abgebrochen");
    } catch (err) {
      console.error(err);
      setStatus("❌ Abbrechen fehlgeschlagen");
    }
  };
}

  $("#editPrice").value = raw.price ?? 0;
  box.style.display = "block";
}

// ---------- RESCHEDULE ----------
async function handleReschedule(info) {
  const ev = info.event;

  if (!ev?.id || !ev.start) {
    info.revert();
    return;
  }

  setStatus("⏳ Termin wird verschoben …");

  try {
    const res = await fetch(
      `/api/calendar/appointments/${ev.id}/reschedule`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: ev.start.toISOString(),
        }),
      }
    );

    if (!res.ok) {
      throw new Error(await res.text());
    }

    setStatus("✅ Termin erfolgreich verschoben");
  } catch (err) {
    console.error(err);
    setStatus("❌ Verschieben fehlgeschlagen");
    info.revert();
  }
}

/* =======================================================
   ✅ SCHRITT 1 – Side Edit Panel (NUR UI + Doppelklick)
   - Kein PATCH / Speichern-Logik (kommt in Schritt 2)
======================================================= */

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toLocalDateInputValue(d) {
  if (!d) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalTimeInputValue(d) {
  if (!d) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function minutesBetween(a, b) {
  if (!a || !b) return 60;
  const ms = b.getTime() - a.getTime();
  const min = Math.max(5, Math.round(ms / 60000));
  return min;
}

function ensureEditPanelUI() {
  const panel = $("#eventEditPanel");
  if (!panel) return;

  // Backdrop einmal erzeugen
  if (!panelBackdrop) {
    panelBackdrop = document.createElement("div");
    panelBackdrop.className = "panel-backdrop";
    document.body.appendChild(panelBackdrop);

    panelBackdrop.addEventListener("click", () => {
      closeEditPanel();
    });
  }

  // Panel Markup (nur UI)
  panel.innerHTML = `
    <div class="panel-head">
      <div class="panel-title">
        <i data-lucide="pencil"></i>
        <span>Termin bearbeiten</span>
      </div>
      <button type="button" class="panel-close" id="btnCloseEditPanel">✕</button>
    </div>

    <div class="panel-body">
      <div class="panel-muted">
        Doppelklick auf einen Termin öffnet dieses Panel.
        Speichern/Backend folgt in Schritt 2.
      </div>

      <div class="panel-grid">

        <div class="panel-field">
          <label>Datum</label>
          <input id="panelDate" type="date" />
        </div>

        <div class="panel-field">
          <label>Startzeit</label>
          <input id="panelStartTime" type="time" step="300" />
        </div>

        <div class="panel-field">
          <label>Dauer (Minuten)</label>
          <input id="panelDuration" type="number" min="5" step="5" value="60" />
        </div>

        <div class="panel-field">
          <label>Mitarbeiter</label>
          <select id="panelEmployee">
            <option value="">– kein Mitarbeiter –</option>
          </select>
        </div>

        <div class="panel-actions">
          <button id="panelSave" class="pill-btn primary" type="button">Speichern</button>
          <button id="panelCancel" class="pill-btn" type="button">Abbrechen</button>
        </div>

      </div>
    </div>
  `;

// Lucide Icons im Panel rendern
try {
  lucide.createIcons();
} catch (_) {}

// Events: Close / Cancel / Save
$("#btnCloseEditPanel")?.addEventListener("click", closeEditPanel);
$("#panelCancel")?.addEventListener("click", closeEditPanel);

// ✅ SAVE: Termin wirklich speichern (Backend + UI)
$("#panelSave")?.addEventListener("click", async () => {
  if (!selectedFcEvent) {
    setStatus("❌ Kein Termin ausgewählt");
    return;
  }

  const id = selectedFcEvent.id;

  const date = $("#panelDate")?.value;
  const time = $("#panelStartTime")?.value;
  const duration = Number($("#panelDuration")?.value || 60);
  const employeeId = $("#panelEmployee")?.value || null;

  if (!date || !time) {
    setStatus("❌ Datum oder Uhrzeit fehlt");
    return;
  }

  const start = new Date(`${date}T${time}:00`);

  setStatus("💾 Speichere Termin …");

  try {
    const res = await fetch(`/api/calendar/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_time: start.toISOString(),
        duration,
        employee_id: employeeId,
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    // ✅ UI synchron halten
    selectedFcEvent.setStart(start);
    selectedFcEvent.setEnd(
      new Date(start.getTime() + duration * 60000)
    );

    selectedFcEvent.setExtendedProp("employeeId", employeeId);

    const emp = employeeMap.get(String(employeeId));
    if (emp?.color) {
      selectedFcEvent.setProp("backgroundColor", emp.color);
      selectedFcEvent.setProp("borderColor", emp.color);
    }

    setStatus("✅ Termin gespeichert");
    closeEditPanel();
  } catch (err) {
    console.error(err);
    setStatus("❌ Speichern fehlgeschlagen");
  }
});
}

function fillEditPanelFromEvent(fcEvent) {
  const panel = $("#eventEditPanel");
  if (!panel || !fcEvent) return;

  const raw = fcEvent.extendedProps || {};
  selectedEvent = raw;
  selectedFcEvent = fcEvent;

  // Date/Time/Dauer
  const start = fcEvent.start ? new Date(fcEvent.start) : null;
  const end = fcEvent.end ? new Date(fcEvent.end) : null;

  const dateEl = $("#panelDate");
  const timeEl = $("#panelStartTime");
  const durEl = $("#panelDuration");

  if (dateEl) dateEl.value = toLocalDateInputValue(start);
  if (timeEl) timeEl.value = toLocalTimeInputValue(start);
  if (durEl) durEl.value = String(minutesBetween(start, end));

  // Mitarbeiter Select füllen
  const empSel = $("#panelEmployee");
  if (empSel) {
    empSel.innerHTML = `<option value="">– kein Mitarbeiter –</option>`;
    employeeMap.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = String(e.id);
      opt.textContent = e.name;
      if (String(raw.employeeId || "") === String(e.id)) opt.selected = true;
      empSel.appendChild(opt);
    });
  }
}

function openEditPanel(fcEvent) {
  ensureEditPanelUI();
  fillEditPanelFromEvent(fcEvent);

  const panel = $("#eventEditPanel");
  if (panel) panel.classList.add("open");
  if (panelBackdrop) panelBackdrop.classList.add("open");
}

function closeEditPanel() {
  const panel = $("#eventEditPanel");
  if (panel) panel.classList.remove("open");
  if (panelBackdrop) panelBackdrop.classList.remove("open");
}

/* =======================================================
   ✅ SCHRITT 1 ENDE
======================================================= */
// ---------- VIEW BUTTONS (data-view, HTML bleibt unverändert) ----------
function wireCalendarViewButtons() {
  document.addEventListener("click", (e) => {
    if (!calendar) return;

    // Heute-Button (hat ID)
    const todayBtn = e.target.closest("#btnToday");
    if (todayBtn) {
      calendar.today();
      setStatus("📌 Heute");
      return;
    }

    // Monat / Woche / Tag / Liste (data-view)
    const viewBtn = e.target.closest("[data-view]");
    if (!viewBtn) return;

    const view = viewBtn.dataset.view;
    calendar.changeView(view);
    setStatus("📅 Ansicht gewechselt");
  });
}

// ---------- CALENDAR ----------
function initCalendar() {
  const el = $("#calendar");
  if (!el) return;

  calendar = new FullCalendar.Calendar(el, {
    initialView: "dayGridMonth",
    locale: "de",
    firstDay: 1,

    editable: true,
    eventDrop: handleReschedule,
    eventResize: handleReschedule,

    // =====================================================
    // ✅ SCHRITT 3C-1
    // canceled + block = niemals verschiebbar / resizebar
    // =====================================================
    eventAllow: (dropInfo, draggedEvent) => {
      const props = draggedEvent.extendedProps || {};
      const status = props.status;
      const type = props.type;

      if (status === "canceled") return false;
      if (type === "block") return false;

      return true;
    },

    // =====================================================
    // ✅ Doppelklick öffnet Panel (UI)
    // canceled + block = nicht editierbar
    // =====================================================
    eventDidMount: (info) => {
      info.el.addEventListener("dblclick", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const props = info.event.extendedProps || {};
        const status = props.status;
        const type = props.type;

        if (status === "canceled") {
          setStatus("🚫 Abgebrochene Termine sind nicht editierbar");
          return;
        }

        if (type === "block") {
          setStatus("⛔ Diese Zeit ist gesperrt (Block)");
          return;
        }

        // 🔑 ausgewählten Termin global merken
        selectedFcEvent = info.event;

        openEditPanel(info.event);
      });
    },

    // =====================================================
    // ✅ EVENTS LADEN (mit Debug-Absicherung)
    // =====================================================
    events: async (_, success, fail) => {
      try {
        setStatus("📅 Lade Kalender …");

        // 🔴 TEMP DEBUG: Backend absichern
        let payload;
        try {
          payload = await fetchCalendarRange();
        } catch (err) {
          console.error("❌ fetchCalendarRange fehlgeschlagen:", err);
          payload = { employees: [], events: [] };
        }

        // 🧠 Mitarbeiter-Map sicher aufbauen
        employeeMap.clear();
        (payload.employees || []).forEach((e) => {
          employeeMap.set(String(e.id), {
            id: e.id,
            name: e.name,
            color: e.color || "#cfa86f",
          });
        });

        refreshEmployeeFilter();
        renderLegend();

        // 📅 Events sicher setzen
        cachedEvents = payload.events || [];
        success(mapApiToFullCalendarEvents(cachedEvents));

        setStatus(`✅ ${cachedEvents.length} Termine geladen`);
        hideLoading();
      } catch (e) {
        console.error("❌ Kalender komplett abgestürzt:", e);
        setStatus("❌ Kalenderfehler");
        hideLoading();
        fail(e);
      }
    },

    // =====================================================
    // ✅ CLICK: Details anzeigen
    // =====================================================
    eventClick: (info) => {
      info.jsEvent.preventDefault();

      // 🔑 wichtig: ausgewählten Termin global merken
      selectedFcEvent = info.event;
      showEventDetails(info.event);
    },
  });

  calendar.render();
}
// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", () => {
  loadTheme();

  // ✅ Theme Toggle wieder aktivieren
  const themeBtn = document.querySelector("#themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
  } else {
    console.warn("⚠️ Theme-Button (#themeToggle) nicht gefunden");
  }

  ensureEditPanelUI();
  initCalendar();
  wireCalendarViewButtons(); // ✅ DIE ENTSCHEIDENDE ZEILE
});



