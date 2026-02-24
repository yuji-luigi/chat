import React from "react";
import { stream_SSE } from "../../lib/stream_sse";
import { api_endpoints } from "../../maps/api_endpoints";
import { useChat } from "../../stores/chat_store/chat_store";

export const ChatForm = () => {
  const { setStreamingMessage, streamingMessage, sendMessage } = useChat();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      sendMessage(e.currentTarget.message.value);
      e.currentTarget.reset();
      // setReasoningState({ status: "reasoning", summary: "" });
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // setReasoningState({
      //   status: "completed",
      //   summary: "reasoning completed",
      // });
      return;
      const form = e.currentTarget;
      const formData = new FormData(form);
      const message = formData.get("message") as string;
      let chunkTexts = "";
      stream_SSE(api_endpoints.chat.openai.root, { message }, async (ev) => {
        if (ev.type === "reasoning_summary_delta") {
          console.log("...reasoning");
        }
        if (ev.type === "text_delta") {
          chunkTexts += ev.data?.delta;

          setStreamingMessage({
            ...streamingMessage,
            content: chunkTexts,
          });
        }
      });
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
            <img src={svg_icon_maps.light.plus} alt="plus" />
          </button> */}
          <button className="chat-send-button" type="submit">
            Send
          </button>
        </div>
      </div>
    </form>
  );
};
