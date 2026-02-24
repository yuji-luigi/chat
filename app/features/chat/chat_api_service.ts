import { stream_SSE, type SSEEvent } from "../../lib/stream_sse";
import { api_endpoints } from "../../maps/api_endpoints";

export const send_message_to_server = async (
  message: string,
  onEvent: (ev: SSEEvent) => void,
) => stream_SSE(api_endpoints.chat.openai.root, { message }, onEvent);
