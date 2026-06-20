import { useState, useRef, useEffect } from "react";
import { aiChat } from "../lib/ai";
import { Button } from "./ui";
import Icon from "./Icon";

export default function AIChat({ context }: { context?: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<{ role: string; content: string }[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm the Brixnode AI assistant. Ask me how to use any product, get listing help, or marketplace tips.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput("");
    setLoading(true);
    const sys = {
      role: "system",
      content:
        "You are the Brixnode AI assistant for a digital marketplace. Be concise and helpful." +
        (context ? " Context about the current item: " + context : ""),
    };
    const reply = await aiChat([sys, ...history]);
    setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-xl shadow-teal-500/30 transition hover:scale-105 md:bottom-6"
        aria-label="AI Assistant"
      >
        <Icon name={open ? "close" : "spark"} size={18} />
      </button>
      {open && (
        <div className="fixed bottom-32 right-4 z-50 flex h-[440px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[#21262d] bg-[#161b22] shadow-2xl md:bottom-20">
          <div className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3 text-white">
            <Icon name="spark" size={18} />
            <div>
              <p className="text-sm font-bold">Brixnode AI</p>
              <p className="text-[11px] opacity-80">Multi-provider assistant</p>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-teal-500 text-white"
                      : "bg-[#0d1117] text-[#e6edf3]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-[#0d1117] px-4 py-3">
                  <span className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#8b949e]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#8b949e] [animation-delay:.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#8b949e] [animation-delay:.3s]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-[#21262d] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything..."
              className="flex-1 rounded-xl border border-[#21262d] bg-[#0d1117] px-3 py-2 text-sm text-[#e6edf3] outline-none focus:border-teal-500/60"
            />
            <Button size="sm" onClick={send} disabled={loading}>
              Send
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
