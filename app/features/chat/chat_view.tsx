import { ButtonTest } from "../button_test";
import { ChatForm } from "./chat_form";
import { ChatHero } from "./chat_hero";
import { ChatMessages } from "./chat_messages";

const ChatView = () => {
  return (
    <div className="chat-view">
      <ButtonTest />
      <ChatHero />
      <ChatMessages />
      <ChatForm />
    </div>
  );
};

export default ChatView;
