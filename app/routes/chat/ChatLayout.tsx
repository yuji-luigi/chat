import React from "react";

const LayoutChat = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="chat-page">
      <h1>Chat</h1>
      {children}
    </section>
  );
};

export default LayoutChat;
