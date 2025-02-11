import { DataSubmissionView } from "./view-objects";

// ------------------------------------------
// The view_submission payload
// ------------------------------------------
//
// Sent to an app's configured Request URL when a user submits a view in a modal.
// Read our guide to using modals to learn how your app should process and respond to these payloads.
// If you're using Bolt framework, you can handle this pattern using app.view listners.
//
// See: https://api.slack.com/reference/interaction-payloads/views#view_submission

export interface ViewSubmission {
  type: "view_submission";
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
  trigger_id: string;
  is_enterprise_install?: boolean;
  enterprise?: {
    id: string;
    name: string;
  };
  /**
   * (Deprecated for workflow apps) An array of objects that contain response_url values, used to send message responses. Each object will also contain block_id and action_id values to identify the source of the interaction. Also included is a channel_id which identifies where the response_url will publish to. response_urls is available only when the view contained block elements configured to generate a response_url.
   */
  response_urls?: {
    block_id: string;
    action_id: string;
    channel_id: string;
    response_url: string;
  }[];
  // ------------------------------------------
  // remote functions / custom workflow steps
  // ------------------------------------------
  /**
   * A workflow (just-in-time) token generated for this view submission.
   */
  bot_access_token?: string;
  /**
   * Metadata about the function execution that generated the view where this view submission took place.
   */
  function_data?: {
    execution_id: string;
    function: { callback_id: string };
    inputs: {
      // deno-lint-ignore no-explicit-any
      [key: string]: any;
    };
  };
  /**
   * An interactivity object generated as a result of the view submission.
   */
  interactivity?: {
    interactivity_pointer: string;
    interactor: { id: string; secret: string };
  };
}
