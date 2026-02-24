import { create } from "zustand";
import { send_message_to_server } from "../../features/chat/chat_api_service";
import type { SSEEvent } from "../../lib/stream_sse";
const initialStreamingMessage: ChatMessage = {
  id: new Date().getTime().toString(),
  from: "assistant",
  content: "",
  file: null,
  timestamp: Date.now(),
};
const createEmptyStreamingMessage = (): ChatMessage => ({
  id: new Date().getTime().toString(),
  from: "assistant",
  content: "",
  file: null,
  timestamp: Date.now(),
});

type ReasoningState = {
  status: "idle" | "reasoning" | "completed";
  summary: string;
};
type ChatState = {
  messages: ChatMessage[];
  streamingMessage: ChatMessage;
  sendMessage: (message: string) => Promise<void>;
  setStreamingMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  reasoningState: ReasoningState;
  setReasoningState: (state: ReasoningState) => void;
};
type ChatMessage = {
  id: string;
  from: "user" | "assistant";
  content: string;
  file: File | null;
  timestamp: number;
};

export const useChatStore = create<ChatState>((set, get) => {
  console.log(get);
  return {
    messages: [] as ChatMessage[],
    streamingMessage: initialStreamingMessage,
    reasoningState: {
      status: "idle",
      summary: "",
    },
    setStreamingMessage: (message: ChatMessage) =>
      set({ streamingMessage: message }),
    setReasoningState: (state: ReasoningState) =>
      set({ reasoningState: state }),
    sendMessage: async (message: string) => {
      const newMessage: ChatMessage = {
        id: "",
        from: "user",
        content: message,
        file: null,
        timestamp: Date.now(),
      };

      const hasStreamingContent =
        get().streamingMessage.content.trim().length > 0;

      // reset reasoning state for this request
      set({
        reasoningState: {
          status: "idle",
          summary: "",
        },
      });

      await send_message_to_server(message, (event: SSEEvent) => {
        if (event.type === "response.reasoning_summary_text.delta") {
          console.log("reasoning_summary_text.delta", event.data?.delta);
          // progressively append reasoning text so UI can update
          set((state) => ({
            reasoningState: {
              status: "reasoning",
              summary: state.reasoningState.summary + (event.data?.delta ?? ""),
            },
          }));
        }

        if (event.type === "response.reasoning_summary_text.done") {
          // mark reasoning as completed
          set((state) => ({
            reasoningState: {
              ...state.reasoningState,
              status: "completed",
            },
          }));
        }
        if (event.type === "response.output_text.delta") {
          console.log("output_text.delta\n", event.data?.delta);
          set((state) => ({
            streamingMessage: {
              ...state.streamingMessage,
              content:
                state.streamingMessage.content + (event.data?.delta ?? ""),
            },
          }));
        }
        if (event.type === "response.output_text.done") {
          set((state) => ({
            streamingMessage: {
              ...state.streamingMessage,
              content:
                state.streamingMessage.content + (event.data?.delta ?? ""),
              status: "completed",
            },
          }));
        }
        if (event.type === "response.completed") {
          set((state) => ({
            reasoningState: {
              ...state.reasoningState,
              status: "completed",
            },
          }));
        }
      });

      set((state) => ({
        messages: hasStreamingContent
          ? [...state.messages, state.streamingMessage, newMessage]
          : [...state.messages, newMessage],
        streamingMessage: createEmptyStreamingMessage(),
      }));
    },
    clearMessages: () => set({ messages: [] }),
  };
});
export const useChat = () => {
  const store = useChatStore();
  return store;
};
