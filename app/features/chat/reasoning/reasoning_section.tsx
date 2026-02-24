import React from "react";
import { SvgThinkingDark } from "../../../maps/svg_icon_maps";
import { useChat } from "../../../stores/chat_store/chat_store";

export const ReasoningSection = () => {
  const { reasoningState } = useChat();

  return (
    <div className="reasoning-section">
      <div className="reasoning-loader">
        <p className="flex-row gap-1">
          <span className="thinking-text">Thinking...</span>
          <SvgThinkingDark className="icon-lg thinking-icon expanding-animation" />
        </p>
      </div>
      <p className="paragraph chat-messages">{reasoningState.summary}</p>
    </div>
  );
};
