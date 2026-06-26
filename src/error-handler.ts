import { SlackAppEnv } from "./app-env";
import { SlackMiddlewareRequest } from "./request/request";

/**
 * The arguments passed to a global error handler registered via `app.error()`.
 */
export interface SlackAppErrorHandlerArgs<E extends SlackAppEnv> {
  /** The error thrown by a post-authorize middleware or a listener (ack or lazy). */
  error: Error;
  /** The authorized request being processed, including its `context`, `headers`, and `env`. */
  request: SlackMiddlewareRequest<E>;
  /** Shortcut for `request.body` (the parsed request payload). */
  // deno-lint-ignore no-explicit-any
  body: Record<string, any>;
}

/**
 * A single global error handler invoked when a post-authorize middleware or a listener throws.
 *
 * For errors thrown during the synchronous ack phase, returning a `Response` makes the app reply
 * with it; returning nothing falls back to a 500 response. For errors thrown inside lazy listeners
 * the app has already responded to Slack, so any returned `Response` is ignored (the handler is
 * still useful for logging/reporting).
 *
 * This is independent of `authorizeErrorHandler`, which handles failures of the `authorize()` call
 * that happen before any listener runs.
 */
export type SlackAppErrorHandler<E extends SlackAppEnv = SlackAppEnv> = (
  args: SlackAppErrorHandlerArgs<E>,
) => Promise<Response | void>;
