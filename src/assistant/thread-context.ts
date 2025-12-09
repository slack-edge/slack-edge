/**
 * Represents the context information associated with an assistant thread.
 * This context is used to track where the assistant conversation originated
 * and can be persisted using an AssistantThreadContextStore.
 */
export interface AssistantThreadContext {
  /** The enterprise ID if the workspace belongs to an Enterprise Grid organization, null otherwise */
  enterprise_id: string | null;
  /** The workspace ID where the assistant thread originated */
  team_id: string;
  /** The channel ID where the context was captured (e.g., where the user invoked the assistant) */
  channel_id: string;
}
