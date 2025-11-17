import { intentDetector } from './intentDetector.js';
import { pdfTextExtractor } from './pdfTextExtractor.js';
import { csvParser } from './csvParser.js';
import { ocrExtractor } from './ocrExtractor.js';
import { summarizeText } from './summarizeText.js';
import { dataAnalysis } from './dataAnalysis.js';
import { offerLetterGenerator } from './offerLetterGenerator.js';
import { claimVerifier } from './claimVerifier.js';
import { webSearchTool } from './webSearchTool.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// State for the agentic loop
const agentState = {
    messages: [], // History (simplified, not fully implemented here)
    scratchpad: {
        extractedText: null, // Text content from the last file
        extractedData: null, // Structured data (e.g., CSV rows/schema)
    },
    action: null,
    data: null,
};

/**
 * The main agent orchestration loop (simplified ReAct/State Machine).
 * @param {{message: string, file: string | null, fileType: string | null, fileName: string | null}} payload 
 * @param {function(string, any): void} onToken 
 */
export const agentOrchestrator = async (payload, onToken) => {
    const { message, file, fileType } = payload;
    
    // 1. Detect Intent/Tool
    onToken('thought', 'Analyzing user intent...');
    const { tool, argument } = await intentDetector(message, fileType);
    agentState.action = tool;

    // A. Tool Execution/Workflow Logic
    try {
        let textResult = null;
        let dataResult = null;
        let finalResponse = null;

        onToken('thought', `\nIntent detected: **${tool}**. Executing primary action...`);

        switch (tool) {
            case 'extract_pdf_text':
            case 'run_ocr':
                if (!file) throw new Error('PDF/Image file is required for extraction.');
                textResult = (fileType === 'application/pdf' && tool !== 'run_ocr')
                    ? await pdfTextExtractor(file)
                    : await ocrExtractor(file);
                
                agentState.scratchpad.extractedText = textResult;
                
                // Automatically summarize the extracted text
                onToken('thought', '\nExtraction complete. Generating summary...');
                const summary = await summarizeText(textResult, (type, data) => onToken(type, data));
                onToken('final_output', summary); // Signal end of stream/output

                break;

            case 'extract_csv_data':
                if (!file || fileType !== 'text/csv') throw new Error('CSV file is required for data parsing.');
                
                const { rows, schema } = await csvParser(file);
                agentState.scratchpad.extractedData = { rows, schema };
                
                // Directly call analysis or summarize the load
                onToken('thought', `\nCSV parsed. Found ${rows.length} records and ${schema.length} fields. Preparing analysis...`);
                
                // Pass directly to data analysis logic here
                const { summary: analysisSummary, chartJson } = await dataAnalysis(rows, schema, argument, (type, data) => onToken(type, data));
                onToken('chart', chartJson);
                onToken('final_output', analysisSummary);

            
            case 'analyze_data':
                // This is the correct, standalone analyze_data case.
                if (!agentState.scratchpad.extractedData) {
                     throw new Error('No dataset found in the workspace. Please upload a CSV or PDF first.');
                }
                const dataToAnalyze = agentState.scratchpad.extractedData.rows;
                const schemaToAnalyze = agentState.scratchpad.extractedData.schema;

                onToken('thought', '\nDataset loaded. Running requested analysis...');
                // The variable declarations are now unique within this single case
                const { summary: chartSummary, chartJson: finalChart } = await dataAnalysis(dataToAnalyze, schemaToAnalyze, argument, (type, data) => onToken(type, data));
                onToken('chart', finalChart);
                onToken('final_output', chartSummary);
                
            case 'generate_offer_letter':
                if (!agentState.scratchpad.extractedText) {
                    throw new Error('Resume text is not available. Please upload a PDF resume first.');
                }
                onToken('thought', '\nGenerating offer letter draft...');
                const { candidate, html } = await offerLetterGenerator(agentState.scratchpad.extractedText, argument);
                
                // Store candidate data for the email action
                agentState.scratchpad.offerData = { to: candidate.email, subject: `Job Offer: ${candidate.jobTitle}`, html };
                
                onToken('email_preview', {
                    to: candidate.email,
                    subject: `Job Offer: ${candidate.jobTitle}`,
                    html: html,
                    message: `Offer letter drafted for **${candidate.name}** at **${candidate.salary}**. Review the HTML preview below and click 'Send Email' to finalize.`,
                });
                
                break;

            case 'verify_claims':
                if (!agentState.scratchpad.extractedText) {
                    throw new Error('Document text is not available for claim verification. Please upload a PDF first.');
                }
                onToken('thought', '\nStarting claim verification process...');
                const verificationTable = await claimVerifier(agentState.scratchpad.extractedText, argument, (type, data) => onToken(type, data));
                
                onToken('table', {
                    caption: 'Claim Verification Results',
                    headers: ['Claim', 'External Result', 'Confidence (%)', 'Summary'],
                    rows: verificationTable.map(row => [row.claim, row.externalResult, row.confidenceScore, row.summary]),
                });
                
                break;
                
            case 'web_search':
                onToken('thought', `\nSearching the web for: "${argument}"`);
                const result = await webSearchTool(argument, 5);
                
                const finalSearchText = `**Web Search Result for:** *${argument}*\n\n> ${result.snippet}\n\n**Source:** [${result.url}](${result.url})`;
                
                onToken('text', finalSearchText);
                onToken('final_output', finalSearchText); // Final stream token

                break;

            case 'general_query':
            default:
                onToken('thought', 'Executing general conversational response...');
                // Fallback to a simple Gemini call for general chat
                const stream = await model.generateContentStream({
                    contents: [{ role: "user", parts: [{ text: message }] }],
                });

                for await (const chunk of stream) {
                    const token = chunk.text;
                    if (token) {
                        onToken('text', token);
                    }
                }
                break;
        }

    } catch (error) {
        console.error(`Tool ${tool} failed:`, error);
        // Stream the error back to the user
        onToken('error', `An error occurred during **${tool}**: ${error.message}`);
    } finally {
        onToken('end', {}); // Always send 'end' signal
    }
};