import { useState } from "react";
import { Loader } from "../../../components/loader";
import { SvgThinkingDark } from "../../../maps/svg_icon_maps";
import { useChat } from "../../../stores/chat_store/chat_store";

export const ReasoningSection = () => {
  const { reasoningStates, isSendingMessage } = useChat();
  const [isReasoningDetailsOpen, setIsReasoningDetailsOpen] = useState(false);
  function openReasoningDetails() {
    setIsReasoningDetailsOpen((isOpen) => !isOpen);
  }

  if (isSendingMessage) {
    return (
      <div className="loading-container">
        <p className="paragraph chat-messages">loading...</p>
        <Loader classNames="icon-lg" />
      </div>
    );
  }

  if (
    reasoningStates.length == 0 ||
    reasoningStates[reasoningStates.length - 1].status !== "reasoning"
  ) {
    return null;
  }
  return (
    <div className="reasoning-section">
      <div className="reasoning-bar">
        <button
          onClick={openReasoningDetails}
          className="flex-row gap-1 no-style"
        >
          <span data-active="true" className="wave-text">
            thinking...
          </span>
          <SvgThinkingDark className="icon-lg reasoning-icon expanding-item" />
        </button>
      </div>
      {isReasoningDetailsOpen && (
        <div>
          {reasoningStates.map((reasoningState) => (
            <div
              className="wave-text"
              data-active={reasoningState.status === "reasoning"}
            >
              <p className="paragraph chat-messages">
                {reasoningState.summary}
              </p>
              <p className="paragraph chat-messages">
                {reasoningState.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
