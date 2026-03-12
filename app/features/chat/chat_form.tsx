import React from "react";
import { useChat } from "../../stores/chat_store/chat_store";

export const ChatForm = () => {
  const { sendMessage, messages } = useChat();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      sendMessage(e.currentTarget.message.value);
      e.currentTarget.reset();

      return;
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <form
      data-has-messages={messages.length > 0}
      className="chat-form"
      onSubmit={handleSubmit}
    >
      <div className="chat-input-area">
        <textarea
          className="chat-text-input"
          name="message"
          id="message-input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              // invoke the submit event
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
              return false;
            }
            if (e.key === "Enter" && e.shiftKey) {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              return false;
            }
          }}
        ></textarea>
        <div className="chat-input-toolbar">
          {/* <button className="icon-button sm" type="submit">
            <img src={svg_icon_maps.light.plus} alt="plus" />
          </button> */}
          <button className="chat-send-button" type="submit">
            Send
          </button>
        </div>
      </div>
    </form>
  );
};
