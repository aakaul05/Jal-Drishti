import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboard } from "@/context/DashboardContext";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function generateResponse(query: string, predictionData: any, region: any): string {
  const q = query.toLowerCase();

  if (!region || !predictionData) {
    return "Please select a region from the sidebar first, and I'll be able to provide detailed groundwater analysis.";
  }

  if (q.includes("risk") || q.includes("danger") || q.includes("safe")) {
    const riskLabels: Record<string, string> = {
      low: "low risk — groundwater levels are stable",
      moderate: "moderate risk — some decline observed, monitoring recommended",
      high: "high risk — significant decline detected, intervention needed",
      severe: "severe risk — critical depletion rate, urgent action required",
    };
    return `**${region.name}** is currently classified as **${riskLabels[predictionData.riskLevel]}**.\n\nThe annual change rate is **${Math.abs(predictionData.annualChangeRate).toFixed(2)} ft/year** with model confidence (R²) of **${(predictionData.rSquared * 100).toFixed(1)}%**.`;
  }

  if (q.includes("depth") || q.includes("level") || q.includes("water")) {
    return `The current groundwater depth at **${region.name}** is **${predictionData.currentDepth.toFixed(1)} feet**. Historical data spans 10 years, with predictions extending 8 years forward.`;
  }

  if (q.includes("predict") || q.includes("future") || q.includes("forecast")) {
    const lastPredicted = predictionData.predictedData[predictionData.predictedData.length - 1];
    return `Based on our Random Forest model (R² = ${predictionData.rSquared.toFixed(3)}), the projected depth at **${region.name}** by **${lastPredicted.year}** is approximately **${lastPredicted.depth.toFixed(1)} ft** (95% CI: ${lastPredicted.lowerCI?.toFixed(1)}–${lastPredicted.upperCI?.toFixed(1)} ft).`;
  }

  if (q.includes("help") || q.includes("what can")) {
    return "I can help you with:\n\n- **Risk assessment** — Ask about risk levels\n- **Water depth** — Current groundwater depth\n- **Predictions** — Future water level forecasts\n- **Advisory** — Recommended actions\n\nTry asking: *\"What is my risk?\"* or *\"What's the predicted depth?\"*";
  }

  return `For **${region.name}**: Current depth is ${predictionData.currentDepth.toFixed(1)} ft with a ${predictionData.riskLevel} risk classification. The annual change rate is ${Math.abs(predictionData.annualChangeRate).toFixed(2)} ft/year. Ask me about specific risk details, predictions, or recommendations.`;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Welcome to **Jal-Drishti AI Assistant**. Select a region and ask me about groundwater risks, predictions, or recommendations." },
  ]);
  const [input, setInput] = useState("");
  const { predictionData, selectedRegion } = useDashboard();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    setTimeout(() => {
      const response = generateResponse(userMsg, predictionData, selectedRegion);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    }, 400 + Math.random() * 400);
  };

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg glow-accent flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] glass-strong rounded-2xl flex flex-col shadow-2xl animate-slide-up overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-foreground">Jal-Drishti AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-foreground"
                }`}>
                  {msg.content.split("\n").map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-1" : ""}>
                      {line.split(/\*\*(.*?)\*\*/).map((part, k) =>
                        k % 2 === 1 ? <strong key={k}>{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border/50">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about water levels..."
                className="flex-1 bg-secondary/50 border-border/40 text-sm"
              />
              <Button type="button" size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground shrink-0">
                <Mic className="h-4 w-4" />
              </Button>
              <Button type="submit" size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
