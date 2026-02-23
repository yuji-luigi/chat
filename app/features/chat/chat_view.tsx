import { ChatForm } from "./chat_form";
import { ChatHero } from "./chat_hero";
import { ChatMessages } from "./chat_messages";

const ChatView = () => {
  return (
    <div className="chat-view">
      <ChatHero />
      <ChatMessages />
      <ChatForm />
    </div>
  );
};

export default ChatView;
