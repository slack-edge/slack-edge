/**
 * Enum representing the different types of payload data that can be received from Slack.
 * These correspond to the `type` field in Slack request payloads.
 *
 * Note: Slash command payloads do not have a `type` property and are identified
 * by the presence of the `command` field instead.
 */
export enum PayloadType {
  /**
   * Block action payload - triggered when a user interacts with a Block Kit interactive component
   * (e.g., button click, select menu selection). Handled by `app.action()` listeners.
   */
  BlockAction = "block_actions",

  /**
   * Block suggestion payload - triggered when a user types in an external select menu
   * that needs to fetch options from an external data source. Handled by `app.options()` listeners.
   */
  BlockSuggestion = "block_suggestion",

  /**
   * Message shortcut payload - triggered when a user invokes a shortcut from a message's
   * context menu (three dots menu). Handled by `app.shortcut()` listeners.
   */
  MessageShortcut = "message_action",

  /**
   * Global shortcut payload - triggered when a user invokes a global shortcut from the
   * shortcuts menu or search bar. Handled by `app.shortcut()` listeners.
   */
  GlobalShortcut = "shortcut",

  /**
   * Events API callback payload - wraps event data when Slack sends events to your app
   * (e.g., message events, app_mention, reaction_added). Handled by `app.event()` listeners.
   */
  EventsAPI = "event_callback",

  /**
   * View submission payload - triggered when a user submits a modal view.
   * Handled by `app.view()` listeners with type "view_submission".
   */
  ViewSubmission = "view_submission",

  /**
   * View closed payload - triggered when a user closes a modal view using the cancel button
   * or by clicking outside the modal (if notify_on_close is true). Handled by `app.view()` listeners.
   */
  ViewClosed = "view_closed",

  /**
   * App rate limited payload - sent when your app is being rate limited.
   * This indicates the app should slow down its API calls.
   */
  AppRateLimited = "app_rate_limited",
}
