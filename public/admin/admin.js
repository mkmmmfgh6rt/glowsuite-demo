// =======================================================
// 💎 GlowSuite AI Admin v10.20 — AURA Edition
// =======================================================
// - Vollständiges Dashboard (KPIs, Charts, Todos, DSGVO, Preisliste)
// - Optimierte Balken & Umsatzchart
// - AURA KI-Live-Analyse integriertf
// - Fehlerfreie, bereinigte Version
// =======================================================

const $ = (s) => document.querySelector(s);

// -------------------------------------------------------
// GLOBAL
// -------------------------------------------------------
let allBookings = [];
let todos = [];
let branding = {
  brandName: "GlowSuite AI",
  brandColor: "#C38B5F",
  brandDark: "#b58b5a",
  logo: "/favicon.ico",
};

let revenueTrendChart = null;
let topServicesChart = null;

// 🔥 AURA benötigt Stats + Buchungen
window.dashboardStats = {
  total: 0,
  revenue: 0,
  avg: 0,
  active: 0,
  loadPct: 0,
  bookings: []
};

// -------------------------------------------------------
// AURA AUTO REFRESH (Phase 6.7.5)
// -------------------------------------------------------
let auraAutoRefreshTimer = null;
let lastAuraActiveKey = null;    // verhindert unnötiges Re-Render
let lastAuraHistoryKey = null;   // verhindert unnötiges Re-Render


// -------------------------------------------------------
// THEME
// -------------------------------------------------------
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

// -------------------------------------------------------
// STATUS
// -------------------------------------------------------
function setStatus(msg) {
  const s = $("#status");
  if (s) s.textContent = msg;
  console.log("ℹ STATUS:", msg);
}

// -------------------------------------------------------
// BRANDING
// -------------------------------------------------------
function setCSSVar(n, v) {
  if (v) document.documentElement.style.setProperty(n, v);
}
function applyBrandingTheme(b) {
  setCSSVar("--brand", b.brandColor);
  setCSSVar("--brandDark", b.brandDark);

  $("#brandTitle").textContent = `${b.brandName} – Admin`;
  $("#brandLogo").src = b.logo;
}
async function loadBranding() {
  try {
    const r = await fetch("/api/branding");
    const j = await r.json();
    if (j?.branding) branding = { ...branding, ...j.branding };
  } catch {}
  applyBrandingTheme(branding);
}

// -------------------------------------------------------
// HELPERS
// -------------------------------------------------------

const euro = (n) => `${Number(n || 0).toFixed(2)} €`;

// =======================================================
// 🧠 AURA – Confidence Helper (SaaS-clean)
// =======================================================
function getConfidenceLabel(confidence) {
  if (typeof confidence !== "number") return null;

  if (confidence >= 0.8) return "hoch";
  if (confidence >= 0.6) return "mittel";
  return "niedrig";
}



// =======================================================
// 🕒 AURA – Time Helper (Phase 6.7.4)
// =======================================================
function formatAuraTime(ts) {
  if (!ts) return "";

  const d = new Date(ts);
  const now = new Date();

  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);

  const time = d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (diffDays === 0) {
    return `heute um ${time}`;
  }

  if (diffDays === 1) {
    return `gestern um ${time}`;
  }

  if (diffDays < 7) {
    return `vor ${diffDays} Tagen`;
  }

  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


// =======================================================
// 🧭 AURA – Action Type Mapping (Phase 6.7.3)
// =======================================================
function getAuraActionMeta(action) {
  const map = {
    suggest_discount: {
      label: "Rabatt empfohlen",
      icon: "💸",
    },
    scheduled: {
      label: "Geplant",
      icon: "🗓️",
    },
    posted: {
      label: "Veröffentlicht",
      icon: "📢",
    },
    ignored: {
      label: "Ignoriert",
      icon: "🚫",
    },
  };

  return (
    map[action] || {
      label: action || "Unbekannt",
      icon: "❓",
    }
  );
}


// =======================================================
// 🧠 AURA – Recommendation Status Badge (Phase B1.3)
// =======================================================
function getAuraStatusBadge() {
  const status = window.lastAuraStatus;

  if (status === "new") {
    return {
      label: "🆕 Neue Empfehlung",
      color: "#1565c0",
      bg: "rgba(21,101,192,0.12)",
    };
  }

  if (status === "updated") {
    return {
      label: "🔁 Aktualisiert",
      color: "#6a1b9a",
      bg: "rgba(106,27,154,0.12)",
    };
  }

  return null; // 👈 bei "same" nichts anzeigen
}


// =======================================================
// 🧠 AURA – Status Helper (Phase B1)
// =======================================================
function getAuraStatusLabel(status) {
  const map = {
    new: {
      label: "🆕 Neu",
      color: "#2e7d32",
      bg: "rgba(46,125,50,0.12)"
    },
    updated: {
      label: "🔁 Aktualisiert",
      color: "#1565c0",
      bg: "rgba(21,101,192,0.12)"
    },
    same: {
      label: "✔️ Unverändert",
      color: "#616161",
      bg: "rgba(97,97,97,0.12)"
    }
  };

  return map[status] || map.same;
}


// =======================================================
// 📣 AURA MARKETING UI – Phase 6.5.3
// Container direkt unter dem AURA Panel
// =======================================================

function ensureAuraMarketingContainer() {
  const auraPanel = document.querySelector(".aura-panel");
  if (!auraPanel) return null;

  let box = document.getElementById("auraMarketingBox");
  if (box) return box;

  box = document.createElement("div");
  box.id = "auraMarketingBox";
  box.style.marginTop = "14px";
  box.style.display = "grid";
  box.style.gap = "10px";

  auraPanel.insertAdjacentElement("afterend", box);
  return box;
}

function hideLoading() {
  const overlay = $("#loadingOverlay");
  if (!overlay) return;
  overlay.style.opacity = "0";
  setTimeout(() => overlay.remove(), 600);
}

function getBrandColors() {
  const cs = getComputedStyle(document.documentElement);
  return {
    brand: cs.getPropertyValue("--brand").trim(),
    brandDark: cs.getPropertyValue("--brandDark").trim(),
  };
}

// =======================================================
// ✨ AURA UX Helpers (Phase 6.7.6)
// =======================================================

function ensureAuraMetaRow() {
  const box = document.getElementById("auraMarketingBox");
  if (!box) return null;

  let row = document.getElementById("auraMetaRow");
  if (row) return row;

  row = document.createElement("div");
  row.id = "auraMetaRow";
  row.className = "small muted";
  row.style.display = "flex";
  row.style.justifyContent = "space-between";
  row.style.alignItems = "center";
  row.style.gap = "10px";
  row.style.marginTop = "6px";
  row.style.opacity = "0.8";

  box.insertAdjacentElement("afterend", row);
  return row;
}

function auraSetLastUpdated(prefix = "Zuletzt aktualisiert") {
  const row = ensureAuraMetaRow();
  if (!row) return;

  const t = new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  row.innerHTML = `<span>🕒 ${prefix}: ${t}</span>`;
}

function auraSoftFlash(el) {
  if (!el) return;
  el.animate(
    [
      { backgroundColor: "rgba(207,168,111,0)" },
      { backgroundColor: "rgba(207,168,111,0.12)" },
      { backgroundColor: "rgba(207,168,111,0)" },
    ],
    { duration: 900, easing: "ease-out" }
  );
}

function auraFadeIn(el) {
  if (!el) return;
  el.animate(
    [
      { opacity: 0, transform: "translateY(4px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 220, easing: "ease-out" }
  );
}


// =======================================================
// 📣 AURA MARKETING – Daten laden
// Phase 6.7.5 AUTO REFRESH + B1.2 Status + C3.1 Soft-Highlight
// =======================================================
async function loadAuraMarketing() {
  const box = ensureAuraMarketingContainer();
  if (!box) return;

  // 🔹 Ruhiges UX
  box.style.maxHeight = "260px";
  box.style.overflowY = "auto";

  box.innerHTML =
    "<div class='muted small'>⏳ A.U.R.A prüft Marketing-Empfehlungen …</div>";

  try {
    const res = await fetch(
      "/api/aura/marketing/active?tenant=beauty_lounge"
    );

    if (!res.ok) throw new Error("Request fehlgeschlagen");

    const json = await res.json();

    // ===================================================
    // 🔑 AUTO-REFRESH KEY (Change Detection)
    // 👉 robust: funktioniert mit Top-Level ODER marketing-Objekt
    // ===================================================
    const m = json?.marketing || json;

    const activeKey =
      json?.show === true
        ? `${m?.marketing_id || m?.id || ""}|${m?.headline || ""}|${m?.reason || ""}|${m?.confidence || ""}`
        : "NO_ACTIVE";

    // ===================================================
    // 🧠 B1.2 – Status bestimmen (new / updated / same)
    // ===================================================
    let auraStatus = "same";

    if (!lastAuraActiveKey) {
      auraStatus = "new";
    } else if (activeKey !== lastAuraActiveKey) {
      auraStatus = "updated";
    }

    lastAuraActiveKey = activeKey;
    window.lastAuraStatus = auraStatus;

    // 🟡 Nichts geändert → ruhig bleiben, aber Zeit aktualisieren
    if (auraStatus === "same") {
      auraSetLastUpdated("Zuletzt geprüft");
      return json;
    }

    // ⛔ Keine aktive Empfehlung
    if (!json || json.show !== true) {
      box.innerHTML =
        "<div class='muted small'>ℹ️ Aktuell keine aktive Marketing-Empfehlung.</div>";

      auraSetLastUpdated("Zuletzt geprüft");
      return null;
    }

    // ===================================================
    // ✅ Aktive Empfehlung rendern
    // ===================================================
    box.innerHTML = "";

    const data = json.marketing || json;   // fallback auf Top-Level
    const cardEl = renderAuraMarketingBox(data);

    // ===================================================
    // ✨ C3.1 – Soft Highlight nur bei NEW / UPDATED
    // ===================================================
    if (
      cardEl &&
      (window.lastAuraStatus === "new" ||
        window.lastAuraStatus === "updated")
    ) {
      auraSoftFlash(cardEl);
      auraFadeIn(cardEl);
    }

    // 🕒 A2 – Last Updated
    auraSetLastUpdated("Zuletzt geprüft");

    return json;

  } catch (err) {
    console.error("❌ AURA Marketing Active Fehler:", err);
    box.innerHTML =
      "<div class='muted small'>❌ Marketing-Empfehlung konnte nicht geladen werden.</div>";
    return null;
  }
}




// =======================================================
// 📜 AURA MARKETING – Historie / letzte Empfehlung (SaaS-clean)
// Phase 6.7.6 – ROI integriert (stabil + null-safe)
// =======================================================
async function loadAuraMarketingHistory() {
  try {
    const res = await fetch(
      "/api/aura/marketing/history?tenant=beauty_lounge&limit=5"
    );

    if (!res.ok) throw new Error("History Request fehlgeschlagen");

    const json = await res.json();

    if (!json?.records || !Array.isArray(json.records) || json.records.length === 0) {
      return;
    }

    // 🔝 neuester Eintrag (DESC sortiert)
    const last = json.records[0];
    if (!last) return;

    // 🔑 Change Detection
    const historyKey = [
      last.id || "",
      last.status || "",
      last.confidence || "",
      last.created_at || "",
      last.impact_revenue || "",
      last.roi_score || ""
    ].join("|");

    if (historyKey === lastAuraHistoryKey) return;
    lastAuraHistoryKey = historyKey;

    const box = ensureAuraMarketingContainer();
    if (!box) return;

    const oldCard = document.getElementById("auraMarketingHistoryCard");
    if (oldCard) oldCard.remove();

    // 🧠 Ruhige Confidence-Anzeige (kein Badge, keine %)
    const confidenceLabel =
      typeof getConfidenceLabel === "function"
        ? getConfidenceLabel(last.confidence)
        : null;

    const timeLabel =
      typeof formatAuraTime === "function"
        ? formatAuraTime(last.created_at)
        : null;

    const hasROI =
      last.status === "executed" &&
      last.impact_revenue !== null;

    const card = document.createElement("div");
    card.id = "auraMarketingHistoryCard";
    card.className = "card";
    card.style.cssText = `
      padding:12px 14px;
      font-size:13px;
      display:flex;
      flex-direction:column;
      gap:6px;
      opacity:0.9;
    `;

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:600">
          📌 Letzte AURA-Empfehlung
        </div>
        ${timeLabel ? `<div class="small muted">🕒 ${timeLabel}</div>` : ""}
      </div>

      <div style="font-weight:500">
        ${last.headline || "Marketing-Aktion"}
      </div>

      ${
        last.reason
          ? `<div class="small muted">
              ${
                Array.isArray(last.reason)
                  ? last.reason.join(", ")
                  : last.reason
              }
            </div>`
          : ""
      }

      ${
        confidenceLabel
          ? `<div class="small muted">
               Sicherheit: <strong>${confidenceLabel}</strong>
             </div>`
          : ""
      }

      <div class="small muted">
        Status: <b>${last.status || "generated"}</b>
      </div>

      ${
        hasROI
          ? `
            <div style="margin-top:6px;border-top:1px solid #eee;padding-top:6px">
              <div class="small">
                📈 Umsatz-Impact:
                <b>${Number(last.impact_revenue).toFixed(2)} €</b>
              </div>

              <div class="small">
                📅 Buchungs-Impact:
                <b>${last.impact_bookings ?? 0}</b>
              </div>

              ${
                last.roi_score !== null
                  ? `
                    <div class="small">
                      🧠 ROI Score:
                      <b>${(Number(last.roi_score) * 100).toFixed(1)} %</b>
                    </div>
                  `
                  : ""
              }
            </div>
          `
          : ""
      }
    `;

    box.appendChild(card);

    auraSoftFlash(card);
    auraFadeIn(card);

  } catch (err) {
    console.error("❌ AURA Marketing History Fehler:", err);
  }
}


// =======================================================
// 📦 BOOKINGS & KPIs
// =======================================================

async function loadBookings() {
  try {
    const r = await fetch("/api/bookings");
    allBookings = await r.json();

    window.dashboardStats.bookings = allBookings;

    updateChartsFromBookings();
    hideLoading();

    setStatus(`${allBookings.length} Buchungen geladen`);

    fetchDashboardSilent();
  } catch {
    setStatus("❌ Fehler beim Laden der Buchungen");
  }
}

function renderKPIs(k) {
  $("#statTotal").textContent = k.total;
  $("#statRevenue").textContent = euro(k.revenue);
  $("#statAvg").textContent = euro(k.avg);
  $("#statActive").textContent = k.active;
  $("#statLoad").textContent = k.loadPct.toFixed(1) + " %";

  window.dashboardStats = {
    ...window.dashboardStats,
    total: k.total,
    revenue: k.revenue,
    avg: k.avg,
    active: k.active,
    loadPct: k.loadPct
  };
}

async function fetchDashboardSilent() {
  try {
    const r = await fetch("/api/dashboard");
    const j = await r.json();
    if (!j?.data) return;
    renderKPIs(j.data);
  } catch {}
}

setInterval(fetchDashboardSilent, 60000);


// =======================================================
// 🧾 AURA MARKETING – Aktive Empfehlung rendern (SaaS-clean, reduziert)
// =======================================================

function renderAuraMarketingBox(m) {
  const box = document.getElementById("auraMarketingBox");
  if (!box) return;

  box.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";
  card.style.padding = "10px 12px";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.gap = "6px";

  // 🧠 Confidence nur als ruhige Textinfo (kein %, kein Badge)
  const confidenceLabel =
    typeof m.confidence === "number"
      ? m.confidence >= 0.8
        ? "hoch"
        : m.confidence >= 0.6
        ? "mittel"
        : "niedrig"
      : null;

  // -----------------------------------------------------
  // 📦 Card Content (clean SaaS)
  // -----------------------------------------------------

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px">
      <div style="flex:1">

        <div style="font-weight:600;font-size:15px;line-height:1.3">
          ${m.headline || "Marketing-Empfehlung"}
        </div>

        ${
          m.reason
            ? `<div class="small muted" style="margin-top:4px">
                ${m.reason}
                ${
                  confidenceLabel
                    ? ` · Sicherheit: ${confidenceLabel}`
                    : ""
                }
               </div>`
            : ""
        }

      </div>
    </div>

    <!-- 🔘 Actions -->
    <div style="display:flex;gap:8px;margin-top:6px">
      <button class="btn-primary" data-status="executed">
        ⚡ Ausführen
      </button>

      <button class="btn-secondary" data-status="ignored">
        Ablehnen
      </button>
    </div>

    <!-- 🧠 Explain Layer -->
    <div class="aura-explain" style="margin-top:4px">
      <button
        class="small muted"
        type="button"
        data-aura-explain-toggle
        aria-expanded="false"
        style="background:none;border:0;text-decoration:underline;cursor:pointer;padding:0"
      >
        Warum empfiehlt AURA das?
      </button>

      <div
        data-aura-explain-panel
        aria-hidden="true"
        style="
          overflow:hidden;
          max-height:0;
          opacity:0;
          transition:max-height 200ms ease, opacity 200ms ease;
          margin-top:4px;
        "
      >
        <ul data-aura-explain-list class="small muted" style="padding-left:16px;margin:0"></ul>
      </div>
    </div>
  `;

// ===================================================
// 🔒 EXECUTE / IGNORE HANDLER
// ===================================================

card.querySelectorAll("button[data-status]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const status = btn.dataset.status;
    const marketingId = m.id;
    if (!marketingId) return;

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = "…";

    try {
      const res = await fetch("/api/aura/marketing/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant: "beauty_lounge",
          marketing_id: marketingId,
          action: status,
        }),
      });

      if (!res.ok) throw new Error("Status Update Fehler");

      // ===================================================
      // ✅ SaaS-Style State Update (B-Variante)
      // ===================================================

      if (status === "executed") {
        card.style.opacity = "0.7";

        // Buttons entfernen
        const actionRow = card.querySelector("div[style*='display:flex'][style*='gap']");
        if (actionRow) actionRow.remove();

        // Statusanzeige hinzufügen
        const statusInfo = document.createElement("div");
        statusInfo.className = "small muted";
        statusInfo.style.marginTop = "6px";
        statusInfo.innerHTML = "✔ Empfehlung wurde ausgeführt.";

        card.appendChild(statusInfo);
      }

      if (status === "ignored") {
        card.style.opacity = "0.6";

        const actionRow = card.querySelector("div[style*='display:flex'][style*='gap']");
        if (actionRow) actionRow.remove();

        const statusInfo = document.createElement("div");
        statusInfo.className = "small muted";
        statusInfo.style.marginTop = "6px";
        statusInfo.innerHTML = "✖ Empfehlung wurde abgelehnt.";

        card.appendChild(statusInfo);
      }

      // ===================================================
      // 🔄 Sync ohne Reload
      // ===================================================

      setTimeout(async () => {
        lastAuraActiveKey = null;
        lastAuraHistoryKey = null;

        await loadAuraMarketing();

        setTimeout(() => {
          loadAuraMarketingHistory();
        }, 400);
      }, 600);

    } catch (err) {
      console.error("❌ Marketing Action Fehler:", err);
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});


// ===================================================
// 🧠 EXPLAIN HANDLER
// ===================================================

const explainBtn = card.querySelector("[data-aura-explain-toggle]");
const explainPanel = card.querySelector("[data-aura-explain-panel]");
const explainList = card.querySelector("[data-aura-explain-list]");

if (explainBtn && explainPanel && explainList) {
  explainBtn.addEventListener("click", async () => {
    const expanded = explainBtn.getAttribute("aria-expanded") === "true";
    explainBtn.setAttribute("aria-expanded", String(!expanded));
    explainPanel.setAttribute("aria-hidden", String(expanded));

    if (!expanded) {
      explainPanel.style.maxHeight = "160px";
      explainPanel.style.opacity = "1";
      explainList.innerHTML = "<li>⏳ Gründe werden geladen …</li>";

      try {
        const res = await fetch(`/api/aura/explain?tenant=beauty_lounge&period=today`);
        if (!res.ok) throw new Error("Explain Request fehlgeschlagen");

        const json = await res.json();

        const reasons =
          Array.isArray(json?.reasons) && json.reasons.length
            ? json.reasons
            : m?.reason
            ? [m.reason]
            : [];

        explainList.innerHTML = reasons.length
          ? reasons.map((r) => `<li>👉 ${r}</li>`).join("")
          : "<li>ℹ️ Keine weiteren Details verfügbar.</li>";

      } catch (err) {
        console.error("❌ AURA Explain Fehler:", err);
        explainList.innerHTML = "<li>❌ Erklärung konnte nicht geladen werden.</li>";
      }

    } else {
      explainPanel.style.maxHeight = "0";
      explainPanel.style.opacity = "0";
    }
  });
}

box.appendChild(card);
return card;
}



// =======================================================
// 📊 CHARTS
// =======================================================
function buildRevenueTrendData(bookings) {
  const since = new Date(Date.now() - 30 * 864e5);
  const perDay = new Map();

  bookings.forEach((b) => {
    const d = new Date(b.dateTime);
    if (d < since) return;

    const key = d.toISOString().slice(0, 10);
    perDay.set(key, (perDay.get(key) || 0) + (+b.price || 0));
  });

  const labels = [];
  const values = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = d.toISOString().slice(0, 10);
    labels.push(
      d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })
    );
    values.push(perDay.get(key) || 0);
  }

  return { labels, values };
}

function buildTopServicesData(bookings) {
  const since = new Date(Date.now() - 30 * 864e5);
  const c = {};

  bookings.forEach((b) => {
    const d = new Date(b.dateTime);
    if (d < since) return;

    const s = b.service || "Unbekannt";
    c[s] = (c[s] || 0) + 1;
  });

  const sorted = Object.entries(c).sort((a, b) => b[1] - a[1]);

  return {
    labels: sorted.slice(0, 5).map((x) => x[0]),
    values: sorted.slice(0, 5).map((x) => x[1]),
  };
}

// =======================================================
// 🧠 Mini Insight – Top Service Erklärung (unter Donut)
// =======================================================
function renderTopServiceInsight(labels, values) {
  const box = document.getElementById("topServiceInsight");
  if (!box || !labels.length) return;

  const total = values.reduce((a, b) => a + b, 0);
  if (!total) {
    box.innerHTML = "";
    return;
  }

  const topLabel = labels[0];
  const topValue = values[0];
  const pct = Math.round((topValue / total) * 100);

  let text = `💡 <strong>${topLabel}</strong> ist aktuell dein stärkster Service (${pct}% aller Buchungen).`;

  if (pct >= 80 && labels.length > 1) {
    text += " ⚠️ Hohe Abhängigkeit – mehr Service-Mix empfohlen.";
  } else if (pct < 50 && labels.length > 1) {
    text += " 👍 Gute Verteilung zwischen mehreren Services.";
  }

  box.innerHTML = text;
}

// Umsatzchart
function createRevenueTrendChart(ctx, labels, values) {
  const { brand, brandDark } = getBrandColors();

  const maxVal = Math.max(...values, 1);
  const yMax = maxVal + maxVal * 0.15;

  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, brand + "55");
  gradient.addColorStop(1, brand + "00");

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: brandDark,
          backgroundColor: gradient,
          borderWidth: 2.2,
          tension: 0.35,
          fill: true,
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          max: yMax,
          ticks: { stepSize: Math.max(Math.round(maxVal / 6), 1) },
        },
        x: { grid: { display: false } },
      },
    },
  });
}

// =======================================================
// 🍩 Doughnut Center Text Plugin (AURA – Smart Insight)
// =======================================================
const doughnutCenterText = {
  id: "doughnutCenterText",
  afterDraw(chart) {
    const { ctx, data } = chart;
    if (!data?.labels?.length) return;

    const values = data.datasets[0].data || [];
    const total = values.reduce((a, b) => a + b, 0);

    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const cx = meta.data[0].x;
    const cy = meta.data[0].y;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // =============================
    // FALL 1: Zu wenig Daten
    // =============================
    if (total < 3) {
      ctx.font = "600 13px Inter, system-ui";
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillText("Zu wenig Daten", cx, cy - 6);

      ctx.font = "12px Inter, system-ui";
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillText("für klare Analyse", cx, cy + 14);

      ctx.restore();
      return;
    }

    // =============================
    // FALL 2: Top-Service ermitteln
    // =============================
    const topIndex = values.indexOf(Math.max(...values));
    const topLabel = data.labels[topIndex];
    const topValue = values[topIndex];
    const pct = Math.round((topValue / total) * 100);

    // =============================
    // FALL 3: Kein klarer Fokus
    // =============================
    if (pct < 50) {
      ctx.font = "600 13px Inter, system-ui";
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText("Kein klarer", cx, cy - 8);

      ctx.font = "600 13px Inter, system-ui";
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillText("Top-Service", cx, cy + 10);

      ctx.restore();
      return;
    }

    // =============================
    // FALL 4: Klarer Top-Service
    // =============================
    ctx.font = "600 12px Inter, system-ui";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText("Top-Service", cx, cy - 20);

    ctx.font = "700 16px Inter, system-ui";
    ctx.fillStyle = "#000";
    ctx.fillText(topLabel, cx, cy + 2);

    ctx.font = "500 12px Inter, system-ui";
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillText(`${pct}% der Buchungen`, cx, cy + 22);

    ctx.restore();
  }
};



function createTopServicesChart(ctx, labels, values) {
  const { brand, brandDark } = getBrandColors();

  const palette = [
    brandDark,
    brand,
    "#d8c2a3",
    "#eadfce",
    "#f4eee7"
  ];

  return new Chart(ctx, {
  plugins: [doughnutCenterText],
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: palette.slice(0, labels.length),
          borderWidth: 0,
          hoverOffset: 8,
          cutout: "70%",
        }
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(20,20,20,0.92)",
          padding: 10,
          titleFont: { weight: "600", size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: (ctx) =>
              ` ${ctx.label}: ${ctx.raw} Buchungen`,
          },
        },
      },
      layout: { padding: 12 },
    },
  });
}



function updateChartsFromBookings() {
  const r = buildRevenueTrendData(allBookings);
  const t = buildTopServicesData(allBookings);

  const c1 = $("#chartRevenueTrend").getContext("2d");
  const c2 = $("#chartTopServices").getContext("2d");

  if (revenueTrendChart) {
    revenueTrendChart.data.labels = r.labels;
    revenueTrendChart.data.datasets[0].data = r.values;
    revenueTrendChart.update();
  } else {
    revenueTrendChart = createRevenueTrendChart(c1, r.labels, r.values);
  }

  if (topServicesChart) {
    topServicesChart.data.labels = t.labels;
    topServicesChart.data.datasets[0].data = t.values;
    topServicesChart.update();
  } else {
    topServicesChart = createTopServicesChart(c2, t.labels, t.values);
  }
}


// =======================================================
// ✅ TODO LIST
// =======================================================
async function loadTodos() {
  const r = await fetch("/api/todos");
  const j = await r.json();
  todos = j.data || [];
  renderTodos();
}

function renderTodos() {
  const tb = $("#todoBody");
  tb.innerHTML = "";

  if (!todos.length) {
    tb.innerHTML = `<tr><td colspan="5" class="muted">Noch keine Aufgaben …</td></tr>`;
    return;
  }

  todos.forEach((t) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="checkbox" data-id="${t.id}" ${t.done ? "checked" : ""}></td>
      <td>${t.title}</td>
      <td>${t.due_at ? new Date(t.due_at).toLocaleDateString("de-DE") : "–"}</td>
      <td>${t.priority == 2 ? "🔥 Kritisch" : t.priority == 1 ? "⚡ Hoch" : "🧊 Normal"}</td>
      <td><button data-del="${t.id}" class="danger">Löschen</button></td>
    `;
    tb.appendChild(row);
  });

  tb.onclick = async (e) => {
    const id = e.target.dataset.id;
    const del = e.target.dataset.del;

    if (id) toggleTodo(id, e.target.checked);
    if (del) deleteTodo(del);
  };
}

async function addTodo() {
  const title = $("#todoTitle").value.trim();
  if (!title) return setStatus("✍ Titel eingeben.");

  const priority = Number($("#todoPrio").value);
  const due = $("#todoDue").value || null;

  await fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      priority,
      due_at: due ? due + "T00:00:00Z" : null,
    }),
  });

  $("#todoTitle").value = "";
  loadTodos();
}

async function toggleTodo(id, done) {
  await fetch(`/api/todos/${id}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done }),
  });
  loadTodos();
}

async function deleteTodo(id) {
  if (!confirm("Löschen?")) return;
  await fetch(`/api/todos/${id}`, { method: "DELETE" });
  loadTodos();
}

// =======================================================
// 🗂️ PREISLISTE
// =======================================================
async function fetchPreislisteInfo() {
  const r = await fetch("/api/preisliste/status");
  const j = await r.json();
  if (j?.exists) {
    enablePreisButtons(j.url);
    $("#preislisteStatus").innerHTML = "✔ Preisliste gefunden";
  } else {
    disablePreisButtons();
    $("#preislisteStatus").innerHTML = "❌ Keine Preisliste gefunden";
  }
}

function enablePreisButtons(url) {
  $("#btnViewPreisliste").disabled = false;
  $("#btnDownloadPreisliste").disabled = false;
  $("#btnViewPreisliste").onclick = () => window.open(url, "_blank");
  $("#btnDownloadPreisliste").onclick = () => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "Preisliste";
    a.click();
  };
}

function disablePreisButtons() {
  $("#btnViewPreisliste").disabled = true;
  $("#btnDownloadPreisliste").disabled = true;
}

async function uploadPreisliste(file) {
  const fd = new FormData();
  fd.append("file", file);

  const r = await fetch("/api/upload-preisliste", {
    method: "POST",
    body: fd,
  });

  const j = await r.json();
  if (j.success) fetchPreislisteInfo();
}

// =======================================================
// 🔒 DSGVO
// =======================================================
async function gdprExport() {
  const phone = $("#gdprPhone").value.trim();
  if (!phone) return;

  const r = await fetch("/api/gdpr/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  $("#gdprOut").textContent = JSON.stringify(await r.json(), null, 2);
}

async function gdprAnonym() {
  const phone = $("#gdprPhone").value.trim();
  if (!phone) return;
  if (!confirm("Wirklich anonymisieren?")) return;

  const r = await fetch("/api/gdpr/anonymize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });

  $("#gdprOut").textContent = JSON.stringify(await r.json(), null, 2);
  loadBookings();
}

// =======================================================
// 🤖 AURA – ECHTE KI ANALYSE
// =======================================================
function initAuraUI() {
  const btn = $("#btnAuraSuggest");
  const panel = $("#auraPanel");

  if (!btn || !panel) return;

  btn.addEventListener("click", async () => {
    panel.style.display = "block";
    panel.innerHTML = "<em>A.U.R.A analysiert deine Studio-Daten …</em>";

    try {
      const res = await fetch("/api/aura/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(window.dashboardStats)
      });

      const json = await res.json();

      if (!json.focusAreas) {
        panel.innerHTML = "<em>⚠️ AURA konnte keine Analyse durchführen.</em>";
        return;
      }

      panel.innerHTML = `
        <h3>✨ A.U.R.A – Empfohlene Fokusbereiche</h3>
        <ul class="small">
          ${json.focusAreas
            .map((f) => `<li>${f.emoji} ${f.message}</li>`)
            .join("")}
        </ul>
      `;

      // ❌ Entfernt: box.classList.add("aura-open");

    } catch (err) {
      console.error(err);
      panel.innerHTML = "<em>⚠️ Fehler: AURA konnte nicht geladen werden.</em>";
    }
  });
}

// =======================================================
// 🚀 INIT (SAFE) – Phase 6.7.5 FINAL (Auto Refresh sauber)
// =======================================================
document.addEventListener("DOMContentLoaded", () => {
  // ✅ Lucide Icons IMMER initialisieren
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }

  // ✅ Datum setzen
  const dateEl = document.getElementById("dateToday");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("de-DE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  // ✅ Theme
  loadTheme();
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  // 🔄 Core Daten
  loadBranding();
  loadBookings();
  loadTodos();
  fetchPreislisteInfo();

  // =====================================================
  // 🧠 AURA MARKETING – Aktive Empfehlung
  // =====================================================
  if (typeof loadAuraMarketing === "function") {
    loadAuraMarketing();
  }

  // =====================================================
  // 📜 AURA MARKETING – Historie
  // =====================================================
  if (typeof loadAuraMarketingHistory === "function") {
    loadAuraMarketingHistory();
  }

  // =====================================================
  // 🔁 AURA AUTO REFRESH – Phase 6.7.5 (zentral gesteuert)
  // =====================================================
  if (typeof startAuraAutoRefresh === "function") {
    startAuraAutoRefresh();
  }

  // =====================================================
  // 📤 Upload Preisliste
  // =====================================================
  const btnUpload = document.getElementById("btnUploadPreisliste");
  const fileInput = document.getElementById("preislisteFile");
  if (btnUpload && fileInput) {
    btnUpload.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      const f = e.target?.files?.[0];
      if (f) uploadPreisliste(f);
    });
  }

  // =====================================================
  // 🔒 DSGVO
  // =====================================================
  const btnExport = document.getElementById("btnGDPRExport");
  if (btnExport) btnExport.addEventListener("click", gdprExport);

  const btnAnonym = document.getElementById("btnGDPRAnonym");
  if (btnAnonym) btnAnonym.addEventListener("click", gdprAnonym);

  // =====================================================
  // ✅ TODOS
  // =====================================================
  const btnTodoAdd = document.getElementById("btnTodoAdd");
  if (btnTodoAdd) btnTodoAdd.addEventListener("click", addTodo);

  const btnTodoReload = document.getElementById("btnTodoReload");
  if (btnTodoReload) btnTodoReload.addEventListener("click", loadTodos);

  // ❌ Alte AURA UI bewusst deaktiviert
  // initAuraUI();
});






