import AvatarCanvas from "../../components/three/AvatarCanvas";
import { ButtonTest } from "../button_test";
import { ChatForm } from "./chat_form";
import { ChatHero } from "./chat_hero";
import { ChatMessages } from "./chat_messages";

const ChatView = () => {
  return (
    <div className="chat-view">
      {/* <ButtonTest />  */}
      <div
        style={{
          height: "600px",
        }}
      >
        <AvatarCanvas />
      </div>
      <ChatHero />
      <ChatMessages />
      <ChatForm />
    </div>
  );
};

export default ChatView;
