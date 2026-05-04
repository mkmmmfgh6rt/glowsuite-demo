import express from "express";
import { answerBeautyQuestion } from "../../core/beautyChatAgent.js";

const router = express.Router();

router.post("/", async (req, res) => {

  const { message } = req.body;

  try {

    const reply = await answerBeautyQuestion(message);

    res.json({ reply });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "AI Antwort fehlgeschlagen" });

  }

});

export default router;