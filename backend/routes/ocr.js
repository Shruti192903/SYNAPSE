import express from "express";
import { runOcrPipeline } from "../services/ocrPipeline.js";

const router = express.Router();

router.post("/ocr", async (req, res) => {
    const { base64 } = req.body;

    const result = await runOcrPipeline({ base64 });

    res.json(result);
});

export default router;
