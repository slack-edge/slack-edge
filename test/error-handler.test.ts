import { assert, test, describe } from "vitest";
import { SlackApp } from "../src/index";

const signingSecret = "test-signing-secret";

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
    headers: {
      "Content-Type": "application/json",
      "x-slack-request-timestamp": ts.toString(),
      "x-slack-signature": signature,
    },
    body: bodyStr,
  });
}

const mockAuthorize = async () => ({
  enterpriseId: undefined,
  teamId: "T111",
  team: "T111",
  botId: "B111",
  botUserId: "U111",
  botToken: "xoxb-test",
  botScopes: [],
});

const appMentionBody = {
  type: "event_callback",
  team_id: "T111",
  api_app_id: "A111",
  event: { type: "app_mention", user: "U123", text: "<@U111> hi", ts: "1.1", channel: "C111", event_ts: "1.1" },
  event_id: "Ev111",
  event_time: 1,
};

// Lazy listeners run detached via ctx.waitUntil; let their microtasks settle.
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("Global error handler (app.error)", () => {
  test("invokes the registered handler when a lazy listener throws", async () => {
    const app = new SlackApp({ env: { SLACK_SIGNING_SECRET: signingSecret, SLACK_BOT_TOKEN: "xoxb-test" }, authorize: mockAuthorize });

    let captured: { message: string; body: unknown } | undefined;
    app.error(async ({ error, body }) => {
      captured = { message: error.message, body };
    });
    app.event("app_mention", async () => {
      throw new Error("boom");
    });

    const res = await app.run(await createSignedRequest(signingSecret, appMentionBody));
    await flush();

    assert.equal(res.status, 200); // ack still succeeds; lazy failure is out-of-band
    assert.exists(captured);
    assert.equal(captured!.message, "boom");
    assert.equal((captured!.body as { event: { type: string } }).event.type, "app_mention");
  });

  test("can be registered via the constructor option", async () => {
    let called = false;
    const app = new SlackApp({
      env: { SLACK_SIGNING_SECRET: signingSecret, SLACK_BOT_TOKEN: "xoxb-test" },
      authorize: mockAuthorize,
      errorHandler: async () => {
        called = true;
      },
    });
    app.event("app_mention", async () => {
      throw new Error("boom");
    });

    await app.run(await createSignedRequest(signingSecret, appMentionBody));
    await flush();
    assert.isTrue(called);
  });

  test("default path (no handler) does not throw and still acks", async () => {
    const app = new SlackApp({ env: { SLACK_SIGNING_SECRET: signingSecret, SLACK_BOT_TOKEN: "xoxb-test" }, authorize: mockAuthorize });
    app.event("app_mention", async () => {
      throw new Error("boom");
    });

    const res = await app.run(await createSignedRequest(signingSecret, appMentionBody));
    await flush();
    assert.equal(res.status, 200);
  });

  test("routes errors thrown by post-authorize middleware and can return a custom Response", async () => {
    const app = new SlackApp({ env: { SLACK_SIGNING_SECRET: signingSecret, SLACK_BOT_TOKEN: "xoxb-test" }, authorize: mockAuthorize });
    app.use(async () => {
      throw new Error("middleware failed");
    });
    let seen: string | undefined;
    app.error(async ({ error }) => {
      seen = error.message;
      return new Response("handled", { status: 503 });
    });

    const res = await app.run(await createSignedRequest(signingSecret, appMentionBody));
    assert.equal(seen, "middleware failed");
    assert.equal(res.status, 503);
    assert.equal(await res.text(), "handled");
  });

  test("does not interfere with the authorizeErrorHandler", async () => {
    // An authorize failure must go to authorizeErrorHandler, not the listener errorHandler.
    let listenerErrorCalled = false;
    const app = new SlackApp({
      env: { SLACK_SIGNING_SECRET: signingSecret, SLACK_BOT_TOKEN: "xoxb-test" },
      authorize: async () => {
        const err = new Error("nope");
        err.name = "AuthorizeError";
        throw err;
      },
      authorizeErrorHandler: async () => new Response("auth handled", { status: 401 }),
    });
    app.error(async () => {
      listenerErrorCalled = true;
    });
    app.event("app_mention", async () => {});

    const res = await app.run(await createSignedRequest(signingSecret, appMentionBody));
    await flush();
    assert.equal(res.status, 401);
    assert.equal(await res.text(), "auth handled");
    assert.isFalse(listenerErrorCalled);
  });
});
