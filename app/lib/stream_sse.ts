export async function stream_SSE(
  url: string,
  body: unknown,
  onEvent: (ev: { event: string; data: { delta?: string } }) => void,
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
  let eventName = "message";

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
      eventName = "message";
      const dataLines: string[] = [];

      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        // ignore ":" comments, id:, retry:
      }

      const dataStr = dataLines.join("\n");
      // let data: { delta?: string } | undefined;
      try {
        const data = JSON.parse(dataStr) as { delta?: string };
        if (data.delta) {
          onEvent({ event: eventName, data });
        } else {
          throw new Error("No delta found");
        }
      } catch {
        console.error("Error parsing JSON:", dataStr);
      }
    }
  }
}
