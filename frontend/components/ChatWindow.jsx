'use client';

import { useState } from "react";
import { ChartRenderer } from "./ChartRenderer";

export const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
  console.log("SEND BUTTON CLICKED");

  if (!userInput.trim()) return;

  const userMsg = { role: "user", content: userInput };
  setMessages(prev => [...prev, userMsg]);

  setUserInput("");
  setLoading(true);

  console.log("Starting fetch to backend...");

  const res = await fetch("http://localhost:8000/agent/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMsg.content }),
  });

  console.log("Fetch response:", res);

  if (!res.body) {
    console.error("No response body returned!");
    setLoading(false);
    return;
  }

  console.log("Streaming started...");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let assistantBuffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    console.log("Chunk received:", chunk);

    const lines = chunk.split("\n").filter(Boolean);

    for (const line of lines) {
      let data;

      try {
        data = JSON.parse(line.replace("data:", "").trim());
      } catch (err) {
        console.warn("Non-JSON chunk:", line);
        continue;
      }

      if (data.type === "text") {
        assistantBuffer += data.data;

        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];

          if (last?.role === "assistant" && !last.chartJson) {
            updated[updated.length - 1] = {
              ...last,
              content: assistantBuffer,
            };
          } else {
            updated.push({
              role: "assistant",
              content: assistantBuffer,
            });
          }

          return updated;
        });
      }

      if (data.type === "chart") {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "📊 Chart Generated",
            chartJson: data.chartJson,
          }
        ]);
      }

      if (data.type === "done") {
        console.log("Streaming completed!");
        setLoading(false);
      }
    }
  }
};


    return (
        <div className="p-4 flex flex-col h-full gap-4">
            {/* CHAT MESSAGES */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
                        {msg.content && (
                            <div className="inline-block bg-secondary px-3 py-2 rounded-lg whitespace-pre-wrap">
                                {msg.content}
                            </div>
                        )}

                        {msg.chartJson && <ChartRenderer chartJson={msg.chartJson} />}
                    </div>
                ))}
            </div>

            {/* CHAT INPUT */}
            <div className="flex gap-2">
                <input
                    className="flex-1 border rounded-md px-3 py-2"
                    placeholder="Type your message..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="bg-primary text-white px-4 py-2 rounded-md"
                >
                    Send
                </button>
            </div>
        </div>
    );
};
