import React from "react";
import { useChat } from "../../stores/chat_store/chat_store";

export const ChatMessages = () => {
  const { messages } = useChat();
  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
};
