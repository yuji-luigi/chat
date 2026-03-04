import { useChat } from "../../stores/chat_store/chat_store";
import viteLogo from "/vite.svg";

export const ChatHero = () => {
  const { messages } = useChat();
  return (
    <div
      className="chat-hero"
      data-has-messages={messages.length > 0}
      onAnimationEnd={(e) =>
        e.currentTarget.setAttribute("data-animation-end", "true")
      }
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
