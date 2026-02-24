import { useChat } from "../../stores/chat_store/chat_store";
import { StreamingMessage } from "./StreamingMessage";
import viteLogo from "/vite.svg";

export const ChatHero = () => {
  const { streamingMessage } = useChat();
  if (streamingMessage.content.length > 0) {
    return <StreamingMessage />;
  }
  return (
    <div
      className="chat-hero"
      onAnimationEnd={() => console.log("animation ended")}
    >
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Type your message</h1>
    </div>
  );
};
