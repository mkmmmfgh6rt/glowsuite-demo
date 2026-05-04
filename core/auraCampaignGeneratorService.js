// =======================================================
// 🚀 AURA Campaign Generator Service – Phase 11
// erzeugt Marketing Kampagnen aus AURA Triggern
// =======================================================

export function generateAuraCampaign({ triggerType, customerKey, context = {} }) {

  if (!triggerType) {
    return null;
  }

  switch (triggerType) {

    // ===================================================
    // VIP LOYALTY
    // ===================================================
    case "vip_loyalty":

      return {
        campaignType: "vip_bonus",
        headline: "VIP Bonus",
        channel: "whatsapp",
        message:
          "Hallo! Als VIP Kundin möchten wir dir einen kleinen Bonus geben. Buche deinen nächsten Termin und erhalte eine kleine Überraschung im Studio 💫",
        cta: "Jetzt Termin buchen",
        priority: 1
      };


    // ===================================================
    // REACTIVATION
    // ===================================================
    case "reactivation_campaign":

      return {
        campaignType: "reactivation",
        headline: "Wir vermissen dich 💛",
        channel: "whatsapp",
        message:
          "Hi! Wir haben gesehen, dass dein letzter Termin schon etwas her ist. Wenn du möchtest, haben wir diese Woche noch freie Plätze für dich ✨",
        cta: "Termin sichern",
        priority: 2
      };


    // ===================================================
    // FREE SLOT BROADCAST
    // ===================================================
    case "free_slot_broadcast":

      return {
        campaignType: "broadcast",
        headline: "Freie Termine heute",
        channel: "whatsapp",
        message:
          "Heute sind kurzfristig Termine frei geworden. Wenn du spontan Zeit hast, kannst du dir jetzt noch einen Platz sichern 💅",
        cta: "Termin buchen",
        priority: 1
      };


    // ===================================================
    // REVIEW REQUEST
    // ===================================================
    case "review_request":

      return {
        campaignType: "review",
        headline: "Bewertung",
        channel: "whatsapp",
        message:
          "Danke für deinen Besuch bei uns! Wenn dir dein Termin gefallen hat, würden wir uns sehr über eine kurze Google Bewertung freuen ⭐",
        cta: "Bewertung schreiben",
        priority: 3
      };


    default:
      return null;
  }
}