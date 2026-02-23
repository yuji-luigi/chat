import React, { useState } from "react";
import { svgIconMaps } from "../../../maps/svg_icon_maps";

export const ChatForm = () => {
  const [, setText] = useState("");
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      let chunkTexts = "";
      const form = e.currentTarget;
      const formData = new FormData(form);
      const message = formData.get("message") as string;

      const streamUrl = `/api/v1/test?message=${encodeURIComponent(message)}`;
      const eventSource = new EventSource(streamUrl);

      eventSource.addEventListener("message", (event) => {
        console.log(event.data);
        chunkTexts += " " + event.data;
        setText(chunkTexts);
      });
      eventSource.addEventListener("done", () => {
        console.log("done");
        setText(chunkTexts);
        eventSource.close();
      });

      eventSource.addEventListener("error", (error) => {
        console.error("SSE error:", error);
      });

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
          <button className="chat-send-button" type="submit">
            Send
          </button>
          <button className="icon-button sm" type="submit">
            <img src={svgIconMaps.light.plus} alt="plus" />
          </button>
        </div>
      </div>
    </form>
  );
};
