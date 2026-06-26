import { assert, test, describe } from "vitest";
import { SlackApp, verifySlackRequest } from "../src/index";

const signingSecret = "test-signing-secret";

async function sign(secret: string, timestamp: number, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`v0:${timestamp}:${body}`));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `v0=${hex}`;
}

function headers(timestamp: number, signature: string): Headers {
  return new Headers({
    "x-slack-request-timestamp": timestamp.toString(),
    "x-slack-signature": signature,
  });
}

describe("Request signature verification", () => {
  test("rejects an empty signing secret at construction", () => {
    assert.throws(
      () => new SlackApp({ env: { SLACK_SIGNING_SECRET: "", SLACK_BOT_TOKEN: "xoxb-" } }),
      /SLACK_SIGNING_SECRET is required/,
    );
  });

  test("rejects a whitespace-only signing secret at construction", () => {
    assert.throws(
      () => new SlackApp({ env: { SLACK_SIGNING_SECRET: "   ", SLACK_BOT_TOKEN: "xoxb-" } }),
      /SLACK_SIGNING_SECRET is required/,
    );
  });

  test("verifySlackRequest returns false for a blank secret without attempting an HMAC", async () => {
    const body = "payload=1";
    const ts = Math.floor(Date.now() / 1000);
    // The guard must short-circuit before importing a (zero-length) key, regardless of signature.
    assert.equal(await verifySlackRequest("", headers(ts, "v0=deadbeef"), body), false);
    assert.equal(await verifySlackRequest("   ", headers(ts, "v0=deadbeef"), body), false);
  });

  test("accepts a valid request", async () => {
    const body = "token=abc&ssl_check=0";
    const ts = Math.floor(Date.now() / 1000);
    const sig = await sign(signingSecret, ts, body);
    assert.equal(await verifySlackRequest(signingSecret, headers(ts, sig), body), true);
  });

  test("rejects a tampered signature", async () => {
    const body = "token=abc";
    const ts = Math.floor(Date.now() / 1000);
    const sig = await sign(signingSecret, ts, body);
    // Flip the request body after signing.
    assert.equal(await verifySlackRequest(signingSecret, headers(ts, sig), `${body}&evil=1`), false);
  });

  test("rejects an expired timestamp", async () => {
    const body = "token=abc";
    const ts = Math.floor(Date.now() / 1000) - 60 * 10; // 10 minutes old
    const sig = await sign(signingSecret, ts, body);
    assert.equal(await verifySlackRequest(signingSecret, headers(ts, sig), body), false);
  });

  test("rejects a non-numeric timestamp", async () => {
    const body = "token=abc";
    const sig = await sign(signingSecret, NaN as unknown as number, body);
    const h = new Headers({ "x-slack-request-timestamp": "not-a-number", "x-slack-signature": sig });
    assert.equal(await verifySlackRequest(signingSecret, h, body), false);
  });

  test("a forged ssl_check that is not exactly '1' is still signature-verified", async () => {
    // slack-edge only skips verification for an exact ssl_check=1 with a token.
    // Any other value falls through to normal verification and must fail without a valid signature.
    const app = new SlackApp({ env: { SLACK_SIGNING_SECRET: signingSecret, SLACK_BOT_TOKEN: "xoxb-" } });
    const body = "ssl_check=foo&token=abc";
    const request = new Request("https://example.com/slack/events", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "x-slack-request-timestamp": "1", "x-slack-signature": "v0=deadbeef" },
      body,
    });
    const res = await app.run(request);
    assert.equal(res.status, 401);
  });

  test("an exact ssl_check=1 with a token is acknowledged without a signature", async () => {
    const app = new SlackApp({ env: { SLACK_SIGNING_SECRET: signingSecret, SLACK_BOT_TOKEN: "xoxb-" } });
    const body = "ssl_check=1&token=abc";
    const request = new Request("https://example.com/slack/events", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const res = await app.run(request);
    assert.equal(res.status, 200);
  });
});
