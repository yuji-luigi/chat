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
  description: string;
};

type ChatState = {
  messages: ChatMessage[];
  streamingMessage: ChatMessage;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  reasoningStates: ReasoningState[];
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
});

export const useChatStore = create<ChatState>((set, get) => {
  return {
    messages: [],
    streamingMessage: createEmptyStreamingMessage(),
    reasoningStates: [],
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
    sendMessage: async (message: string) => {
      const myNewMessage: ChatMessage = {
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
            description: "",
          },
        ],
      });
      set((state) => ({
        messages: [...state.messages, myNewMessage],
      }));
      await send_message_to_server(message, (event: SSEEvent) => {
        if (event.type === "response.reasoning_summary_part.added") {
          set((state) => ({
            reasoningStates: [
              ...state.reasoningStates,
              {
                status: "reasoning",
                summary:
                  state.reasoningStates[state.reasoningStates.length - 1]
                    .summary + (event.data?.delta ?? ""),
                description: event.data?.delta ?? "",
              },
            ],
          }));
        }
        if (event.type === "response.reasoning_summary_text.delta") {
          // progressively append reasoning text so UI can update
          set((state) => ({
            reasoningStates: [
              // ...state.reasoningStates,
              {
                status: "reasoning",
                summary:
                  state.reasoningStates[state.reasoningStates.length - 1]
                    .summary + (event.data?.delta ?? ""),
                description: event.data?.delta ?? "",
              },
            ],
          }));
        }

        if (event.type === "response.reasoning_summary_text.done") {
          console.log("one reasoning summary text is done");
          const newReasoningStates = get().reasoningStates.map(
            (state, index) => {
              if (index === get().reasoningStates.length - 1) {
                return {
                  ...state,
                  status: "completed",
                } as ReasoningState;
              }
              return state;
            },
          );
          // mark reasoning as completed
          set(() => ({
            reasoningStates: newReasoningStates,
          }));
        }
        if (event.type === "response.output_text.delta") {
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
          console.log("response completed");
        }
      });

      set((state) => ({
        messages: [...state.messages, state.streamingMessage],
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
