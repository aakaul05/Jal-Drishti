import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/context/DashboardContext";
import { useLanguage } from "@/context/LanguageContext";
import type { MessageKey } from "@/i18n/translations";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: "assistant",
      content:
        "🌊 नमस्कार! I'm **Jal-Drishti AI**, your groundwater advisor.\n\nSelect a village from the sidebar and ask me anything about water levels, irrigation advice, or crop recommendations!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { predictionData, selectedRegion } = useDashboard();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      // Build the request with village context
      const body: Record<string, unknown> = {
        message: userMsg,
        chat_history: messages.slice(-6), // last 6 messages for context
        language: locale, // Send selected language to backend
      };

      if (selectedRegion) {
        body.village_name = selectedRegion.name;
        body.district = selectedRegion.district;
        body.block = selectedRegion.subDistrict;
      }

      if (predictionData) {
        body.historical_data = predictionData.historicalData;
        body.predicted_data = predictionData.predictedData;
        body.risk_level = predictionData.riskLevel;
        body.current_depth = predictionData.currentDepth;
        body.annual_change_rate = predictionData.annualChangeRate;
      }

      const resp = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: "Server error" }));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error: ${errorMsg}\n\nPlease try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center hover:scale-110 transition-all duration-300"
          aria-label={t("chatTitle" as MessageKey)}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[520px] glass-strong rounded-2xl flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-cyan-500/20">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground block leading-tight">Jal-Drishti AI</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  {selectedRegion ? `📍 ${selectedRegion.name}` : "Ready to help"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary/50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-br-sm"
                      : "bg-secondary/60 text-foreground border border-border/20 rounded-bl-sm"
                  }`}
                >
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-1.5" : ""}>
                      {line.split(/\*\*(.*?)\*\*/).map((part, k) =>
                        k % 2 === 1 ? (
                          <strong key={k} className="font-semibold">{part}</strong>
                        ) : (
                          part
                        )
                      )}
                    </p>
                  ))}
                </div>
                {msg.role === "user" && (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <div className="bg-secondary/60 rounded-xl px-4 py-3 border border-border/20 rounded-bl-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border/50 bg-background/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedRegion ? `Ask about ${selectedRegion.name}...` : "Select a village first..."}
                className="flex-1 bg-secondary/50 border-border/40 text-sm"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
