"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { buildSystemPrompt } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { Send, User, Sparkles, RefreshCw } from "lucide-react";

const SUGGESTIONS = [
  "What ingredients should I use for acne?",
  "Can I use retinol and vitamin C together?",
  "What's the difference between AHA and BHA?",
  "How do I build a basic routine from scratch?",
  "What foods help with skin inflammation?",
  "How long until I see results from retinol?",
];

export default function ChatPage() {
  const profile = useAppStore((s) => s.profile);
  const chatSession = useAppStore((s) => s.chatSession);
  const initChat = useAppStore((s) => s.initChat);
  const addMessage = useAppStore((s) => s.addMessage);
  const clearChat = useAppStore((s) => s.clearChat);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatSession?.messages]);

  const sendMessage = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || isLoading) return;

    setInput("");
    addMessage({ role: "user", content });
    setIsLoading(true);

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
    } catch {
      addMessage({
        role: "assistant",
        content:
          "I'm currently running in demo mode without an OpenAI API key. To enable full AI responses, add your `OPENAI_API_KEY` to `.env.local`. In the meantime, try browsing your **personalized analysis** or the **ingredient library**.",
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
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="border-b border-stone-200 px-4 sm:px-6 py-3 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-stone-900 rounded-full flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-stone-900">Skintel AI</div>
            <div className="text-xs text-stone-400">
              {profile ? `Personalized for your ${profile.skinType} skin` : "General skincare advisor"}
            </div>
          </div>
        </div>
        <button
          onClick={() => { clearChat(); setTimeout(initChat, 50); }}
          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition-colors"
          title="New conversation"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-3xl",
              msg.role === "user" ? "ml-auto flex-row-reverse" : ""
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold",
              msg.role === "assistant"
                ? "bg-stone-900 text-white"
                : "bg-stone-200 text-stone-700"
            )}>
              {msg.role === "assistant" ? <Sparkles size={13} /> : <User size={13} />}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-xl",
                msg.role === "assistant"
                  ? "bg-white border border-stone-200 text-stone-800"
                  : "bg-stone-900 text-white"
              )}
            >
              <MessageContent content={msg.content} />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl">
            <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
              <Sparkles size={13} className="text-white" />
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3 flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions (only when empty) */}
      {messages.length <= 1 && (
        <div className="px-4 sm:px-6 pb-3">
          <div className="text-xs text-stone-400 mb-2 font-medium">Try asking</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-full hover:bg-stone-50 hover:border-stone-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-stone-200 px-4 sm:px-6 py-3 bg-white">
        <div className="flex gap-2 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about ingredients, routines, products..."
            rows={1}
            className="flex-1 resize-none text-sm border border-stone-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-300 max-h-32 overflow-auto"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 bg-stone-900 text-white rounded-xl flex items-center justify-center hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-xs text-stone-400 text-center mt-2">
          AI advice is educational. Consult a dermatologist for medical concerns.
        </p>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-ish rendering for bold and line breaks
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
