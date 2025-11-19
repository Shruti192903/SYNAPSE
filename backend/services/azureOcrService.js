// backend/services/azureOcrService.js
import 'dotenv/config';
import fetch from 'node-fetch'; // Using node-fetch as suggested by user's provided ocrExtractor.js

const AZURE_DI_ENDPOINT = process.env.AZURE_OCR_ENDPOINT;
const AZURE_DI_KEY = process.env.AZURE_OCR_KEY;

const API_VERSION = '2023-07-31';
// Using prebuilt-layout model for generic document analysis, ensuring tables are extracted.
const MODEL_ID = 'prebuilt-layout'; 

/**
 * Extracts structured content from a file's base64 content using Azure Document Intelligence REST API.
 * This function expects base64Content as input, aligning with the provided test file logic.
 * @param {string} base64Content The base64 encoded content of the file.
 * @param {string} fileName The name of the file.
 * @param {string} fileType The MIME type or simple type ('pdf', 'image').
 * @returns {Promise<string>} The extracted content, including structured lines and tables formatted as text.
 */
export async function azureExtract(base64Content, fileName, fileType) {
    if (!AZURE_DI_ENDPOINT || !AZURE_DI_KEY) {
        throw new Error(`Azure Document Intelligence is NOT configured. Please check .env file.`);
    }
    console.log(`Starting Azure Document Intelligence REST analysis for: ${fileName}`);

    const buffer = Buffer.from(base64Content, 'base64');
    const analyzeUrl = `${AZURE_DI_ENDPOINT}/formrecognizer/documentModels/${MODEL_ID}:analyze?api-version=${API_VERSION}`;

    const analyzeResponse = await fetch(analyzeUrl, {
        method: 'POST',
        headers: {
            "Ocp-Apim-Subscription-Key": AZURE_DI_KEY,
            "Content-Type": "application/octet-stream"
        },
        body: buffer
    });

    if (analyzeResponse.status !== 202) {
        const errorText = await analyzeResponse.text();
        throw new Error(`Document analysis failed: ${errorText}`);
    }

    const resultUrl = analyzeResponse.headers.get('Operation-Location');
    if (!resultUrl) throw new Error("No Operation-Location returned from Azure DI");

    let resultData;
    let retries = 0;
    const maxRetries = 15;
    const delay = 2000;

    // Polling logic
    do {
        await new Promise(resolve => setTimeout(resolve, delay));
        const pollResponse = await fetch(resultUrl, {
            headers: { "Ocp-Apim-Subscription-Key": AZURE_DI_KEY }
        });
        resultData = await pollResponse.json();
        retries++;
        if (retries > maxRetries) throw new Error("Max retries reached for Azure DI analysis");
    } while (resultData.status === 'running');

    if (resultData.status === 'failed') {
        throw new Error(`Azure DI analysis failed: ${resultData.error?.message}`);
    }
    
    // --- Format Output (Preserving table structure as markdown) ---
    let extractedContent = `--- Azure OCR Analysis for ${fileName} ---\n\n`;

    // 1. Process paragraphs/lines (as plain text)
    const lines = resultData.analyzeResult?.pages
        .flatMap(page => page.lines.map(line => line.content))
        .join('\n') || "No text detected";
    extractedContent += "### Extracted Text Content:\n" + lines + '\n\n';

    // 2. Process tables
    const tables = resultData.analyzeResult?.tables || [];
    if (tables.length > 0) {
        extractedContent += "### Extracted Table Data:\n";
        tables.forEach((table, index) => {
            const pageNumber = table.boundingRegions?.[0]?.pageNumber || 'Unknown Page';
            extractedContent += `\n--- Table ${index + 1} (Page ${pageNumber}) ---\n`;
            
            // Collect all unique column and row indices
            const columnIndices = Array.from(new Set(table.cells.map(c => c.columnIndex))).sort((a, b) => a - b);
            const rowIndices = Array.from(new Set(table.cells.map(c => c.rowIndex))).sort((a, b) => a - b);
            
            // Map cells for easy lookup
            const cellMap = new Map();
            table.cells.forEach(cell => {
                const key = `${cell.rowIndex},${cell.columnIndex}`;
                cellMap.set(key, cell.content.replace(/\s+/g, ' ').trim());
            });

            // Helper to get cell content
            const getCellContent = (row, col) => cellMap.get(`${row},${col}`) || '';

            // Header Row (assuming first row is header, common pattern)
            const headerRow = columnIndices.map(colIndex => getCellContent(rowIndices[0], colIndex) || `Col ${colIndex + 1}`).join(' | ');
            extractedContent += '| ' + headerRow + ' |\n';
            
            // Separator Row
            extractedContent += '|' + columnIndices.map(() => ' --- ').join('|') + '|\n';
            
            // Body Rows (start from the second row index if present)
            rowIndices.filter((_, idx) => idx > 0).forEach(rowIndex => {
                const rowText = columnIndices.map(colIndex => getCellContent(rowIndex, colIndex)).join(' | ');
                extractedContent += '| ' + rowText + ' |\n';
            });
        });
    }

    return extractedContent;
}