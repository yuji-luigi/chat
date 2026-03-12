import { stream_SSE, type SSEEvent } from "../../lib/stream_sse";
import { api_endpoints } from "../../maps/api_endpoints";
import type { ChatMessage } from "../../stores/chat_store/chat_store";

export const send_message_to_server = async (
  chatMessage: ChatMessage,
  onEvent: (ev: SSEEvent) => void,
) => stream_SSE(api_endpoints.chat.openai.root, { chatMessage }, onEvent);
