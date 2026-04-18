import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SkinProfile, SkinAnalysis, ChatSession, ChatMessage } from "./types";
import { generateId } from "./utils";

interface AppState {
  profile: SkinProfile | null;
  analysis: SkinAnalysis | null;
  chatSession: ChatSession | null;
  isAnalyzing: boolean;

  setProfile: (profile: SkinProfile) => void;
  updateProfile: (partial: Partial<SkinProfile>) => void;
  clearProfile: () => void;

  setAnalysis: (analysis: SkinAnalysis) => void;
  setIsAnalyzing: (v: boolean) => void;

  initChat: () => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearChat: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      analysis: null,
      chatSession: null,
      isAnalyzing: false,

      setProfile: (profile) => set({ profile }),
      updateProfile: (partial) => {
        const existing = get().profile;
        if (existing) {
          set({ profile: { ...existing, ...partial, updatedAt: new Date().toISOString() } });
        }
      },
      clearProfile: () => set({ profile: null, analysis: null }),

      setAnalysis: (analysis) => set({ analysis }),
      setIsAnalyzing: (v) => set({ isAnalyzing: v }),

      initChat: () => {
        if (!get().chatSession) {
          set({
            chatSession: {
              id: generateId(),
              profileId: get().profile?.id,
              messages: [
                {
                  id: generateId(),
                  role: "assistant",
                  content:
                    "Hi! I'm your Skintel AI advisor. I can help you understand your skin, decode ingredients, and find the best products for your concerns. What would you like to know?",
                  timestamp: new Date().toISOString(),
                },
              ],
              createdAt: new Date().toISOString(),
            },
          });
        }
      },

      addMessage: (message) => {
        const session = get().chatSession;
        if (!session) return;
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set({
          chatSession: {
            ...session,
            messages: [...session.messages, newMessage],
          },
        });
      },

      clearChat: () => set({ chatSession: null }),
    }),
    {
      name: "skintel-storage",
      partialize: (state) => ({
        profile: state.profile,
        analysis: state.analysis,
        chatSession: state.chatSession,
      }),
    }
  )
);
