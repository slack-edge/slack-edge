import { SlackAPIClient, AnyMessageBlock, MessageMetadata, ChatAppendStreamResponse, ChatStopStreamResponse } from "slack-web-api-client";

/**
 * Input accepted by `MessageStream#append`. Either a markdown string or an object wrapping it.
 */
export type AppendInput = string | { markdown_text: string };

/**
 * Input accepted by `MessageStream#stop`. A markdown string, or an object that can also attach
 * final Block Kit blocks / message metadata to the completed message.
 */
export type StopInput = string | { markdown_text?: string; blocks?: AnyMessageBlock[]; metadata?: MessageMetadata };

/**
 * A handle over an in-progress streaming message, returned by `startMessageStream` / `context.sayStream`.
 * Append chunks as they are produced, then call `stop()` once to finalize the message.
 */
export interface MessageStream {
  /** The `ts` of the streaming message, available once the stream has started. */
  readonly ts: string;
  /** The channel the message is being streamed into. */
  readonly channel: string;
  /** Appends a markdown chunk to the streaming message. */
  append(input: AppendInput): Promise<ChatAppendStreamResponse>;
  /** Finalizes the stream. Calling more than once is a no-op-safe error guard. */
  stop(input?: StopInput): Promise<ChatStopStreamResponse>;
}

/**
 * Parameters for starting a low-level message stream over chat.startStream/appendStream/stopStream.
 */
export interface MessageStreamStartParams {
  channel: string;
  /** Required by chat.startStream — the thread to stream the message into. */
  thread_ts: string;
  recipient_user_id?: string;
  recipient_team_id?: string;
  /** Initial markdown shown when the stream starts. Falls back to `loading_messages[0]`. */
  markdown_text?: string;
  /**
   * Optional placeholder(s) shown while the first real chunk is produced.
   * ponytail: chat.startStream/appendStream is append-only with no "replace", so only the
   * first entry is used as the initial message — true timer-based cycling isn't supported on
   * edge runtimes. Pass a single message unless you specifically want the first of several.
   */
  loading_messages?: string[];
  /** Default metadata applied to the finalized message when `stop()` isn't given its own. */
  metadata?: MessageMetadata;
}

/**
 * Lower-level wrapper over chat.startStream → appendStream* → stopStream. Starts the stream
 * immediately and resolves to a handle whose `append()` / `stop()` manage the rest of the lifecycle.
 *
 * @param client the SlackAPIClient to use
 * @param params start parameters (channel/thread are required by the Slack API)
 * @returns a MessageStream handle
 */
export async function startMessageStream(client: SlackAPIClient, params: MessageStreamStartParams): Promise<MessageStream> {
  const { channel, thread_ts, recipient_user_id, recipient_team_id, loading_messages, metadata } = params;
  const started = await client.chat.startStream({
    channel,
    thread_ts,
    recipient_user_id,
    recipient_team_id,
    markdown_text: params.markdown_text ?? loading_messages?.[0],
  });
  const ts = started.ts;
  if (!ts) {
    throw new Error(`Failed to start a message stream: ${started.error ?? "unknown error"}`);
  }

  let stopped = false;
  return {
    ts,
    channel,
    async append(input) {
      if (stopped) {
        throw new Error("Cannot append to a message stream that has already been stopped");
      }
      const markdown_text = typeof input === "string" ? input : input.markdown_text;
      return await client.chat.appendStream({ channel, ts, markdown_text });
    },
    async stop(input) {
      stopped = true;
      const args = typeof input === "string" ? { markdown_text: input } : { ...input };
      if (args.metadata === undefined && metadata !== undefined) {
        args.metadata = metadata;
      }
      return await client.chat.stopStream({ channel, ts, ...args });
    },
  };
}

/**
 * Parameters for the `context.sayStream` helper. Channel and thread are auto-sourced from the
 * listener context (like `say`), so all fields are optional overrides.
 */
export interface SayStreamParams {
  markdown_text?: string;
  /** Override the auto-sourced thread_ts (required by the Slack streaming API). */
  thread_ts?: string;
  recipient_user_id?: string;
  recipient_team_id?: string;
  loading_messages?: string[];
}
