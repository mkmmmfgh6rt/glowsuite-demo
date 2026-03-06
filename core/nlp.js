// nlp.js – Service- & Befehlserkennung
import Fuse from "fuse.js";
import leven from "leven";

// ---------------------- Synonyme ----------------------
export const serviceSynonyms = {
  "Haarschnitt Damen": ["haarschnitt damen", "damenhaarschnitt", "friseur damen", "damen schnitt"],
  "Haarschnitt Herren": ["haarschnitt herren", "herrenhaarschnitt", "friseur herren", "herren schnitt"],
  "Maniküre": ["maniküre", "nägel", "nagelpflege", "nägel machen"],
  "Pediküre": ["pediküre", "füße", "fußpflege", "pedikuere"],
};

export const commandSynonyms = {
  cancel: ["stornieren", "absagen", "termin stornieren", "termin absagen"],
  reschedule: ["verschieben", "ändern", "umbuchen", "termin verschieben"],
  showBookings: ["meine termine", "zeige termine", "buchungen", "termine"],
  openingHours: ["öffnungszeiten", "wann offen", "zeiten"],
  greeting: ["hallo", "hi", "hey", "guten tag"],
  prices: ["preise", "kosten", "was kostet"],
  location: ["wo ist das studio", "adresse", "standort", "anschrift"],
};

// ---------------------- Fuzzy Suche ----------------------
const fuse = new Fuse(
  Object.entries(serviceSynonyms).flatMap(([service, synonyms]) =>
    synonyms.map((s) => ({ service, synonym: s }))
  ),
  { keys: ["synonym"], threshold: 0.4 }
);

// ---------------------- Erkennung ----------------------
export function detectCommand(msg, type) {
  const terms = commandSynonyms[type] || [];
  return terms.some((term) => msg.includes(term) || leven(msg, term) <= 2);
}

export function detectService(rawMsg) {
  let msg = (rawMsg || "").toLowerCase();
  msg = msg.replace(/harschnitt|hasrschnitt/gi, "haarschnitt");

  if (detectCommand(msg, "prices")) return null;

  const fuseResult = fuse.search(msg);
  if (fuseResult.length > 0) return fuseResult[0].item.service;

  for (const [service, synonyms] of Object.entries(serviceSynonyms)) {
    for (const syn of synonyms) {
      if (msg.includes(syn)) return service;
    }
  }

  if (msg.includes("haarschnitt")) return "Haarschnitt Unklar";
  return null;
}
