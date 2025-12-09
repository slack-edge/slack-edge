import { SlackAppEnv } from "../app-env";
import { isAssitantThreadEvent } from "../context/context";
import {
  AssistantEventLazyHandler,
  AssistantUserMessageEventRequest,
  AssistantThreadEventRequest,
  EventLazyHandler,
  AssistantBotMessageEventRequest,
} from "../handler/handler";
import { AssistantThreadContextChangedEvent, AssistantThreadStartedEvent } from "../request/payload/event";
import { AssistantThreadContextStore } from "./thread-context-store";

/**
 * Handler type for the `assistant_thread_started` event.
 * This handler is invoked when a user opens a new assistant thread in a DM with the app.
 * @template E - The Slack app environment type
 */
export type AssistantThreadStartedHandler<E extends SlackAppEnv> = AssistantEventLazyHandler<AssistantThreadStartedEvent, E>;

/**
 * Handler type for the `assistant_thread_context_changed` event.
 * This handler is invoked when the context of an assistant thread is updated.
 * @template E - The Slack app environment type
 */
export type AssistantThreadContextChangedHandler<E extends SlackAppEnv> = AssistantEventLazyHandler<AssistantThreadContextChangedEvent, E>;

/**
 * Handler type for user messages sent to the assistant thread.
 * This handler is invoked when a user sends a message (including file shares) in the assistant thread.
 * @template E - The Slack app environment type
 */
export type AssistantUserMessageHandler<E extends SlackAppEnv> = (req: AssistantUserMessageEventRequest<E>) => Promise<void>;

/**
 * Handler type for bot messages in the assistant thread.
 * This handler is invoked when the bot itself sends a message in the assistant thread.
 * @template E - The Slack app environment type
 */
export type AssistantBotMessageHandler<E extends SlackAppEnv> = (req: AssistantBotMessageEventRequest<E>) => Promise<void>;

/**
 * Configuration options for the Assistant class.
 * @template E - The Slack app environment type
 */
export interface AssistantOptions<E extends SlackAppEnv> {
  threadContextStore?: AssistantThreadContextStore;
  threadStarted?: AssistantThreadStartedHandler<E>;
  threadContextChanged?: AssistantThreadContextChangedHandler<E>;
  userMessage?: AssistantUserMessageHandler<E>;
  botMessage?: AssistantBotMessageHandler<E>;
}

/**
 * A class that manages Slack AI Assistant functionality.
 *
 * The Assistant class provides a simplified interface for building AI-powered assistants
 * that respond to user messages in direct message threads. It handles the lifecycle events
 * of assistant threads including thread creation, context changes, and message handling.
 *
 * @template E - The Slack app environment type
 * @example
 * ```typescript
 * const assistant = new Assistant({
 *   threadStarted: async ({ context, say }) => {
 *     await say({ text: "Hello! How can I help you?" });
 *   },
 *   userMessage: async ({ context, say, payload }) => {
 *     await say({ text: `You said: ${payload.text}` });
 *   },
 * });
 * app.assistant(assistant);
 * ```
 */
export class Assistant<E extends SlackAppEnv> {
  /** Optional store for persisting assistant thread context data */
  threadContextStore?: AssistantThreadContextStore;
  /** Internal handler for the assistant_thread_started event */
  threadStartedHandler: EventLazyHandler<"assistant_thread_started", E>;
  /** Internal handler for the assistant_thread_context_changed event */
  threadContextChangedHandler: EventLazyHandler<"assistant_thread_context_changed", E>;
  /** Internal handler for user messages in the assistant thread */
  userMessageHandler: EventLazyHandler<"message", E>;
  /** Internal handler for bot messages in the assistant thread */
  botMessageHandler: EventLazyHandler<"message", E>;

  /**
   * Creates a new Assistant instance with the specified options.
   * @param options - Configuration options for the assistant including event handlers
   */
  constructor(options: AssistantOptions<E> = {}) {
    this.threadContextStore = options.threadContextStore;
    this.threadStartedHandler = async (req) => {
      try {
        if (isAssitantThreadEvent(req.body)) {
          const request = req as unknown as AssistantThreadEventRequest<E, AssistantThreadStartedEvent>;
          if (options.threadStarted) {
            await options.threadStarted(request);
          } else {
            const { say, setSuggestedPrompts } = request.context;
            await say({ text: ":wave: Hi, how can I help you today?" });
            await setSuggestedPrompts({ title: "New chat", prompts: ["What does SLACK stand for?"] });
          }
        }
      } catch (e: unknown) {
        console.error(`Failed to execute threadStartedHandler listener: ${(e as Error).stack}`);
      }
    };
    this.threadContextChangedHandler = async (req) => {
      try {
        if (isAssitantThreadEvent(req.body)) {
          const request = req as unknown as AssistantThreadEventRequest<E, AssistantThreadContextChangedEvent>;
          if (options.threadContextChanged) {
            await options.threadContextChanged(request);
          } else {
            // the defualt implementation
            const { context } = request;
            await context.saveThreadContextStore({ ...request.payload.assistant_thread.context });
          }
        }
      } catch (e: unknown) {
        console.error(`Failed to execute threadContextChangedHandler listener: ${(e as Error).stack}`);
      }
    };
    this.userMessageHandler = async (req) => {
      try {
        if (req.payload.subtype === undefined || req.payload.subtype === "file_share") {
          if (options.userMessage) {
            await options.userMessage(req as AssistantUserMessageEventRequest<E>);
          } else {
            // noop; just ack the request
          }
        }
      } catch (e: unknown) {
        console.error(`Failed to execute userMessageHandler listener: ${(e as Error).stack}`);
      }
    };
    this.botMessageHandler = async (req) => {
      try {
        if (req.payload.subtype === undefined && req.payload.user === req.context.botUserId) {
          if (options.botMessage) {
            await options.botMessage(req as AssistantBotMessageEventRequest<E>);
          } else {
            // noop; just ack the request
          }
        }
      } catch (e: unknown) {
        console.error(`Failed to execute botMessageHandler listener: ${(e as Error).stack}`);
      }
    };
  }

  /**
   * Registers a handler for the `assistant_thread_started` event.
   * This event is triggered when a user opens a new assistant thread (DM) with the app.
   * @param handler - The handler function to execute when a new thread is started
   */
  threadStarted(handler: AssistantThreadStartedHandler<E>) {
    this.threadStartedHandler = async (req) => {
      try {
        if (isAssitantThreadEvent(req.body)) {
          await handler(req as unknown as AssistantThreadEventRequest<E, AssistantThreadStartedEvent>);
        }
      } catch (e: unknown) {
        console.error(`Failed to execute threadStartedHandler listener: ${(e as Error).stack}`);
      }
    };
  }
  /**
   * Registers a handler for the `assistant_thread_context_changed` event.
   * This event is triggered when the context of an assistant thread is updated,
   * typically when metadata about the conversation changes.
   * @param handler - The handler function to execute when thread context changes
   */
  threadContextChanged(handler: AssistantThreadContextChangedHandler<E>) {
    this.threadContextChangedHandler = async (req) => {
      try {
        if (isAssitantThreadEvent(req.body)) {
          await handler(req as unknown as AssistantThreadEventRequest<E, AssistantThreadContextChangedEvent>);
        }
      } catch (e: unknown) {
        console.error(`Failed to execute threadContextChangedHandler listener: ${(e as Error).stack}`);
      }
    };
  }
  /**
   * Registers a handler for user messages sent in the assistant thread.
   * This handler is invoked when a user sends a regular message or shares a file
   * in the assistant thread.
   * @param handler - The handler function to execute when a user sends a message
   */
  userMessage(handler: AssistantUserMessageHandler<E>) {
    this.userMessageHandler = async (req) => {
      try {
        if (req.payload.subtype === undefined || req.payload.subtype === "file_share") {
          await handler(req as AssistantUserMessageEventRequest<E>);
        }
      } catch (e: unknown) {
        console.error(`Failed to execute userMessageHandler listener: ${(e as Error).stack}`);
      }
    };
  }
  /**
   * Registers a handler for bot messages in the assistant thread.
   * This handler is invoked when the assistant bot itself sends a message,
   * which can be useful for tracking or processing bot responses.
   * @param handler - The handler function to execute when the bot sends a message
   */
  botMessage(handler: AssistantBotMessageHandler<E>) {
    this.botMessageHandler = async (req) => {
      try {
        if (req.payload.subtype === undefined && req.payload.user === req.context.botUserId) {
          await handler(req as AssistantBotMessageEventRequest<E>);
        }
      } catch (e: unknown) {
        console.error(`Failed to execute botMessageHandler listener: ${(e as Error).stack}`);
      }
    };
  }
}
