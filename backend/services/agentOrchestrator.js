// import { detectIntent } from "./intentDetector.js";
// import { ocrExtractor } from "./ocrExtractor.js";
// import { summarizeText } from "./summarizeText.js";
// import { runOcrPipeline } from "./ocrPipeline.js";
// import { parseCSV } from "./csvParser.js";
// import { analyzeData } from "./dataAnalysis.js";

// export async function agentOrchestrator({ message, file, fileType, fileName, res }) {
// console.log("🔥 agentOrchestrator START");
// console.log("➡ Incoming message:", message);
// console.log("➡ File type:", fileType, " File name:", fileName);

// // ---- ENABLE STREAMING ----
// res.setHeader("Content-Type", "text/event-stream");
// res.setHeader("Cache-Control", "no-cache");
// res.setHeader("Connection", "keep-alive");
// if (res.flushHeaders) res.flushHeaders();

// function stream(type, data) {
// res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
// }

// try {
// // STEP 1 → Detect Intent
// stream("thinking", "Analyzing user request...");
// const intent = await detectIntent(message);

// if (intent === "summarize_pdf") {
//   try {
//     if (!file) throw new Error("No file passed from frontend");

//     stream("thinking", "Extracting PDF text...");
//     const pdfBuffer = Buffer.from(file, "base64");
//     const rawText = await ocrExtractor(pdfBuffer);

//     stream("thinking", "Generating summary...");
//     await summarizeText(rawText, (chunkType, token) => stream(chunkType, token));

//     stream("text", "✔ Summary complete.");
//   } catch (err) {
//     console.error("❌ PDF Summary Error:", err);
//     stream("error", `PDF summarization failed: ${err.message}`);
//   }

//   res.end();
//   return;
// }

// if (intent === "run_ocr") {
//   try {
//     if (!file) throw new Error("No file passed from frontend");

//     stream("thinking", "Running OCR pipeline...");
//     const ocrResult = await runOcrPipeline({ base64: file });

//     stream("text", "✔ OCR extraction completed.");
//     stream("text", ocrResult.summary || "No summary returned.");
//   } catch (err) {
//     console.error("❌ OCR Error:", err);
//     stream("error", `OCR Failed: ${err.message}`);
//   }

//   res.end();
//   return;
// }

// if (intent === "analyze_csv") {
//   try {
//     if (!file) throw new Error("No CSV received from frontend");

//     stream("thinking", "Parsing CSV...");
//     const csvBuffer = Buffer.from(file, "base64");
//     const parsed = await parseCSV(csvBuffer.toString());

//     stream("thinking", "Analyzing dataset...");
//     const analysis = await analyzeData(parsed.rows);

//     stream("text", analysis.summary);
//     stream("chart", analysis.chartData);
//     stream("text", "✔ CSV Analysis complete.");
//   } catch (err) {
//     console.error("❌ CSV Analysis Error:", err);
//     stream("error", `CSV analysis failed: ${err.message}`);
//   }

//   res.end();
//   return;
// }


// } catch (error) {
// console.error("❌ AgentOrchestrator Fatal Error:", error);
// stream("error", `Internal error: ${error.message}`);
// res.end();
// }
// }
// services/agentOrchestrator.js

export async function agentOrchestrator(req, res) {
  try {
    // Required for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const userMessage = req.body?.message || "";

    // Step 1: Start the stream
    sendChunk(res, "text", "Processing started...");

    // -------------- AI LOGIC START ---------------
    // Replace this with your LLM/agent logic.
    // The example below simulates 3 progressive outputs.

    await fakeDelay();
    sendChunk(res, "text", "Analyzing your input...");

    await fakeDelay();
    sendChunk(res, "text", `Received: ${userMessage}`);

    await fakeDelay();
    sendChunk(res, "text", "Answer generation complete.");
    // -------------- AI LOGIC END -----------------

    // Step 3: Close the stream
    sendChunk(res, "done", "Stream complete.");
    res.end();
  } catch (err) {
    console.error("Agent error:", err);

    sendChunk(res, "error", "Agent crashed.");
    res.end();
  }
}

// Helper: send one SSE chunk
function sendChunk(res, type, data) {
  res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
}

// Simulated delay (remove in production)
function fakeDelay(ms = 600) {
  return new Promise(r => setTimeout(r, ms));
}
