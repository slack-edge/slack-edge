import { AnyEventType, isDebugLogEnabled, prettyPrint, ResponseUrlSender, SlackAPIClient } from "slack-web-api-client";
import { SlackAppEnv, SlackEdgeAppEnv, SlackSocketModeAppEnv } from "./app-env";
import {
  Assistant,
  AssistantBotMessageHandler,
  AssistantThreadContextChangedHandler,
  AssistantThreadStartedHandler,
  AssistantUserMessageHandler,
} from "./assistant/assistant";
import { AssistantThreadContext } from "./assistant/thread-context";
import { AssistantThreadContextStore, DefaultAssistantThreadContextStore } from "./assistant/thread-context-store";
import { Authorize } from "./authorization/authorize";
import { AuthorizeErrorHandler, buildDefaultAuthorizeErrorHanlder } from "./authorization/authorize-error-handler";
import { AuthorizeResult } from "./authorization/authorize-result";
import { singleTeamAuthorize } from "./authorization/single-team-authorize";
import {
  builtBaseContext,
  isAssitantThreadEvent,
  SlackAppContext,
  SlackAppContextWithAssistantUtilities,
  SlackAppContextWithChannelId,
  SlackAppContextWithRespond,
} from "./context/context";
import { AuthorizeError, ConfigError } from "./errors";
import { ExecutionContext, NoopExecutionContext } from "./execution-context";
import {
  BlockActionAckHandler,
  BlockActionLazyHandler,
  BlockSuggestionAckHandler,
  EventLazyHandler,
  GlobalShortcutAckHandler,
  GlobalShortcutLazyHandler,
  MessageEventLazyHandler,
  MessageShortcutAckHandler,
  MessageShortcutLazyHandler,
  ShortcutAckHandler,
  ShortcutLazyHandler,
  SlackHandler,
  SlashCommandAckHandler,
  SlashCommandLazyHandler,
  SourceSpecifiedBlockActionAckHandler,
  SourceSpecifiedBlockActionLazyHandler,
  ViewAckHandler,
  ViewClosedAckHandler,
  ViewClosedLazyHandler,
  ViewLazyHandler,
  ViewSubmissionAckHandler,
  ViewSubmissionLazyHandler,
  AppRateLimitedLazyHandler,
} from "./handler/handler";
import { SlackMessageHandler } from "./handler/message-handler";
import { SlackOptionsHandler } from "./handler/options-handler";
import { SlackViewHandler } from "./handler/view-handler";
import { ignoringSelfEvents, urlVerification } from "./middleware/built-in-middleware";
import { Middleware, PreAuthorizeMiddleware } from "./middleware/middleware";
import { PayloadType } from "./request/payload-types";
import { AppRateLimited } from "./request/payload/app-rate-limited";
import { BlockAction, BlockElementActions, BlockElementTypes } from "./request/payload/block-action";
import { BlockSuggestion } from "./request/payload/block-suggestion";
import { AnySlackEvent, AnySlackEventWithChannelId, SlackEvent } from "./request/payload/event";
import { GlobalShortcut } from "./request/payload/global-shortcut";
import { MessageShortcut } from "./request/payload/message-shortcut";
import { SlashCommand } from "./request/payload/slash-command";
import { ViewClosed } from "./request/payload/view-closed";
import { ViewSubmission } from "./request/payload/view-submission";
import { PreAuthorizeSlackMiddlewareRequest, SlackMiddlewareRequest, SlackRequest, SlackRequestWithChannelId } from "./request/request";
import { SlackRequestBody } from "./request/request-body";
import { parseRequestBody } from "./request/request-parser";
import { verifySlackRequest } from "./request/request-verification";
import { toCompleteResponse } from "./response/response";
import { SocketModeClient } from "./socket-mode/socket-mode-client";
import { isFunctionExecutedEvent } from "./utility/function-executed-event";
import { isPostedMessageEvent } from "./utility/message-events";

/**
 * Options for initializing SlackApp instance.
 */
export interface SlackAppOptions<E extends SlackEdgeAppEnv | SlackSocketModeAppEnv> {
  /**
   * Passed env variables for configuring the app.
   */
  env: E;

  /**
   * The function that resolves the OAuth token associated with an incoming request.
   */
  authorize?: Authorize<E>;

  /**
   * The hoook that handles authorization failure.
   */
  authorizeErrorHandler?: AuthorizeErrorHandler<E>;

  /**
   * The endpoint routes to handle requests from Slack's API server.
   * When this app connects to Slack through Socket Mode, this setting won't be used.
   */
  routes?: {
    // The name "events" could be somewhat confusing, but this path handles all types of request patterns
    events: string;
  };

  /**
   * True when Socket Mode is enabled.
   */
  socketMode?: boolean;

  /**
   * When this is set to true, all lazy listeners are invoked after the ack function completion.
   * The default is set to false.
   */
  startLazyListenerAfterAck?: boolean;

  /**
   * When this is set to false, the built-in ignoringSelfEvents middleware is disabled.
   * The default is set to true.
   */
  ignoreSelfEvents?: boolean;

  /**
   * When this is set to false, the built-in ignoringSelfEvents middleware does not block this app's assistant bot message event.
   * The default is set to true.
   */
  ignoreSelfAssistantMessageEvents?: boolean;

  /**
   * Your custom assistant thread context store implementation.
   */
  assistantThreadContextStore?: AssistantThreadContextStore;
}

/**
 * The class representing a Slack app process that handles requests from Slack's API server.
 */
export class SlackApp<E extends SlackEdgeAppEnv | SlackSocketModeAppEnv> {
  /**
   * Passed env variables for configuring the app.
   */
  public env: E;

  /**
   * The singleton SlackAPIClient instance that embodies a bot token.
   * SlackOAuthApp initializes this property without a token.
   */
  public client: SlackAPIClient;

  /**
   * The function that resolves the OAuth token associated with an incoming request.
   */
  public authorize: Authorize<E>;

  /**
   * The hoook that handles authorization failure.
   */
  public authorizeErrorHandler: AuthorizeErrorHandler<E>;

  /**
   * The endpoint routes to handle requests from Slack's API server.
   * When this app connects to Slack through Socket Mode, this setting won't be used.
   */
  public routes: {
    // The name "events" could be somewhat confusing, but this path handles all types of request patterns
    events: string | undefined;
  };

  /**
   * The credential used for verifying a request's signature.
   */
  public signingSecret: string;

  /**
   * The app-level token for Socket Mode.
   * When Socket Mode is not enabled, this can be undefined.
   */
  public appLevelToken: string | undefined;

  /**
   * True when Socket Mode is enabled.
   */
  public socketMode: boolean; // default: false

  /**
   * The underlying Socket Mode client
   * that manages WebSocket connections and dispatches messages from Slack.
   */
  public socketModeClient: SocketModeClient | undefined;

  /**
   * When this is set to true, all lazy listeners are invoked after the ack function completion.
   * The default is set to false.
   */
  public startLazyListenerAfterAck: boolean; // default: false

  /**
   * When this is set to false, the built-in ignoringSelfEvents middleware is disabled.
   * The default is set to true.
   */
  public ignoreSelfEvents: boolean; // default: true

  /**
   * The custom middleware that are called before authorize() function.
   */
  // deno-lint-ignore no-explicit-any
  public preAuthorizeMiddleware: PreAuthorizeMiddleware<any>[] = [urlVerification];

  /**
   * The custom middleware that are called after authorize() function.
   */
  // deno-lint-ignore no-explicit-any
  public postAuthorizeMiddleware: Middleware<any>[] = [];

  public eventsToSkipAuthorize: string[] = ["app_uninstalled", "tokens_revoked"];

  /**
   * Your custom assistant thread context store implementation.
   */
  public assistantThreadContextStore?: AssistantThreadContextStore;

  // --------------------------
  // Enabled listener functions
  // --------------------------

  #slashCommands: ((body: SlackRequestBody) => SlackMessageHandler<E, SlashCommand> | null)[] = [];
  #events: ((body: SlackRequestBody) => SlackHandler<E, SlackEvent<AnyEventType>> | null)[] = [];
  #globalShorcuts: ((body: SlackRequestBody) => SlackHandler<E, GlobalShortcut> | null)[] = [];
  #messageShorcuts: ((body: SlackRequestBody) => SlackHandler<E, MessageShortcut> | null)[] = [];
  #blockActions: ((body: SlackRequestBody) => SlackHandler<
    E,
    // deno-lint-ignore no-explicit-any
    BlockAction<any>
  > | null)[] = [];
  #blockSuggestions: ((body: SlackRequestBody) => SlackOptionsHandler<E, BlockSuggestion> | null)[] = [];
  #viewSubmissions: ((body: SlackRequestBody) => SlackViewHandler<E, ViewSubmission> | null)[] = [];
  #viewClosed: ((body: SlackRequestBody) => SlackViewHandler<E, ViewClosed> | null)[] = [];
  #appRateLimited: ((body: SlackRequestBody) => SlackHandler<E, AppRateLimited> | null) | undefined = undefined;

  #assistantEnabled: boolean;

  // --------------------------

  constructor(options: SlackAppOptions<E>) {
    if (options.env.SLACK_BOT_TOKEN === undefined && (options.authorize === undefined || options.authorize === singleTeamAuthorize)) {
      throw new ConfigError(
        "When you don't pass env.SLACK_BOT_TOKEN, your own authorize function, which supplies a valid token to use, needs to be passed instead.",
      );
    }
    this.env = options.env;
    // Note that options.env.SLACK_BOT_TOKEN is absent for SlackOAuthApp
    this.client = new SlackAPIClient(options.env.SLACK_BOT_TOKEN, {
      logLevel: this.env.SLACK_LOGGING_LEVEL,
    });

    // Socket Mode settings
    this.appLevelToken = options.env.SLACK_APP_TOKEN;
    this.socketMode = options.socketMode ?? this.appLevelToken !== undefined;
    if (this.socketMode) {
      // Socket Mode does not require request signature verification
      // because the underlying WS connection are securely established.
      this.signingSecret = "";
    } else {
      if (!this.env.SLACK_SIGNING_SECRET) {
        throw new ConfigError("env.SLACK_SIGNING_SECRET is required to run your app on edge functions!");
      }
      this.signingSecret = this.env.SLACK_SIGNING_SECRET;
    }
    this.startLazyListenerAfterAck = options.startLazyListenerAfterAck ?? false;
    this.ignoreSelfEvents = options.ignoreSelfEvents ?? true;
    if (this.ignoreSelfEvents) {
      const middleware = ignoringSelfEvents(options.ignoreSelfAssistantMessageEvents ?? true);
      this.postAuthorizeMiddleware.push(middleware);
    }
    this.authorize = options.authorize ?? singleTeamAuthorize;
    this.authorizeErrorHandler = options.authorizeErrorHandler ?? buildDefaultAuthorizeErrorHanlder();
    this.routes = { events: options.routes?.events };
    this.assistantThreadContextStore = options.assistantThreadContextStore;
    this.#assistantEnabled = options.assistantThreadContextStore !== undefined;
  }

  /**
   * Registers a pre-authorize middleware.
   * @param middleware middleware
   * @returns this instance
   */
  beforeAuthorize(middleware: PreAuthorizeMiddleware<E>): SlackApp<E> {
    this.preAuthorizeMiddleware.push(middleware);
    return this;
  }

  /**
   * Registers a post-authorize middleware. This naming is for consistency with bolt-js.
   * @param middleware middleware
   * @returns this instance
   */
  middleware(middleware: Middleware<E>): SlackApp<E> {
    return this.afterAuthorize(middleware);
  }

  /**
   * Registers a post-authorize middleware. This naming is for consistency with bolt-js.
   * @param middleware middleware
   * @returns this instance
   */
  use(middleware: Middleware<E>): SlackApp<E> {
    return this.afterAuthorize(middleware);
  }

  /**
   * Registers a post-authorize middleware.
   * @param middleware middleware
   * @returns this instance
   */
  afterAuthorize(middleware: Middleware<E>): SlackApp<E> {
    this.postAuthorizeMiddleware.push(middleware);
    return this;
  }

  /**
   * Registers a listener that handles slash command executions.
   * @param pattern the pattern to match slash command name
   * @param ack ack function that must complete within 3 seconds
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  command(pattern: StringOrRegExp, ack: SlashCommandAckHandler<E>, lazy: SlashCommandLazyHandler<E> = noopLazyHandler): SlackApp<E> {
    const handler: SlackMessageHandler<E, SlashCommand> = { ack, lazy };
    this.#slashCommands.push((body) => {
      if (body.type || !body.command) {
        return null;
      }
      if (typeof pattern === "string" && body.command === pattern) {
        return handler;
      } else if (typeof pattern === "object" && pattern instanceof RegExp && body.command.match(pattern)) {
        return handler;
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a listener that handles custom function calls within Workflow Builder.
   * Please be aware that this feature is still in beta as of April 2024.
   * @param callbackId the pattern to match callback_id in a payload
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  function(callbackId: FunctionExecutedEventCallbackIdPattern, lazy: EventLazyHandler<"function_executed", E>) {
    this.#events.push((body) => {
      if (body.type !== PayloadType.EventsAPI || !body.event || body.event.type !== "function_executed") {
        return null;
      }
      if (isFunctionExecutedEvent(body.event)) {
        let matched = true;
        if (callbackId !== undefined) {
          if (typeof callbackId === "string") {
            matched = body.event.function.callback_id.includes(callbackId);
          }
          if (typeof callbackId === "object") {
            matched = body.event.function.callback_id.match(callbackId) !== null;
          }
        }
        if (matched) {
          // deno-lint-ignore require-await
          return { ack: async (_: EventRequest<E, "message">) => "", lazy };
        }
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a listener that handles Events API request.
   * @param event the pattern to match event type in a payload
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  event<Type extends AnyEventType>(event: Type, lazy: EventLazyHandler<Type, E>): SlackApp<E> {
    this.#events.push((body) => {
      if (body.type !== PayloadType.EventsAPI || !body.event) {
        return null;
      }
      if (body.event.type === event) {
        // deno-lint-ignore require-await
        return { ack: async () => "", lazy };
      }
      return null;
    });
    return this;
  }

  #assistantEvent<Type extends AnyEventType>(
    event: Type,
    lazy: EventLazyHandler<Type, E>,
    handleSelfBotMessageEvents: boolean = false,
  ): SlackApp<E> {
    this.#assistantEnabled = true;
    this.#events.push((body) => {
      if (body.type !== PayloadType.EventsAPI || !body.event) {
        return null;
      }
      if (body.event.type === event && this.#assistantEnabled && isAssitantThreadEvent(body)) {
        if (event === "message" && "bot_profile" in body.event) {
          if (handleSelfBotMessageEvents) {
            // this app's bot message events
            // The botMessageHandler acknowledges this pattern
            // Note that ignoreSelfAssistantMessageEvents must be set to false
            // deno-lint-ignore require-await
            return { ack: async () => "", lazy };
          } else {
            // userMessageHandler does not acknowledge
            return null;
          }
        } else {
          // assistant_thread_started events
          // assistant_thread_context_changed events
          // user message events
          // deno-lint-ignore require-await
          return { ack: async () => "", lazy };
        }
      }
      return null;
    });
    return this;
  }

  assistant(assistant: Assistant<E>): SlackApp<E> {
    this.#assistantEvent("assistant_thread_started", assistant.threadStartedHandler);
    this.#assistantEvent("assistant_thread_context_changed", assistant.threadContextChangedHandler);
    this.#assistantEvent("message", assistant.userMessageHandler, false);
    this.#assistantEvent("message", assistant.botMessageHandler, true);
    if (assistant.threadContextStore) {
      this.assistantThreadContextStore = assistant.threadContextStore;
    }
    return this;
  }

  assistantThreadStarted(lazy: AssistantThreadStartedHandler<E>): SlackApp<E> {
    return this.#assistantEvent(
      "assistant_thread_started",
      new Assistant<E>({
        threadContextStore: this.assistantThreadContextStore,
        threadStarted: lazy,
      }).threadStartedHandler,
    );
  }

  assistantThreadContextChanged(lazy: AssistantThreadContextChangedHandler<E>): SlackApp<E> {
    return this.#assistantEvent(
      "assistant_thread_context_changed",
      new Assistant<E>({
        threadContextStore: this.assistantThreadContextStore,
        threadContextChanged: lazy,
      }).threadContextChangedHandler,
    );
  }

  assistantUserMessage(lazy: AssistantUserMessageHandler<E>): SlackApp<E> {
    return this.#assistantEvent(
      "message",
      new Assistant<E>({
        threadContextStore: this.assistantThreadContextStore,
        userMessage: lazy,
      }).userMessageHandler,
      false,
    );
  }

  assistantBotMessage(lazy: AssistantBotMessageHandler<E>): SlackApp<E> {
    return this.#assistantEvent(
      "message",
      new Assistant<E>({
        threadContextStore: this.assistantThreadContextStore,
        botMessage: lazy,
      }).botMessageHandler,
      true,
    );
  }

  /**
   * Registers a listener that handles all newly posted message events.
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  anyMessage(lazy: MessageEventLazyHandler<E>): SlackApp<E> {
    return this.message(undefined, lazy);
  }

  /**
   * Registers a listener that handles newly posted message events that matches the pattern.
   * @param pattern the pattern to match a message event's text
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  message(pattern: MessageEventPattern, lazy: MessageEventLazyHandler<E>): SlackApp<E> {
    this.#events.push((body) => {
      if (body.type !== PayloadType.EventsAPI || !body.event || body.event.type !== "message") {
        return null;
      }
      if (isPostedMessageEvent(body.event)) {
        let matched = true;
        if (pattern !== undefined) {
          if (typeof pattern === "string") {
            matched = body.event.text!.includes(pattern);
          }
          if (typeof pattern === "object") {
            matched = body.event.text!.match(pattern) !== null;
          }
        }
        if (matched) {
          // deno-lint-ignore require-await
          return { ack: async (_: EventRequest<E, "message">) => "", lazy };
        }
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a listener that handles global/message shortcut executions.
   * @param callbackId the pattern to match callback_id in a payload
   * @param ack ack function that must complete within 3 seconds
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  shortcut(callbackId: StringOrRegExp, ack: ShortcutAckHandler<E>, lazy: ShortcutLazyHandler<E> = noopLazyHandler): SlackApp<E> {
    return this.globalShortcut(callbackId, ack, lazy).messageShortcut(callbackId, ack, lazy);
  }

  /**
   * Registers a listener that handles global shortcut executions.
   * @param callbackId the pattern to match callback_id in a payload
   * @param ack ack function that must complete within 3 seconds
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  globalShortcut(
    callbackId: StringOrRegExp,
    ack: GlobalShortcutAckHandler<E>,
    lazy: GlobalShortcutLazyHandler<E> = noopLazyHandler,
  ): SlackApp<E> {
    const handler: SlackHandler<E, GlobalShortcut> = { ack, lazy };
    this.#globalShorcuts.push((body) => {
      if (body.type !== PayloadType.GlobalShortcut || !body.callback_id) {
        return null;
      }
      if (typeof callbackId === "string" && body.callback_id === callbackId) {
        return handler;
      } else if (typeof callbackId === "object" && callbackId instanceof RegExp && body.callback_id.match(callbackId)) {
        return handler;
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a listener that handles message shortcut executions.
   * @param callbackId the pattern to match callback_id in a payload
   * @param ack ack function that must complete within 3 seconds
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  messageShortcut(
    callbackId: StringOrRegExp,
    ack: MessageShortcutAckHandler<E>,
    lazy: MessageShortcutLazyHandler<E> = noopLazyHandler,
  ): SlackApp<E> {
    const handler: SlackHandler<E, MessageShortcut> = { ack, lazy };
    this.#messageShorcuts.push((body) => {
      if (body.type !== PayloadType.MessageShortcut || !body.callback_id) {
        return null;
      }
      if (typeof callbackId === "string" && body.callback_id === callbackId) {
        return handler;
      } else if (typeof callbackId === "object" && callbackId instanceof RegExp && body.callback_id.match(callbackId)) {
        return handler;
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a listener that handles type: "block_actions" requests.
   * @param constraints the constraints to match block_id/action_id in a payload
   * @param ack ack function that must complete within 3 seconds
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  action<
    T extends BlockElementTypes,
    A extends BlockAction<Extract<BlockElementActions, { type: T }>> = BlockAction<Extract<BlockElementActions, { type: T }>>,
  >(
    constraints: StringOrRegExp | { type: T; block_id?: string; action_id: string },
    ack: BlockActionAckHandler<T, E, A> | SourceSpecifiedBlockActionAckHandler<E, A>,
    lazy: BlockActionLazyHandler<T, E, A> | SourceSpecifiedBlockActionLazyHandler<E, A> = noopLazyHandler,
  ): SlackApp<E> {
    const handler: SlackHandler<E, A> = { ack, lazy };
    this.#blockActions.push((body) => {
      if (body.type !== PayloadType.BlockAction || !body.actions || !body.actions[0]) {
        return null;
      }
      const action = body.actions[0];
      if (typeof constraints === "string" && action.action_id === constraints) {
        return handler;
      } else if (typeof constraints === "object") {
        if (constraints instanceof RegExp) {
          if (action.action_id.match(constraints)) {
            return handler;
          }
        } else if (constraints.type) {
          if (action.type === constraints.type) {
            if (action.action_id === constraints.action_id) {
              if (constraints.block_id && action.block_id !== constraints.block_id) {
                return null;
              }
              return handler;
            }
          }
        }
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a listener that handles type: "block_suggestion" requests.
   * Note that your app must return the options/option_groups within 3 seconds,
   * so slack-edge intentionally does not accept lazy here.
   * @param constraints the constraints to match block_id/action_id in a payload
   * @param ack ack function that must complete within 3 seconds
   * @returns this instance
   */
  options(constraints: StringOrRegExp | { block_id?: string; action_id: string }, ack: BlockSuggestionAckHandler<E>): SlackApp<E> {
    // Note that block_suggestion response must be done within 3 seconds.
    // So, we don't support the lazy handler for it.
    const handler: SlackOptionsHandler<E, BlockSuggestion> = { ack };
    this.#blockSuggestions.push((body) => {
      if (body.type !== PayloadType.BlockSuggestion || !body.action_id) {
        return null;
      }
      if (typeof constraints === "string" && body.action_id === constraints) {
        return handler;
      } else if (typeof constraints === "object") {
        if (constraints instanceof RegExp) {
          if (body.action_id.match(constraints)) {
            return handler;
          }
        } else {
          if (body.action_id === constraints.action_id) {
            if (body.block_id && body.block_id !== constraints.block_id) {
              return null;
            }
            return handler;
          }
        }
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a listener that handles type: "view_submission"/"view_closed" requests.
   * @param callbackId the constraints to match callback_id in a payload
   * @param ack ack function that must complete within 3 seconds
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  view(callbackId: StringOrRegExp, ack: ViewAckHandler<E>, lazy: ViewLazyHandler<E> = noopLazyHandler): SlackApp<E> {
    return this.viewSubmission(callbackId, ack, lazy).viewClosed(callbackId, ack, lazy);
  }

  /**
   * Registers a listener that handles type: "view_submission" requests.
   * @param callbackId the constraints to match callback_id in a payload
   * @param ack ack function that must complete within 3 seconds
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  viewSubmission(
    callbackId: StringOrRegExp,
    ack: ViewSubmissionAckHandler<E>,
    lazy: ViewSubmissionLazyHandler<E> = noopLazyHandler,
  ): SlackApp<E> {
    const handler: SlackViewHandler<E, ViewSubmission> = { ack, lazy };
    this.#viewSubmissions.push((body) => {
      if (body.type !== PayloadType.ViewSubmission || !body.view) {
        return null;
      }
      if (typeof callbackId === "string" && body.view.callback_id === callbackId) {
        return handler;
      } else if (typeof callbackId === "object" && callbackId instanceof RegExp && body.view.callback_id.match(callbackId)) {
        return handler;
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a listener that handles type: "view_closed" requests.
   * @param callbackId the constraints to match callback_id in a payload
   * @param ack ack function that must complete within 3 seconds
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  viewClosed(callbackId: StringOrRegExp, ack: ViewClosedAckHandler<E>, lazy: ViewClosedLazyHandler<E> = noopLazyHandler): SlackApp<E> {
    const handler: SlackViewHandler<E, ViewClosed> = { ack, lazy };
    this.#viewClosed.push((body) => {
      if (body.type !== PayloadType.ViewClosed || !body.view) {
        return null;
      }
      if (typeof callbackId === "string" && body.view.callback_id === callbackId) {
        return handler;
      } else if (typeof callbackId === "object" && callbackId instanceof RegExp && body.view.callback_id.match(callbackId)) {
        return handler;
      }
      return null;
    });
    return this;
  }

  /**
   * Registers a single listener that handles type: "app_rate_limited" requests.
   * @param lazy lazy function that can do anything asynchronously
   * @returns this instance
   */
  appRateLimited(lazy: AppRateLimitedLazyHandler<E>): SlackApp<E> {
    this.#appRateLimited = (body) => {
      if (body.type !== PayloadType.AppRateLimited) {
        return null;
      }
      // deno-lint-ignore require-await
      return { ack: async () => "", lazy };
    };
    return this;
  }

  /**
   * Handles an http request and returns a response to it.
   * @param request request
   * @param ctx execution context
   * @returns response
   */
  async run(request: Request, ctx: ExecutionContext = new NoopExecutionContext()): Promise<Response> {
    return await this.handleEventRequest(request, ctx);
  }

  /**
   * Establishes a WebSocket connection for Socket Mode.
   */
  async connect(): Promise<void> {
    if (!this.socketMode) {
      throw new ConfigError("Both env.SLACK_APP_TOKEN and socketMode: true are required to start a Socket Mode connection!");
    }
    this.socketModeClient = new SocketModeClient(this);
    await this.socketModeClient.connect();
  }

  /**
   * Disconnect a WebSocket connection for Socket Mode.
   */
  async disconnect(): Promise<void> {
    if (this.socketModeClient) {
      await this.socketModeClient.disconnect();
    }
  }

  async #callAuthorize(request: PreAuthorizeSlackMiddlewareRequest<E>): Promise<AuthorizeResult> {
    const body = request.body as SlackRequestBody;
    if (body.type === PayloadType.EventsAPI && body.event && this.eventsToSkipAuthorize.includes(body.event.type)) {
      // this pattern does not need AuthorizeResult at all
      return {
        enterpriseId: request.context.actorEnterpriseId,
        teamId: request.context.actorTeamId,
        team: request.context.actorTeamId,
        botId: request.context.botId || "N/A",
        botUserId: request.context.botUserId || "N/A",
        botToken: "N/A",
        botScopes: [],
        userId: request.context.actorUserId,
        user: request.context.actorUserId,
        userToken: "N/A",
        userScopes: [],
      };
    }
    return await this.authorize(request);
  }

  /**
   * Handles an HTTP request from Slack's API server and returns a response to it.
   * @param request request
   * @param ctx execution context
   * @returns response
   */
  async handleEventRequest(request: Request, ctx: ExecutionContext): Promise<Response> {
    // If the routes.events is missing, any URLs can work for handing requests from Slack
    if (this.routes.events) {
      const { pathname } = new URL(request.url);
      if (pathname !== this.routes.events) {
        return new Response("Not found", { status: 404 });
      }
    }

    // To avoid the following warning by Cloudflware, parse the body as Blob first
    // Called .text() on an HTTP body which does not appear to be text ..
    const blobRequestBody = await request.blob();
    // We can safely assume the incoming request body is always text data
    const rawBody: string = await blobRequestBody.text();

    // For Request URL verification
    if (rawBody.includes("ssl_check=")) {
      // Slack does not send the x-slack-signature header for this pattern.
      // Thus, we need to check the pattern before verifying a request.
      const bodyParams = new URLSearchParams(rawBody);
      if (bodyParams.get("ssl_check") === "1" && bodyParams.get("token")) {
        return new Response("", { status: 200 });
      }
    }

    // Verify the request headers and body
    const isRequestSignatureVerified = this.socketMode || (await verifySlackRequest(this.signingSecret, request.headers, rawBody));
    if (isRequestSignatureVerified) {
      // deno-lint-ignore no-explicit-any
      const body: Record<string, any> = await parseRequestBody(request.headers, rawBody);
      let retryNum: number | undefined = undefined;
      try {
        const retryNumHeader = request.headers.get("x-slack-retry-num");
        if (retryNumHeader) {
          retryNum = Number.parseInt(retryNumHeader);
        } else if (this.socketMode && body.retry_attempt) {
          retryNum = Number.parseInt(body.retry_attempt);
        }
        // deno-lint-ignore no-unused-vars
      } catch (e) {
        // Ignore an exception here
      }
      const retryReason = request.headers.get("x-slack-retry-reason") ?? body.retry_reason;
      const preAuthorizeRequest: PreAuthorizeSlackMiddlewareRequest<E> = {
        body,
        rawBody,
        retryNum,
        retryReason,
        context: builtBaseContext(body),
        env: this.env,
        headers: request.headers,
      };
      if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
        console.log(`*** Received request body ***\n ${prettyPrint(body)}`);
      }
      for (const middlware of this.preAuthorizeMiddleware) {
        const response = await middlware(preAuthorizeRequest);
        if (response) {
          return toCompleteResponse(response);
        }
      }
      let authorizeResult: AuthorizeResult;
      try {
        authorizeResult = await this.#callAuthorize(preAuthorizeRequest);
      } catch (
        // deno-lint-ignore no-explicit-any
        error: any
      ) {
        if ("name" in error && error.name === "AuthorizeError") {
          const responseOrError: Response | AuthorizeError = await this.authorizeErrorHandler({
            request: preAuthorizeRequest,
            error,
          });
          if ("name" in responseOrError && responseOrError.name === "AuthorizeError") {
            throw responseOrError; // AuthorizeError
          } else {
            return responseOrError as Response; // Response
          }
        } else {
          // The authorize() function should not throw any other exceptions than AuthorizeError
          throw error;
        }
      }
      const primaryToken = preAuthorizeRequest.context.functionBotAccessToken || authorizeResult.botToken;
      const authorizedContext: SlackAppContext = {
        ...preAuthorizeRequest.context,
        authorizeResult,
        client: new SlackAPIClient(primaryToken, {
          logLevel: this.env.SLACK_LOGGING_LEVEL,
        }),
        botToken: authorizeResult.botToken,
        botId: authorizeResult.botId,
        botUserId: authorizeResult.botUserId,
        userToken: authorizeResult.userToken,
      };
      if (authorizedContext.channelId) {
        const context = authorizedContext as SlackAppContextWithChannelId;
        const primaryToken = context.functionBotAccessToken || context.botToken;
        const client = new SlackAPIClient(primaryToken);
        if (this.#assistantEnabled && authorizedContext.isAssistantThreadEvent) {
          const assistantContext = authorizedContext as SlackAppContextWithAssistantUtilities;
          const { channelId: channel_id, threadTs: thread_ts } = assistantContext;
          // setStatus
          assistantContext.setStatus = async ({ status }) => await client.assistant.threads.setStatus({ channel_id, thread_ts, status });
          // setTitle
          assistantContext.setTitle = async ({ title }) => await client.assistant.threads.setTitle({ channel_id, thread_ts, title });
          // setSuggestedPrompts
          assistantContext.setSuggestedPrompts = async ({ title, prompts }) => {
            const promptsArgs: { title: string; message: string }[] = [];
            for (const p of prompts) {
              if (typeof p === "string") {
                promptsArgs.push({ message: p, title: p });
              } else {
                promptsArgs.push(p);
              }
            }
            return await client.assistant.threads.setSuggestedPrompts({ channel_id, thread_ts, prompts: promptsArgs, title });
          };
          // threadContextStore
          const threadContextStore =
            this.assistantThreadContextStore ??
            new DefaultAssistantThreadContextStore({
              client,
              thisBotUserId: context.botUserId,
            });
          assistantContext.threadContextStore = threadContextStore;
          // saveThreadContextStore
          assistantContext.saveThreadContextStore = async (newContext) => {
            await threadContextStore.save({ channel_id, thread_ts }, newContext);
          };

          // threadContext
          const threadContext: AssistantThreadContext | undefined =
            (await threadContextStore.find({ channel_id, thread_ts })) ||
            (body.event.assistant_thread?.context && Object.keys(body.event.assistant_thread.context).length > 0
              ? body.event.assistant_thread?.context
              : undefined);
          if (threadContext) {
            assistantContext.threadContext = threadContext;
          }
          // say
          context.say = async (params) =>
            await client.chat.postMessage({
              channel: channel_id,
              thread_ts,
              metadata: threadContext
                ? {
                    event_type: "assistant_thread_context",
                    event_payload: { ...threadContext },
                  }
                : undefined,
              ...params,
            });
        } else {
          context.say = async (params) =>
            await client.chat.postMessage({
              channel: context.channelId,
              thread_ts: context.threadTs, // for assistant apps
              ...params,
            });
        }
      }
      if (authorizedContext.responseUrl) {
        const responseUrl = authorizedContext.responseUrl;
        // deno-lint-ignore require-await
        (authorizedContext as SlackAppContextWithRespond).respond = async (params) => {
          return new ResponseUrlSender(responseUrl).call(params);
        };
      }

      const baseRequest: SlackMiddlewareRequest<E> = {
        ...preAuthorizeRequest,
        context: authorizedContext,
      };
      for (const middlware of this.postAuthorizeMiddleware) {
        const response = await middlware(baseRequest);
        if (response) {
          return toCompleteResponse(response);
        }
      }

      const payload = body as SlackRequestBody;

      if (body.type === PayloadType.EventsAPI) {
        // Events API
        const slackRequest: SlackRequest<E, SlackEvent<AnyEventType>> = {
          payload: body.event,
          ...baseRequest,
        };
        for (const matcher of this.#events) {
          const handler = matcher(payload);
          if (handler) {
            if (!this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            if (this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            return toCompleteResponse(slackResponse);
          }
        }
        if (payload.event?.type === "assistant_thread_context_changed") {
          // When a developer does not register their customer listener for this event,
          // SlackApp automatically calls the built-in one for ease of development.
          const handler = new Assistant({ threadContextStore: this.assistantThreadContextStore }).threadContextChangedHandler;
          if (!this.startLazyListenerAfterAck) {
            const req = slackRequest as EventRequest<E, "assistant_thread_context_changed">;
            ctx.waitUntil(handler(req));
            return toCompleteResponse();
          }
        }
      } else if (!body.type && body.command) {
        // Slash commands
        const slackRequest: SlackRequest<E, SlashCommand> = {
          payload: body as SlashCommand,
          ...baseRequest,
        };
        for (const matcher of this.#slashCommands) {
          const handler = matcher(payload);
          if (handler) {
            if (!this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            if (this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            return toCompleteResponse(slackResponse);
          }
        }
      } else if (body.type === PayloadType.GlobalShortcut) {
        // Global shortcuts
        const slackRequest: SlackRequest<E, GlobalShortcut> = {
          payload: body as GlobalShortcut,
          ...baseRequest,
        };
        for (const matcher of this.#globalShorcuts) {
          const handler = matcher(payload);
          if (handler) {
            if (!this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            if (this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            return toCompleteResponse(slackResponse);
          }
        }
      } else if (body.type === PayloadType.MessageShortcut) {
        // Message shortcuts
        const slackRequest: SlackRequest<E, MessageShortcut> = {
          payload: body as MessageShortcut,
          ...baseRequest,
        };
        for (const matcher of this.#messageShorcuts) {
          const handler = matcher(payload);
          if (handler) {
            if (!this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            if (this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            return toCompleteResponse(slackResponse);
          }
        }
      } else if (body.type === PayloadType.BlockAction) {
        // Block actions
        // deno-lint-ignore no-explicit-any
        const slackRequest: SlackRequest<E, BlockAction<any>> = {
          // deno-lint-ignore no-explicit-any
          payload: body as BlockAction<any>,
          ...baseRequest,
        };
        for (const matcher of this.#blockActions) {
          const handler = matcher(payload);
          if (handler) {
            if (!this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            if (this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            return toCompleteResponse(slackResponse);
          }
        }
      } else if (body.type === PayloadType.BlockSuggestion) {
        // Block suggestions
        const slackRequest: SlackRequest<E, BlockSuggestion> = {
          payload: body as BlockSuggestion,
          ...baseRequest,
        };
        for (const matcher of this.#blockSuggestions) {
          const handler = matcher(payload);
          if (handler) {
            // Note that the only way to respond to a block_suggestion request
            // is to send an HTTP response with options/option_groups.
            // Thus, we don't support lazy handlers for this pattern.
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            return toCompleteResponse(slackResponse);
          }
        }
      } else if (body.type === PayloadType.ViewSubmission) {
        // View submissions
        const slackRequest: SlackRequest<E, ViewSubmission> = {
          payload: body as ViewSubmission,
          ...baseRequest,
        };
        for (const matcher of this.#viewSubmissions) {
          const handler = matcher(payload);
          if (handler) {
            if (!this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            if (this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            return toCompleteResponse(slackResponse);
          }
        }
      } else if (body.type === PayloadType.ViewClosed) {
        // View closed
        const slackRequest: SlackRequest<E, ViewClosed> = {
          payload: body as ViewClosed,
          ...baseRequest,
        };
        for (const matcher of this.#viewClosed) {
          const handler = matcher(payload);
          if (handler) {
            if (!this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            if (this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            return toCompleteResponse(slackResponse);
          }
        }
      } else if (body.type === PayloadType.AppRateLimited) {
        // App rate limited
        const slackRequest: SlackRequest<E, AppRateLimited> = {
          payload: body as AppRateLimited,
          ...baseRequest,
        };
        // Only a single appRateLimited handler is supported
        if (this.#appRateLimited) {
          const handler = this.#appRateLimited(payload);
          if (handler) {
            if (!this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            const slackResponse = await handler.ack(slackRequest);
            if (isDebugLogEnabled(this.env.SLACK_LOGGING_LEVEL)) {
              console.log(`*** Slack response ***\n${prettyPrint(slackResponse)}`);
            }
            if (this.startLazyListenerAfterAck) {
              ctx.waitUntil(handler.lazy(slackRequest));
            }
            return toCompleteResponse(slackResponse);
          }
        }
      }

      // TODO: Add code suggestion here
      console.log(`*** No listener found ***\n${JSON.stringify(baseRequest.body)}`);
      return new Response("No listener found", { status: 404 });
    }
    return new Response("Invalid signature", { status: 401 });
  }
}

export type StringOrRegExp = string | RegExp;

export type MessageEventPattern = string | RegExp | undefined;

/**
 * Events API request
 */
export type EventRequest<E extends SlackAppEnv, T> = Extract<AnySlackEventWithChannelId, { type: T }> extends never
  ? SlackRequest<E, Extract<AnySlackEvent, { type: T }>>
  : SlackRequestWithChannelId<E, Extract<AnySlackEventWithChannelId, { type: T }>>;

/**
 * Events API: "function_executed" event for custom functions in Workflow Builder
 */
export type FunctionExecutedEventCallbackIdPattern = string | RegExp | undefined;

/**
 * Events API: "message" event
 */
export type MessageEventRequest<E extends SlackAppEnv, ST extends string | undefined> = SlackRequestWithChannelId<
  E,
  Extract<AnySlackEventWithChannelId, { subtype: ST }>
>;

export type MessageEventSubtypes = undefined | "bot_message" | "thread_broadcast" | "file_share";

/**
 * Handler function for "message" events
 */
export type MessageEventHandler<E extends SlackAppEnv> = (req: MessageEventRequest<E, MessageEventSubtypes>) => Promise<void>;

/**
 * Singleton lazy listener that does not do anything
 */
export const noopLazyHandler = async () => {};
