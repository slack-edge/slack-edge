import { BotMessageEvent, FileShareMessageEvent, GenericMessageEvent, ThreadBroadcastMessageEvent } from "../request/payload/event";

/**
 * Type guard that determines if a message event represents an actual posted message.
 *
 * A "posted message" is a message that was actively sent by a user or bot,
 * as opposed to system-generated message events like message_changed or message_deleted.
 *
 * This includes:
 * - Regular user messages (no subtype)
 * - Bot messages (subtype: "bot_message")
 * - File share messages (subtype: "file_share")
 * - Thread broadcast messages (subtype: "thread_broadcast")
 *
 * @param event - The message event to check
 * @returns true if the event represents an actual posted message
 *
 * @example
 * ```typescript
 * app.event("message", async ({ event }) => {
 *   if (isPostedMessageEvent(event)) {
 *     // Handle actual posted messages
 *     console.log(`New message: ${event.text}`);
 *   }
 * });
 * ```
 */
export const isPostedMessageEvent = (event: {
  type: string;
  subtype?: string;
}): event is GenericMessageEvent | BotMessageEvent | FileShareMessageEvent | ThreadBroadcastMessageEvent => {
  return (
    event.subtype === undefined || event.subtype === "bot_message" || event.subtype === "file_share" || event.subtype === "thread_broadcast"
  );
};
