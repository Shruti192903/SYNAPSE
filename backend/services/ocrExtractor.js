import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// --- FIX: READING USER'S EXACT ENVIRONMENT VARIABLE NAMES ---
const AZURE_DI_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
const AZURE_DI_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
// -------------------------------------------------------------

const API_VERSION = "2023-07-31";
const MODEL_ID = process.env.AZURE_DI_MODEL || "prebuilt-layout";

/**
 * Extracts text from an image/PDF buffer using Azure Document Intelligence (Consumption Model).
 */
export const ocrExtractor = async (base64Content) => {
    // This check will now pass if the user's ENV variables are set.
    if (!AZURE_DI_ENDPOINT || !AZURE_DI_KEY) {
        throw new Error("Azure Document Intelligence keys or endpoint are not configured. Please verify AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and KEY in .env");
    }
    const buffer = Buffer.from(base64Content, 'base64');

    try {
        const analyzeUrl = `${AZURE_DI_ENDPOINT}/formrecognizer/documentModels/${MODEL_ID}:analyze?api-version=${API_VERSION}`;
        const analyzeResponse = await fetch(analyzeUrl, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": AZURE_DI_KEY,
                "Content-Type": "application/octet-stream"
            },
            body: buffer,
        });

        if (analyzeResponse.status !== 202) {
             const errorText = await analyzeResponse.text();
             throw new Error(`Analysis failed: ${errorText || analyzeResponse.statusText}`);
        }

        const resultUrl = analyzeResponse.headers.get('Operation-Location');
        if (!resultUrl) throw new Error('No Operation-Location header found');

        let resultData;
        let retries = 0;
        const maxRetries = 15;
        const delay = 2000;

        do {
            await new Promise(resolve => setTimeout(resolve, delay));
            const pollResponse = await fetch(resultUrl, {
                headers: { "Ocp-Apim-Subscription-Key": AZURE_DI_KEY }
            });

            const clonedResponse = pollResponse.clone();
            resultData = await clonedResponse.json();

            if (++retries > maxRetries) throw new Error('Max retries reached');
        } while (resultData.status === 'running');

        if (resultData.status === 'failed') {
            throw new Error(`Analysis failed: ${resultData.error.message}`);
        }

        if (resultData.analyzeResult) {
            return resultData.analyzeResult.pages
                .flatMap(page => page.lines.map(line => line.content))
                .join('\n');
        }

        return "No text detected";
    } catch (error) {
        console.error("Document Intelligence Error:", error);
        throw new Error(`OCR Failed: ${error.message}`);
    }
};