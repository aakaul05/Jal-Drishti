import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/context/DashboardContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatMessage } from "@/i18n/translations";
import type { MessageKey } from "@/i18n/translations";
import type { PredictionResult, Region } from "@/data/mockData";

/** Max user prompts kept for context (current message included when passed in). */
const CHAT_PROMPT_MEMORY = 10;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function riskPhrase(level: string, t: (k: MessageKey) => string): string {
  const map: Record<string, MessageKey> = {
    low: "chatRiskLow",
    moderate: "chatRiskModerate",
    high: "chatRiskHigh",
    severe: "chatRiskSevere",
  };
  return t(map[level] ?? "chatRiskModerate");
}

function matchesRisk(s: string): boolean {
  return (
    s.includes("risk") ||
    s.includes("danger") ||
    s.includes("safe") ||
    s.includes("जोखिम") ||
    s.includes("खतरा")
  );
}

function matchesDepth(s: string): boolean {
  return (
    s.includes("depth") ||
    s.includes("level") ||
    s.includes("water") ||
    s.includes("पातळी") ||
    s.includes("गहराई") ||
    s.includes("खोल")
  );
}

function matchesPredict(s: string): boolean {
  return (
    s.includes("predict") ||
    s.includes("future") ||
    s.includes("forecast") ||
    s.includes("अंदाज") ||
    s.includes("पूर्वानुमान") ||
    s.includes("भविष्य")
  );
}

function matchesHelp(s: string): boolean {
  return s.includes("help") || s.includes("what can") || s.includes("मदद") || s.includes("क्या");
}

type Topic = "risk" | "depth" | "predict" | "help";

/** Newest user prompts first: find the latest message that clearly mentions a topic. */
function lastResolvedTopic(priorUserPrompts: string[]): Topic | null {
  for (let i = priorUserPrompts.length - 1; i >= 0; i--) {
    const s = priorUserPrompts[i].toLowerCase();
    if (matchesRisk(s)) return "risk";
    if (matchesDepth(s)) return "depth";
    if (matchesPredict(s)) return "predict";
    if (matchesHelp(s)) return "help";
  }
  return null;
}

/**
 * Short / affirmative replies inherit intent from earlier prompts in this chat.
 */
function isFollowUpQuery(text: string): boolean {
  const t = text.trim();
  if (t.length === 0) return false;
  if (
    /^(yes|yep|yeah|ok|okay|sure|more|details?|tell me more|go on|and\?|what else|same|repeat|again|और|हाँ|ठीक|फिर|चालू)$/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    t.length <= 22 &&
    !/\b(risk|depth|water|predict|forecast|help|level|advisory|जोखिम|गहराई|पातळी|अंदाज|भूजल)/i.test(
      t
    )
  ) {
    return true;
  }
  return false;
}

function replyForTopic(
  topic: Topic,
  region: Region,
  pd: PredictionResult,
  t: (k: MessageKey) => string
): string {
  switch (topic) {
    case "risk": {
      const phrase = riskPhrase(pd.riskLevel, t);
      return `**${region.name}** — ${phrase}\n\n${t("annualChange")}: **${Math.abs(pd.annualChangeRate).toFixed(2)}** ft/yr · R² **${(pd.rSquared * 100).toFixed(1)}%**`;
    }
    case "depth":
      return formatMessage(t("chatDepthReply"), {
        region: region.name,
        depth: pd.currentDepth.toFixed(1),
      });
    case "predict": {
      const last = pd.predictedData[pd.predictedData.length - 1];
      return formatMessage(t("chatPredictReply"), {
        r2: pd.rSquared.toFixed(3),
        region: region.name,
        year: last.year,
        depth: last.depth.toFixed(1),
        lo: last.lowerCI?.toFixed(1) ?? "—",
        hi: last.upperCI?.toFixed(1) ?? "—",
      });
    }
    case "help":
      return t("chatHelpBody");
  }
}

function generateResponse(
  query: string,
  predictionData: PredictionResult | null,
  region: Region | null,
  t: (k: MessageKey) => string,
  /** Last up to 10 user prompts, oldest→newest, including `query` as the last item. */
  recentUserPrompts: string[]
): string {
  const q = query.toLowerCase();

  if (!region || !predictionData) {
    return t("chatSelectRegionFirst");
  }

  const pd = predictionData;

  const priorOnly = recentUserPrompts.slice(0, -1);
  const followUp = isFollowUpQuery(query) && recentUserPrompts.length >= 2;
  const inherited = followUp ? lastResolvedTopic(priorOnly) : null;

  if (followUp && inherited) {
    return replyForTopic(inherited, region, pd, t);
  }

  if (matchesRisk(q)) return replyForTopic("risk", region, pd, t);
  if (matchesDepth(q)) return replyForTopic("depth", region, pd, t);
  if (matchesPredict(q)) return replyForTopic("predict", region, pd, t);
  if (matchesHelp(q)) return replyForTopic("help", region, pd, t);

  if (followUp && !inherited) {
    return t("chatHelpBody");
  }

  return formatMessage(t("chatDefaultReply"), {
    region: region.name,
    depth: pd.currentDepth.toFixed(1),
    risk: riskPhrase(pd.riskLevel, t),
    rate: Math.abs(pd.annualChangeRate).toFixed(2),
  });
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const { t, locale } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { role: "assistant", content: t("chatWelcome") },
  ]);
  const [input, setInput] = useState("");
  const { predictionData, selectedRegion } = useDashboard();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ role: "assistant", content: t("chatWelcome") }]);
  }, [locale, t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");

    setMessages((prev) => {
      const withUser = [...prev, { role: "user" as const, content: userMsg }];
      const recentUserPrompts = withUser
        .filter((m): m is ChatMessage & { role: "user" } => m.role === "user")
        .map((m) => m.content)
        .slice(-CHAT_PROMPT_MEMORY);

      const delay = 400 + Math.random() * 400;
      window.setTimeout(() => {
        const response = generateResponse(
          userMsg,
          predictionData,
          selectedRegion,
          t,
          recentUserPrompts
        );
        setMessages((p) => [...p, { role: "assistant", content: response }]);
      }, delay);

      return withUser;
    });
  };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg glow-accent flex items-center justify-center hover:scale-105 transition-transform"
          aria-label={t("chatTitle")}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[500px] glass-strong rounded-2xl flex flex-col shadow-2xl animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-semibold text-foreground">{t("chatTitle")}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/60 text-foreground"
                  }`}
                >
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

          <div className="px-3 py-3 border-t border-border/50">
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
                placeholder={t("chatPlaceholder")}
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
