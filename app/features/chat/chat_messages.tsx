import { useChat } from "../../stores/chat_store/chat_store";
import { ReasoningSection } from "./reasoning/reasoning_section";

export const ChatMessages = () => {
  const { messages, streamingMessage } = useChat();

  // const isReasoning = reasoningState.status === "reasoning";
  return (
    <div>
      <ReasoningSection />
      {streamingMessage.content.length > 0 && (
        <div className="streaming-message">
          <p className="paragraph chat-messages">{streamingMessage.content}</p>
        </div>
      )}
      {messages.map((message) => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
};
