import {
  AnyMessageBlock,
  AnyOption,
  Confirm,
  MessageAttachment,
  MessageMetadata,
  PlainTextField,
} from "https://deno.land/x/slack_web_api_client@1.1.5/mod.ts";
import { DataSubmissionView, ViewStateValue } from "./view-objects.ts";
import { BotProfile } from "./event.ts";

// ------------------------------------------
// The block_actions payload
// ------------------------------------------
//
// A block_actions payload is received when a user interacts with a Block Kit interactive component.
// Read our guide to handling payloads from user interactions to learn how your app should process and respond to these payloads.
// If you use Bolt framework, you can handle this pattern using app.action listners.
//
// Timing of payload dispatch:
// --------------------------
// |Component|	Payload sent|
// |button| When the button is clicked.|
// |checkboxes| When a checkbox is ticked or unticked.|
// When a checkbox is ticked or unticked.|
// |datepicker| When a date is chosen and the date picker closes.|
// |multi_*_select| Each time an item is chosen from the multi-select menu.|
// |overflow| When an item from the overflow menu is clicked.|
// |plain_text_input| Determined by the dispatch_action_config field in the element.|
// |radio| When the selected radio in a group of radio buttons is changed.|
// |*_select| When an item is chosen from the select menu.|
// |rich_text_input| Determined by the dispatch_action_config field in the element.|
// --------------------------
//
// Deselecting the currently selected option of a Block Kit static option will return a null value. For more information about select menu elements, refer to select menu of static options.
// To send this block_actions payload for interactive components used within input blocks, you can set dispatch_action to true in those input blocks. They are included in view_submission payloads as well.
//
// See: https://api.slack.com/reference/interaction-payloads/block-actions

export type BlockAction<A extends BlockElementAction> =
  | MessageBlockAction<A>
  | ViewBlockAction<A>;

// To narrow the type down to this, you can have either `if ("message" in payload) { ... }` or SourceSpecifiedBlockActionAckHandler
export type MessageBlockAction<A extends BlockElementAction> =
  & BaseBlockAction<A>
  & {
    channel: {
      id: string;
      name: string;
    };
    message: {
      type: "message";
      user?: string;
      ts: string;
      thread_ts?: string;
      text: string;
      metadata?: MessageMetadata;
      blocks?: AnyMessageBlock[];
      attachments?: MessageAttachment[];
      bot_id?: string;
      bot_profile?: BotProfile;
      edited?: {
        user: string;
        ts: string;
      };
      // deno-lint-ignore no-explicit-any
      [key: string]: any;
    };
    container:
      | {
        type: "message";
        message_ts: string;
        channel_id: string;
        is_ephemeral: boolean;
      }
      | {
        type: "message_attachment";
        message_ts: string;
        attachment_id: number;
        channel_id: string;
        is_ephemeral: boolean;
        is_app_unfurl: boolean;
        app_unfurl_url?: string;
        thread_ts?: string;
      };
    app_unfurl?: {
      id: string;
      app_id: string;
      bot_id: string;
      fallback: string;
      app_unfurl_url: string;
      is_app_unfurl: boolean;
    };
    response_url?: string;
  };

// To narrow the type down to this, you can have either `if ("view" in payload) { ... }` or SourceSpecifiedBlockActionAckHandler
export type ViewBlockAction<A extends BlockElementAction> =
  & BaseBlockAction<A>
  & {
    view: DataSubmissionView;
    container: {
      type: "view";
      view_id: string;
    };
  };

export interface BaseBlockAction<A extends BlockElementAction> {
  type: "block_actions";
  actions: A[];
  trigger_id: string;
  api_app_id: string;
  is_enterprise_install?: boolean;
  enterprise?: {
    id: string;
    name: string;
  };
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
  // state can exist even for a payload from a message block
  state: {
    values: {
      [blockId: string]: {
        [actionId: string]: ViewStateValue;
      };
    };
  };
  // only for a workflow custom step
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
  token: string; // legacy verification token
}

// ------------------------------------------
// Block element actions
// ------------------------------------------

export interface BlockElementAction<T extends string = string> {
  type: T;
  block_id: string;
  action_id: string;
  action_ts: string;
}

export interface ButtonAction extends BlockElementAction<"button"> {
  value: string;
  text: PlainTextField;
  url?: string;
  confirm?: Confirm;
  accessibility_label?: string;
}

export interface StaticSelectAction
  extends BlockElementAction<"static_select"> {
  selected_option: {
    text: PlainTextField;
    value: string;
  };
  initial_option?: AnyOption;
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface MultiStaticSelectAction
  extends BlockElementAction<"multi_static_select"> {
  selected_options: {
    text: PlainTextField;
    value: string;
  }[];
  initial_options?: AnyOption[];
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface UsersSelectAction extends BlockElementAction<"users_select"> {
  selected_user: string;
  initial_user?: string;
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface MultiUsersSelectAction
  extends BlockElementAction<"multi_users_select"> {
  selected_users: string[];
  initial_users?: string[];
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface ConversationsSelectAction
  extends BlockElementAction<"conversations_select"> {
  selected_conversation: string;
  initial_conversation?: string;
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface MultiConversationsSelectAction
  extends BlockElementAction<"multi_conversations_select"> {
  selected_conversations: string[];
  initial_conversations?: string[];
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface ChannelsSelectAction
  extends BlockElementAction<"channels_select"> {
  selected_channel: string;
  initial_channel?: string;
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface MultiChannelsSelectAction
  extends BlockElementAction<"multi_channels_select"> {
  selected_channels: string[];
  initial_channels?: string[];
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface ExternalSelectAction
  extends BlockElementAction<"external_select"> {
  selected_option?: AnyOption;
  initial_option?: AnyOption;
  placeholder?: PlainTextField;
  min_query_length?: number;
  confirm?: Confirm;
}

export interface MultiExternalSelectAction
  extends BlockElementAction<"multi_external_select"> {
  selected_options?: AnyOption[];
  initial_options?: AnyOption[];
  placeholder?: PlainTextField;
  min_query_length?: number;
  confirm?: Confirm;
}

export interface OverflowAction extends BlockElementAction<"overflow"> {
  selected_option: {
    text: PlainTextField;
    value: string;
  };
  confirm?: Confirm;
}

export interface DatepickerAction extends BlockElementAction<"datepicker"> {
  selected_date: string | null;
  initial_date?: string;
  placeholder?: PlainTextField;
  confirm?: Confirm;
}

export interface RadioButtonsAction
  extends BlockElementAction<"radio_buttons"> {
  selected_option: AnyOption | null;
  initial_option?: AnyOption;
  confirm?: Confirm;
}

export interface CheckboxesAction extends BlockElementAction<"checkboxes"> {
  selected_options: AnyOption[];
  initial_options?: AnyOption[];
  confirm?: Confirm;
}

export interface PlainTextInputAction
  extends BlockElementAction<"plain_text_input"> {
  value: string;
}

export type BlockElementActions =
  | ButtonAction
  | StaticSelectAction
  | MultiStaticSelectAction
  | UsersSelectAction
  | MultiUsersSelectAction
  | ConversationsSelectAction
  | MultiConversationsSelectAction
  | ChannelsSelectAction
  | MultiChannelsSelectAction
  | ExternalSelectAction
  | MultiExternalSelectAction
  | OverflowAction
  | DatepickerAction
  | RadioButtonsAction
  | CheckboxesAction
  | PlainTextInputAction;

export type BlockElementTypes = BlockElementActions["type"];
