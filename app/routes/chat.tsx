import React from "react";
import { Outlet } from "react-router";

const ChatPageLayout = () => {
  return (
    <section className="chat-page">
      <Outlet />
    </section>
  );
};

export default ChatPageLayout;
