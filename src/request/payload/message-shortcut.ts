// ------------------------------------------
// The Message Shortcut payload
// ------------------------------------------
//
// Message shortcuts are shown to users in the context menus of non-ephemeral messages within Slack. If you're using Bolt framework, you can handle this pattern using app.shortcut listners.
//
// Message shortcuts will retain the context of the source message from which they were initiated. This makes them ideal when you have a workflow that relies on that context to work.
// For example, users might quickly generate tasks from a posted message, or send messages to external services. Think about what app invocation points belong in a global context versus which belong in a message context. For example, pretend you're building a task management app. An example of a shortcut that makes sense in a global context would be Create a task, whereas a shortcut that belongs in a message context would be Attach to a task, which could attach the specific message to an existing task.
//
// See: https://api.slack.com/interactivity/shortcuts

export interface MessageShortcut {
  type: "message_action";
  callback_id: string;
  trigger_id: string;
  message_ts: string;
  response_url: string;
  message: {
    type: "message";
    user?: string;
    ts: string;
    text?: string;
    // deno-lint-ignore no-explicit-any
    [key: string]: any;
  };
  user: {
    id: string;
    name: string;
    team_id?: string;
    username?: string;
  };
  channel: {
    id: string;
    name: string;
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
  enterprise?: {
    id: string;
    name: string;
  };
}
