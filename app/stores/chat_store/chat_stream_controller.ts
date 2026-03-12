import { send_message_to_server } from "../../features/chat/chat_api_service";
import type { SSEEvent } from "../../lib/stream_sse";
import type { ChatMessage, ChatState } from "./chat_store";

type ChatStateUpdater =
  | Partial<ChatState>
  | ((state: ChatState) => Partial<ChatState>);

type SetChatState = (updater: ChatStateUpdater) => void;
type GetChatState = () => ChatState;

type RunChatSendMessageArgs = {
  message: string;
  set: SetChatState;
  get: GetChatState;
  createEmptyStreamingMessage: () => ChatMessage;
};

export const runChatSendMessage = async ({
  message,
  set,
  get,
  createEmptyStreamingMessage,
}: RunChatSendMessageArgs): Promise<void> => {
  set({ isSendingMessage: true });
  const lastMessage = get().messages.at(-1);

  const myNewMessage: ChatMessage = {
    id: "",
    from: "user",
    content: message,
    file: null,
    timestamp: Date.now(),
    parent_message_id: lastMessage?.id ?? null,
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
    avatarState: {
      phase: "idle",
      expressionWeights: { neutral: 1 },
      speakingText: "",
      streamCompleted: false,
    },
  });
  set((state) => ({
    messages: [...state.messages, myNewMessage],
  }));

  await send_message_to_server(myNewMessage, (event: SSEEvent) => {
    if (event.type === "response.reasoning_summary_part.added") {
      set((state) => ({
        isSendingMessage: false,
        avatarState: {
          ...state.avatarState,
          phase: "reasoning",
          expressionWeights: { thinking: 0.6, neutral: 0.2 },
          streamCompleted: false,
        },
      }));
      set((state) => ({
        reasoningStates: [
          ...state.reasoningStates,
          {
            status: "reasoning",
            summary:
              state.reasoningStates[state.reasoningStates.length - 1].summary +
              (event.data?.delta ?? ""),
            description: event.data?.delta ?? "",
          },
        ],
      }));
    }

    if (event.type === "response.reasoning_summary_text.delta") {
      // progressively append reasoning text so UI can update
      set((state) => ({
        avatarState: {
          ...state.avatarState,
          phase: "reasoning",
          expressionWeights: { thinking: 0.6, neutral: 0.2 },
          streamCompleted: false,
        },
        reasoningStates: [
          {
            status: "reasoning",
            summary:
              state.reasoningStates[state.reasoningStates.length - 1].summary +
              (event.data?.delta ?? ""),
            description: event.data?.delta ?? "",
          },
        ],
      }));
    }

    if (event.type === "response.reasoning_summary_text.done") {
      const currentReasoningStates = get().reasoningStates;
      const newReasoningStates = currentReasoningStates.map((state, index) => {
        if (index === currentReasoningStates.length - 1) {
          return {
            ...state,
            status: "completed" as const,
          };
        }
        return state;
      });

      // mark reasoning as completed
      set(() => ({
        reasoningStates: newReasoningStates,
      }));
    }

    if (event.type === "assistant.phase") {
      set((state) => ({
        avatarState: {
          ...state.avatarState,
          phase:
            typeof event.data.phase === "string"
              ? event.data.phase
              : state.avatarState.phase,
        },
      }));
    }

    if (event.type === "assistant.emotion") {
      const expressionUpdate: Record<string, number> = {};
      if (
        event.data &&
        typeof event.data.emotions === "object" &&
        event.data.emotions !== null
      ) {
        for (const [name, value] of Object.entries(event.data.emotions)) {
          if (typeof value === "number") {
            expressionUpdate[name] = Math.max(0, Math.min(1, value));
          }
        }
      } else if (typeof event.data.emotion === "string") {
        expressionUpdate[event.data.emotion] =
          typeof event.data.intensity === "number"
            ? Math.max(0, Math.min(1, event.data.intensity))
            : 1;
      }

      set((state) => ({
        avatarState: {
          ...state.avatarState,
          expressionWeights:
            Object.keys(expressionUpdate).length > 0
              ? expressionUpdate
              : state.avatarState.expressionWeights,
        },
      }));
    }

    if (event.type === "response.output_text.delta") {
      set((state) => ({
        avatarState: {
          ...state.avatarState,
          phase: "speaking",
          speakingText:
            state.avatarState.speakingText + (event.data?.delta ?? ""),
          streamCompleted: false,
          expressionWeights: {
            ...state.avatarState.expressionWeights,
            neutral: 0,
            happy: Math.max(
              state.avatarState.expressionWeights.happy ?? 0,
              0.2,
            ),
          },
        },
        streamingMessage: {
          ...state.streamingMessage,
          content: state.streamingMessage.content + (event.data?.delta ?? ""),
        },
      }));
    }

    if (event.type === "response.output_text.done") {
      set((state) => ({
        streamingMessage: {
          ...state.streamingMessage,
          content:
            typeof event.data.delta === "string"
              ? event.data.delta
              : state.streamingMessage.content,
        },
      }));
    }

    if (event.type === "response.completed") {
      set((state) => ({
        avatarState: {
          ...state.avatarState,
          phase:
            state.avatarState.speakingText.length > 0 ? "speaking" : "done",
          streamCompleted: true,
        },
      }));
    }

    if (event.type === "response.created") {
      console.log(event.data.id);
      set((state) => ({
        streamingMessage: {
          ...state.streamingMessage,
          id: event.data.id as string,
        },
      }));
    }
  });

  set((state) => ({
    isSendingMessage: false,
    messages: [...state.messages, state.streamingMessage],
    streamingMessage: createEmptyStreamingMessage(),
  }));
};
