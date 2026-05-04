import fs from "fs";
import path from "path";
import QRCode from "qrcode";

const dataPath = path.join(process.cwd(), "data", "loyalty_cards.json");

export async function addVisit({ tenant, phone }) {

  let cards = [];

  if (fs.existsSync(dataPath)) {
    cards = JSON.parse(fs.readFileSync(dataPath));
  }

  let card = cards.find(c => c.phone === phone);

  if (!card) {
    card = {
      phone,
      visits: 0,
      points: 0,
      tenant
    };

    cards.push(card);
  }

  card.visits += 1;
  card.points += 10;

  fs.writeFileSync(dataPath, JSON.stringify(cards, null, 2));
}

export async function generateCustomerQR(phone) {

  const url = `https://yourdomain.de/loyalty/scan/${phone}`;

  const qr = await QRCode.toDataURL(url);

  return {
    url,
    qr
  };
}
export function getCustomerCard(phone) {

  if (!fs.existsSync(dataPath)) {
    return null;
  }

  const cards = JSON.parse(fs.readFileSync(dataPath));

  return cards.find(c => c.phone === phone) || null;

}