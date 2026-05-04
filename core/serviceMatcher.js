import fs from "fs";

export async function matchService(userText) {

  const services = JSON.parse(
    fs.readFileSync("./public/services.json", "utf8")
  );

  const text = userText.toLowerCase();

  const synonyms = {
    nägel: "Maniküre",
    nagel: "Maniküre",
    wimpern: "Wimpernlifting",
    wimper: "Wimpernlifting",
    haare: "Haarschnitt Damen",
    haar: "Haarschnitt Damen",
    gesicht: "Gesichtsbehandlung"
  };

  for (const key in synonyms) {

    if (text.includes(key)) {

      const serviceName = synonyms[key];

      return {
        name: serviceName,
        ...services[serviceName]
      };

    }

  }

  for (const name in services) {

    if (text.includes(name.toLowerCase())) {

      return {
        name,
        ...services[name]
      };

    }

  }

  return null;
}