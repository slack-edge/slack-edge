import { AnyOption } from "https://deno.land/x/slack_web_api_client@1.1.5/mod.ts";
import { DataSubmissionView } from "./view-objects.ts";

/**
 * block_suggestion payload data
 */
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
