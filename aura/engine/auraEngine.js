// engine/auraEngine.js
import OpenAI from "openai";
import { auraPersonality } from "../config/auraPersonality.js";

/* =====================================================
   INIT
===================================================== */

const hasKey = !!process.env.OPENAI_API_KEY;

const client = hasKey
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (hasKey) {
  console.log("🤖 A.U.R.A läuft im GPT-Modus");
} else {
  console.log("🤖 A.U.R.A läuft im Offline-Demo-Modus");
}

/* =====================================================
   🔐 AURA MEMORY (H3.3 – NEU)
   Minimal & bewusst nicht persistent
===================================================== */

const auraMemory = {
  lastFocus: null,
  lastUpdated: null,
};

function rememberFocus(focusId) {
  auraMemory.lastFocus = focusId;
  auraMemory.lastUpdated = Date.now();
}

/* =====================================================
   AGENT OUTPUT HELPER
===================================================== */

function agentResponse(reply, agent = null) {
  return agent ? { reply, agent } : { reply };
}

/* =====================================================
   OFFLINE CHAT (UNVERÄNDERT)
===================================================== */

function offlineChat(message) {
  const text = message.toLowerCase();

  if (text.includes("coach")) {
    return agentResponse(
      "A.U.R.A (Offline):\n\n" +
        "Coaching ist ein Premium-Business – Menschen kaufen Transformation, nicht Zeit.\n\n" +
        "Aktuell funktionieren am besten:\n" +
        "• Reels mit klarer Vorher/Nachher-Story\n" +
        "• ehrliches Storytelling aus deinem Alltag\n" +
        "• ein klarer Call-to-Action (DM oder Link)\n\n" +
        "👉 Geht es dir gerade mehr um **Reichweite** oder **Anfragen**?",
      {
        intent: "growth_strategy",
        confidence: 0.55,
        nextAction: "clarify_goal",
        tags: ["coaching", "reach", "leads"],
      }
    );
  }

  if (text.includes("nagel")) {
    return agentResponse(
      "A.U.R.A (Offline):\n\n" +
        "Nagelstudios leben von Wiederbuchungen und festen Stammkunden.\n\n" +
        "👉 Was ist aktuell dein größtes Problem: **Neukunden** oder **Auslastung**?",
      {
        intent: "calendar_optimization",
        confidence: 0.6,
        nextAction: "identify_bottleneck",
        tags: ["nails", "retention", "utilization"],
      }
    );
  }

  if (text.includes("kosmetik")) {
    return agentResponse(
      "A.U.R.A (Offline):\n\n" +
        "Kosmetikstudios wachsen über sichtbare Ergebnisse.\n\n" +
        "👉 Willst du aktuell eher **mehr Neukunden** oder **mehr Umsatz pro Kunde**?",
      {
        intent: "client_acquisition",
        confidence: 0.65,
        nextAction: "select_growth_focus",
        tags: ["cosmetics", "acquisition", "upsell"],
      }
    );
  }

  if (text.includes("haar") || text.includes("friseur")) {
    return agentResponse(
      "A.U.R.A (Offline):\n\n" +
        "Friseurbetriebe wachsen über Struktur.\n\n" +
        "👉 Was ist dir gerade wichtiger: **Umsatz steigern** oder **Kalender füllen**?",
      {
        intent: "revenue_optimization",
        confidence: 0.6,
        nextAction: "prioritize_revenue_vs_utilization",
        tags: ["hair", "upsell", "pricing"],
      }
    );
  }

  return agentResponse(
    "A.U.R.A (Offline):\n\n" +
      "Sag mir bitte:\n" +
      "• welche Dienstleistung du anbietest\n" +
      "• was dein Hauptziel ist\n\n" +
      "👉 Dann gebe ich dir die nächste klare Empfehlung.",
    {
      intent: "clarification",
      confidence: 0.4,
      nextAction: "request_context",
      tags: ["generic"],
    }
  );
}

/* =====================================================
   ANALYSE (H3.3 – FOKUS-LOGIK)
===================================================== */

function offlineAnalyze() {
  const focusAreas = [
    {
      id: "top_services",
      emoji: "📈",
      message: "Optimierung deiner Top-Services lohnt sich.",
      importance: "hoch",
    },
    {
      id: "off_peak",
      emoji: "⏰",
      message: "Randzeiten gezielt mit Aktionen füllen.",
      importance: "mittel",
    },
    {
      id: "reactivation",
      emoji: "💌",
      message: "Stammkunden-Reaktivierung bringt schnellen Umsatz.",
      importance: "hoch",
      action: {
        type: "campaign",
        goal: "customer_reactivation",
      },
    },
  ];

  // 🔐 Wichtigsten Fokus merken (bewusst NUR EINER)
  rememberFocus("customer_reactivation");

  return { focusAreas };
}


/* =====================================================
   INSIGHTS & KAMPAGNE
===================================================== */

function offlineInsights(data = {}) {
  return {
    kpis: {
      totalRevenue: data.umsatzGesamt ?? null,
      totalCustomers: data.kundenGesamt ?? null,
      utilizationRate: data.auslastungProzent ?? null,
    },
    risks: ["Zu wenig strukturierte Daten für tiefe Analyse."],
    opportunities: [
      "Mehr Wiederbuchungen",
      "Gezielte Aktionen an schwachen Tagen",
    ],
  };
}

function offlineCampaign(goal) {
  return {
    goal,
    headline: "Wir vermissen dich ✨",
    channelSuggestions: ["Instagram", "WhatsApp"],
    offerIdeas: ["10 % Rabatt", "Upgrade beim nächsten Termin"],
    context: {
      triggeredBy: auraMemory.lastFocus,
      generatedAt: new Date().toISOString(),
    },
  };
}

/* =====================================================
   EXPORTS (UNVERÄNDERT)
===================================================== */

export function auraAnalyze(data = {}) {
  return offlineAnalyze(data);
}

export function auraInsights(data = {}) {
  return offlineInsights(data);
}

export function auraCreateCampaign(goal, data = {}) {
  return offlineCampaign(goal, data);
}

/* =====================================================
   GPT CHAT
===================================================== */

export async function auraChat(message, context = {}) {
  if (!hasKey) return offlineChat(message);

  const prompt = `
${auraPersonality}

User sagt:
"${message}"

Kontext:
${JSON.stringify(context, null, 2)}

Antworte klar, strukturiert und beratend.
`;

  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return agentResponse(res.choices[0].message.content);
}
