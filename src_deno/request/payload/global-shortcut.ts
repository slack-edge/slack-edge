// ------------------------------------------
// The Global Shortcut payload
// ------------------------------------------
//
// Global shortcuts are available to users via the shortcuts button in the message composer, and when using search in Slack. If you're using Bolt framework, you can handle this pattern using app.shortcut listners.
//
// These type of shortcuts are intended to trigger workflows that can operate without the context of a channel or message.
//
// For example, users might trigger a global shortcut to create a calendar event or view their upcoming on-call shifts.
//
// See: https://api.slack.com/interactivity/shortcuts

export interface GlobalShortcut {
  type: "shortcut";
  callback_id: string;
  trigger_id: string;
  user: {
    id: string;
    username: string;
    team_id: string;
  };
  team: {
    id: string;
    domain: string;
    enterprise_id?: string;
    enterprise_name?: string;
  } | null;
  token: string;
  action_ts: string;
  is_enterprise_install?: boolean;
  enterprise?: { id: string; name: string };
}
