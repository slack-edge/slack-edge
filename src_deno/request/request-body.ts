/**
 * Represents the raw request body received from Slack.
 * This interface captures the common properties that may appear in various
 * Slack request payloads including slash commands, events, interactions, and views.
 *
 * The properties present depend on the type of request:
 * - Slash commands: `command` property
 * - Events API: `event`, `event_id`, `event_time`, `authorizations`
 * - Interactive components: `actions`, `callback_id`, `trigger_id`
 * - Block suggestions: `block_id`, `action_id`
 * - Views: `view`
 */
export interface SlackRequestBody {
  /** The type of request payload (e.g., "event_callback", "block_actions") */
  type?: string;

  /** The slash command that was invoked (e.g., "/weather") - present in slash command payloads */
  command?: string;

  /** The event data for Events API payloads */
  event?: {
    /** The type of event (e.g., "message", "app_mention") */
    type: string;
    /** The subtype of the event if applicable (e.g., "bot_message", "file_share") */
    subtype?: string;
    /** Text content of the event if applicable */
    text?: string;
  };
  /** Unique identifier for the event */
  event_id?: string;
  /** Unix timestamp when the event occurred */
  event_time?: number;
  /** The app ID that received this event */
  api_app_id?: string;
  /** The enterprise ID if applicable */
  enterprise_id?: string;
  /** The workspace ID where the event occurred */
  team_id?: string;
  /** Whether the event occurred in an externally shared channel */
  is_ext_shared_channel?: boolean;
  /** Authorization information for the event */
  authorizations?: EventApiAuthorization[];
  /** Legacy verification token (deprecated, use signing secret instead) */
  token?: string;

  /** The callback_id for shortcuts and message actions */
  callback_id?: string;

  /** The list of actions triggered in block_actions payloads */
  actions: {
    /** The type of interactive element (e.g., "button", "static_select") */
    type: string;
    /** The block_id of the block containing this action */
    block_id: string;
    /** The action_id identifying this specific action */
    action_id: string;
  }[];

  /** The block_id for block_suggestion payloads (external data source) */
  block_id?: string;
  /** The action_id for block_suggestion payloads */
  action_id?: string;

  /** The view data for view_submission and view_closed payloads */
  view?: {
    /** The callback_id of the view */
    callback_id: string;
  };
}

/**
 * Authorization information included in Events API payloads.
 * Contains details about the authorized installation that received the event.
 */
export interface EventApiAuthorization {
  /** The enterprise ID if the app is installed in an Enterprise Grid organization, null otherwise */
  enterprise_id: string | null;
  /** The workspace ID where the app is installed, null for org-wide installations */
  team_id: string | null;
  /** The user ID of the authorized user or bot */
  user_id: string;
  /** Whether the authorization is for a bot user */
  is_bot: boolean;
  /** Whether this is an org-wide (enterprise) installation */
  is_enterprise_install?: boolean;
}
