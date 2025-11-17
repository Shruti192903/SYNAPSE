// Generic client-side fetch utility for non-streaming actions (e.g., sending email)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

/**
 * Simple utility to fetch data from the backend/API routes.
 * @param {string} endpoint - The API endpoint (e.g., '/api/agent/send-email').
 * @param {RequestInit} options - Standard fetch options.
 * @returns {Promise<any>} The parsed JSON response.
 */
export async function fetcher(endpoint, options) {
    // Check if the endpoint is an internal Next.js API route or an external backend call
    const isInternal = endpoint.startsWith('/api/');
    const url = isInternal ? endpoint : `${BACKEND_URL}${endpoint}`;

    const response = await fetch(url, options);

    if (!response.ok) {
        let errorData = await response.text();
        try {
            errorData = JSON.parse(errorData);
        } catch (e) {
            // not a JSON error
        }
        
        const errorMessage = typeof errorData === 'object' && errorData !== null && errorData.error 
            ? errorData.error 
            : `HTTP error! status: ${response.status}`;
            
        throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true, status: 204 };
    }

    return response.json();
}