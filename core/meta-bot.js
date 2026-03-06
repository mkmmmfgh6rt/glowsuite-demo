// core/meta-bot.js – Meta/Facebook/Instagram Webhook-Handler (v1 stable)
import express from "express";
const router = express.Router();

// ====== Verifikation (Callback) ======
router.get("/meta-webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "beautyAgentSecure123";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Meta Webhook erfolgreich verifiziert!");
    res.status(200).send(challenge);
  } else {
    console.warn("❌ Meta Webhook Verifikation fehlgeschlagen.");
    res.sendStatus(403);
  }
});

// ====== Nachrichten / Events ======
router.post("/meta-webhook", express.json(), (req, res) => {
  console.log("📩 Meta Webhook-Ereignis:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

export default router;
