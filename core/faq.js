const STUDIO = {
  name: 'Beauty Lounge Mustermann',
  address: 'Hauptstraße 12, 12345 Musterstadt',
  phone: '+49 123 456789',
  email: 'kontakt@beautylounge.de',
  open: 'Mo–Sa 09:00–18:00',
};

const faqs = [
  { keywords: ['öffnungszeiten', 'geöffnet', 'wann offen'], answer: `Unsere Öffnungszeiten sind: ${STUDIO.open}.` },
  { keywords: ['adresse', 'wo', 'standort', 'weg'], answer: `Sie finden uns in der ${STUDIO.address}.` },
  { keywords: ['telefon', 'anrufen', 'telefonnummer'], answer: `Telefonisch erreichen Sie uns unter ${STUDIO.phone}.` },
  { keywords: ['kontakt', 'email', 'mail'], answer: `Sie können uns auch per E-Mail kontaktieren: ${STUDIO.email}.` },
  { keywords: ['gutschein', 'gutscheine'], answer: 'Ja, Gutscheine sind im Studio und online erhältlich.' },
  { keywords: ['storno', 'stornierung', 'absagen', 'absage'], answer: 'Absagen bis 24h vorher sind kostenfrei. Kurzfristig können Gebühren anfallen.' },
  { keywords: ['lack', 'gel', 'nägel', 'maniküre'], answer: 'Wir bieten klassische Maniküre, Shellac und Gel-Modellage an.' },
  { keywords: ['wimpern', 'wimpernverlängerung', 'lifting'], answer: 'Ja, Wimpernverlängerung (Classic/Volume) sowie Wimpernlifting sind buchbar.' },
  { keywords: ['massage', 'entspannung'], answer: 'Wir bieten verschiedene Entspannungsmassagen ab 30 Minuten an.' },
  { keywords: ['haare schneiden', 'haarschnitt', 'friseur'], answer: 'Ja, wir bieten Haarschnitte für Damen und Herren an.' },
  { keywords: ['färben', 'tönen', 'farbe'], answer: 'Haarfärben, Tönungen und Balayage sind möglich. Gern beraten wir Sie individuell.' },
  { keywords: ['waschen', 'föhnen', 'styling'], answer: 'Waschen, Föhnen und professionelles Styling (z. B. Hochsteckfrisuren) sind buchbar.' },
  { keywords: ['preise', 'kosten', 'kostenlos', 'tarif'], answer: 'Die Preise variieren je nach Behandlung. Gern nenne ich Ihnen den Preis für Ihre Wunschbehandlung.' },
  { keywords: ['dauer', 'wie lange', 'zeitaufwand'], answer: 'Das hängt von der Behandlung ab. Sagen Sie mir gern, was Sie interessiert.' },
  { keywords: ['parkplatz', 'parken'], answer: 'Kundenparkplätze sind vor dem Studio verfügbar.' },
  { keywords: ['zahlung', 'zahlen', 'karte', 'bar'], answer: 'Sie können bar oder mit EC-/Kreditkarte zahlen.' }
];

export function findFAQ(query) {
  const q = (query || '').toLowerCase();
  for (const entry of faqs) {
    if (entry.keywords.some(k => q.includes(k))) return entry.answer;
  }
  return 'Dazu habe ich leider keine Information. Möchten Sie, dass ich Sie zurückrufen lasse?';
}
