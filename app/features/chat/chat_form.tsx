import React from "react";
import { useChat } from "../../stores/chat_store/chat_store";

export const ChatForm = () => {
  const { sendMessage } = useChat();
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
    <form onSubmit={handleSubmit}>
      <div className="chat-input-area">
        <input
          maxLength={100}
          max={100}
          className="chat-text-input"
          name="message"
          id="message-input"
        ></input>
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
