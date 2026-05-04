import express from "express";
import { matchService } from "../../core/serviceMatcher.js";

const router = express.Router();

router.post("/", async (req, res) => {

    const { text } = req.body;

    try {

        const service = await matchService(text);

        res.json({ service });

    } catch (err) {

        console.error(err);
        res.status(500).json({ error: "Service Matching failed" });

    }

});

export default router;