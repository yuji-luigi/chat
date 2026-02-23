import React from "react";
import { api_endpoints } from "../../maps/api_endpoints";
import { useChat } from "../../stores/chat_store/chat_store";

export const ChatForm = () => {
  const { setStreamingMessage, streamingMessage } = useChat();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      const form = e.currentTarget;
      const formData = new FormData(form);
      const message = formData.get("message") as string;
      const res = await fetch(api_endpoints.chat.openai.root, {
        method: "POST",
        body: JSON.stringify({ message }),
        headers: {
          "Content-Type": "application/json",
          // Accept: "text/event-stream",
        },
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let chunkTexts = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        try {
          const json = JSON.parse(chunk);

          if (json.type === "response.created") {
            console.log("response.created");
          }
        } catch (error: unknown) {
          chunkTexts += chunk;
        }
        // setText(chunkTexts);
        setStreamingMessage({
          ...streamingMessage,
          content: streamingMessage.content + chunkTexts,
        });
      }

      // eventSource.addEventListener("message", (event) => {
      //   console.log(event.data);
      //   chunkTexts += " " + event.data;
      //   setText(chunkTexts);
      //   setStreamingMessage({
      //     ...streamingMessage,
      //     content: streamingMessage.content + chunkTexts,
      //   });
      // });
      // eventSource.addEventListener("done", () => {
      //   console.log("done");
      //   setText(chunkTexts);
      //   eventSource.close();
      // });

      // eventSource.addEventListener("error", (error) => {
      //   console.error("SSE error:", error);
      // });

      form.reset();
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
            <img src={svgIconMaps.light.plus} alt="plus" />
          </button> */}
          <button className="chat-send-button" type="submit">
            Send
          </button>
        </div>
      </div>
    </form>
  );
};
