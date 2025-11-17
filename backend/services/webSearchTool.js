import dotenv from 'dotenv';
// import { GoogleSearch } from '@langchain/community/tools';
// import { TavilySearchAPI } from '@langchain/community/tools'; // Try simple sub-path first
// import { GoogleCustomSearch } from '@langchain/community/tools'; // Try simple sub-path first

import * as community from '@langchain/community'; // Try Tavily from root again


dotenv.config();

/**
 * Searches the web using either Tavily or Google Custom Search API.
 * @param {string} query - The search query.
 * @param {number} numResults - The number of results to fetch.
 * @returns {Promise<{snippet: string, url: string}>} The best search result.
 */
export const webSearchTool = async (query, numResults = 3) => {
    
    // Prioritize Tavily if key is available
    if (process.env.TAVILY_API_KEY) {
        try {
            const tavily = new community.TavilySearchAPI(process.env.TAVILY_API_KEY);
            const rawResults = await tavily.call(query);
            
            // Tavily's output is a stringified JSON array of results
            const results = JSON.parse(rawResults); 

            if (results && results.length > 0) {
                // Return the snippet and URL of the first result
                return {
                    snippet: results[0].content,
                    url: results[0].url,
                };
            }
        } catch (e) {
            console.warn(`Tavily search failed: ${e.message}. Falling back to Google Custom Search.`);
        }
    }

    // Fallback to Google Custom Search API
    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX) {
        // try {
        //     // NOTE: Using GoogleCustomSearch, which aligns with @langchain/community
        //     const googleSearch = new GoogleCustomSearch({
        //         apiKey: process.env.GOOGLE_SEARCH_API_KEY,
        //         cx: process.env.GOOGLE_SEARCH_CX,
        //     });
            
        //     const results = await googleSearch.call(query);
            
        //     // Results is a stringified JSON of search items
        //     const parsedResults = JSON.parse(results);

        //     if (parsedResults.length > 0) {
        //         // Return the snippet and URL of the first result
        //         return {
        //             snippet: parsedResults[0].snippet,
        //             url: parsedResults[0].link,
        //         };
        //     }
        // } catch (e) {
        //     console.error(`Google Custom Search API failed: ${e.message}.`);
        // }
        return {
            snippet: 'Google Search functionality temporarily disabled due to module import errors. Using only Tavily.',
            url: '',
        };
    }

    // Final fallback
    return {
        snippet: 'Web search tool is currently unavailable or returned no results.',
        url: '',
    };
};