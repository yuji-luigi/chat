import AvatarCanvas from "../../components/three/AvatarCanvas";
import { ChatForm } from "./chat_form";
import { ChatHero } from "./chat_hero";
import { ChatMessages } from "./chat_messages";
import { useChat } from "../../stores/chat_store/chat_store";

const ChatView = () => {
  const { avatarState, markAvatarSpeechDrained } = useChat();
  return (
    <div className="chat-view">
      {/* <ButtonTest />  */}
      <div
        style={
          {
            // height: "600px",
          }
        }
      >
        <AvatarCanvas
          phase={avatarState.phase}
          expressionWeights={avatarState.expressionWeights}
          speakingText={avatarState.speakingText}
          streamCompleted={avatarState.streamCompleted}
          onSpeechDrained={markAvatarSpeechDrained}
        />
      </div>
      <ChatHero />
      <ChatMessages />
      <ChatForm />
    </div>
  );
};

export default ChatView;
