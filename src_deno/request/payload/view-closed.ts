import { DataSubmissionView } from "./view-objects.ts";

// ------------------------------------------
// The view_closed payload
// ------------------------------------------
//
// Optionally sent to an app's configured Request URL when a user dismisses a modal. To receive these payloads, the modal view must have been created with the notify_on_close argument set to true.
// Read our guide to using modals to learn how your app should process and respond to these payloads.
// If you're using Bolt framework, you can handle this pattern using app.view listners.
//
// See: https://api.slack.com/reference/interaction-payloads/views#view_closed

export interface ViewClosed {
  type: "view_closed";
  team: {
    id: string;
    domain: string;
    enterprise_id?: string;
    enterprise_name?: string;
  } | null;
  user: {
    id: string;
    name: string;
    team_id?: string;
  };
  view: DataSubmissionView;
  api_app_id: string;
  token: string;
  /**
   * A boolean that represents whether or not a whole view stack was cleared.
   */
  is_cleared: boolean;
  is_enterprise_install?: boolean;
  enterprise?: { id: string; name: string };
  // remote functions
  bot_access_token?: string;
  function_data?: {
    execution_id: string;
    function: { callback_id: string };
    inputs: {
      // deno-lint-ignore no-explicit-any
      [key: string]: any;
    };
  };
  interactivity?: {
    interactivity_pointer: string;
    interactor: { id: string; secret: string };
  };
}
