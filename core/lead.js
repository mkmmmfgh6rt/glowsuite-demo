// lead.js
import fs from "fs";
const FILE = "./leads.json";

function loadLeads() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function saveLeads(leads) {
  fs.writeFileSync(FILE, JSON.stringify(leads, null, 2));
}

export function addOrUpdateLead({ phone, name, status = "new", bookingId = null }) {
  let leads = loadLeads();
  let lead = leads.find(l => l.phone === phone);

  if (lead) {
    // Update bestehender Lead
    lead.status = status || lead.status;
    if (bookingId) lead.bookingId = bookingId;
  } else {
    // Neuer Lead
    lead = { id: "L" + Date.now(), phone, name, status, bookingId };
    leads.push(lead);
  }

  saveLeads(leads);
  return lead;
}

export function getLeads() {
  return loadLeads();
}
