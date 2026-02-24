import React from "react";
import { useChat } from "../../stores/chat_store/chat_store";
import { svg_icon_maps } from "../../maps/svg_icon_maps";

export const ChatMessages = () => {
  const { messages, reasoningState, streamingMessage } = useChat();
  const isReasoning = true;
  // const isReasoning = reasoningState.status === "reasoning";
  return (
    <div>
      {isReasoning && (
        <div>
          <div className="reasoning-loader">
            <p className="flex-row gap-1">
              <span className="thinking-text">Thinking...</span>
              <img
                className="icon-lg expanding-animation"
                src={svg_icon_maps.light.thinking}
                alt="thinking"
              />
            </p>
          </div>
          <p className="paragraph chat-messages">{reasoningState.summary}</p>
        </div>
      )}
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
