import { assert, test, describe, beforeEach } from "vitest";
import { SlackApp, SlackOAuthApp, InstallationStore, SlackOAuthEnv, Installation, InstallationStoreQuery, Authorize } from "../src/index";

// Helper to generate a valid Slack request signature
async function signRequest(signingSecret: string, timestamp: number, body: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", textEncoder.encode(signingSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(`v0:${timestamp}:${body}`));
  const hexSignature = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `v0=${hexSignature}`;
}

// Create a valid signed request
async function createSignedRequest(signingSecret: string, body: object): Promise<Request> {
  const bodyStr = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await signRequest(signingSecret, timestamp, bodyStr);

  return new Request("https://example.com/slack/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-slack-request-timestamp": timestamp.toString(),
      "x-slack-signature": signature,
    },
    body: bodyStr,
  });
}

// Mock installation store for OAuth app tests
class MockInstallationStore implements InstallationStore<SlackOAuthEnv> {
  deletedBotInstallations: InstallationStoreQuery[] = [];
  deletedUserInstallations: InstallationStoreQuery[] = [];
  deletedAll: InstallationStoreQuery[] = [];

  async save(_installation: Installation, _request: Request | undefined): Promise<void> {}

  async findBotInstallation(_query: InstallationStoreQuery): Promise<Installation | undefined> {
    return undefined;
  }

  async findUserInstallation(_query: InstallationStoreQuery): Promise<Installation | undefined> {
    return undefined;
  }

  async deleteBotInstallation(query: InstallationStoreQuery): Promise<void> {
    this.deletedBotInstallations.push(query);
  }

  async deleteUserInstallation(query: InstallationStoreQuery): Promise<void> {
    this.deletedUserInstallations.push(query);
  }

  async deleteAll(query: InstallationStoreQuery): Promise<void> {
    this.deletedAll.push(query);
  }

  toAuthorize(): Authorize<SlackOAuthEnv> {
    return async (_req) => ({
      enterpriseId: undefined,
      teamId: "T111",
      team: "T111",
      botId: "B111",
      botUserId: "U111",
      botToken: "xoxb-test",
      botScopes: [],
    });
  }
}

describe("Multiple Event Handlers", () => {
  const signingSecret = "test-signing-secret";

  test("SlackApp invokes all matching event handlers, not just the first", async () => {
    const handlerCalls: string[] = [];

    const app = new SlackApp({
      env: {
        SLACK_SIGNING_SECRET: signingSecret,
        SLACK_BOT_TOKEN: "xoxb-test",
      },
      // Provide mock authorize to avoid real API calls
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

    // Register multiple handlers for the same event type
    app.event("app_mention", async () => {
      handlerCalls.push("handler1");
    });

    app.event("app_mention", async () => {
      handlerCalls.push("handler2");
    });

    app.event("app_mention", async () => {
      handlerCalls.push("handler3");
    });

    const eventBody = {
      type: "event_callback",
      token: "test-token",
      team_id: "T111",
      api_app_id: "A111",
      event: {
        type: "app_mention",
        user: "U123",
        text: "<@U111> hello",
        ts: "1234567890.123456",
        channel: "C111",
        event_ts: "1234567890.123456",
      },
      event_id: "Ev111",
      event_time: 1234567890,
    };

    const request = await createSignedRequest(signingSecret, eventBody);
    const response = await app.run(request);

    assert.equal(response.status, 200);
    assert.deepEqual(handlerCalls, ["handler1", "handler2", "handler3"]);
  });

  test("SlackOAuthApp invokes both built-in and custom tokens_revoked handlers", async () => {
    const handlerCalls: string[] = [];
    const installationStore = new MockInstallationStore();

    const app = new SlackOAuthApp({
      env: {
        SLACK_CLIENT_ID: "111.222",
        SLACK_CLIENT_SECRET: "xxx",
        SLACK_BOT_SCOPES: "commands,chat:write",
        SLACK_SIGNING_SECRET: signingSecret,
      },
      installationStore,
    });

    // Register a custom handler for tokens_revoked
    // This should be invoked IN ADDITION to the built-in handler
    app.event("tokens_revoked", async ({ payload }) => {
      handlerCalls.push("custom_tokens_revoked_handler");
    });

    const eventBody = {
      type: "event_callback",
      token: "test-token",
      team_id: "T111",
      enterprise_id: undefined,
      api_app_id: "A111",
      event: {
        type: "tokens_revoked",
        tokens: {
          oauth: ["U123", "U456"],
          bot: [],
        },
      },
      event_id: "Ev111",
      event_time: 1234567890,
    };

    const request = await createSignedRequest(signingSecret, eventBody);
    const response = await app.run(request);

    assert.equal(response.status, 200);
    // Custom handler should have been called
    assert.deepEqual(handlerCalls, ["custom_tokens_revoked_handler"]);
    // Built-in handler should have also been called (deleting user installations)
    assert.equal(installationStore.deletedUserInstallations.length, 2);
  });

  test("SlackOAuthApp invokes both built-in and custom app_uninstalled handlers", async () => {
    const handlerCalls: string[] = [];
    const installationStore = new MockInstallationStore();

    const app = new SlackOAuthApp({
      env: {
        SLACK_CLIENT_ID: "111.222",
        SLACK_CLIENT_SECRET: "xxx",
        SLACK_BOT_SCOPES: "commands,chat:write",
        SLACK_SIGNING_SECRET: signingSecret,
      },
      installationStore,
    });

    // Register a custom handler for app_uninstalled
    app.event("app_uninstalled", async () => {
      handlerCalls.push("custom_app_uninstalled_handler");
    });

    const eventBody = {
      type: "event_callback",
      token: "test-token",
      team_id: "T111",
      enterprise_id: "E111",
      api_app_id: "A111",
      event: {
        type: "app_uninstalled",
      },
      event_id: "Ev111",
      event_time: 1234567890,
    };

    const request = await createSignedRequest(signingSecret, eventBody);
    const response = await app.run(request);

    assert.equal(response.status, 200);
    // Custom handler should have been called
    assert.deepEqual(handlerCalls, ["custom_app_uninstalled_handler"]);
    // Built-in handler should have also been called (deleting all installations)
    assert.equal(installationStore.deletedAll.length, 1);
    assert.deepEqual(installationStore.deletedAll[0], {
      enterpriseId: "E111",
      teamId: "T111",
    });
  });

  test("Handler execution order is preserved (registration order)", async () => {
    const executionOrder: number[] = [];

    const app = new SlackApp({
      env: {
        SLACK_SIGNING_SECRET: signingSecret,
        SLACK_BOT_TOKEN: "xoxb-test",
      },
      // Provide mock authorize to avoid real API calls
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

    app.event("reaction_added", async () => {
      executionOrder.push(1);
    });

    app.event("reaction_added", async () => {
      executionOrder.push(2);
    });

    app.event("reaction_added", async () => {
      executionOrder.push(3);
    });

    const eventBody = {
      type: "event_callback",
      token: "test-token",
      team_id: "T111",
      api_app_id: "A111",
      event: {
        type: "reaction_added",
        user: "U123",
        reaction: "thumbsup",
        item: {
          type: "message",
          channel: "C111",
          ts: "1234567890.123456",
        },
        item_user: "U456",
        event_ts: "1234567890.123457",
      },
      event_id: "Ev111",
      event_time: 1234567890,
    };

    const request = await createSignedRequest(signingSecret, eventBody);
    await app.run(request);

    // Handlers should be called in registration order
    assert.deepEqual(executionOrder, [1, 2, 3]);
  });
});
