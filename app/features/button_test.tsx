import React from "react";
import { useChat } from "../stores/chat_store/chat_store";

export const ButtonTest = () => {
  const { setReasoningStates } = useChat();
  function handleClick() {
    setReasoningStates((state) => {
      const lastState = state.at(-1);
      const status =
        lastState?.status === "reasoning" ? "completed" : "reasoning";
      if (state.length > 1) {
        const lastItem = state.at(-1)!; // last element (or undefined if empty)
        const tillBeforeLastItem = state.slice(0, -1);
        return [...tillBeforeLastItem, { ...lastItem, status }];
      }

      return [
        {
          ...state[0],
          status,
        },
      ];
    });
  }
  return (
    <button className="uppercase" onClick={handleClick}>
      click me
    </button>
  );
};
