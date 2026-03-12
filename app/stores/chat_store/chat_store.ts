import { create } from "zustand";
import { runChatSendMessage } from "./chat_stream_controller";

export type ChatMessage = {
  id: string;
  from: "user" | "assistant";
  content: string;
  file: File | null;
  timestamp: number;
  parent_message_id: string | null;
};

export type ReasoningState = {
  status: "idle" | "reasoning" | "completed";
  summary: string;
  description: string;
};

export type AvatarState = {
  phase: "idle" | "reasoning" | "speaking" | "done";
  /**
   * Model-agnostic expression channels from 0 to 1.
   * Avatar component decides how to map these channels to morph names.
   */
  expressionWeights: Record<string, number>;
  /**
   * Incremental streaming text used for lip-sync style speaking.
   */
  speakingText: string;
  /**
   * True after SSE stream completes; avatar can finish queued playback.
   */
  streamCompleted: boolean;
};

export type ChatState = {
  /** true until we get the streaming res from api. */
  isSendingMessage: boolean;
  messages: ChatMessage[];
  streamingMessage: ChatMessage;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  reasoningStates: ReasoningState[];
  avatarState: AvatarState;
  markAvatarSpeechDrained: () => void;
  setReasoningState: (cb: (state: ReasoningState) => ReasoningState) => void;
  setReasoningStates: (
    cb: (state: ReasoningState[]) => ReasoningState[],
  ) => void;
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptyStreamingMessage = (): ChatMessage => ({
  id: createId(),
  from: "assistant",
  content: "",
  file: null,
  timestamp: Date.now(),
  parent_message_id: null,
});

export const useChatStore = create<ChatState>((set, get) => {
  return {
    messages: [],
    isSendingMessage: false,
    streamingMessage: createEmptyStreamingMessage(),
    reasoningStates: [],
    avatarState: {
      phase: "idle",
      expressionWeights: { neutral: 1 },
      speakingText: "",
      streamCompleted: false,
    },
    markAvatarSpeechDrained: () =>
      set((state) => ({
        avatarState: {
          ...state.avatarState,
          phase: "idle",
          expressionWeights: {
            ...state.avatarState.expressionWeights,
            neutral: Math.max(
              state.avatarState.expressionWeights.neutral ?? 0,
              1,
            ),
          },
          speakingText: "",
          streamCompleted: false,
        },
      })),
    setReasoningState: (cb: (state: ReasoningState) => ReasoningState) =>
      set((state) => ({
        reasoningStates: [
          ...state.reasoningStates,
          cb(state.reasoningStates[state.reasoningStates.length - 1]),
        ],
      })),
    // for testing
    setReasoningStates: (cb: (state: ReasoningState[]) => ReasoningState[]) =>
      set((state) => ({
        reasoningStates: cb(state.reasoningStates),
      })),
    sendMessage: async (message: string) =>
      runChatSendMessage({
        message,
        set,
        get,
        createEmptyStreamingMessage,
      }),
    clearMessages: () => set({ messages: [] }),
  };
});

export const useChat = () => {
  const store = useChatStore();
  return store;
};
