import express from "express";
import { runOcrPipeline } from "../services/ocrPipeline.js";

const router = express.Router();

router.post("/process", async (req, res) => {
    try {
        const { base64 } = req.body;

        const result = await runOcrPipeline({ base64 });

        return res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
