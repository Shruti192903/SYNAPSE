import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Extracts candidate details from text and generates an offer letter in HTML format.
 * @param {string} resumeText - The extracted text from the candidate's resume/PDF.
 * @param {string} userQuery - The specific instruction (e.g., "Software Engineer, $120k").
 * @returns {Promise<{candidate: {name: string, email: string}, html: string}>} The extracted candidate details and the generated HTML letter.
 */
export const offerLetterGenerator = async (resumeText, userQuery) => {
    
    // Step 1: Extract candidate name and email
    const extractionPrompt = `From the following resume text, identify and extract the candidate's full name and their primary email address. Return the result in a JSON object.

    RESUME TEXT:
    ---
    ${resumeText}
    ---
    
    JSON FORMAT:
    {
        "name": "Candidate Full Name",
        "email": "candidate@example.com",
        "jobTitle": "Suggested Job Title (e.g., Software Engineer)",
        "salary": "Suggested Salary (e.g., $120,000)"
    }
    `;

    let candidateDetails;
    try {
        const extractionResponse = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: extractionPrompt }] }],
            config: {
                responseMimeType: "application/json",
            },
        });
        candidateDetails = JSON.parse(extractionResponse.text);

    } catch (e) {
        console.error('Candidate detail extraction failed:', e);
        throw new Error('Could not extract candidate name and email from the document.');
    }
    
    // Fallback/refinement for job title and salary from user query
    const { name, email, jobTitle: extractedTitle, salary: extractedSalary } = candidateDetails;

    // Use a simple regex or a separate LLM call to get details from user query
    const titleMatch = userQuery.match(/(Software Engineer|Data Scientist|Product Manager|Analyst)/i)?.[0] || extractedTitle || 'Associate';
    const salaryMatch = userQuery.match(/(\$\d{1,3}(,\d{3})*)/)?.[0] || extractedSalary || '$80,000';
    
    const finalJobTitle = titleMatch;
    const finalSalary = salaryMatch;
    
    if (!name || !email) {
        throw new Error('Could not find both candidate name and email to generate the letter.');
    }

    // Step 2: Generate the Offer Letter HTML
    const htmlPrompt = `You are an expert HR documentation generator. Draft a professional, standard offer letter in clean, responsive HTML format. The HTML must include all necessary tags (<html>, <body>, <head> with a <title>). Use simple inline styles for email compatibility.

    Use the following details:
    - Candidate Name: ${name}
    - Position: ${finalJobTitle}
    - Annual Salary: ${finalSalary}
    - Start Date: January 1, 2026 (or next month's 1st)
    - Company: Synapse Corp
    - Sender: Agent Synapse

    The letter should be professional, welcoming, and clearly state the compensation, start date, and acceptance deadline (e.g., 7 days).

    Output ONLY the complete HTML code.`;

    let html;
    try {
        const htmlResponse = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: htmlPrompt }] }],
        });
        html = htmlResponse.text.trim().replace(/^```html\s*|```\s*$/g, ''); // Clean up markdown code fences

    } catch (e) {
        console.error('HTML generation failed:', e);
        throw new Error('Failed to generate the offer letter HTML.');
    }
    
    return {
        candidate: { name, email, jobTitle: finalJobTitle, salary: finalSalary },
        html
    };
};