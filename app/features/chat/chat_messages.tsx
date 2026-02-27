import { useChat } from "../../stores/chat_store/chat_store";
import { ReasoningSection } from "./reasoning/reasoning_section";

export const ChatMessages = () => {
  const { messages, streamingMessage } = useChat();

  // const isReasoning = reasoningState.status === "reasoning";
  return (
    <>
      <div className="chat-messages-container">
        {streamingMessage.content.length > 0 && (
          <div className="streaming-message">
            <p className="paragraph chat-messages">
              {streamingMessage.content}
            </p>
          </div>
        )}
        {messages.map((message) => (
          <div className="message-container" key={message.id}>
            <p
              className={`paragraph chat-messages message-from-${message.from}`}
            >
              {message.content}
            </p>
          </div>
        ))}
      </div>
      <ReasoningSection />
    </>
  );
};
