import { FunctionExecutedEvent } from "../request/payload/event.ts";

export const isFunctionExecutedEvent = (
  event: { type: string },
): event is FunctionExecutedEvent => {
  return event.type === "function_executed";
};
