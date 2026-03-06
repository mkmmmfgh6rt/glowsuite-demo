// core/memory.js – Kunden-Memory Modul
import { db } from "./db.js";

// Tabelle für Kunden, falls noch nicht vorhanden
db.prepare(`
  CREATE TABLE IF NOT EXISTS customers (
    phone TEXT PRIMARY KEY,
    name TEXT,
    lastService TEXT,
    lastDate TEXT,
    visitCount INTEGER DEFAULT 0
  )
`).run();

// Kundendaten aktualisieren oder neu anlegen
export function updateCustomer({ name, phone, service, dateTime }) {
  const existing = db.prepare("SELECT * FROM customers WHERE phone = ?").get(phone);
  if (existing) {
    db.prepare(`
      UPDATE customers
      SET name = ?, lastService = ?, lastDate = ?, visitCount = visitCount + 1
      WHERE phone = ?
    `).run(name, service, dateTime, phone);
  } else {
    db.prepare(`
      INSERT INTO customers (phone, name, lastService, lastDate, visitCount)
      VALUES (?, ?, ?, ?, 1)
    `).run(phone, name, service, dateTime);
  }
}

// Alle Kunden abrufen (für Admin)
export function getAllCustomers() {
  return db.prepare("SELECT * FROM customers ORDER BY lastDate DESC").all();
}

// Kunden löschen (optional für DSGVO)
export function deleteCustomer(phone) {
  return db.prepare("DELETE FROM customers WHERE phone = ?").run(phone);
}
