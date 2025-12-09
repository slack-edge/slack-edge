import { AnyMessageBlock, MessageMetadata, SlackAPIClient } from "slack-web-api-client";
import { AssistantThreadContext } from "./thread-context";

/**
 * A unique key identifying an assistant thread.
 * Combines channel ID and thread timestamp to uniquely identify a conversation.
 */
export type AssistantThreadKey = {
  /** The channel ID where the assistant thread exists */
  channel_id: string;
  /** The timestamp of the thread's parent message */
  thread_ts: string;
};

/**
 * Interface for storing and retrieving assistant thread context data.
 * Implementations of this interface can persist thread context to various backends
 * (e.g., message metadata, databases, or in-memory stores).
 */
export interface AssistantThreadContextStore {
  /**
   * Saves the context data for an assistant thread.
   * @param key - The unique identifier for the thread
   * @param newContext - The context data to save
   * @returns A promise that resolves when the save is complete
   */
  save(key: AssistantThreadKey, newContext: AssistantThreadContext): Promise<void>;

  /**
   * Retrieves the context data for an assistant thread.
   * @param key - The unique identifier for the thread
   * @returns A promise that resolves to the context data, or undefined if not found
   */
  find(key: AssistantThreadKey): Promise<AssistantThreadContext | undefined>;
}

/**
 * Configuration options for the DefaultAssistantThreadContextStore.
 */
export interface DefaultAssistantThreadContextStoreOptions {
  /** The Slack API client used to make API calls */
  client: SlackAPIClient;
  /** The bot user ID of the assistant app */
  thisBotUserId: string;
}

/**
 * Internal interface representing the first reply from the assistant bot in a thread.
 * Used to store and retrieve context via message metadata.
 */
interface FirstReply {
  /** The channel ID where the reply exists */
  channel_id: string;
  /** The timestamp of the reply message */
  ts: string;
  /** The text content of the reply */
  text: string;
  /** The block elements of the reply message */
  blocks: AnyMessageBlock[];
  /** Optional metadata attached to the message */
  metadata?: MessageMetadata;
}

/**
 * Default implementation of AssistantThreadContextStore that persists context
 * in message metadata of the bot's first reply in a thread.
 *
 * This implementation stores context by updating the metadata of the assistant's
 * first reply message in the thread. The context can then be retrieved by reading
 * the metadata from that same message.
 *
 * @example
 * ```typescript
 * const store = new DefaultAssistantThreadContextStore({
 *   client: slackClient,
 *   thisBotUserId: "U12345"
 * });
 * ```
 */
export class DefaultAssistantThreadContextStore implements AssistantThreadContextStore {
  #client: SlackAPIClient;
  #thisBotUserId: string;

  /**
   * Creates a new DefaultAssistantThreadContextStore instance.
   * @param options - Configuration options including the Slack API client and bot user ID
   */
  constructor({ client, thisBotUserId }: DefaultAssistantThreadContextStoreOptions) {
    this.#client = client;
    this.#thisBotUserId = thisBotUserId;
  }

  async #findFirstAssistantReply(key: AssistantThreadKey): Promise<FirstReply | undefined> {
    try {
      const response = await this.#client.conversations.replies({
        channel: key.channel_id,
        ts: key.thread_ts,
        oldest: key.thread_ts,
        include_all_metadata: true,
        limit: 4,
      });
      if (response.messages) {
        for (const message of response.messages) {
          if (!("subtype" in message) && message.user === this.#thisBotUserId) {
            return {
              channel_id: key.channel_id,
              ts: message.ts!,
              text: message.text!,
              blocks: message.blocks!,
              metadata: message.metadata as MessageMetadata | undefined,
            };
          }
        }
      }
    } catch (e) {
      console.log(`Failed to fetch conversations.replies API result: ${e}`);
    }
    return undefined;
  }

  /**
   * Saves the context data by updating the metadata of the bot's first reply in the thread.
   * If no first reply exists yet, the save operation is skipped silently.
   * @param key - The unique identifier for the thread (channel_id and thread_ts)
   * @param newContext - The context data to save
   */
  async save(key: AssistantThreadKey, newContext: AssistantThreadContext): Promise<void> {
    const reply = await this.#findFirstAssistantReply(key);
    if (reply) {
      await this.#client.chat.update({
        ...reply,
        channel: reply.channel_id,
        metadata: {
          // this must be placed at the bottom
          event_type: "assistant_thread_context",
          event_payload: { ...newContext },
        },
      });
    }
  }

  /**
   * Retrieves the context data from the metadata of the bot's first reply in the thread.
   * @param key - The unique identifier for the thread (channel_id and thread_ts)
   * @returns The stored context data, or undefined if not found
   */
  async find(key: AssistantThreadKey): Promise<AssistantThreadContext | undefined> {
    const reply = await this.#findFirstAssistantReply(key);
    if (reply) {
      return reply.metadata?.event_payload as AssistantThreadContext | undefined;
    }
    return undefined;
  }
}
