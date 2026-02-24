const sseEventTypes = [
  "response.created",
  "response.reasoning_summary_text.delta",
  "response.reasoning_summary_text.done",
  "response.reasoning_summary_part.done",
  "response.output_text.delta",
  "response.output_text.done",
  "response.completed",
  "response.failed",
  "response.output_item.added",
  "response.output_item.done",
] as const;

export type SSEEventType = (typeof sseEventTypes)[number];

function isSSEEventType(eventType: unknown): eventType is SSEEventType {
  if (typeof eventType !== "string") return false;
  return sseEventTypes.includes(eventType);
}
export type SSEEvent = { type: SSEEventType; data: { delta?: string } };

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

      const [eventLine, dataLine] = rawEvent.split("\n");
      if (eventLine.startsWith("event:")) {
        eventName = eventLine.slice(6).trim();
        if (dataLine.startsWith("data:"))
          dataLines.push(dataLine.slice(5).trim());
        // ignore ":" comments, id:, retry:
      }

      const dataStr = dataLines.join("\n");
      // let data: { delta?: string } | undefined;
      try {
        const data = JSON.parse(dataStr) as { delta?: string };
        if (isSSEEventType(eventName)) {
          onEvent({ type: eventName, data });
        }
      } catch {
        console.error("Error parsing JSON:", dataStr);
      }
    }
  }
}
