import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { webSearchTool } from './webSearchTool.js';

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Extracts verifiable claims from text, searches the web, and produces a verification table.
 * @param {string} documentText - The text from the document (e.g., PDF).
 * @param {string} userQuery - The specific verification instruction.
 * @param {function(string, any): void} onToken - Callback for streaming text tokens.
 * @returns {Promise<Array<Object>>} A table structure with verification results.
 */
export const claimVerifier = async (documentText, userQuery, onToken) => {
    
    // Step 1: Extract verifiable claims from the document
    onToken('thought', 'Analyzing document to extract verifiable claims...');
    const extractionPrompt = `Analyze the following document text and the user's query. Identify 3-5 specific, factual claims or data points that need external verification via a web search (e.g., market rates, specific statistics, current events).

    DOCUMENT TEXT:
    ---
    ${documentText}
    ---

    USER QUERY: "${userQuery}"

    Output a JSON array of strings, where each string is a clear, concise claim/query for web search.
    
    JSON FORMAT:
    ["Claim/Query 1", "Claim/Query 2", ...]
    `;

    let claims;
    try {
        const extractionResponse = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });
        claims = JSON.parse(extractionResponse.text);
        if (!Array.isArray(claims) || claims.length === 0) {
            throw new Error('No verifiable claims could be extracted.');
        }
        
    } catch (e) {
        onToken('text', `\n\n**Error:** Failed to extract claims from the document. Reason: ${e.message}`);
        throw new Error('Claim extraction failed.');
    }

    // Step 2: Perform web search for each claim
    onToken('thought', `\nExtracted ${claims.length} claims. Now searching the web for verification...`);
    
    const verificationResults = [];
    for (const claim of claims) {
        onToken('thought', `\n- Searching for: "${claim}"`);
        // Use webSearchTool to get the top result snippet
        const searchResult = await webSearchTool(claim, 1); 

        verificationResults.push({
            claim,
            externalResult: searchResult.snippet || 'No relevant external data found.',
            sourceUrl: searchResult.url || '',
        });
    }

    // Step 3: Use Gemini to compare and score confidence
    onToken('thought', '\nComparing external data with original document claims and scoring confidence...');

    const comparisonPrompt = `You are a Claim Verification Engine. You are provided with claims extracted from a document and external verification data from a web search.

    For each item, compare the 'claim' with the 'externalResult'.
    1. **Determine Confidence Score (0-100):** 100 if the claim is fully supported/identical; 50 if it's related but slightly different/outdated; 0 if it's directly contradicted.
    2. **Generate a Concise Summary:** Briefly explain the comparison result.

    DATA TO ANALYZE (JSON array):
    ---
    ${JSON.stringify(verificationResults, null, 2)}
    ---

    Output a JSON array of objects with the structure:
    [
      { "claim": "...", "externalResult": "...", "confidenceScore": 90, "summary": "Claim is strongly supported by the search result." }
    ]
    `;
    
    let finalTableData;
    try {
        const comparisonResponse = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: comparisonPrompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });
        finalTableData = JSON.parse(comparisonResponse.text);

    } catch (e) {
        onToken('text', `\n\n**Error:** Failed to perform final comparison and scoring. Reason: ${e.message}`);
        throw new Error('Comparison and scoring failed.');
    }
    
    onToken('thought', '\nVerification process complete. Preparing final table...');

    // Return the final structured data for the frontend to render as a table
    return finalTableData;
};