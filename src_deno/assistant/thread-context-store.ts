import {
  AnyMessageBlock,
  MessageMetadata,
  SlackAPIClient,
} from "https://deno.land/x/slack_web_api_client@1.1.6/mod.ts";
import { AssistantThreadContext } from "./thread-context.ts";

export type AssistantThreadKey = {
  channel_id: string;
  thread_ts: string;
};

export interface AssistantThreadContextStore {
  save(
    key: AssistantThreadKey,
    newContext: AssistantThreadContext,
  ): Promise<void>;
  find(key: AssistantThreadKey): Promise<AssistantThreadContext | undefined>;
}

export interface DefaultAssistantThreadContextStoreOptions {
  client: SlackAPIClient;
  thisBotUserId: string;
}

interface FirstReply {
  channel_id: string;
  ts: string;
  text: string;
  blocks: AnyMessageBlock[];
  metadata?: MessageMetadata;
}

export class DefaultAssistantThreadContextStore
  implements AssistantThreadContextStore {
  #client: SlackAPIClient;
  #thisBotUserId: string;
  constructor(
    { client, thisBotUserId }: DefaultAssistantThreadContextStoreOptions,
  ) {
    this.#client = client;
    this.#thisBotUserId = thisBotUserId;
  }

  async #findFirstAssistantReply(
    key: AssistantThreadKey,
  ): Promise<FirstReply | undefined> {
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

  async save(
    key: AssistantThreadKey,
    newContext: AssistantThreadContext,
  ): Promise<void> {
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

  async find(
    key: AssistantThreadKey,
  ): Promise<AssistantThreadContext | undefined> {
    const reply = await this.#findFirstAssistantReply(key);
    if (reply) {
      return reply.metadata?.event_payload as
        | AssistantThreadContext
        | undefined;
    }
    return undefined;
  }
}
