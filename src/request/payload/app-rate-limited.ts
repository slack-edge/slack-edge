// ------------------------------------------
// The app_rate_limited payload
// ------------------------------------------
//
// The app_rate_limited event is a special Events API-only event type has no "inner event".
// This event type is only dispatched when your app is rate limited on the Events API.
// Rate limiting currently occurs when:
// 1. Your app would receive more than 30,000 events in an hour from a single workspace.
// OR
// 2. Your app does not respond with a HTTP 200 OK to at 5% of event deliveries in the past 60 minutes.
//
// See: https://api.slack.com/events/app_rate_limited

export interface AppRateLimited {
  type: "app_rate_limited";
  token: string;
  team_id: string;
  minute_rate_limited: number;
  api_app_id: string;
}
