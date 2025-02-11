import { AnyOption } from "https://deno.land/x/slack_web_api_client@1.1.5/mod.ts";
import { DataSubmissionView } from "./view-objects.ts";

// ------------------------------------------
// The block_actions payload
// ------------------------------------------
//
// A block_suggestion payload is received when a user interacts with a select menu of external data source element. Users may return a maximum of 100 options or option groups when handling the block_suggestion payload. If you're using Bolt framework, you can handle this pattern using app.options listners.
//
// Read our guide to handling payloads from user interactions to learn how your app should process and respond to these payloads.
// Properties received in a block_suggestion event may differ based on the source of the interactive elements—a modal view, message, or home tab surface. A check in the column means that property is included in a block_suggestion event sent to a function, a non-function, or both. Functions refer to workflow apps; refer to workflow automations Interactivity overview for more information.
//
// See: https://api.slack.com/reference/interaction-payloads/block-suggestion

export interface BlockSuggestion {
  type: "block_suggestion";
  block_id: string;
  action_id: string;
  value: string;
  api_app_id: string;
  team: {
    id: string;
    domain: string;
    enterprise_id?: string;
    enterprise_name?: string;
  } | null;
  channel?: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    team_id?: string;
  };
  token: string;
  // deno-lint-ignore no-explicit-any
  container: any;
  view?: DataSubmissionView;
  is_enterprise_install?: boolean;
  enterprise?: {
    id: string;
    name: string;
  };
}

export interface BlockOptions {
  options: AnyOption[];
}

export interface OptionGroups<Options> {
  option_groups: ({ label: string } & Options)[];
}
