import { useState, useEffect, useRef } from "react";
import { aiApi } from "../api/resources";

const SUGGESTIONS = [
  "What are my top products?",
  "Why did sales decrease?",
  "What should I reorder?",
  "Generate executive report",
];

export default function AIAssistant() {
  const [status, setStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    aiApi.status().then(setStatus);
    aiApi.history().then((d) => setMessages(d.messages));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;

    setMessages((m) => [...m, { role: "user", message, id: `local-${Date.now()}` }]);
    setInput("");
    setSending(true);
    try {
      const result = await aiApi.ask(message);
      setMessages((m) => [...m, { role: "assistant", message: result.response, source: result.source, id: `local-${Date.now()}-a` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="ri-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>AI Assistant</h1>
          <p>Ask questions about your sales, products, and customers in plain language.</p>
        </div>
        {status && (
          <span className={`ri-badge ${status.available ? "ri-badge-green" : "ri-badge-muted"}`}>
            {status.available ? `Ollama connected (${status.models[0] || "model"})` : "Running in rule-based mode"}
          </span>
        )}
      </div>

      <div className="ri-card" style={{ display: "flex", flexDirection: "column", height: "60vh" }}>
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.5rem" }}>
          {messages.length === 0 && (
            <div className="ri-empty-state">
              <i className="bi bi-stars" />
              <h3>Ask me anything about your store</h3>
              <p>Try one of these to get started:</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginTop: "0.75rem" }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="ri-btn ri-btn-outline" style={{ fontSize: "0.82rem", padding: "0.5rem 0.9rem" }} onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  maxWidth: "75%",
                  padding: "0.75rem 1rem",
                  borderRadius: 16,
                  background: m.role === "user" ? "var(--ri-primary)" : "#f1f7f4",
                  color: m.role === "user" ? "#fff" : "var(--ri-text-dark)",
                  whiteSpace: "pre-wrap",
                  fontSize: "0.92rem",
                }}
              >
                {m.message}
              </div>
            </div>
          ))}
          {sending && <div style={{ color: "var(--ri-text-muted)", fontSize: "0.85rem" }}>Thinking...</div>}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", borderTop: "1px solid #eef4f1", paddingTop: "1rem" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your business..."
            style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: 999, border: "1.5px solid #d9e6e0" }}
          />
          <button className="ri-btn ri-btn-primary" disabled={sending || !input.trim()}>
            <i className="bi bi-send" />
          </button>
        </form>
      </div>
    </>
  );
}
