// backend/services/ocrPipeline.js

import { ocrExtractor } from "./ocrExtractor.js";
import { summarizeText } from "./summarizeText.js";

export async function runOcrPipeline({ base64, filePath }) {
  let buffer;

  if (filePath) {
    buffer = fs.readFileSync(filePath);
  } else {
    buffer = Buffer.from(base64, "base64");
  }

  const rawText = await ocrExtractor(buffer);

  let summary = "";
  await summarizeText(rawText, (type, token) => {
    summary += token;
  });

  return {
    rawText,
    summary,
  };
}
