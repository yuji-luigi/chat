const sseEventTypes = [
  "response.created",
  "response.reasoning_summary_text.delta",
  "response.reasoning_summary_text.done",
  "response.reasoning_summary_part.added",
  "response.reasoning_summary_part.done",
  "response.output_text.delta",
  "response.output_text.done",
  "response.completed",
  "response.failed",
  "response.output_item.added",
  "response.output_item.done",
  "assistant.phase",
  "assistant.emotion",
] as const;

export type SSEEventType = (typeof sseEventTypes)[number];
export type AssistantPhase = "idle" | "reasoning" | "speaking" | "done";
export type AssistantEmotion = "neutral" | "thinking" | "happy" | "surprised";

function isSSEEventType(eventType: unknown): eventType is SSEEventType {
  if (typeof eventType !== "string") return false;
  return sseEventTypes.includes(eventType);
}
export type SSEEventData = {
  delta?: string;
  phase?: AssistantPhase;
  emotion?: AssistantEmotion;
  intensity?: number;
  [key: string]: unknown;
};

export type SSEEvent = { type: SSEEventType; data: SSEEventData };

export async function stream_SSE(
  url: string,
  body: unknown,
  onEvent: (ev: SSEEvent) => void,
) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let eventName: unknown;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by blank line
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      // parse lines
      const dataLines: string[] = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
          continue;
        }
        if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }

      const dataStr = dataLines.join("\n");
      try {
        const data = JSON.parse(dataStr) as SSEEventData;
        if (isSSEEventType(eventName)) {
          onEvent({ type: eventName, data });
        }
      } catch {
        console.error("Error parsing JSON:", dataStr);
      }
    }
  }
}
