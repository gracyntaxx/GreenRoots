import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Globe,
  Leaf,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CHAT_SUGGESTIONS,
  INITIAL_GREETING,
  chatbotService,
  type ChatLanguage,
  type ChatMessage,
} from "@/services/chatbotService";

const LANGUAGE_LABELS: Record<ChatLanguage, { code: ChatLanguage; label: string; native: string }> = {
  en: { code: "en", label: "English", native: "English" },
  mr: { code: "mr", label: "Marathi", native: "मराठी" },
  hi: { code: "hi", label: "Hindi", native: "हिन्दी" },
};

const INPUT_PLACEHOLDERS: Record<ChatLanguage, string> = {
  en: "Ask about crop stubble, prices, hubs...",
  mr: "पिकांचे अवशेष, भाव, संकलन केंद्रांबद्दल विचारा...",
  hi: "पराली बिक्री, भाव, कलेक्शन सेंटर के बारे में पूछें...",
};

function renderFormattedMessage(text: string) {
  // Simple, safe Markdown parser for bold, bullet lists, and paragraphs
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-1.5" />;
    }

    // Bullet line
    if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.slice(2);
      return (
        <li key={idx} className="ml-3 list-disc text-[12px] leading-relaxed my-0.5">
          {parseInlineMarkdown(content)}
        </li>
      );
    }

    // Numbered line: "1. "
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start gap-1.5 text-[12px] leading-relaxed my-0.5">
          <span className="font-bold text-forest shrink-0">{numMatch[1]}.</span>
          <span>{parseInlineMarkdown(numMatch[2])}</span>
        </div>
      );
    }

    // Regular paragraph
    return (
      <p key={idx} className="text-[12px] leading-relaxed my-1">
        {parseInlineMarkdown(trimmed)}
      </p>
    );
  });
}

function parseInlineMarkdown(text: string) {
  // Replace **bold** with <strong>
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-ink dark:text-portal-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function ChatbotWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<ChatLanguage>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize first greeting when chat widget mounts or language changes
  useEffect(() => {
    setMessages([
      {
        id: "msg_init",
        sender: "bot",
        text: INITIAL_GREETING[language],
        timestamp: new Date(),
      },
    ]);
  }, [language]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
      setHasUnread(false);
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const raw = textToSend ?? inputValue;
    const query = raw.trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue("");
    setLoading(true);

    try {
      const response = await chatbotService.sendMessage(query, messages, language);
      const botMessage: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: "bot",
        text: response.text,
        timestamp: new Date(),
        action: response.action,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: "bot",
          text:
            language === "mr"
              ? "क्षमस्व, उत्तर देण्यास तांत्रिक अडचण आली. कृपया थोड्या वेळाने पुन्हा विचारा."
              : language === "hi"
              ? "क्षमा करें, उत्तर देने में समस्या आई। कृपया थोड़ी देर बाद पुनः प्रयास करें।"
              : "I apologize, I encountered a temporary connection issue. Please ask again shortly.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `msg_init_${Date.now()}`,
        sender: "bot",
        text: INITIAL_GREETING[language],
        timestamp: new Date(),
      },
    ]);
  };

  const currentSuggestions = CHAT_SUGGESTIONS[language] || CHAT_SUGGESTIONS.en;

  return (
    <div className="no-print">
      {/* 1. Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          {/* Helper Speech Bubble */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 shadow-lg border border-forest/20 text-xs font-bold text-forest dark:bg-portal-surface dark:text-growth backdrop-blur-md animate-bounce">
            <Sparkles className="h-3.5 w-3.5 text-forest" />
            <span>Ask GreenRoots AI</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-forest to-[#1A633E] text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-forest/30 active:scale-95 focus:outline-none focus:ring-4 focus:ring-forest/30"
            aria-label="Open AI Chatbot"
          >
            {/* Pulse Ring */}
            <span className="absolute -inset-1 rounded-full bg-forest/30 animate-ping opacity-60 pointer-events-none" />

            <div className="relative flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              <Bot className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-growth" />
            </div>

            {hasUnread && (
              <span className="absolute top-0 right-0 h-3.5 w-3.5 rounded-full bg-terracotta border-2 border-white" />
            )}
          </button>
        </div>
      )}

      {/* 2. Floating Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col w-[94vw] sm:w-[410px] h-[580px] max-h-[88vh] rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden dark:border-portal-line dark:bg-portal-surface transition-all duration-200 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-forest to-[#134D30] text-white select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white shadow-inner">
                <Leaf className="h-5 w-5 text-growth" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-forest" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-bold text-sm tracking-tight">EcoBot AI</h3>
                  <span className="rounded bg-white/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white">
                    Live
                  </span>
                </div>
                <p className="text-[10px] text-white/80 font-medium">Multilingual Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language Switcher Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangMenu((v) => !v)}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-white hover:bg-white/20 transition-colors"
                  title="Switch Language (English / मराठी / हिन्दी)"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{LANGUAGE_LABELS[language].native}</span>
                  <ChevronDown className="h-3 w-3 opacity-80" />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-1.5 w-32 rounded-xl border border-line bg-surface p-1 shadow-xl text-ink dark:border-portal-line dark:bg-portal-surface z-50">
                    {(Object.keys(LANGUAGE_LABELS) as ChatLanguage[]).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setLanguage(code);
                          setShowLangMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors",
                          language === code
                            ? "bg-forest/10 text-forest font-bold dark:bg-growth/15 dark:text-growth"
                            : "hover:bg-canvas text-muted hover:text-ink"
                        )}
                      >
                        <span>{LANGUAGE_LABELS[code].native}</span>
                        {language === code && <Check className="h-3.5 w-3.5 text-forest dark:text-growth" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset Conversation */}
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                title="Restart Conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                title="Close Chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-canvas/40 dark:bg-portal-bg/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[88%]",
                  msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 shadow-sm text-xs",
                    msg.sender === "user"
                      ? "bg-forest text-white rounded-br-none"
                      : "bg-surface border border-line text-ink rounded-bl-none dark:border-portal-line dark:bg-portal-surface dark:text-portal-ink"
                  )}
                >
                  {msg.sender === "bot" ? renderFormattedMessage(msg.text) : msg.text}

                  {/* Interactive Action Button if present in bot response */}
                  {msg.action && (
                    <div className="mt-2.5 pt-2 border-t border-line/60 dark:border-portal-line/60">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs font-bold py-1 h-7 bg-forest hover:bg-forest-dark text-white flex items-center justify-center gap-1 shadow-sm"
                        onClick={() => navigate(msg.action!.url)}
                      >
                        <span>{msg.action.label}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-muted font-mono mt-0.5 px-1">
                  {new Intl.DateTimeFormat("default", { hour: "numeric", minute: "2-digit" }).format(msg.timestamp)}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-surface border border-line px-3.5 py-2.5 max-w-[120px] dark:border-portal-line dark:bg-portal-surface">
                <span className="h-2 w-2 rounded-full bg-forest animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-forest animate-pulse [animation-delay:200ms]" />
                <span className="h-2 w-2 rounded-full bg-forest animate-pulse [animation-delay:400ms]" />
                <span className="text-[10px] text-muted ml-1">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="border-t border-line/70 bg-surface px-3 py-2 dark:border-portal-line/70 dark:bg-portal-surface">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-forest" /> Quick Questions:
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {currentSuggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(item.query)}
                  className="shrink-0 rounded-full border border-line bg-canvas px-2.5 py-1 text-[11px] font-medium text-ink hover:border-forest hover:text-forest hover:bg-meadow/40 transition-colors disabled:opacity-50 dark:border-portal-line dark:bg-portal-bg dark:text-portal-ink dark:hover:border-growth"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-line bg-surface p-2.5 dark:border-portal-line dark:bg-portal-surface"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={INPUT_PLACEHOLDERS[language]}
              disabled={loading}
              className="flex-1 min-h-[38px] rounded-xl border border-line bg-canvas px-3 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest dark:border-portal-line dark:bg-portal-bg dark:text-portal-ink"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputValue.trim() || loading}
              className="h-[38px] w-[38px] p-0 shrink-0 rounded-xl bg-forest hover:bg-forest/90 text-white flex items-center justify-center shadow-sm disabled:opacity-40"
              aria-label="Send message"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>

          {/* Bottom Micro Disclaimer */}
          <div className="bg-canvas px-3 py-1 text-center text-[9px] text-muted border-t border-line/60 dark:bg-portal-bg dark:border-portal-line/60">
            Powered by GreenRoots AI · 100% Verified Escrow
          </div>
        </div>
      )}
    </div>
  );
}
