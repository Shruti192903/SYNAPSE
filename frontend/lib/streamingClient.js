const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function fetchAgentResponse(formData, onChunk) {
  try {
    const response = await fetch(`${backendUrl}/api/agent/chat`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Process response streaming or JSON here
    // Example for JSON response:
    const data = await response.json();
    // Call onChunk callback with meaningful data chunks as per your app logic
    onChunk({ type: 'text', data: data.extractedText || '' });
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
