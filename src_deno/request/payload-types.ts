/**
 * Types of payload data
 */
export enum PayloadType {
  // app.action listeners
  BlockAction = "block_actions",
  // app.options listeners
  BlockSuggestion = "block_suggestion",
  // app.shortcut listeners
  MessageShortcut = "message_action",
  // app.shortcut listeners
  GlobalShortcut = "shortcut",
  // app.event listeners
  EventsAPI = "event_callback",
  // app.view listeners
  ViewSubmission = "view_submission",
  // app.view listeners
  ViewClosed = "view_closed",
  // app rate limited listeners
  AppRateLimited = "app_rate_limited",
  // Note that Slash command payloads do not have "type" property
}
