// =======================================================
// 🎯 AURA Campaign Generator
// erzeugt Marketingkampagnen aus AI Triggern
// =======================================================

export function generateAuraCampaign({ triggerType, segment, confidence }) {

  let campaign = {
    headline: "",
    message: "",
    offer: "",
    cta: "Jetzt Termin buchen",
    channels: ["whatsapp"],
    confidence
  };

  // ===================================================
  // LOW OCCUPANCY
  // ===================================================
  if (triggerType === "low_occupancy") {

    campaign.headline = "Heute noch freie Termine";

    campaign.message =
      "✨ Heute sind noch Termine frei.\n\n" +
      "Sichere dir jetzt einen spontanen Beauty Termin.";

    campaign.offer = "10% Rabatt auf freie Slots heute";

  }

  // ===================================================
  // REBOOKING
  // ===================================================
  else if (triggerType === "rebooking_reminder") {

    campaign.headline = "Zeit für deinen nächsten Termin";

    campaign.message =
      "💅 Es ist wieder Zeit für deinen Beauty Termin.\n\n" +
      "Buche jetzt deinen nächsten Besuch.";

    campaign.offer = "Treuebonus für Stammkunden";

  }

  // ===================================================
  // DEMAND SPIKE
  // ===================================================
  else if (triggerType === "demand_spike") {

    campaign.headline = "Beliebte Behandlung diese Woche";

    campaign.message =
      "🔥 Diese Behandlung ist aktuell besonders gefragt.\n\n" +
      "Sichere dir noch einen Termin.";

    campaign.offer = "Limitierte Termine verfügbar";

  }

  // ===================================================
  // REVENUE DROP
  // ===================================================
  else if (triggerType === "revenue_drop") {

    campaign.headline = "Beauty Special diese Woche";

    campaign.message =
      "✨ Diese Woche gibt es ein besonderes Angebot.\n\n" +
      "Perfekt für eine kleine Auszeit.";

    campaign.offer = "15% Aktionsrabatt";

  }

  // ===================================================
  // DEFAULT
  // ===================================================
  else {

    campaign.headline = "Neue Termine verfügbar";

    campaign.message =
      "✨ Buche jetzt deinen nächsten Termin.";

    campaign.offer = "Schnell Termin sichern";

  }

  return campaign;

}