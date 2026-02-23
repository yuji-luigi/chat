import { create } from "zustand";
const initialStreamingMessage: ChatMessage = {
  from: "assistant",
  content: "",
  file: null,
  timestamp: Date.now(),
};
const createEmptyStreamingMessage = (): ChatMessage => ({
  from: "assistant",
  content: "",
  file: null,
  timestamp: Date.now(),
});

type ChatState = {
  messages: ChatMessage[];
  streamingMessage: ChatMessage;
  sendMessage: (message: string) => void;
  setStreamingMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
};
type ChatMessage = {
  from: "user" | "assistant";
  content: string;
  file: File | null;
  timestamp: number;
};

export const useChatStore = create<ChatState>((set) => {
  return {
    messages: [] as ChatMessage[],
    streamingMessage: initialStreamingMessage,
    setStreamingMessage: (message: ChatMessage) =>
      set({ streamingMessage: message }),
    sendMessage: (message: string) =>
      set((state) => {
        const hasStreamingContent =
          state.streamingMessage.content.trim().length > 0;
        const newMessage: ChatMessage = {
          from: "user",
          content: message,
          file: null,
          timestamp: Date.now(),
        };
        return {
          messages: hasStreamingContent
            ? [...state.messages, state.streamingMessage, newMessage]
            : [...state.messages, newMessage],
          streamingMessage: createEmptyStreamingMessage(),
        };
      }),
    clearMessages: () => set({ messages: [] }),
  };
});
export const useChat = () => {
  const store = useChatStore();
  return store;
};
