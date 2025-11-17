import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

const TOOL_NAMES = [
    'extract_pdf_text',
    'extract_csv_data',
    'run_ocr',
    'analyze_data',
    'generate_offer_letter',
    'verify_claims',
    'web_search',
    'send_email', // This is usually a final step, but can be a high-level intent
    'general_query',
];

const INTENT_SYSTEM_PROMPT = `
You are an intelligent Intent Detection and Tool Routing Agent. Your task is to analyze the user's message and the available file to determine the single, best next step (tool) and any required arguments.

Available Tools:
- **extract_pdf_text**: When the user provides a PDF file and needs its content extracted, summarized, or processed (e.g., "Analyze this PDF", "Summarize the report").
- **extract_csv_data**: When the user provides a CSV file, usually for analysis or charting (e.g., "Show trends in this CSV", "Analyze the data").
- **run_ocr**: When the user provides an image file (e.g., PNG, JPG) or an image-based PDF and asks for text extraction (e.g., "Read the text from this image").
- **analyze_data**: When the user's intent is to perform calculations, trend analysis, or generate a chart on already extracted data (usually from a CSV or a structured table from PDF). Trigger examples: "Show trends," "Compute growth rate."
- **generate_offer_letter**: When the user explicitly asks to create an offer letter, typically referencing a candidate profile/resume PDF (e.g., "Draft an offer letter for this candidate").
- **verify_claims**: When the user asks to fact-check, verify information, or compare internal data with external, real-world data, usually after uploading a document (e.g., "Verify the claims in this document").
- **web_search**: When the user needs current, external, or general knowledge not related to a specific document (e.g., "What is the current market rate for a software engineer in Berlin?").
- **send_email**: This is a direct action after an 'email_preview' widget is approved by the user. Do not select this as the initial tool.
- **general_query**: For simple conversational questions, summaries not requiring complex tool pipelines, or clarification requests.

Output must be a JSON object with 'tool' and 'argument'. The 'argument' should be the user's original message, or the specific text/data if known.

JSON FORMAT:
{
  "tool": "selected_tool_name",
  "argument": "The main query/instruction for the selected tool"
}
`;

/**
 * Detects the user's intent and selects the appropriate tool.
 * @param {string} message - User's chat message.
 * @param {string | null} fileType - Type of the uploaded file ('application/pdf', 'text/csv', 'image/jpeg', etc.).
 * @returns {Promise<{tool: string, argument: string}>} The determined tool and argument.
 */
export const intentDetector = async (message, fileType) => {
    let context = '';
    
    // Enrich the prompt with file context
    if (fileType) {
        context = `The user has provided a file of type: ${fileType}. The file is available for processing.`;
    } else {
        context = `No file has been provided by the user.`;
    }

    const fullPrompt = `${INTENT_SYSTEM_PROMPT}

    CONTEXT: ${context}
    
    USER MESSAGE: "${message}"`;

    try {
        const response = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "object",
                    properties: {
                        tool: {
                            type: "string",
                            enum: TOOL_NAMES,
                            description: "The name of the tool to be executed.",
                        },
                        argument: {
                            type: "string",
                            description: "The specific instruction or query passed to the selected tool.",
                        },
                    },
                    required: ["tool", "argument"],
                },
            },
        });

        // The response.text is a JSON string
        const result = JSON.parse(response.text);
        
        // Fallback or correction if the model somehow returns an invalid tool
        if (!TOOL_NAMES.includes(result.tool)) {
             console.warn(`Model returned invalid tool: ${result.tool}. Falling back to general_query.`);
             return { tool: 'general_query', argument: message };
        }
        
        return result;

    } catch (error) {
        console.error('Intent detection failed:', error);
        // Default fallback
        return { tool: 'general_query', argument: message };
    }
};