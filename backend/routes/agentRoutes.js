// import express from "express";
// import { agentOrchestrator } from "../services/agentOrchestrator.js";

// const router = express.Router();

// router.post("/run", async (req, res) => {
//   try {
//     // Run your orchestrator / agent logic
//     await agentOrchestrator(req, res);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Agent execution failed" });
//   }
// });

// export default router;

import express from "express";
import { agentOrchestrator } from "../services/agentOrchestrator.js";

const router = express.Router();

router.post("/run", agentOrchestrator);

export default router;
