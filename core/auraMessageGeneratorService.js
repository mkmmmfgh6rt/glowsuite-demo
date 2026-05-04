// =======================================================
// 🤖 AURA Message Generator Service – Phase 11
// erzeugt personalisierte Marketing Nachrichten
// =======================================================

export function generateAuraMessage({
  triggerType,
  customerName,
  serviceName,
  studioName
}) {

  const name = customerName || "Hallo";
  const service = serviceName || "Termin";
  const studio = studioName || "unser Studio";

  switch (triggerType) {

    // ==========================================
    // Reaktivierung
    // ==========================================
    case "reactivation_campaign":

      return `Hi ${name} 😊

dein letzter ${service} Termin ist schon etwas her.

Diese Woche haben wir noch freie Slots bei ${studio}.

Möchtest du dir wieder einen Termin sichern?`;


    // ==========================================
    // VIP Kampagne
    // ==========================================
    case "vip_loyalty":

      return `Hi ${name} ✨

als VIP Kundin bei ${studio} möchten wir dir einen kleinen Bonus anbieten.

Buche deinen nächsten ${service} Termin und erhalte eine Überraschung im Studio 💛`;


    // ==========================================
    // Freie Termine Broadcast
    // ==========================================
    case "free_slot_broadcast":

      return `Hi ${name} 😊

heute sind kurzfristig Termine für ${service} frei geworden.

Wenn du spontan Zeit hast, kannst du dir jetzt einen Platz sichern.`;


    // ==========================================
    // Review Anfrage
    // ==========================================
    case "review_request":

      return `Hi ${name} ⭐

vielen Dank für deinen letzten Besuch bei ${studio}.

Wenn dir dein ${service} Termin gefallen hat, würden wir uns sehr über eine kurze Google Bewertung freuen.`;


    default:

      return `Hi ${name} 😊

wir haben aktuell freie Termine bei ${studio}.

Möchtest du dir einen Termin sichern?`;
  }

}