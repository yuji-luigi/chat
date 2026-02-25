import { create } from "zustand";
import { send_message_to_server } from "../../features/chat/chat_api_service";
import type { SSEEvent } from "../../lib/stream_sse";

type ChatMessage = {
  id: string;
  from: "user" | "assistant";
  content: string;
  file: File | null;
  timestamp: number;
};

type ReasoningState = {
  status: "idle" | "reasoning" | "completed";
  summary: string;
  delta: string;
};

type ChatState = {
  messages: ChatMessage[];
  streamingMessage: ChatMessage;
  sendMessage: (message: string) => Promise<void>;
  setStreamingMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  reasoningStates: ReasoningState[];
  setReasoningState: (state: ReasoningState) => void;
};

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptyStreamingMessage = (): ChatMessage => ({
  id: createId(),
  from: "assistant",
  content: "",
  file: null,
  timestamp: Date.now(),
});

export const useChatStore = create<ChatState>((set, get) => {
  return {
    messages: [],
    streamingMessage: createEmptyStreamingMessage(),
    reasoningStates: [],
    setStreamingMessage: (message: ChatMessage) =>
      set({ streamingMessage: message }),
    setReasoningState: (state: ReasoningState) =>
      set({ reasoningStates: [...get().reasoningStates, state] }),
    sendMessage: async (message: string) => {
      const newMessage: ChatMessage = {
        id: createId(),
        from: "user",
        content: message,
        file: null,
        timestamp: Date.now(),
      };

      // reset reasoning state for this request
      set({
        reasoningStates: [
          ...get().reasoningStates,
          {
            status: "idle",
            summary: "",
            delta: "",
          },
        ],
      });

      await send_message_to_server(message, (event: SSEEvent) => {
        if (event.type === "response.reasoning_summary_text.delta") {
          // progressively append reasoning text so UI can update
          set((state) => ({
            reasoningStates: [
              ...state.reasoningStates,
              {
                status: "reasoning",
                summary:
                  state.reasoningStates[state.reasoningStates.length - 1]
                    .summary + (event.data?.delta ?? ""),
                delta: event.data?.delta ?? "",
              },
            ],
          }));
        }

        if (event.type === "response.reasoning_summary_text.done") {
          console.log("one reasoning summary text is done");
          // mark reasoning as completed
          set((state) => ({
            reasoningStates: [
              ...state.reasoningStates,
              {
                status: "completed",
                summary:
                  state.reasoningStates[state.reasoningStates.length - 1]
                    .summary,
                delta: "",
              },
            ],
          }));
        }
        if (event.type === "response.output_text.delta") {
          console.log("reasoning completed. generating answer...");
          console.log("output_text.delta\n", event.data?.delta);
          set((state) => ({
            reasoningStates: [
              ...state.reasoningStates,
              {
                status: "completed",
                summary:
                  state.reasoningStates[state.reasoningStates.length - 1]
                    .summary,
                delta: "",
              },
            ],
          }));

          set((state) => ({
            streamingMessage: {
              ...state.streamingMessage,
              content:
                state.streamingMessage.content + (event.data?.delta ?? ""),
            },
          }));
        }
        if (event.type === "response.output_text.done") {
          // no-op for now; streamingMessage has no "status" field
        }
        if (event.type === "response.completed") {
          set((state) => ({
            reasoningStates: [...state.reasoningStates],
          }));
        }
      });

      set((state) => ({
        messages: [...state.messages, state.streamingMessage, newMessage],
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
