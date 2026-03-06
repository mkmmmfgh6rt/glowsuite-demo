// =======================================================
// 🧠 AURA Action Templates – Phase 5.2
// Liefert konkrete Umsetzungs-Texte
// =======================================================

export function getAuraActionTemplate(actionId, context = {}) {
  switch (actionId) {
    case "instagram_story":
      return {
        id: "instagram_story",
        title: "Instagram Story – Buchungen generieren",
        steps: [
          "Vorher/Nachher Bild oder kurzes Video aufnehmen",
          "Story-Text einfügen",
          "Call-to-Action setzen (DM oder Link)"
        ],
        content: {
          hook: "Heute habe ich noch freie Termine ✨",
          body:
            "Wenn du dir auch eine kleine Auszeit gönnen willst, schreib mir einfach 💬",
          cta: "👉 Jetzt Termin sichern per DM",
        },
      };

    case "whatsapp_broadcast":
      return {
        id: "whatsapp_broadcast",
        title: "WhatsApp Broadcast – Bestandskunden",
        steps: [
          "Broadcast-Liste auswählen",
          "Nachricht kopieren",
          "Absenden"
        ],
        content: {
          text:
            "Hallo 👋\nIch habe diese Woche noch freie Termine.\nWenn du Lust auf eine Behandlung hast, melde dich gern direkt bei mir 💆‍♀️✨",
        },
      };

    default:
      return null;
  }
}
