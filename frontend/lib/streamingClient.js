// Client-side utility for handling the streaming POST request

/**
 * Fetches the streaming response from the Next.js API proxy route.
 * @param {FormData} formData - The payload including message and file.
 * @param {(chunk: {type: string, data: any}) => void} onChunk - Callback for each JSON Line chunk.
 * @returns {Promise<void>}
 */
export async function fetchAgentResponse(formData, onChunk) {
    const response = await fetch('/api/agent/route', {
        method: 'POST',
        body: formData,
        // Next.js handles the 'Content-Type: multipart/form-data' automatically from FormData
    });

    if (!response.ok) {
        let errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            errorText = errorJson.error || errorText;
        } catch (e) {
            // not a JSON error
        }
        throw new Error(`Agent request failed: ${errorText}`);
    }

    if (!response.body) {
        throw new Error("Received no response body from the agent.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
            // Process any remaining data in the buffer
            if (buffer.trim()) {
                try {
                    const finalChunk = JSON.parse(buffer);
                    onChunk(finalChunk);
                } catch (e) {
                    console.error("Failed to parse final buffer chunk:", buffer, e);
                }
            }
            break;
        }

        // Decode the chunk and add it to the buffer
        buffer += decoder.decode(value, { stream: true });

        // Process chunks line by line (JSON Lines format)
        let lastNewlineIndex;
        while ((lastNewlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.substring(0, lastNewlineIndex);
            buffer = buffer.substring(lastNewlineIndex + 1); // Move buffer past the newline

            if (line.trim()) {
                try {
                    const chunk = JSON.parse(line);
                    onChunk(chunk);
                    
                    // Break the loop if we receive the final signal
                    if (chunk.type === 'end' || chunk.type === 'error') {
                        reader.cancel(); // Stop reading further
                        return; 
                    }
                    
                } catch (e) {
                    console.error("Failed to parse JSON chunk:", line, e);
                    // Discard the corrupted line
                }
            }
        }
    }
}