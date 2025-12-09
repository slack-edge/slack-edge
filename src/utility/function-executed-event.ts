import { FunctionExecutedEvent } from "../request/payload/event";

/**
 * Type guard that determines if an event is a function_executed event.
 *
 * Function executed events are triggered when a custom function (defined in an app's
 * manifest) is invoked within a Slack workflow. This type guard helps narrow the
 * event type to access function-specific properties.
 *
 * @param event - The event object to check
 * @returns true if the event is a FunctionExecutedEvent
 *
 * @example
 * ```typescript
 * app.event("function_executed", async ({ event }) => {
 *   if (isFunctionExecutedEvent(event)) {
 *     // Access function-specific properties
 *     const { function_execution_id, inputs } = event;
 *     // Process the custom function execution
 *   }
 * });
 * ```
 */
export const isFunctionExecutedEvent = (event: { type: string }): event is FunctionExecutedEvent => {
  return event.type === "function_executed";
};
