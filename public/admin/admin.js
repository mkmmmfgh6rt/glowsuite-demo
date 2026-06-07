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

  const brandTitle = $("#brandTitle");
  if (brandTitle) {
    brandTitle.textContent = b.brandName || "GlowSuite AI";
  }

  const brandLogo = $("#brandLogo");
  if (brandLogo && b.logo) {
    brandLogo.src = b.logo;
  }
}
async function loadBranding() {
  try {
    const r = await fetch("/api/branding");
    const j = await r.json();
    if (j?.branding) branding = { ...branding, ...j.branding };
  } catch { }
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
    loyalty_bonus: {
      label: "VIP-Bonus",
      short: "Bindung stärken",
    },
    suggest_discount: {
      label: "Rabatt-Aktion",
      short: "Rückgewinnung fördern",
    },
    scheduled: {
      label: "Geplant",
      short: "Aktion vorbereitet",
    },
    posted: {
      label: "Veröffentlicht",
      short: "Aktion wurde gestartet",
    },
    executed: {
      label: "Umgesetzt",
      short: "Empfehlung wurde ausgeführt",
    },
    ignored: {
      label: "Abgelehnt",
      short: "Empfehlung wurde nicht übernommen",
    },
    low_bookings: {
      label: "Wenig Buchungen",
      short: "Auslastung verbessern",
    },
    upsell_opportunity: {
      label: "Zusatzverkauf",
      short: "Mehr Umsatz pro Termin",
    },
  };

  return (
    map[action] || {
      label: "Empfehlung",
      short: "Studioleistung verbessern",
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
// Phase 6.7.6 – ROI integriert (Studio verständlich)
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

    const last = json.records[0];
    if (!last) return;

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

    const meta = getAuraActionMeta(last.headline || last.action || last.type);

    const recommendationMap = {
      loyalty_bonus: "VIP-Kundenbonus erneut aktivieren",
      suggest_discount: "Rabattaktion erneut starten",
      low_bookings: "Freie Termine aktiv bewerben",
      upsell_opportunity: "Zusatzbehandlungen empfehlen",
    };

    const recommendationText =
      recommendationMap[
      last.strategy_type ||
      last.headline ||
      last.action
      ] || meta.label;

    const confidenceLabel =
      typeof getConfidenceLabel === "function"
        ? getConfidenceLabel(last.confidence)
        : null;

    const timeLabel =
      typeof formatAuraTime === "function"
        ? formatAuraTime(last.created_at)
        : null;

    const reasons = Array.isArray(last.reason)
      ? last.reason
      : last.reason
        ? String(last.reason).split("·").map(x => x.trim()).filter(Boolean)
        : [];

    const summary =
      reasons[0] || meta.short || "AURA hat eine sinnvolle Marketingmaßnahme erkannt.";

    // ===================================================
    // Verständlicher Status für Studios
    // ===================================================

    const statusLabelMap = {
      executed: "Aktion gestartet",
      approved: "freigegeben",
      ignored: "später prüfen",
      posted: "Kampagne aktiv",
      scheduled: "geplant",
      generated: "erstellt"
    };

    const statusLabel = statusLabelMap[last.status] || "gespeichert";

    const card = document.createElement("div");
    card.id = "auraMarketingHistoryCard";
    card.className = "card";

    card.style.cssText = `
      padding:18px;
      display:flex;
      flex-direction:column;
      gap:12px;
      border-radius:18px;
      border:1px solid rgba(207,168,111,.18);
      box-shadow:0 8px 24px rgba(0,0,0,.04);
      background:#fff;
      opacity:0.92;
    `;

    card.innerHTML = `
  <div
    style="
      display:flex;
      justify-content:space-between;
      align-items:center;
    "
  >
    <div
      style="
        font-weight:600;
        font-size:14px;
      "
    >
      Letzte Marketingaktion
    </div>

    ${timeLabel
        ? `
        <div class="small muted">
          ${timeLabel}
        </div>
      `
        : ""
      }
  </div>

  <div
    style="
      font-size:13px;
      color:#777;
      font-weight:600;
      text-transform:uppercase;
      letter-spacing:.5px;
    "
  >
    Empfehlung
  </div>

  <div
    style="
      font-size:18px;
      font-weight:700;
      margin-top:4px;
      line-height:1.4;
    "
  >
    ${recommendationText}
  </div>

  <div
    class="small muted"
    style="
      margin-top:4px;
      line-height:1.5;
    "
  >
    ${summary}
  </div>

  <div
    style="
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-top:8px;
    "
  >

    ${confidenceLabel
        ? `
        <span
          style="
            padding:4px 8px;
            border-radius:999px;
            background:#F5F5F5;
            font-size:12px;
            font-weight:600;
          "
        >
          Priorität: ${confidenceLabel}
        </span>
      `
        : ""
      }

    <span
      style="
        padding:4px 8px;
        border-radius:999px;
        background:#F5F5F5;
        font-size:12px;
        font-weight:600;
      "
    >
      Status: ${statusLabel}
    </span>

  </div>

  ${last.status === "executed"
        ? `
      <div
        style="
          margin-top:10px;
          padding-top:10px;
          border-top:1px solid #eee;
          display:grid;
          gap:10px;
        "
      >

        ${Number(last.impact_revenue) > 0
          ? `
            <div>
              <div class="small muted">
                Zusätzlicher Umsatz
              </div>

              <div
                style="
                  font-size:16px;
                  font-weight:600;
                "
              >
                ${Number(last.impact_revenue).toFixed(2)} €
              </div>
            </div>
          `
          : ""
        }

        ${Number(last.impact_bookings) > 0
          ? `
            <div>
              <div class="small muted">
                Zusätzliche Buchungen
              </div>

              <div
                style="
                  font-size:16px;
                  font-weight:600;
                "
              >
                ${last.impact_bookings}
              </div>
            </div>
          `
          : ""
        }

        ${last.roi_score !== null &&
          Number(last.roi_score) > 0
          ? `
            <div>
              <div class="small muted">
                Erfolgsquote
              </div>

              <div
                style="
                  font-size:16px;
                  font-weight:600;
                "
              >
                ${(Number(last.roi_score) * 100).toFixed(1)} %
              </div>
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
  $("#statLoad").textContent =
    k.loadPct.toFixed(1) + " %";

  // =========================
  // KPI Hinweise
  // =========================

  $("#statTotalInfo").textContent =
    k.total >= 50
      ? "Buchungsvolumen stabil"
      : "Wachstumspotenzial vorhanden";

  $("#statRevenueInfo").textContent =
    k.revenue >= 2000
      ? "Positiver Umsatztrend"
      : "Zusätzliche Marketingmaßnahmen sinnvoll";

  $("#statAvgInfo").textContent =
    k.avg >= 50
      ? "Überdurchschnittlicher Terminwert"
      : "Zusatzverkäufe möglich";

  $("#statActiveInfo").textContent =
    k.active >= 15
      ? "Starke Kundenbindung"
      : "Kundenaktivierung empfohlen";

  $("#statLoadInfo").textContent =
    k.loadPct >= 75
      ? "Kapazität gut ausgelastet"
      : "Freie Termine verfügbar";

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
  } catch { }
}

setInterval(fetchDashboardSilent, 60000);


// =======================================================
// 🧾 AURA MARKETING – Aktive Empfehlung rendern
// =======================================================

function renderAuraMarketingBox(m) {
  console.log("AURA ACTIVE:", m);
  const box = document.getElementById("auraMarketingBox");
  if (!box) return;

  box.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card";
  card.style.padding = "10px 12px";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.gap = "6px";

  // -----------------------------------------------------
  // 🧠 Titel verständlich machen
  // -----------------------------------------------------

  const actionMap = {
    loyalty_bonus: "Stammkunden-Bonus vorschlagen",
    suggest_discount: "Rabattaktion zur Auslastung starten",
    low_bookings: "Wenig Buchungen erkannt",
    upsell_opportunity: "Zusatzbehandlung empfehlen"
  };

  const headline =
    actionMap[m.headline] ||
    actionMap[m.action] ||
    m.headline ||
    "Marketing-Empfehlung";

  // -----------------------------------------------------
  // 🧠 Confidence Label
  // -----------------------------------------------------

  const confidenceLabel =
    typeof m.confidence === "number"
      ? m.confidence >= 0.8
        ? "hoch"
        : m.confidence >= 0.6
          ? "mittel"
          : "niedrig"
      : null;

  // -----------------------------------------------------
  // 📦 Card Content
  // -----------------------------------------------------

  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px">
      <div style="flex:1">

        <div
          style="
            font-size:13px;
            color:#777;
            font-weight:600;
            text-transform:uppercase;
            letter-spacing:.5px;
          "
        >
          AURA Empfehlung
        </div>

        <div
          style="
            font-size:20px;
            font-weight:700;
            margin-top:4px;
            line-height:1.3;
          "
        >
          ${headline}
        </div>

        ${Number(m.impact_revenue || 0) > 0
      ? `
            <div
              style="
                margin-top:8px;
                font-size:15px;
                font-weight:600;
                color:#2f855a;
              "
            >
              +${Number(m.impact_revenue).toFixed(0)} € Umsatzpotenzial
            </div>
          `
      : ""
    }

        <div
          style="
            margin-top:10px;
            display:flex;
            flex-wrap:wrap;
            gap:8px;
          "
        >

          <span class="badge">
            Analyse abgeschlossen
          </span>

          ${confidenceLabel
      ? `
              <span class="badge">
                Priorität ${confidenceLabel}
              </span>
            `
      : ""
    }

          <span class="badge">
            Kundenbindung
          </span>

        </div>

        ${m.reason
      ? `
            <div
              class="small muted"
              style="
                margin-top:10px;
                line-height:1.5;
              "
            >
              ${m.reason}
            </div>
          `
      : ""
    }

      </div>
    </div>

    <!-- 🔘 Actions -->

    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn-primary" data-status="executed">
        Maßnahme starten
      </button>

      <button class="btn-secondary" data-status="ignored">
        Später prüfen
      </button>
    </div>

    <!-- 🧠 Explain Layer -->

    <div class="aura-explain" style="margin-top:6px">
      <button
        class="small muted"
        type="button"
        data-aura-explain-toggle
        aria-expanded="false"
        style="
          background:none;
          border:0;
          text-decoration:underline;
          cursor:pointer;
          padding:0;
        "
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
        <ul
          data-aura-explain-list
          class="small muted"
          style="
            padding-left:16px;
            margin:0;
          "
        ></ul>
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
      btn.textContent = "...";

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

        if (status === "executed") {
          card.style.opacity = "0.7";

          const actionRow = card.querySelector("div[style*='display:flex'][style*='gap']");
          if (actionRow) actionRow.remove();

          const statusInfo = document.createElement("div");
          statusInfo.className = "small muted";
          statusInfo.style.marginTop = "6px";
          statusInfo.innerHTML = "Empfehlung wurde umgesetzt.";

          card.appendChild(statusInfo);
        }

        if (status === "ignored") {
          card.style.opacity = "0.6";

          const actionRow = card.querySelector("div[style*='display:flex'][style*='gap']");
          if (actionRow) actionRow.remove();

          const statusInfo = document.createElement("div");
          statusInfo.className = "small muted";
          statusInfo.style.marginTop = "6px";
          statusInfo.innerHTML = "Empfehlung wurde zurückgestellt.";

          card.appendChild(statusInfo);
        }

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
        explainList.innerHTML = "<li>Analyse wird geladen ...</li>";

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
            ? reasons.map((r) => `<li>${r}</li>`).join("")
            : "<li>Keine weiteren Details verfügbar.</li>";

        } catch (err) {
          console.error("❌ AURA Explain Fehler:", err);
          explainList.innerHTML = "<li>Erklärung konnte nicht geladen werden.</li>";
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

    // ❗ FIX + DEBUG
    if (isNaN(d.getTime())) {
      console.warn("❌ Ungültiges Datum in Booking:", b);
      return;
    }

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

    // ❗ gleicher Schutz hier
    if (isNaN(d.getTime())) {
      console.warn("❌ Ungültiges Datum (Service):", b);
      return;
    }

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

  const c1El = $("#chartRevenueTrend");
  const c2El = $("#chartTopServices");

  // ❗ CRASH FIX: DOM noch nicht ready
  if (!c1El || !c2El) {
    console.warn("⚠️ Charts DOM noch nicht bereit");
    return;
  }

  const c1 = c1El.getContext("2d");
  const c2 = c2El.getContext("2d");

  // ❗ zusätzliche Sicherheit (Canvas vorhanden, aber kein Context)
  if (!c1 || !c2) {
    console.warn("⚠️ Canvas Context nicht verfügbar");
    return;
  }

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
  // 📊 AURA Umsatzanalyse (NEU)
  // =====================================================
  if (typeof loadAuraRevenueInsights === "function") {
    loadAuraRevenueInsights();
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


// =======================================================
// 📊 AURA Umsatzanalyse + 🧠 Learning Dashboard
// Phase 2
// =======================================================

async function loadAuraRevenueInsights() {
  console.log("AURA REVENUE FUNKTION REGISTRIERT");

  const box = document.getElementById("auraRevenueBox");
  if (!box) return;

  try {

    // ===================================================
    // 📊 Umsatzdaten
    // ===================================================

    const analyticsRes = await fetch(
      "/api/aura/summary?tenant=beauty_lounge&period=last_30_days"
    );

    if (!analyticsRes.ok) return;

    const analytics = await analyticsRes.json();

    const revenue =
      Number(analytics?.studio?.revenue || 0);

    const bookings =
      Number(analytics?.studio?.count || 0);

    const avg =
      Number(analytics?.studio?.avg_booking_value || 0);

    let recommendation = "Auslastung stabil.";

    if (bookings < 50) {
      recommendation =
        "Auslastung niedrig – Marketingaktion empfohlen.";
    }

    if (avg > 70) {
      recommendation =
        "Hoher Terminwert – Zusatzbehandlungen hervorheben.";
    }

    // ===================================================
    // 🧠 Learning Daten
    // Phase 3 – Best Campaign Finder
    // ===================================================

    let bestStrategy = null;
    let worstStrategy = null;
    let allStrategies = [];

    try {

      const learningRes = await fetch(
        "/api/aura/learning?tenant=beauty_lounge"
      );

      if (learningRes.ok) {

        const learning = await learningRes.json();

        if (
          learning?.learned_actions &&
          learning.learned_actions.length
        ) {

          allStrategies = learning.learned_actions
            .filter(x => x.strategy_type !== "unknown");

          if (allStrategies.length) {

            bestStrategy = [...allStrategies]
              .sort((a, b) => b.avg_roi - a.avg_roi)[0];

            worstStrategy = [...allStrategies]
              .sort((a, b) => a.avg_roi - b.avg_roi)[0];

          }

        }

      }

    } catch (err) {
      console.warn("Learning Daten nicht verfügbar:", err);
    }

    // ===================================================
    // 🧠 Empfehlungstexte
    // ===================================================

    const recommendationMap = {
      loyalty_bonus:
        "VIP-Kundenbonus erneut aktivieren",

      suggest_discount:
        "Gezielte Rabattaktion erneut starten",

      low_bookings:
        "Mehr Termine durch Marketingkampagne gewinnen",

      upsell_opportunity:
        "Zusatzbehandlungen aktiv empfehlen",

      revenue_drop:
        "Strategie aktuell pausieren und beobachten"
    };

    const strategyLabelMap = {
      loyalty_bonus: "VIP-Kundenbonus",
      suggest_discount: "Rabattaktion",
      low_bookings: "Auslastungskampagne",
      upsell_opportunity: "Zusatzbehandlung",
      revenue_drop: "Umsatzrückgang"
    };

    const learningRecommendation =
      recommendationMap[
      bestStrategy?.strategy_type
      ] || "AURA sammelt weitere Erkenntnisse";


    // ===================================================
    // 🏆 Phase 5 – Top Strategien Ranking
    // ===================================================

    const topStrategies = [...allStrategies]
      .filter(
        s =>
          Number(s.avg_roi || 0) > 0
      )
      .sort(
        (a, b) =>
          Number(b.avg_roi || 0) -
          Number(a.avg_roi || 0)
      )
      .slice(0, 3);

    const worstStrategies = [...allStrategies]
      .filter(
        s =>
          Number(s.avg_roi || 0) < 0
      )
      .sort(
        (a, b) =>
          Number(a.avg_roi || 0) -
          Number(b.avg_roi || 0)
      )
      .slice(0, 3);

    // ===================================================
    // 🎯 Phase 4 – Prioritätsbewertung
    // ===================================================

    let strategyPriority = "Niedrig";

    if (bestStrategy) {

      const roi =
        Number(bestStrategy.avg_roi || 0);

      const successRate =
        Number(bestStrategy.success_rate || 0);

      const revenueImpact =
        Number(bestStrategy.avg_revenue_impact || 0);

      if (
        roi >= 1 ||
        successRate >= 0.50 ||
        revenueImpact >= 50
      ) {
        strategyPriority = "Mittel";
      }

      if (
        roi >= 2 ||
        successRate >= 0.70 ||
        revenueImpact >= 100
      ) {
        strategyPriority = "Hoch";
      }

      if (
        roi >= 3 ||
        successRate >= 0.90 ||
        revenueImpact >= 150
      ) {
        strategyPriority = "Kritisch";
      }

    }


    // ===================================================
    // 📈 Forecast Daten
    // ===================================================

    let forecastData = null;

    try {

      const forecastRes = await fetch(
        "/api/aura/forecast?tenant=beauty_lounge"
      );

      if (forecastRes.ok) {

        const forecastJson =
          await forecastRes.json();

        forecastData =
          forecastJson.forecast || null;

        console.log(
          "FORECAST JSON:",
          forecastJson
        );

        console.log(
          "FORECAST DATA:",
          forecastData
        );
      }

    } catch (err) {

      console.warn(
        "Forecast nicht verfügbar:",
        err
      );

    }

    console.log("🏆 Beste Strategie:", bestStrategy);
    console.log("⚠️ Schlechteste Strategie:", worstStrategy);
    console.log("🎯 Priorität:", strategyPriority);


    // ===================================================
    // 🖥️ Render
    // ===================================================

    box.innerHTML = `

<div class="card" style="padding:12px">

  <div style="font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px">
    <i data-lucide="bar-chart-3"></i>
    Umsatzanalyse
  </div>

  <div class="small muted">
    Umsatz:
    <b>${revenue.toFixed(2)} €</b>
  </div>

  <div class="small muted">
    Buchungen:
    <b>${bookings}</b>
  </div>

  <div class="small muted">
    Ø Terminwert:
    <b>${avg.toFixed(2)} €</b>
  </div>

  <div style="margin-top:10px;font-size:13px">
    Empfehlung:
    <b>${recommendation}</b>
  </div>

</div>

<!-- AURA Learning -->

<div class="card" style="padding:18px;border-radius:18px">

  <div style="font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-size:18px">
    <i data-lucide="brain"></i>
    AURA Erkenntnisse
  </div>

  ${bestStrategy
    ? `

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-bottom:14px">

        <div style="padding:14px;border-radius:14px;background:rgba(207,168,111,.08);border:1px solid rgba(207,168,111,.18)">
          <div class="small muted" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <i data-lucide="award"></i>
            Beste Marketingmaßnahme
          </div>

          <div style="font-size:18px;font-weight:700">
            ${strategyLabelMap[bestStrategy.strategy_type] || bestStrategy.strategy_type}
          </div>
        </div>

        <div style="padding:14px;border-radius:14px;background:rgba(47,133,90,.08);border:1px solid rgba(47,133,90,.16)">
          <div class="small muted" style="margin-bottom:6px">
            Erfolg
          </div>

          <div style="font-size:18px;font-weight:700;color:#2f855a">
            ${Math.round(Number(bestStrategy.avg_roi || 0) * 100)} % Rendite
          </div>
        </div>

        <div style="padding:14px;border-radius:14px;background:#f7f3ef;border:1px solid rgba(0,0,0,.06)">
          <div class="small muted" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <i data-lucide="sparkles"></i>
            AURA empfiehlt
          </div>

          <div style="font-size:16px;font-weight:700">
            ${learningRecommendation}
          </div>
        </div>

      </div>

      <div class="small muted" style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,.08)">
        <b style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
          <i data-lucide="trophy"></i>
          Top Strategien
        </b>

        <div style="display:grid;gap:10px">

          ${topStrategies
            .map((s, i) => {
              const roi = Number(s.avg_roi || 0);
              const width = Math.min(Math.max(roi * 25, 8), 100);

              return `
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                    <span>
                      ${i + 1}. ${strategyLabelMap[s.strategy_type] || s.strategy_type}
                    </span>

                    <b>
                      ${Math.round(roi * 100)} %
                    </b>
                  </div>

                  <div style="height:8px;background:#ececec;border-radius:999px;overflow:hidden">
                    <div style="width:${width}%;height:100%;background:linear-gradient(90deg,#C38B5F,#d7b384)"></div>
                  </div>
                </div>
              `;
            })
            .join("")}

        </div>
      </div>

      ${worstStrategies.length
        ? `
          <div class="small muted" style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(0,0,0,.08)">
            <b style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
              <i data-lucide="triangle-alert"></i>
              Vermeiden
            </b>

            <div style="display:grid;gap:8px">
              ${worstStrategies
                .map((s, i) => {
                  const roi = Number(s.avg_roi || 0);

                  return `
                    <div style="display:flex;justify-content:space-between;font-size:12px;padding:8px 10px;border-radius:10px;background:rgba(220,80,80,.08)">
                      <span>
                        ${i + 1}. ${strategyLabelMap[s.strategy_type] || s.strategy_type}
                      </span>

                      <b>
                        ROI ${roi.toFixed(2)}
                      </b>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        `
        : ""
      }

      <details style="margin-top:12px">
        <summary style="cursor:pointer;font-size:13px;font-weight:600">
          Mehr Details anzeigen
        </summary>

        <div class="small muted" style="margin-top:10px;display:grid;gap:4px">
          <div>
            Zusätzlicher Umsatz:
            <b>+${Number(bestStrategy.avg_revenue_impact).toFixed(2)} €</b>
          </div>

          <div>
            Zusätzliche Termine:
            <b>+${Number(bestStrategy.avg_booking_impact).toFixed(1)}</b>
          </div>

          <div>
            Erfolgsquote:
            <b>${Math.round(Number(bestStrategy.success_rate) * 100)}%</b>
          </div>

          <div>
            Bisher genutzt:
            <b>${bestStrategy.total_runs}</b>
          </div>
        </div>
      </details>

    `
    : `

      <div class="small muted">
        Noch nicht genügend Daten vorhanden.
      </div>

      <div class="small muted" style="margin-top:8px;line-height:1.5">
        AURA sammelt aktuell Erkenntnisse aus Buchungen, Kampagnen und Kundenverhalten.
      </div>

    `
  }

</div>

${forecastData ? `

<div class="card" style="padding:18px;border-radius:18px">

  <div style="font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-size:18px">
    <i data-lucide="sparkles"></i>
    AURA Prognose
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">

    <div style="padding:14px;border-radius:14px;background:rgba(207,168,111,.08);border:1px solid rgba(207,168,111,.18)">
      <div class="small muted" style="margin-bottom:6px;display:flex;align-items:center;gap:6px">
        <i data-lucide="calendar-days"></i>
        Erwartete Buchungen
      </div>

      <div style="font-size:24px;font-weight:700">
        ${Math.round(
          Number(
            forecastData?.adjustedForecast?.[0]?.adjusted_bookings ?? 0
          )
        )}
      </div>

      <div class="small muted" style="margin-top:4px">
        Termine
      </div>
    </div>

    <div style="padding:14px;border-radius:14px;background:rgba(47,133,90,.08);border:1px solid rgba(47,133,90,.16)">
      <div class="small muted" style="margin-bottom:6px;display:flex;align-items:center;gap:6px">
        <i data-lucide="wallet"></i>
        Erwarteter Umsatz
      </div>

      <div style="font-size:24px;font-weight:700;color:#2f855a">
        ${Number(
          forecastData?.adjustedForecast?.[0]?.adjusted_revenue ?? 0
        ).toFixed(2)} €
      </div>

      <div class="small muted" style="margin-top:4px">
        Prognosezeitraum
      </div>
    </div>

    <div style="padding:14px;border-radius:14px;background:#f7f3ef;border:1px solid rgba(0,0,0,.06)">
      <div class="small muted" style="margin-bottom:6px;display:flex;align-items:center;gap:6px">
        <i data-lucide="target"></i>
        Prognosesicherheit
      </div>

      <div style="font-size:24px;font-weight:700">
        ${Math.round(
          Number(
            forecastData?.confidence ?? 0
          ) * 100
        )}%
      </div>

      <div class="small muted" style="margin-top:4px">
        Vorhersagegenauigkeit
      </div>
    </div>

    <div style="padding:14px;border-radius:14px;background:#f7f3ef;border:1px solid rgba(0,0,0,.06)">
      <div class="small muted" style="margin-bottom:6px;display:flex;align-items:center;gap:6px">
        <i data-lucide="shield-check"></i>
        Zuverlässigkeit
      </div>

      <div style="font-size:24px;font-weight:700;text-transform:capitalize">
        ${forecastData?.reliability ?? "unbekannt"}
      </div>

      <div class="small muted" style="margin-top:4px">
        Datenqualität
      </div>
    </div>

  </div>

  <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:16px">

    <span
      style="
        display:flex;
        align-items:center;
        gap:6px;
        padding:8px 12px;
        border-radius:999px;
        background:rgba(207,168,111,.10);
        font-size:13px;
        font-weight:600;
      "
    >
      <i data-lucide="activity"></i>

      Trend:
      ${
        forecastData?.trigger
          ? "Risiko erkannt"
          : "Wachstum"
      }
    </span>

    <span
      style="
        display:flex;
        align-items:center;
        gap:6px;
        padding:8px 12px;
        border-radius:999px;
        background:${
          forecastData?.trigger
            ? "rgba(220,80,80,.10)"
            : "rgba(47,133,90,.10)"
        };
        font-size:13px;
        font-weight:600;
      "
    >
      <i data-lucide="shield-check"></i>

      ${
        forecastData?.trigger?.message ||
        "Keine Risiken erkannt"
      }
    </span>

  </div>

</div>

` : ""}

`;

    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (err) {
    console.error("❌ AURA Revenue Fehler:", err);
  }

}



