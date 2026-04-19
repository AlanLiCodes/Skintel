"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { buildSystemPrompt } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { Send, User, Sparkles, RefreshCw, X, MessageCircle, Minus } from "lucide-react";

const SUGGESTIONS = [
  "What ingredients help with acne?",
  "Can I use retinol and vitamin C together?",
  "What's the difference between AHA and BHA?",
  "How do I build a basic routine?",
];

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return part.split("\n").map((line, j) => (
          <span key={`${i}-${j}`}>
            {j > 0 && <br />}
            {line}
          </span>
        ));
      })}
    </span>
  );
}

export default function ChatWidget() {
  const profile = useAppStore((s) => s.profile);
  const chatSession = useAppStore((s) => s.chatSession);
  const initChat = useAppStore((s) => s.initChat);
  const addMessage = useAppStore((s) => s.addMessage);
  const clearChat = useAppStore((s) => s.clearChat);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnread(0);
    }
  }, [chatSession?.messages, isOpen, isMinimized]);

  const open = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || isLoading) return;

    setInput("");
    addMessage({ role: "user", content });
    setIsLoading(true);

    if (!isOpen || isMinimized) setUnread((n) => n + 1);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          systemPrompt: buildSystemPrompt(profile ?? undefined),
          history: chatSession?.messages.slice(-10) ?? [],
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      addMessage({ role: "assistant", content: data.message });
      if (!isOpen || isMinimized) setUnread((n) => n + 1);
    } catch {
      addMessage({
        role: "assistant",
        content:
          "I'm in demo mode — add your `OPENAI_API_KEY` to `.env.local` to enable full AI responses.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const messages = chatSession?.messages ?? [];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {isOpen && (
        <div
          className={cn(
            "w-[360px] rounded-2xl border border-brand-200 bg-white overflow-hidden transition-all duration-200",
            isMinimized ? "h-0 opacity-0 pointer-events-none" : "opacity-100",
          )}
          style={{
            boxShadow: "0 8px 40px rgba(74,144,164,0.18), 0 2px 8px rgba(74,144,164,0.10)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-500 text-white">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-none">Skintel AI</div>
                <div className="text-xs text-brand-200 mt-0.5">
                  {profile ? `${profile.skinType} skin · personalized` : "General advisor"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { clearChat(); setTimeout(initChat, 50); }}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                title="New conversation"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                title="Minimize"
              >
                <Minus size={13} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                title="Close"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto px-3 py-3 space-y-3 bg-brand-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center",
                  msg.role === "assistant" ? "bg-brand-500" : "bg-brand-200"
                )}>
                  {msg.role === "assistant"
                    ? <Sparkles size={11} className="text-white" />
                    : <User size={11} className="text-brand-600" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-3 py-2 text-xs leading-relaxed max-w-[240px]",
                  msg.role === "assistant"
                    ? "bg-white border border-brand-100 text-brand-900"
                    : "bg-brand-500 text-white"
                )}>
                  <MessageContent content={msg.content} />
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={11} className="text-white" />
                </div>
                <div className="bg-white border border-brand-100 rounded-2xl px-3 py-2.5 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 border-t border-brand-100 bg-white">
              <div className="text-xs text-brand-400 mb-1.5 font-medium">Try asking</div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs border border-brand-200 text-brand-600 px-2.5 py-1 rounded-full hover:bg-brand-50 hover:border-brand-400 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-brand-100 px-3 py-2.5 bg-white">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about ingredients or routines..."
                rows={1}
                className="flex-1 resize-none text-xs border border-brand-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 max-h-20 overflow-auto bg-brand-50 placeholder:text-brand-300"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-8 h-8 bg-brand-500 text-white rounded-xl flex items-center justify-center hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={isOpen && !isMinimized ? () => setIsMinimized(true) : open}
        className="relative w-13 h-13 bg-brand-500 hover:bg-brand-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
        style={{
          width: 52,
          height: 52,
          boxShadow: "0 4px 20px rgba(74,144,164,0.35)",
        }}
        aria-label="Open AI chat"
      >
        {isOpen && !isMinimized
          ? <Minus size={20} />
          : <MessageCircle size={20} />}

        {/* Unread badge */}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
