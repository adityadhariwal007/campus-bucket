import { test } from "node:test";
import assert from "node:assert/strict";
import { geminiBuck } from "../src/lib/gemini-buck";
test("Gemini keeps the key in a header, separates system instructions and translates chat roles", async () => {
  const ai = geminiBuck("test-secret", async (url, init) => {
    assert.equal(
      url,
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    );
    assert.equal(
      new Headers(init?.headers).get("x-goog-api-key"),
      "test-secret",
    );
    assert.equal(init?.redirect, "manual");
    const body = JSON.parse(init!.body as string);
    assert.ok(!JSON.stringify(body).includes("test-secret"));
    assert.deepEqual(body.systemInstruction, {
      parts: [{ text: "Buck rules" }],
    });
    assert.deepEqual(
      body.contents.map((m: { role: string }) => m.role),
      ["user", "model", "user"],
    );
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, "low");
    assert.ok(!body.tools);
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: {
            parts: [
              { thought: true, text: "Private reasoning" },
              { text: '{"message":"Hi"}' },
            ],
          },
        },
      ],
    });
  });
  const result = await ai.run("gemini-3.6-flash", {
    messages: [
      { role: "system", content: "Buck rules" },
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
      { role: "user", content: "Hostel kit?" },
    ],
  });
  assert.equal(result.response, '{"message":"Hi"}');
});
test("Gemini fails closed on quota/auth errors, blocked replies and truncated output", async () => {
  for (const response of [
    new Response("", {
      status: 302,
      headers: { Location: "https://untrusted.invalid" },
    }),
    new Response("sensitive provider details", { status: 429 }),
    new Response("bad key details", { status: 403 }),
    Response.json({
      candidates: [
        {
          finishReason: "MAX_TOKENS",
          content: { parts: [{ text: "partial" }] },
        },
      ],
    }),
    Response.json({ candidates: [] }),
  ]) {
    const ai = geminiBuck("test-secret", async () => response);
    await assert.rejects(
      ai.run("gemini-3.6-flash", {
        messages: [
          { role: "system", content: "rules" },
          { role: "user", content: "hi" },
        ],
      }),
      (error) =>
        error instanceof Error &&
        !/test-secret|sensitive|bad key/.test(error.message),
    );
  }
});
test("Gemini preserves the global fetch receiver required by Worker runtimes", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async function (this: unknown) {
    assert.equal(this, globalThis);
    return Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: '{"message":"Hello"}' }] },
        },
      ],
    });
  };
  try {
    const result = await geminiBuck("test-secret").run("gemini-3.6-flash", {
      messages: [
        { role: "system", content: "Rules" },
        { role: "user", content: "Hi" },
      ],
    });
    assert.equal(result.response, '{"message":"Hello"}');
  } finally {
    globalThis.fetch = original;
  }
});
