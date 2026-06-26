import { assert, expect, test, describe, vi, afterEach } from "vitest";
import { SlackApp, SlackAPIClient, startMessageStream, ExecutionContext } from "../src/index";

const signingSecret = "test-signing-secret";

// --- helpers ---------------------------------------------------------------

async function signRequest(secret: string, timestamp: number, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`v0:${timestamp}:${body}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `v0=${hex}`;
}

async function createSignedRequest(secret: string, body: object): Promise<Request> {
  const bodyStr = JSON.stringify(body);
  const ts = Math.floor(Date.now() / 1000);
  const signature = await signRequest(secret, ts, bodyStr);
  return new Request("https://example.com/slack/events", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-slack-request-timestamp": ts.toString(), "x-slack-signature": signature },
    body: bodyStr,
  });
}

// Records every chat.*Stream call against a fake client.
function fakeClient() {
  const calls: { method: string; args: Record<string, unknown> }[] = [];
  const record = (method: string, ret: Record<string, unknown>) => async (args: Record<string, unknown>) => {
    calls.push({ method, args });
    return { ok: true, ...ret };
  };
  const client = {
    chat: {
      startStream: record("startStream", { ts: "1700000000.000100", channel: "C111" }),
      appendStream: record("appendStream", {}),
      stopStream: record("stopStream", {}),
    },
  } as unknown as SlackAPIClient;
  return { client, calls };
}

// Collects lazy listener promises so tests can await their completion.
class CollectingExecutionContext implements ExecutionContext {
  promises: Promise<unknown>[] = [];
  // deno-lint-ignore no-explicit-any
  waitUntil(promise: Promise<any>): void {
    this.promises.push(promise);
  }
}

// --- low-level factory -----------------------------------------------------

describe("startMessageStream", () => {
  test("drives start -> append -> stop in order", async () => {
    const { client, calls } = fakeClient();
    const stream = await startMessageStream(client, { channel: "C111", thread_ts: "1.1", markdown_text: "hello" });

    assert.equal(stream.ts, "1700000000.000100");
    await stream.append("more");
    await stream.append({ markdown_text: " and more" });
    await stream.stop("done");

    assert.deepEqual(
      calls.map((c) => c.method),
      ["startStream", "appendStream", "appendStream", "stopStream"],
    );
    assert.deepEqual(calls[0].args, {
      channel: "C111",
      thread_ts: "1.1",
      recipient_user_id: undefined,
      recipient_team_id: undefined,
      markdown_text: "hello",
    });
    assert.deepEqual(calls[1].args, { channel: "C111", ts: "1700000000.000100", markdown_text: "more" });
    assert.deepEqual(calls[2].args, { channel: "C111", ts: "1700000000.000100", markdown_text: " and more" });
    assert.deepEqual(calls[3].args, { channel: "C111", ts: "1700000000.000100", markdown_text: "done" });
  });

  test("uses loading_messages[0] as the initial markdown when none is given", async () => {
    const { client, calls } = fakeClient();
    await startMessageStream(client, { channel: "C111", thread_ts: "1.1", loading_messages: ["Thinking…", "Still thinking…"] });
    assert.equal(calls[0].args.markdown_text, "Thinking…");
  });

  test("applies default metadata on stop unless overridden", async () => {
    const { client, calls } = fakeClient();
    const meta = { event_type: "assistant_thread_context", event_payload: { channel_id: "C111" } };
    const stream = await startMessageStream(client, { channel: "C111", thread_ts: "1.1", metadata: meta });
    await stream.stop();
    assert.deepEqual(calls[1].args.metadata, meta);
  });

  test("throws when the stream fails to start", async () => {
    const client = {
      chat: { startStream: async () => ({ ok: false, error: "channel_not_found" }) },
    } as unknown as SlackAPIClient;
    await expect(startMessageStream(client, { channel: "C111", thread_ts: "1.1" })).rejects.toThrow(/channel_not_found/);
  });

  test("refuses to append after stop", async () => {
    const { client } = fakeClient();
    const stream = await startMessageStream(client, { channel: "C111", thread_ts: "1.1" });
    await stream.stop();
    await expect(stream.append("nope")).rejects.toThrow(/already been stopped/);
  });
});

// --- context.sayStream wiring (end-to-end via app.run) ---------------------

describe("context.sayStream", () => {
  afterEach(() => vi.unstubAllGlobals());

  test("auto-sources channel_id and threads ts from start through append/stop", async () => {
    const apiCalls: { method: string; body: URLSearchParams }[] = [];
    vi.stubGlobal("fetch", async (input: Request | string) => {
      const url = typeof input === "string" ? input : input.url;
      const method = url.split("/api/")[1];
      const body = typeof input === "string" ? new URLSearchParams() : new URLSearchParams(await input.text());
      apiCalls.push({ method, body });
      const ret = method === "chat.startStream" ? { ok: true, ts: "1700000000.000999" } : { ok: true };
      return new Response(JSON.stringify(ret), { headers: { "content-type": "application/json" } });
    });

    const app = new SlackApp({
      env: { SLACK_SIGNING_SECRET: signingSecret, SLACK_BOT_TOKEN: "xoxb-test" },
      authorize: async () => ({
        enterpriseId: undefined,
        teamId: "T111",
        team: "T111",
        botId: "B111",
        botUserId: "U111",
        botToken: "xoxb-test",
        botScopes: [],
      }),
    });

    app.event("app_mention", async ({ context }) => {
      const stream = await context.sayStream({ thread_ts: "100.200", markdown_text: "Working on it" });
      await stream.append("partial");
      await stream.stop("final");
    });

    const body = {
      type: "event_callback",
      team_id: "T111",
      api_app_id: "A111",
      event: { type: "app_mention", user: "U123", text: "<@U111> hi", ts: "1.1", channel: "C999", event_ts: "1.1" },
      event_id: "Ev1",
      event_time: 1,
    };
    const ctx = new CollectingExecutionContext();
    await app.run(await createSignedRequest(signingSecret, body), ctx);
    await Promise.all(ctx.promises);

    const streamCalls = apiCalls.filter((c) => c.method.endsWith("Stream"));
    assert.deepEqual(
      streamCalls.map((c) => c.method),
      ["chat.startStream", "chat.appendStream", "chat.stopStream"],
    );
    // channel auto-sourced from the event payload
    assert.equal(streamCalls[0].body.get("channel"), "C999");
    assert.equal(streamCalls[0].body.get("thread_ts"), "100.200");
    assert.equal(streamCalls[0].body.get("markdown_text"), "Working on it");
    // ts returned by start flows into append + stop
    assert.equal(streamCalls[1].body.get("ts"), "1700000000.000999");
    assert.equal(streamCalls[1].body.get("channel"), "C999");
    assert.equal(streamCalls[2].body.get("ts"), "1700000000.000999");
    assert.equal(streamCalls[2].body.get("markdown_text"), "final");
  });
});
