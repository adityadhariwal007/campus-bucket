import type { BuckAI, BuckMessage } from "./buck-chat";
// Called only by the server route; the secret never reaches browser code or URLs.
export function geminiBuck(
  key: string,
  send: typeof fetch = (input, init) => globalThis.fetch(input, init),
): BuckAI {
  return {
    async run(model, input) {
      const messages = input.messages as (
        | { role: "system"; content: string }
        | BuckMessage
      )[];
      const response = await send(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
          },
          redirect: "manual",
          signal: AbortSignal.timeout(28000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: messages[0].content }] },
            contents: messages.slice(1).map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }],
            })),
            generationConfig: {
              maxOutputTokens: 2048,
              thinkingConfig: { thinkingLevel: "low" },
              responseMimeType: "application/json",
              responseJsonSchema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                  expression: {
                    type: "string",
                    enum: ["curious", "happy", "thoughtful", "gentle"],
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    maxItems: 3,
                  },
                },
                required: ["message", "expression", "recommendations"],
                additionalProperties: false,
              },
            },
          }),
        },
      );
      // Provider error bodies can contain request details; do not log or return them.
      if (!response.ok) {
        console.error("Buck Gemini HTTP failure", response.status);
        throw new Error("Gemini unavailable");
      }
      const data = (await response.json()) as {
        candidates?: {
          finishReason?: string;
          content?: { parts?: { text?: string; thought?: boolean }[] };
        }[];
      };
      const candidate = data.candidates?.[0];
      if (candidate?.finishReason !== "STOP") {
        const reason = candidate?.finishReason;
        console.error(
          "Buck Gemini incomplete reply",
          typeof reason === "string" && /^[A-Z_]{1,40}$/.test(reason)
            ? reason
            : "missing",
        );
        throw new Error("Incomplete Gemini reply");
      }
      const text = candidate.content?.parts
        ?.filter((part) => !part.thought && typeof part.text === "string")
        .map((part) => part.text)
        .join("");
      if (!text) throw new Error("Empty Gemini reply");
      return { response: text };
    },
  };
}
