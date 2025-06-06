import { assert, test, describe } from "vitest";
import {
  BlockActionAckHandler,
  SourceSpecifiedBlockActionAckHandler,
  BlockActionLazyHandler,
  BlockSuggestionAckHandler,
  ButtonAction,
  DataSubmissionView,
  EventLazyHandler,
  GlobalShortcutAckHandler,
  GlobalShortcutLazyHandler,
  MessageBlockAction,
  MessageEventLazyHandler,
  MessageShortcutAckHandler,
  MessageShortcutLazyHandler,
  Respond,
  ShortcutAckHandler,
  SlackApp,
  SlackAppEnv,
  SlashCommandAckHandler,
  SlashCommandLazyHandler,
  ViewAckHandler,
  ViewClosedAckHandler,
  ViewClosedLazyHandler,
  ViewLazyHandler,
  ViewSubmissionAckHandler,
  ViewSubmissionLazyHandler,
  SourceSpecifiedBlockActionLazyHandler,
  ViewBlockAction,
  ViewStateValue,
  AppRateLimitedLazyHandler,
} from "../src/index";

interface MyEnv extends SlackAppEnv {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  MyValue: string;
}

describe("SlackApp", () => {
  test("initialization", () => {
    const app = new SlackApp({
      env: { SLACK_SIGNING_SECRET: "test", SLACK_BOT_TOKEN: "xoxb-" },
      authorizeErrorHandler: async ({ request, error }) => {
        // Just acknowledge the request this app cannot handle
        return new Response("", { status: 200 });
      },
    });
    assert.exists(app.client);
  });
  test("handler type aliases", () => {
    const env: MyEnv = {
      SLACK_SIGNING_SECRET: "test",
      SLACK_BOT_TOKEN: "xoxb-",
      MyValue: "foo",
    };
    const app = new SlackApp({
      env,
    });

    // Slash commands
    const command: SlashCommandAckHandler = async ({ body, context }) => {
      console.log(body);
      console.log(context);
    };
    const commandLazy: SlashCommandLazyHandler = async ({ body, context }) => {
      console.log(body);
      console.log(context);
    };
    app.command("/echo", command);
    app.command("/echo", command, commandLazy);

    // Events API
    const appMentionEvent: EventLazyHandler<"app_mention"> = async ({ payload, context }) => {
      const type: "app_mention" = payload.type;
      const botUserId: string = context.botUserId;
      const botId: string = context.botId;
    };
    app.event("app_mention", appMentionEvent);

    const tokensRevokedEvent: EventLazyHandler<"tokens_revoked"> = async ({ payload }) => {
      const type: "tokens_revoked" = payload.type;
    };
    app.event("tokens_revoked", tokensRevokedEvent);

    const messageEvent: MessageEventLazyHandler = async ({ payload }) => {
      const type: "message" = payload.type;
    };
    app.anyMessage(messageEvent);
    app.message("Hey", messageEvent);

    // Shortcuts
    const shortcut: ShortcutAckHandler = async ({ payload, context }) => {
      const type: "shortcut" | "message_action" = payload.type;
    };
    const globalShortcut: GlobalShortcutAckHandler = async ({ payload }) => {
      const type: "shortcut" = payload.type;
    };
    const globalShortcutLazy: GlobalShortcutLazyHandler = async ({ payload }) => {
      const type: "shortcut" = payload.type;
    };
    const messageShortcut: MessageShortcutAckHandler = async ({ payload, context }) => {
      const type: "message_action" = payload.type;
      const respond: Respond = context.respond;
    };
    const messageShortcutLazy: MessageShortcutLazyHandler = async ({ payload, context }) => {
      const type: "message_action" = payload.type;
      const respond: Respond = context.respond;
    };
    app.shortcut("start", shortcut);
    app.globalShortcut("hey", globalShortcut);
    app.globalShortcut("hey", globalShortcut, globalShortcutLazy);
    app.messageShortcut("save-this", messageShortcut);
    app.messageShortcut("save-this", messageShortcut, messageShortcutLazy);

    // Block actions
    const button: BlockActionAckHandler<"button", MyEnv> = async ({ payload, env }) => {
      const type: "block_actions" = payload.type;
      const action: ButtonAction = payload.actions[0];
      if ("message" in payload) {
        const messageTs: string = payload.message.ts;
        const channelId: string = payload.channel.id;
        // for a workflow custom step, this has to be optional
        const responseUrl: string | undefined = payload.response_url;
      } else if ("view" in payload) {
        const view: DataSubmissionView = payload.view;
        const state: Record<string, Record<string, ViewStateValue>> = payload.state.values;
      }
      const functionId: string | undefined = payload.function_data?.execution_id;
      const interactivityPointer: string | undefined = payload.interactivity?.interactivity_pointer;
      const label: string | undefined = action.accessibility_label;
      const myValue: string = env.MyValue;
    };

    const button2: BlockActionAckHandler<"button", MyEnv, MessageBlockAction<ButtonAction>> = async ({ payload, env }) => {
      const type: "block_actions" = payload.type;
      const action: ButtonAction = payload.actions[0];
      const messageTs: string = payload.message.ts;
      const channelId: string = payload.channel.id;
      // for a workflow custom step, this has to be optional
      const responseUrl: string | undefined = payload.response_url;
    };

    const button3: SourceSpecifiedBlockActionAckHandler<MyEnv, MessageBlockAction<ButtonAction>> = async ({ payload, env }) => {
      const type: "block_actions" = payload.type;
      const action: ButtonAction = payload.actions[0];
      const messageTs: string = payload.message.ts;
      const channelId: string = payload.channel.id;
      // for a workflow custom step, this has to be optional
      const responseUrl: string | undefined = payload.response_url;
    };

    const buttonLazy: BlockActionLazyHandler<"button", MyEnv> = async ({ payload, env }) => {
      const type: "block_actions" = payload.type;
      const action: ButtonAction = payload.actions[0];
      const label: string | undefined = action.accessibility_label;
      const myValue: string = env.MyValue;
    };
    const buttonLazy2: SourceSpecifiedBlockActionLazyHandler<MyEnv, ViewBlockAction<ButtonAction>> = async ({ payload, env }) => {
      const type: "block_actions" = payload.type;
      const action: ButtonAction = payload.actions[0];
      const view: DataSubmissionView = payload.view;
      const state: Record<string, Record<string, ViewStateValue>> = payload.state.values;
    };
    app.action("action_id", button);
    app.action("action_id", button2);
    app.action("action_id", button3);
    app.action("action_id", button, buttonLazy);
    app.action("action_id", button, buttonLazy2);

    app.action<"button">("action_id", async ({ payload }) => {
      const type: "block_actions" = payload.type;
      const action: ButtonAction = payload.actions[0];
      if ("message" in payload) {
        const messageTs: string = payload.message.ts;
        const channelId: string = payload.channel.id;
        // for a workflow custom step, this has to be optional
        const responseUrl: string | undefined = payload.response_url;
      }
    });
    app.action<"button", MessageBlockAction<ButtonAction>>("action_id", async ({ payload }) => {
      const type: "block_actions" = payload.type;
      const action: ButtonAction = payload.actions[0];
      // This can result in a runtime error if the handler receives other patterns
      const messageTs: string = payload.message.ts;
      const channelId: string = payload.channel.id;
      // for a workflow custom step, this has to be optional
      const responseUrl: string | undefined = payload.response_url;
    });

    // Block suggestion
    const search: BlockSuggestionAckHandler = async ({ payload }) => {
      const type: "block_suggestion" = payload.type;
      const value: string = payload.value;
      return { options: [] };
    };
    app.options("data-search", search);

    // View submission/closed
    const view: ViewAckHandler = async ({ payload }) => {
      const type: "view_submission" | "view_closed" = payload.type;
    };
    const viewLazy: ViewLazyHandler = async ({ payload }) => {
      const type: "view_submission" | "view_closed" = payload.type;
    };
    app.view("callback_id", view);
    app.view("callback_id", view, viewLazy);

    const viewSubmission: ViewSubmissionAckHandler = async ({ payload }) => {
      const type: "view_submission" = payload.type;
    };
    const viewSubmissionLazy: ViewSubmissionLazyHandler = async ({ payload }) => {
      const type: "view_submission" = payload.type;
    };
    app.viewSubmission("callback_id", view);
    app.viewSubmission("callback_id", view, viewLazy);
    app.viewSubmission("callback_id", viewSubmission);
    app.viewSubmission("callback_id", viewSubmission, viewSubmissionLazy);

    const viewClosed: ViewClosedAckHandler = async ({ payload }) => {
      const type: "view_closed" = payload.type;
    };
    const viewClosedLazy: ViewClosedLazyHandler = async ({ payload }) => {
      const type: "view_closed" = payload.type;
    };
    app.viewClosed("callback_id", view);
    app.viewClosed("callback_id", view, viewLazy);
    app.viewClosed("callback_id", viewClosed);
    app.viewClosed("callback_id", viewClosed, viewClosedLazy);

    // App rate limited
    const appRateLimitedLazy: AppRateLimitedLazyHandler = async ({ payload }) => {
      const type: "app_rate_limited" = payload.type;
    };
    app.appRateLimited(appRateLimitedLazy);
  });
});
