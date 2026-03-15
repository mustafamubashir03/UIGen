
// Narrow the agent-kit AgentResult type at the usage site instead of trying
// to re-declare it here; accept any object that exposes an `output` array
// with `role` and `content` so we stay compatible with library updates.
type AssistantLikeMessage = {
  role: string;
  // `content` is often a string or array of rich text parts, but can be
  // undefined or other shapes depending on the adapter – keep this loose.
  content?: unknown;
};

// `result` is deliberately typed as `unknown` to avoid strict coupling to
// agent-kit internals while still keeping strict TypeScript mode happy.
// We defensively narrow at runtime.
export function lastAssistantTextMessageContent(result: unknown): string | undefined {
  if (
    !result ||
    typeof result !== "object" ||
    !Array.isArray((result as { output?: unknown }).output)
  ) {
    return undefined;
  }

  const output = (result as { output: AssistantLikeMessage[] }).output;

  const lastAssistantTextMessageIndex = output.findLastIndex(
    (message) => message.role === "assistant"
  );

  if (lastAssistantTextMessageIndex === -1) return undefined;

  const message = output[lastAssistantTextMessageIndex];

  if (!message) return undefined;

  const { content } = message;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    // Try to handle array-of-objects with `text` fields (AgentKit text chunks)
    const texts = content
      .map((c) => {
        if (c && typeof c === "object" && "text" in (c as any)) {
          return String((c as any).text);
        }
        return "";
      })
      .filter(Boolean);

    if (texts.length > 0) {
      return texts.join("");
    }
  }

  // Fallback: nothing we can safely stringify
  return undefined;
}