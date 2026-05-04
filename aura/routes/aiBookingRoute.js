import express from "express";
import { extractBookingDetails } from "../../core/openai.js";
import fs from "fs";

const router = express.Router();

router.post("/", async (req, res) => {

  const { message } = req.body;

  try {

    const services = JSON.parse(
      fs.readFileSync("./public/services.json", "utf8")
    ).map(s => s.name);

    const result = await extractBookingDetails(message, services);

    res.json(result || { service: null, dateTime: null });

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "AI extraction failed" });

  }

});

export default router;