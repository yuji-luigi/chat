import { useChat } from "../../stores/chat_store/chat_store";

export function StreamingMessage() {
  const { streamingMessage } = useChat();
  return <p className="paragraph chat-messages">{streamingMessage.content}</p>;
}
