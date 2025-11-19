// export async function streamAgentResponse(body, onChunk) {
//   const response = await fetch("/api/agent", {
//     method: "POST",
//     body: JSON.stringify(body),
//   });

//   const reader = response.body.getReader();
//   const decoder = new TextDecoder();

//   while (true) {
//     const { done, value } = await reader.read();
//     if (done) break;

//     const chunk = decoder.decode(value);
//     const lines = chunk.split("\n").filter(Boolean);

//     for (const line of lines) {
//       if (line.startsWith("data:")) {
//         const json = JSON.parse(line.replace("data:", "").trim());
//         onChunk(json);
//       }
//     }
//   }
// }


// frontend/lib/streamingClient.js

export async function streamAgentResponse(formData, onChunk) {
  const res = await fetch("http://localhost:8000/agent/run", {
    method: "POST",
    body: formData,
  });

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data:")) {
        try {
          const parsed = JSON.parse(line.replace("data:", "").trim());
          if (parsed.type === "text" && parsed.data.trim()) {
            accumulatedText += parsed.data;
          } else {
            onChunk(parsed);
          }
        } catch (err) {
          console.error("Chunk JSON parse error:", err);
        }
      }
    }
  }

  if (buffer.startsWith("data:")) {
    try {
      const parsed = JSON.parse(buffer.replace("data:", "").trim());
      if (parsed.type === "text" && parsed.data.trim()) {
        accumulatedText += parsed.data;
      }
    } catch (err) {
      console.error("Chunk JSON parse error:", err);
    }
  }

  onChunk({ type: "final_output", data: accumulatedText });
}