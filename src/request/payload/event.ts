import { AnyEventType, AnyMessageBlock, HomeTabView, MessageAttachment, MessageMetadata } from "slack-web-api-client";

// ------------------------------------------
// The Events API payloads
// ------------------------------------------
//
// The Events API is a streamlined way to build apps and bots that respond to activities in Slack. When you use the Events API, Slack calls you. If you're using Bolt framework, you can handle this pattern using app.event listners.
//
// You have two options: you can either use Socket Mode or you can designate a public HTTP endpoint that your app listens on, choose what events to subscribe to, and voilà: Slack sends the appropriate events to you. Learn more about the differences between Socket Mode and HTTP here.
//
// All you need is a Slack app and a secure place for us to send your events. With the Events API, you can do the following:
//
// - Tell Slack where to send your event types and we'll deliver them with grace, security, and respect. We'll even retry when things don't work out. The event types sent to you are directly tied to the OAuth permission scopes awarded as users install your Slack app.
// - Subscribe to only the event types you want; don't worry about the ones you don't need.
// - Subscribe your Slack apps to events related to channels and direct messages they are party to. Build bots without a bothersome bevy of Real Time Messaging (RTM) API WebSockets.
//
// Many apps built using the Events API will follow the same abstract event-driven sequence:
//
// - A user creates a circumstance that triggers an event subscription to your application.
// - Your server receives a payload of JSON describing that event.
// - Your server acknowledges receipt of the event.
// - Your business logic decides what to do about that event.
// - Your server carries out that decision.
//
// If your app is a bot listening to messages with specific trigger phrases, that event loop may play out something like the following:
//
// - Members send messages in a channel the bot belongs to—the #random channel. The messages are about lots of things, but some of them contain today's secret word.
// - Your server receives a message.channels event, as per its bot subscription and membership in the #random channel.
// - Your server responds with a swift and confident HTTP 200 OK.
// - Your bot is trained to listen for today's secret word, and having found it, decides to send a message to the channel, encouraging everyone to keep that word secret.
// - Your server uses chat.postMessage from the Web API to post that message to #random.
//
// Using the Web API with the Events API empowers your app or bot to do much more than just listen and reply to messages.
//
// See: https://api.slack.com/apis/events-api

export type AnySlackEvent =
  | AppRequestedEvent
  | AppInstalledEvent
  | AppUninstalledTeamEvent
  | AppDeletedEvent
  | AppHomeOpenedEvent
  | AppMentionEvent
  | AppUninstalledEvent
  | AssistantThreadStartedEvent
  | AssistantThreadContextChangedEvent
  | ChannelArchiveEvent
  | ChannelCreatedEvent
  | ChannelDeletedEvent
  | ChannelHistoryChangedEvent
  | ChannelIDChangedEvent
  | ChannelLeftEvent
  | ChannelRenameEvent
  | ChannelSharedEvent
  | ChannelUnarchiveEvent
  | ChannelUnsharedEvent
  | DNDUpdatedEvent
  | DNDUpdatedUserEvent
  | EmailDomainChangedEvent
  | EmojiChangedEvent
  | FileChangeEvent
  | FileCreatedEvent
  | FileDeletedEvent
  | FilePublicEvent
  | FileSharedEvent
  | FileUnsharedEvent
  | FunctionExecutedEvent
  | GridMigrationFinishedEvent
  | GridMigrationStartedEvent
  | GroupArchiveEvent
  | GroupCloseEvent
  | GroupDeletedEvent
  | GroupHistoryChangedEvent
  | GroupLeftEvent
  | GroupOpenEvent
  | GroupRenameEvent
  | GroupUnarchiveEvent
  | IMCloseEvent
  | IMCreatedEvent
  | IMHistoryChangedEvent
  | IMOpenEvent
  | InviteRequestedEvent
  | LinkSharedEvent
  | MemberJoinedChannelEvent
  | MemberLeftChannelEvent
  | AnyMessageEvent
  | AnyMessageMetadataEvent
  | PinAddedEvent
  | PinRemovedEvent
  | ReactionAddedEvent
  | ReactionRemovedEvent
  | SharedChannelInviteReceivedEvent
  | SharedChannelInviteAcceptedEvent
  | SharedChannelInviteApprovedEvent
  | SharedChannelInviteDeclinedEvent
  | SharedChannelInviteRequestedEvent
  | StarAddedEvent
  | StarRemovedEvent
  | SubteamCreatedEvent
  | SubteamMembersChangedEvent
  | SubteamSelfAddedEvent
  | SubteamSelfRemovedEvent
  | SubteamUpdatedEvent
  | TeamAccessGrantedEvent
  | TeamAccessRevokedEvent
  | TeamDomainChangeEvent
  | TeamJoinEvent
  | TeamRenameEvent
  | TokensRevokedEvent
  | UserChangeEvent
  | UserHuddleChangedEvent
  | UserProfileChangedEvent
  | UserStatusChangedEvent
  | WorkflowDeletedEvent
  | WorkflowPublishedEvent
  | WorkflowUnpublishedEvent
  | WorkflowStepDeletedEvent
  | WorkflowStepExecuteEvent;

// These union types may not be a complete set of events
export type AnySlackEventWithChannelId =
  | AppHomeOpenedEvent
  | AppMentionEvent
  | AppUninstalledEvent
  | AssistantThreadStartedEvent
  | AssistantThreadContextChangedEvent
  | ChannelArchiveEvent
  | ChannelCreatedEvent
  | ChannelDeletedEvent
  | ChannelIDChangedEvent
  | ChannelLeftEvent
  | ChannelRenameEvent
  | ChannelSharedEvent
  | ChannelUnarchiveEvent
  | ChannelUnsharedEvent
  | FileSharedEvent
  | FileUnsharedEvent
  | GroupArchiveEvent
  | GroupCloseEvent
  | GroupDeletedEvent
  | GroupLeftEvent
  | GroupOpenEvent
  | GroupRenameEvent
  | GroupUnarchiveEvent
  | IMCloseEvent
  | IMCreatedEvent
  | IMOpenEvent
  | InviteRequestedEvent
  | LinkSharedEvent
  | MemberJoinedChannelEvent
  | MemberLeftChannelEvent
  | AnyMessageEvent
  | AnyMessageMetadataEvent
  | PinAddedEvent
  | PinRemovedEvent
  | ReactionAddedEvent
  | ReactionRemovedEvent
  | SharedChannelInviteReceivedEvent
  | SharedChannelInviteAcceptedEvent
  | SharedChannelInviteApprovedEvent
  | SharedChannelInviteDeclinedEvent
  | StarAddedEvent
  | StarRemovedEvent;

// These union types may not be a complete set of events
export type AnySlackAssistantThreadEvent =
  | AssistantThreadStartedEvent
  | AssistantThreadContextChangedEvent
  | GenericMessageEvent
  | FileShareMessageEvent;

export type SupportedEventType =
  | AnyEventType
  // TODO: confirming Slack support team if these are really deleted
  | "user_status_changed"
  | "user_profile_changed"
  | "user_huddle_changed";

/**
 * Events API payload data
 */
export interface SlackEvent<Type extends SupportedEventType> {
  type: Type;
  subtype?: string;
}

export interface AppRequestedEvent extends SlackEvent<"app_requested"> {
  type: "app_requested";
  app_request: {
    id: string;
    app: {
      id: string;
      name: string;
      description: string;
      help_url: string;
      privacy_policy_url: string;
      app_homepage_url: string;
      app_directory_url: string;
      is_app_directory_approved: boolean;
      is_internal: boolean;
      additional_info: string;
      icons?: {
        image_32?: string;
        image_36?: string;
        image_48?: string;
        image_64?: string;
        image_72?: string;
        image_96?: string;
        image_128?: string;
        image_192?: string;
        image_512?: string;
        image_1024?: string;
        image_original?: string;
      };
    };
  };
  previous_resolution: {
    status: "approved" | "restricted";
    scopes: {
      name: string;
      description: string;
      is_dangerous: boolean;
      token_type: "bot" | "user" | "app" | null;
    };
  } | null;
  is_user_app_collaborator: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  team: {
    id: string;
    name: string;
    domain: string;
  };
  scopes: {
    name: string;
    description: string;
    is_dangerous: boolean;
    token_type: "bot" | "user" | "app" | null;
  };
  message: string;
  date_created: number;
}

export interface AppHomeOpenedEvent extends SlackEvent<"app_home_opened"> {
  type: "app_home_opened";
  user: string;
  channel: string;
  tab: "home" | "messages";
  view?: HomeTabView;
  event_ts: string;
}

export interface AppInstalledEvent extends SlackEvent<"app_installed"> {
  type: "app_installed";
  app_id: string;
  app_name: string;
  app_owner_id: string;
  user_id: string;
  team_id: string;
  team_domain: string;
  event_ts: string;
}

export interface AppDeletedEvent extends SlackEvent<"app_deleted"> {
  type: "app_deleted";
  app_id: string;
  app_name: string;
  app_owner_id: string;
  team_id: string;
  team_domain: string;
  event_ts: string;
}
export interface AppUninstalledTeamEvent extends SlackEvent<"app_uninstalled_team"> {
  type: "app_uninstalled_team";
  app_id: string;
  app_name: string;
  app_owner_id: string;
  team_id: string;
  team_domain: string;
  user_id: string;
  event_ts: string;
}

export interface AppMentionEvent extends SlackEvent<"app_mention"> {
  type: "app_mention";
  client_msg_id?: string;
  subtype?: string;
  bot_id?: string;
  bot_profile?: BotProfile;
  username?: string;
  team?: string;
  // user_team, source_team, and user_profile
  // can exist when the user who mentioned this bot is in a different workspace/org
  user_team?: string;
  source_team?: string;
  user_profile?: {
    name: string;
    first_name: string;
    real_name: string;
    display_name: string;
    team: string;
    is_restricted?: boolean;
    is_ultra_restricted?: boolean;
    avatar_hash?: string;
    image_72?: string;
  };
  user?: string;
  text: string;
  attachments?: MessageAttachment[];
  blocks?: AnyMessageBlock[];
  files?: FileElement[];
  upload?: boolean;
  display_as_bot?: boolean;
  edited?: {
    user: string;
    ts: string;
  };
  ts: string;
  channel: string;
  event_ts: string;
  thread_ts?: string;
}

export interface AppUninstalledEvent extends SlackEvent<"app_uninstalled"> {
  type: "app_uninstalled";
}

export interface AssistantThreadStartedEvent extends SlackEvent<"assistant_thread_started"> {
  type: "assistant_thread_started";
  assistant_thread: {
    user_id: string;
    context: {
      channel_id?: string;
      team_id?: string;
      enterprise_id?: string | null;
    };
    channel_id: string;
    thread_ts: string;
  };
  event_ts: string;
}
export interface AssistantThreadContextChangedEvent extends SlackEvent<"assistant_thread_context_changed"> {
  type: "assistant_thread_context_changed";
  assistant_thread: {
    user_id: string;
    context: {
      channel_id: string;
      team_id: string;
      enterprise_id: string | null;
    };
    channel_id: string;
    thread_ts: string;
  };
  event_ts: string;
}

export interface ChannelArchiveEvent extends SlackEvent<"channel_archive"> {
  type: "channel_archive";
  channel: string;
  user: string;
  is_moved?: number;
  event_ts: string;
}

export interface ChannelCreatedEvent extends SlackEvent<"channel_created"> {
  type: "channel_created";
  channel: {
    id: string;
    is_channel: boolean;
    name: string;
    name_normalized: string;
    created: number;
    creator: string;
    is_group: boolean;
    is_im: boolean;
    is_mpim: boolean;
    is_private: boolean;
    is_archived: boolean;
    is_general: boolean;
    is_shared: boolean;
    is_org_shared: boolean;
    is_moved?: number;
    updated?: number;
    unlinked?: number;
    context_team_id?: string;
    is_pending_ext_shared?: boolean;
    pending_shared?: string[];
    is_ext_shared?: boolean;
    shared_team_ids?: string[];
    internal_team_ids?: string[];
    pending_connected_team_ids?: string[];
    topic?: {
      value: string;
      creator: string;
      last_set: number;
    };
    purpose?: {
      value: string;
      creator: string;
      last_set: number;
    };
    previous_names?: string[];
  };
}

export interface ChannelDeletedEvent extends SlackEvent<"channel_deleted"> {
  type: "channel_deleted";
  channel: string;
  actor_id: string;
}

export interface ChannelHistoryChangedEvent extends SlackEvent<"channel_history_changed"> {
  type: "channel_history_changed";
  latest: string;
  ts: string;
  event_ts: string;
}

export interface ChannelIDChangedEvent extends SlackEvent<"channel_id_changed"> {
  type: "channel_id_changed";
  old_channel_id: string;
  new_channel_id: string;
  event_ts: string;
}

export interface ChannelLeftEvent extends SlackEvent<"channel_left"> {
  type: "channel_left";
  channel: string;
  actor_id: string;
  event_ts: string;
}

export interface ChannelRenameEvent extends SlackEvent<"channel_rename"> {
  type: "channel_rename";
  channel: {
    id: string;
    name: string;
    name_normalized: string;
    created: number;
    is_channel: boolean;
    is_mpim: boolean;
  };
  event_ts: string;
}

export interface ChannelSharedEvent extends SlackEvent<"channel_shared"> {
  type: "channel_shared";
  connected_team_id: string;
  channel: string;
  event_ts: string;
}

export interface ChannelUnarchiveEvent extends SlackEvent<"channel_unarchive"> {
  type: "channel_unarchive";
  channel: string;
  user: string;
  event_ts: string;
}

export interface ChannelUnsharedEvent extends SlackEvent<"channel_unshared"> {
  type: "channel_unshared";
  previously_connected_team_id: string;
  channel: string;
  is_ext_shared: boolean;
  event_ts: string;
}

export interface DNDUpdatedEvent extends SlackEvent<"dnd_updated"> {
  type: "dnd_updated";
  user: string;
  dnd_status: {
    dnd_enabled: boolean;
    next_dnd_start_ts: number;
    next_dnd_end_ts: number;
    snooze_enabled: boolean;
    snooze_endtime: number;
    snooze_remaining: number;
  };
  event_ts: string;
}

export interface DNDUpdatedUserEvent extends SlackEvent<"dnd_updated_user"> {
  type: "dnd_updated_user";
  user: string;
  dnd_status: {
    dnd_enabled: boolean;
    next_dnd_start_ts: number;
    next_dnd_end_ts: number;
  };
  event_ts: string;
}

export interface EmailDomainChangedEvent extends SlackEvent<"email_domain_changed"> {
  type: "email_domain_changed";
  email_domain: string;
  event_ts: string;
}

// NOTE: this should probably be broken into its two subtypes
export interface EmojiChangedEvent extends SlackEvent<"emoji_changed"> {
  type: "emoji_changed";
  subtype: "add" | "remove" | "rename";
  names?: string[]; // only for remove
  name?: string; // only for add
  value?: string; // only for add
  old_name?: string;
  new_name?: string;
  event_ts: string;
}

export interface FileChangeEvent extends SlackEvent<"file_change"> {
  type: "file_change";
  file_id: string;
  file: { id: string };
}

export interface FileCreatedEvent extends SlackEvent<"file_created"> {
  type: "file_created";
  file_id: string;
  user_id: string;
  file: { id: string };
  event_ts: string;
}

export interface FileDeletedEvent extends SlackEvent<"file_deleted"> {
  type: "file_deleted";
  file_id: string;
  channel_ids?: string[];
  event_ts: string;
}

export interface FilePublicEvent extends SlackEvent<"file_public"> {
  type: "file_public";
  file_id: string;
  user_id: string;
  file: { id: string };
  event_ts: string;
}

export interface FileSharedEvent extends SlackEvent<"file_shared"> {
  type: "file_shared";
  file_id: string;
  user_id: string;
  file: { id: string };
  channel_id: string;
  event_ts: string;
}

export interface FileUnsharedEvent extends SlackEvent<"file_unshared"> {
  type: "file_unshared";
  file_id: string;
  user_id: string;
  file: { id: string };
  channel_id: string;
  event_ts: string;
}

export interface FunctionExecutedEvent extends SlackEvent<"function_executed"> {
  type: "function_executed";
  function: {
    id: string;
    callback_id: string;
    title: string;
    description?: string;
    type: "app";
    input_parameters: {
      type: string;
      name: string;
      description?: string;
      title?: string;
      is_required: boolean;
      hint?: string;
    }[];
    output_parameters: {
      type: string;
      name: string;
      description?: string;
      title?: string;
      is_required: boolean;
      hint?: string;
    }[];
    app_id: string;
    date_created: number;
    date_updated: number;
    date_deleted: number;
    form_enabled: boolean;
  };
  inputs: {
    // deno-lint-ignore no-explicit-any
    [key: string]: any;
  };
  function_execution_id: string;
  workflow_execution_id: string;
  bot_access_token: string; // xwfp-...
  event_ts: string;
}

export interface GridMigrationFinishedEvent extends SlackEvent<"grid_migration_finished"> {
  type: "grid_migration_finished";
  enterprise_id: string;
}

export interface GridMigrationStartedEvent extends SlackEvent<"grid_migration_started"> {
  type: "grid_migration_started";
  enterprise_id: string;
}

export interface GroupArchiveEvent extends SlackEvent<"group_archive"> {
  type: "group_archive";
  channel: string;
  user: string;
  is_moved: number;
  event_ts: string;
}

export interface GroupCloseEvent extends SlackEvent<"group_close"> {
  type: "group_close";
  user: string;
  channel: string;
}

export interface GroupDeletedEvent extends SlackEvent<"group_deleted"> {
  type: "group_deleted";
  channel: string;
  date_deleted: number;
  actor_id: string;
  event_ts: string;
}

export interface GroupHistoryChangedEvent extends SlackEvent<"group_history_changed"> {
  type: "group_history_changed";
  latest: string;
  ts: string;
  event_ts: string;
}

export interface GroupLeftEvent extends SlackEvent<"group_left"> {
  type: "group_left";
  channel: string;
  actor_id: string;
  event_ts: string;
}

export interface GroupOpenEvent extends SlackEvent<"group_open"> {
  type: "group_open";
  user: string;
  channel: string;
}

export interface GroupRenameEvent extends SlackEvent<"group_rename"> {
  type: "group_rename";
  channel: {
    id: string;
    name: string;
    name_normalized: string;
    created: number;
    is_channel: boolean;
    is_mpim: boolean;
  };
  event_ts: string;
}

export interface GroupUnarchiveEvent extends SlackEvent<"group_unarchive"> {
  type: "group_unarchive";
  channel: string;
  actor_id: string;
  event_ts: string;
}

export interface IMCloseEvent extends SlackEvent<"im_close"> {
  type: "im_close";
  user: string;
  channel: string;
  event_ts: string;
}

export interface IMCreatedEvent extends SlackEvent<"im_created"> {
  type: "im_created";
  user: string;
  channel: { id: string };
}

export interface IMHistoryChangedEvent extends SlackEvent<"im_history_changed"> {
  type: "im_history_changed";
  latest: string;
  ts: string;
  event_ts: string;
}

export interface IMOpenEvent extends SlackEvent<"im_open"> {
  type: "im_open";
  user: string;
  channel: string;
  event_ts: string;
}

export interface InviteRequestedEvent extends SlackEvent<"invite_requested"> {
  type: "invite_requested";
  invite_request: {
    id: string;
    email: string;
    date_created: number;
    requester_ids: string[];
    channel_ids: string[];
    invite_type: "restricted" | "ultra_restricted" | "full_member";
    real_name: string;
    date_expire: number;
    request_reason: string;
    team: {
      id: string;
      name: string;
      domain: string;
    };
  };
}

export interface LinkSharedEvent extends SlackEvent<"link_shared"> {
  type: "link_shared";
  channel: string;
  is_bot_user_member: boolean;
  user: string;
  message_ts: string;
  thread_ts?: string;
  links: {
    domain: string;
    url: string;
  }[];
  unfurl_id?: string;
  source?: string;
  event_ts: string;
}

export interface MemberJoinedChannelEvent extends SlackEvent<"member_joined_channel"> {
  type: "member_joined_channel";
  user: string;
  channel: string;
  channel_type: string;
  team: string;
  inviter?: string;
  event_ts: string;
}

export interface MemberLeftChannelEvent extends SlackEvent<"member_left_channel"> {
  type: "member_left_channel";
  user: string;
  channel: string;
  channel_type: string;
  team: string;
  event_ts: string;
}

export interface PinAddedEvent extends SlackEvent<"pin_added"> {
  type: "pin_added";
  user: string;
  channel_id: string;
  item: PinnedItem;
  item_user: string;
  pin_count: string;
  pinned_info: {
    channel: string;
    pinned_by: string;
    pinned_ts: number;
  };
  event_ts: string;
}
export interface PinRemovedEvent extends SlackEvent<"pin_removed"> {
  type: "pin_removed";
  user: string;
  channel_id: string;
  item: PinnedItem;
  item_user: string;
  pin_count: string;
  pinned_info: {
    channel: string;
    pinned_by: string;
    pinned_ts: number;
  };
  has_pins: boolean;
  event_ts: string;
}

export interface ReactionAddedEvent extends SlackEvent<"reaction_added"> {
  type: "reaction_added";
  user: string;
  reaction: string;
  item_user: string;
  item: ReactionMessageItem;
  event_ts: string;
}

export interface ReactionRemovedEvent extends SlackEvent<"reaction_removed"> {
  type: "reaction_removed";
  user: string;
  reaction: string;
  item_user: string;
  item: ReactionMessageItem;
  event_ts: string;
}

export interface SharedChannelInviteAcceptedEvent extends SlackEvent<"shared_channel_invite_accepted"> {
  type: "shared_channel_invite_accepted";
  approval_required: boolean;
  invite: SharedChannelInviteItem;
  channel: SharedChannelItem;
  teams_in_channel: SharedChannelTeamItem[];
  accepting_user: SharedChannelUserItem;
  event_ts: string;
}

export interface SharedChannelInviteApprovedEvent extends SlackEvent<"shared_channel_invite_approved"> {
  type: "shared_channel_invite_approved";
  invite: SharedChannelInviteItem;
  channel: SharedChannelItem;
  approving_team_id: string;
  teams_in_channel: SharedChannelTeamItem[];
  approving_user: SharedChannelUserItem;
  event_ts: string;
}

export interface SharedChannelInviteDeclinedEvent extends SlackEvent<"shared_channel_invite_declined"> {
  type: "shared_channel_invite_declined";
  invite: SharedChannelInviteItem;
  channel: SharedChannelItem;
  declining_team_id: string;
  teams_in_channel: SharedChannelTeamItem[];
  declining_user: SharedChannelUserItem;
  event_ts: string;
}

export interface SharedChannelInviteRequestedEvent extends SlackEvent<"shared_channel_invite_requested"> {
  type: "shared_channel_invite_requested";
  actor: {
    id: string;
    name: string;
    is_bot: boolean;
    team_id: string;
    timezone: string;
    real_name: string;
    display_name: string;
  };
  channel_id: string;
  event_type: "slack#/events/shared_channel_invite_requested";
  channel_name: string;
  channel_type: "public" | "private";
  target_users: [{ email: string; invite_id: string }];
  teams_in_channel: [
    {
      id: string;
      icon: { image_34: string; image_default: boolean };
      name: string;
      domain: string;
      is_verified: boolean;
      date_created: number;
      avatar_base_url: string;
      requires_sponsorship: boolean;
    },
  ];
  is_external_limited: boolean;
  channel_date_created: number;
  channel_message_latest_counted_timestamp: number;
}

export interface SharedChannelInviteReceivedEvent extends SlackEvent<"shared_channel_invite_received"> {
  type: "shared_channel_invite_received";
  invite: SharedChannelInviteItem;
  channel: SharedChannelItem;
  event_ts: string;
}

export interface StarAddedEvent extends SlackEvent<"star_added"> {
  type: "star_added";
  user: string;
  item: StarItem;
  event_ts: string;
}

export interface StarRemovedEvent extends SlackEvent<"star_removed"> {
  type: "star_removed";
  user: string;
  item: StarItem;
  event_ts: string;
}

export interface SubteamCreatedEvent extends SlackEvent<"subteam_created"> {
  type: "subteam_created";
  subteam: Subteam;
  event_ts: string;
}

export interface SubteamMembersChangedEvent extends SlackEvent<"subteam_members_changed"> {
  type: "subteam_members_changed";
  subteam_id: string;
  team_id: string;
  date_previous_update: number;
  date_update: number;
  added_users?: string[];
  added_users_count?: number;
  removed_users?: string[];
  removed_users_count?: number;
  event_ts: string;
}

export interface SubteamSelfAddedEvent extends SlackEvent<"subteam_self_added"> {
  type: "subteam_self_added";
  subteam_id: string;
  event_ts: string;
}

export interface SubteamSelfRemovedEvent extends SlackEvent<"subteam_self_removed"> {
  type: "subteam_self_removed";
  subteam_id: string;
  event_ts: string;
}

export interface SubteamUpdatedEvent extends SlackEvent<"subteam_updated"> {
  type: "subteam_updated";
  subteam: Subteam;
  event_ts: string;
}

export interface TeamAccessGrantedEvent extends SlackEvent<"team_access_granted"> {
  type: "team_access_granted";
  team_ids: string[];
  event_ts: string;
}

export interface TeamAccessRevokedEvent extends SlackEvent<"team_access_revoked"> {
  type: "team_access_revoked";
  team_ids: string[];
  event_ts: string;
}

export interface TeamDomainChangeEvent extends SlackEvent<"team_domain_change"> {
  type: "team_domain_change";
  url: string;
  domain: string;
}

export interface TeamJoinEvent extends SlackEvent<"team_join"> {
  type: "team_join";
  user: {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    color: string;
    real_name: string;
    tz: string;
    tz_label: string;
    tz_offset: number;
    profile: {
      title: string;
      phone: string;
      skype: string;
      real_name: string;
      real_name_normalized: string;
      display_name: string;
      display_name_normalized: string;
      status_text: string;
      status_text_canonical: string;
      status_emoji: string;
      status_emoji_display_info: StatusEmojiDisplayInfo[];
      status_expiration: number;
      avatar_hash: string;
      huddle_state?: string;
      huddle_state_expiration_ts?: number;
      bot_id?: string;
      first_name: string;
      last_name: string;
      email?: string;
      image_original?: string;
      is_custom_image?: boolean;
      image_24: string;
      image_32: string;
      image_48: string;
      image_72: string;
      image_192: string;
      image_512: string;
      image_1024?: string;
      team: string;
      fields: { [key: string]: { value: string; alt: string } } | [] | null;
    };
    is_admin: boolean;
    is_owner: boolean;
    is_primary_owner: boolean;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
    is_bot: boolean;
    is_stranger?: boolean;
    updated: number;
    is_email_confirmed: boolean;
    is_app_user: boolean;
    is_invited_user?: boolean;
    has_2fa?: boolean;
    locale: string;
    presence?: string;
    enterprise_user?: {
      id: string;
      enterprise_id: string;
      enterprise_name: string;
      is_admin: boolean;
      is_owner: boolean;
      teams: string[];
    };
    two_factor_type?: string;
    has_files?: boolean;
    is_workflow_bot?: boolean;
    who_can_share_contact_card: string;
  };
}

export interface TeamRenameEvent extends SlackEvent<"team_rename"> {
  type: "team_rename";
  name: string;
}

export interface TokensRevokedEvent extends SlackEvent<"tokens_revoked"> {
  type: "tokens_revoked";
  tokens: {
    oauth?: string[];
    bot?: string[];
  };
}

export interface UserChangeEvent extends SlackEvent<"user_change"> {
  type: "user_change";
  user: {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    is_forgotten?: boolean;
    color: string;
    real_name: string;
    tz: string;
    tz_label: string;
    tz_offset: number;
    profile: {
      title: string;
      phone: string;
      skype: string;
      real_name: string;
      real_name_normalized: string;
      display_name: string;
      display_name_normalized: string;
      status_text: string;
      status_text_canonical: string;
      status_emoji: string;
      status_emoji_display_info: StatusEmojiDisplayInfo[];
      status_expiration: number;
      avatar_hash: string;
      huddle_state?: string;
      huddle_state_expiration_ts?: number;
      first_name: string;
      last_name: string;
      email?: string;
      image_original?: string;
      is_custom_image?: boolean;
      image_24: string;
      image_32: string;
      image_48: string;
      image_72: string;
      image_192: string;
      image_512: string;
      image_1024?: string;
      team: string;
      fields: { [key: string]: { value: string; alt: string } } | [] | null;
    };
    is_admin: boolean;
    is_owner: boolean;
    is_primary_owner: boolean;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
    is_bot: boolean;
    is_stranger?: boolean;
    updated: number;
    is_email_confirmed: boolean;
    is_app_user: boolean;
    is_invited_user?: boolean;
    has_2fa?: boolean;
    locale: string;
    presence?: string;
    enterprise_user?: {
      id: string;
      enterprise_id: string;
      enterprise_name: string;
      is_admin: boolean;
      is_owner: boolean;
      teams: string[];
    };
    two_factor_type?: string;
    has_files?: boolean;
    is_workflow_bot?: boolean;
    who_can_share_contact_card: string;
  };
  cache_ts: number;
  event_ts: string;
}

export interface UserHuddleChangedEvent extends SlackEvent<"user_huddle_changed"> {
  type: "user_huddle_changed";
  user: {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    color: string;
    real_name: string;
    tz: string;
    tz_label: string;
    tz_offset: number;
    profile: {
      title: string;
      phone: string;
      skype: string;
      real_name: string;
      real_name_normalized: string;
      display_name: string;
      display_name_normalized: string;
      status_text: string;
      status_text_canonical: string;
      status_emoji: string;
      status_emoji_display_info: StatusEmojiDisplayInfo[];
      status_expiration: number;
      avatar_hash: string;
      huddle_state: string;
      huddle_state_expiration_ts: number;
      first_name: string;
      last_name: string;
      email?: string;
      image_original?: string;
      is_custom_image?: boolean;
      image_24: string;
      image_32: string;
      image_48: string;
      image_72: string;
      image_192: string;
      image_512: string;
      image_1024?: string;
      team: string;
      fields: { [key: string]: { value: string; alt: string } } | [] | null;
    };
    is_admin: boolean;
    is_owner: boolean;
    is_primary_owner: boolean;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
    is_bot: boolean;
    is_stranger?: boolean;
    updated: number;
    is_email_confirmed: boolean;
    is_app_user: boolean;
    is_invited_user?: boolean;
    has_2fa?: boolean;
    locale: string;
    presence?: string;
    enterprise_user?: {
      id: string;
      enterprise_id: string;
      enterprise_name: string;
      is_admin: boolean;
      is_owner: boolean;
      teams: string[];
    };
    two_factor_type?: string;
    has_files?: boolean;
    is_workflow_bot?: boolean;
    who_can_share_contact_card: string;
  };
  cache_ts: number;
  event_ts: string;
}

export interface UserProfileChangedEvent extends SlackEvent<"user_profile_changed"> {
  type: "user_profile_changed";
  user: {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    is_forgotten?: boolean;
    color: string;
    real_name: string;
    tz: string;
    tz_label: string;
    tz_offset: number;
    profile: {
      title: string;
      phone: string;
      skype: string;
      real_name: string;
      real_name_normalized: string;
      display_name: string;
      display_name_normalized: string;
      status_text: string;
      status_text_canonical: string;
      status_emoji: string;
      status_emoji_display_info: StatusEmojiDisplayInfo[];
      status_expiration: number;
      avatar_hash: string;
      huddle_state: string;
      huddle_state_expiration_ts: number;
      first_name: string;
      last_name: string;
      email?: string;
      image_original?: string;
      is_custom_image?: boolean;
      image_24: string;
      image_32: string;
      image_48: string;
      image_72: string;
      image_192: string;
      image_512: string;
      image_1024?: string;
      team: string;
      fields: { [key: string]: { value: string; alt: string } } | [] | null;
    };
    is_admin: boolean;
    is_owner: boolean;
    is_primary_owner: boolean;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
    is_bot: boolean;
    is_stranger?: boolean;
    updated: number;
    is_email_confirmed: boolean;
    is_app_user: boolean;
    is_invited_user?: boolean;
    has_2fa?: boolean;
    locale: string;
    presence?: string;
    enterprise_user?: {
      id: string;
      enterprise_id: string;
      enterprise_name: string;
      is_admin: boolean;
      is_owner: boolean;
      teams: string[];
    };
    two_factor_type?: string;
    has_files?: boolean;
    is_workflow_bot?: boolean;
    who_can_share_contact_card: string;
  };
  cache_ts: number;
  event_ts: string;
}

export interface UserStatusChangedEvent extends SlackEvent<"user_status_changed"> {
  type: "user_status_changed";
  user: {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    color: string;
    real_name: string;
    tz: string;
    tz_label: string;
    tz_offset: number;
    profile: {
      title: string;
      phone: string;
      skype: string;
      real_name: string;
      real_name_normalized: string;
      display_name: string;
      display_name_normalized: string;
      status_text: string;
      status_text_canonical: string;
      status_emoji: string;
      status_emoji_display_info: StatusEmojiDisplayInfo[];
      status_expiration: number;
      avatar_hash: string;
      first_name: string;
      last_name: string;
      email?: string;
      image_original?: string;
      is_custom_image?: boolean;
      image_24: string;
      image_32: string;
      image_48: string;
      image_72: string;
      image_192: string;
      image_512: string;
      image_1024?: string;
      team: string;
      fields: { [key: string]: { value: string; alt: string } } | [] | null;
    };
    is_admin: boolean;
    is_owner: boolean;
    is_primary_owner: boolean;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
    is_bot: boolean;
    is_stranger?: boolean;
    updated: number;
    is_email_confirmed: boolean;
    is_app_user: boolean;
    is_invited_user?: boolean;
    has_2fa?: boolean;
    locale: string;
    presence?: string;
    enterprise_user?: {
      id: string;
      enterprise_id: string;
      enterprise_name: string;
      is_admin: boolean;
      is_owner: boolean;
      teams: string[];
    };
    two_factor_type?: string;
    has_files?: boolean;
    is_workflow_bot?: boolean;
    who_can_share_contact_card: string;
  };
  cache_ts: number;
  event_ts: string;
}

export interface WorkflowDeletedEvent extends SlackEvent<"workflow_deleted"> {
  type: "workflow_deleted";
  workflow_id: string;
  workflow_draft_configuration: {
    version_id: string;
    app_steps: {
      app_id: string;
      workflow_step_id: string;
      callback_id: string;
    }[];
  };
  event_ts: string;
}

export interface WorkflowPublishedEvent extends SlackEvent<"workflow_published"> {
  type: "workflow_published";
  workflow_id: string;
  workflow_published_configuration: {
    version_id: string;
    app_steps: {
      app_id: string;
      workflow_step_id: string;
      callback_id: string;
    }[];
  };
  event_ts: string;
}

export interface WorkflowUnpublishedEvent extends SlackEvent<"workflow_unpublished"> {
  type: "workflow_unpublished";
  workflow_id: string;
  workflow_draft_configuration: {
    version_id: string;
    app_steps: {
      app_id: string;
      workflow_step_id: string;
      callback_id: string;
    }[];
  };
  event_ts: string;
}

export interface WorkflowStepDeletedEvent extends SlackEvent<"workflow_step_deleted"> {
  type: "workflow_step_deleted";
  workflow_id: string;
  workflow_draft_configuration: {
    version_id: string;
    app_steps: {
      app_id: string;
      workflow_step_id: string;
      callback_id: string;
    }[];
  };
  workflow_published_configuration?: {
    version_id: string;
    app_steps: {
      app_id: string;
      workflow_step_id: string;
      callback_id: string;
    }[];
  };
  event_ts: string;
}

export interface WorkflowStepExecuteEvent extends SlackEvent<"workflow_step_execute"> {
  type: "workflow_step_execute";
  callback_id: string;
  workflow_step: {
    workflow_step_execute_id: string;
    workflow_id: string;
    workflow_instance_id: string;
    step_id: string;
    // deno-lint-ignore no-explicit-any
    inputs: { [key: string]: { value: any } };
    outputs: { name: string; type: string; label: string }[];
  };
  event_ts: string;
}

export type AnyMessageEvent =
  | GenericMessageEvent
  | BotMessageEvent
  | ChannelArchiveMessageEvent
  | ChannelConvertToPrivateMessageEvent
  | ChannelConvertToPublicMessageEvent
  | ChannelJoinMessageEvent
  | ChannelLeaveMessageEvent
  | ChannelNameMessageEvent
  | ChannelPostingPermissionsMessageEvent
  | ChannelPurposeMessageEvent
  | ChannelTopicMessageEvent
  | ChannelUnarchiveMessageEvent
  | EKMAccessDeniedMessageEvent
  | FileShareMessageEvent
  | MeMessageEvent
  | MessageChangedEvent
  | MessageDeletedEvent
  | MessageRepliedEvent
  | ThreadBroadcastMessageEvent;

export type AnyMessageItem =
  | GenericMessageEvent
  | BotMessageEvent
  | ChannelArchiveMessageEvent
  | ChannelJoinMessageEvent
  | ChannelLeaveMessageEvent
  | ChannelNameMessageEvent
  | ChannelPostingPermissionsMessageEvent
  | ChannelPurposeMessageEvent
  | ChannelTopicMessageEvent
  | ChannelUnarchiveMessageEvent
  | EKMAccessDeniedMessageEvent
  | FileShareMessageEvent
  | MeMessageEvent
  | MessageRepliedEvent
  | ThreadBroadcastMessageEvent
  | TombstoneMessageEvent;

export type AnyMessageMetadataEvent = MessageMetadataPostedEvent | MessageMetadataUpdatedEvent | MessageMetadataDeletedEvent;

export interface GenericMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: undefined;
  event_ts: string;
  team?: string;
  channel: string;
  user: string;
  bot_id?: string;
  bot_profile?: BotProfile;
  text: string;
  ts: string;
  thread_ts?: string;
  channel_type: AnyChannelType;
  attachments?: MessageAttachment[];
  blocks?: AnyMessageBlock[];
  files?: FileElement[];
  metadata?: MessageMetadata;
  edited?: {
    user: string;
    ts: string;
  };
  client_msg_id?: string;
  parent_user_id?: string;

  assistant_thread?: Record<string, unknown>;

  // TODO: optional types that maybe should flow into other subtypes?
  is_starred?: boolean;
  pinned_to?: string[];
  reactions?: {
    name: string;
    count: number;
    users: string[];
  }[];
}

export interface BotMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "bot_message";
  event_ts: string;
  channel: string;
  channel_type: AnyChannelType;
  ts: string;
  text: string;
  bot_id: string;
  username?: string;
  icons?: {
    [size: string]: string;
  };

  // copied from MessageEvent
  // TODO: is a user really optional? likely for things like IncomingWebhook authored messages
  user?: string;
  attachments?: MessageAttachment[];
  blocks?: AnyMessageBlock[];
  metadata?: MessageMetadata;
  edited?: {
    user: string;
    ts: string;
  };
  thread_ts?: string;
}

export interface ChannelArchiveMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_archive";
  team: string;
  user: string;
  channel: string;
  channel_type: AnyChannelType;
  text: string;
  ts: string;
  event_ts: string;
}

export interface ChannelJoinMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_join";
  team: string;
  user: string;
  inviter: string;
  channel: string;
  channel_type: AnyChannelType;
  text: string;
  ts: string;
  event_ts: string;
}

export interface ChannelLeaveMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_leave";
  team: string;
  user: string;
  channel: string;
  channel_type: AnyChannelType;
  text: string;
  ts: string;
  event_ts: string;
}

export interface ChannelNameMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_name";
  team: string;
  user: string;
  name: string;
  old_name: string;
  channel: string;
  channel_type: AnyChannelType;
  text: string;
  ts: string;
  event_ts: string;
}

export interface ChannelPostingPermissionsMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_posting_permissions";
  user: string;
  channel: string;
  channel_type: AnyChannelType;
  text: string;
  ts: string;
  event_ts: string;
}

export interface ChannelConvertToPrivateMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_convert_to_private";
  ts: string;
  text: string;
  user: string;
  channel: string;
  event_ts: string;
  channel_type: string;
}

export interface ChannelConvertToPublicMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_convert_to_public";
  ts: string;
  text: string;
  user: string;
  channel: string;
  event_ts: string;
  channel_type: string;
}

export interface ChannelPurposeMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_purpose";
  user: string;
  channel: string;
  channel_type: AnyChannelType;
  text: string;
  purpose: string;
  ts: string;
  event_ts: string;
}

export interface ChannelTopicMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_topic";
  user: string;
  channel: string;
  channel_type: AnyChannelType;
  text: string;
  topic: string;
  ts: string;
  event_ts: string;
}

export interface ChannelUnarchiveMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "channel_unarchive";
  team: string;
  user: string;
  channel: string;
  channel_type: AnyChannelType;
  text: string;
  ts: string;
  event_ts: string;
}

export interface EKMAccessDeniedMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "ekm_access_denied";
  event_ts: string;
  channel: string;
  channel_type: AnyChannelType;
  ts: string;
  text: string; // This will not have any meaningful content within
  user: "UREVOKEDU";
}

export interface FileShareMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "file_share";
  text: string;
  attachments?: MessageAttachment[];
  blocks?: AnyMessageBlock[];
  files?: FileElement[];
  upload?: boolean;
  display_as_bot?: boolean;
  x_files?: string[];
  user: string;
  parent_user_id?: string;
  ts: string;
  thread_ts?: string;
  channel: string;
  channel_type: AnyChannelType;
  event_ts: string;
}

export interface MeMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "me_message";
  event_ts: string;
  channel: string;
  channel_type: AnyChannelType;
  user: string;
  text: string;
  ts: string;
}

export interface MessageChangedEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "message_changed";
  event_ts: string;
  hidden: true;
  channel: string;
  channel_type: AnyChannelType;
  ts: string;
  message: AnyMessageItem;
  previous_message: AnyMessageItem;
}

export interface MessageDeletedEvent {
  type: "message";
  subtype: "message_deleted";
  event_ts: string;
  hidden: true;
  channel: string;
  channel_type: AnyChannelType;
  ts: string;
  deleted_ts: string;
  previous_message: AnyMessageItem;
}

export interface MessageRepliedEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "message_replied";
  event_ts: string;
  hidden: true;
  channel: string;
  channel_type: AnyChannelType;
  ts: string;
  message: AnyMessageItem & {
    // TODO: should this be the union of all message events with type 'message'?
    thread_ts: string;
    reply_count: number;
    replies: AnyMessageEvent[]; // TODO: should this be the union of all message events with type 'message'?
  };
}

// the `reply_broadcast` message subtype is omitted because it is discontinued

export interface ThreadBroadcastMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "thread_broadcast";
  event_ts: string;
  text: string;
  attachments?: MessageAttachment[];
  blocks?: AnyMessageBlock[];
  user: string;
  ts: string;
  thread_ts?: string;
  root: (GenericMessageEvent | BotMessageEvent) & {
    thread_ts: string;
    reply_count: number;
    reply_users_count: number;
    latest_reply: string;
    reply_users: string[];
  };
  client_msg_id: string;
  channel: string;
  channel_type: AnyChannelType;
}

// One reproducible tombstone example is deleting a message which contains threaded replies.

export interface TombstoneMessageEvent extends SlackEvent<"message"> {
  type: "message";
  subtype: "tombstone";
  text: string;
  user: string;
  hidden: boolean;
  ts: string;
  thread_ts: string;
  parent_user_id: string;
  reply_count: number;
  reply_users_count: number;
  latest_reply: string;
  reply_users: string[];
  is_locked: boolean;
  subscribed: boolean;
}

export interface MessageMetadataPostedEvent extends SlackEvent<"message_metadata_posted"> {
  type: "message_metadata_posted";
  app_id: string;
  bot_id?: string;
  user_id: string;
  team_id: string;
  channel_id: string;
  metadata: MessageMetadata;
  message_ts: string;
  event_ts: string;
}

export interface MessageMetadataUpdatedEvent extends SlackEvent<"message_metadata_updated"> {
  type: "message_metadata_updated";
  channel_id: string;
  event_ts: string;
  previous_metadata: MessageMetadata;
  app_id: string;
  bot_id?: string;
  user_id: string;
  team_id: string;
  message_ts: string;
  metadata: MessageMetadata;
}

export interface MessageMetadataDeletedEvent extends SlackEvent<"message_metadata_deleted"> {
  type: "message_metadata_deleted";
  channel_id: string;
  event_ts: string;
  previous_metadata: MessageMetadata;
  app_id: string;
  bot_id?: string;
  user_id: string;
  team_id: string;
  message_ts: string;
  deleted_ts: string;
}

export type AnyChannelType = "channel" | "group" | "im" | "mpim" | "app_home";

// -----------------------------------------------------------

export interface BotProfile {
  id: string;
  name: string;
  app_id: string;
  team_id: string;
  icons: { [size: string]: string };
  updated: number;
  deleted: boolean;
}

export interface PinnedItem {
  type: string;
  channel: string;
  created_by: string;
  created: number;
  message?: MessageItem;
  file?: FileItem;
}

export interface SharedChannelTeamItem {
  id: string;
  name: string;
  icon: Record<string, unknown>;
  is_verified: boolean;
  domain: string;
  date_created: number;
}

export interface SharedChannelUserItem {
  id: string;
  team_id: string;
  name: string;
  updated: number;
  profile: {
    real_name: string;
    display_name: string;
    real_name_normalized: string;
    display_name_normalized: string;
    team: string;
    avatar_hash: string;
    email: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
  };
}

export interface SharedChannelInviteItem {
  id: string;
  date_created: number;
  date_invalid: number;
  inviting_team: SharedChannelTeamItem;
  inviting_user: SharedChannelUserItem;
  recipient_email?: string;
  recipient_user_id?: string;
}

export interface SharedChannelItem {
  id: string;
  is_private: boolean;
  is_im: boolean;
  name: string;
}

export interface Subteam {
  id: string;
  team_id?: string;
  is_usergroup: boolean;
  is_subteam: boolean;
  name: string;
  description?: string;
  handle: string;
  is_external: boolean;
  date_create: number;
  date_update?: number;
  date_delete?: number;
  auto_provision: boolean;
  enterprise_subteam_id?: string;
  created_by: string;
  updated_by?: string;
  prefs?: {
    channels?: string[];
    groups?: string[];
  };
  users: string[];
  user_count: number;
  channel_count?: number;
  is_section?: boolean;
}

export interface StatusEmojiDisplayInfo {
  emoji_name?: string;
  display_alias?: string;
  display_url?: string;
}

export interface ReactionMessageItem {
  type: "message";
  channel: string;
  ts: string;
}

export interface FileInitialComment {
  channel?: string;
  comment?: string;
  created?: number;
  id?: string;
  is_intro?: boolean;
  timestamp?: number;
  user?: string;
}

export interface StarItem {
  date_create: number;
  type: string;
  channel?: string;
  file?: FileItem;
  message?: MessageItem;
  comment?: {
    channel?: string;
    comment?: string;
    created?: number;
    id?: string;
    is_intro?: boolean;
    is_starred?: boolean;
    num_stars?: number;
    timestamp?: number;
    user?: string;
  };
}

export interface FileItem {
  alt_txt?: string;
  app_id?: string;
  app_name?: string;
  bot_id?: string;
  cc?: EmailAddress[];
  channel_actions_count?: number;
  channel_actions_ts?: string;
  channels?: string[];
  comments_count?: number;
  converted_pdf?: string;
  created: number;
  deanimate?: string;
  deanimate_gif?: string;
  display_as_bot?: boolean;
  duration_ms?: number;
  edit_link?: string;
  editable?: boolean;
  editor?: string;
  external_id?: string;
  external_type?: string;
  external_url?: string;
  file_access?: string;
  filetype: string;
  from?: EmailAddress[];
  groups?: string[];
  has_more?: boolean;
  has_more_shares?: boolean;
  has_rich_preview?: boolean;
  headers?: EmailHeaders;
  hls?: string;
  hls_embed?: string;
  id?: string;
  image_exif_rotation?: number;
  ims?: string[];
  initial_comment?: FileInitialComment;
  is_external?: boolean;
  is_public?: boolean;
  is_starred?: boolean;
  last_editor?: string;
  lines?: number;
  lines_more?: number;
  media_display_type?: string;
  media_progress?: SlackVideoMediaProgress;
  mimetype?: string;
  mode?: string;
  mp4?: string;
  name: string;
  non_owner_editable?: boolean;
  num_stars?: number;
  original_attachment_count?: number;
  original_h?: number;
  original_w?: number;
  permalink: string;
  permalink_public?: string;
  pinned_to?: string[];
  pjpeg?: string;
  plain_text?: string;
  pretty_type?: string;
  preview?: string;
  preview_highlight?: string;
  preview_is_truncated?: boolean;
  preview_plain_text?: string;
  public_url_shared?: boolean;
  reactions?: Reaction[];
  sent_to_self?: boolean;
  shares?: FileShares;
  simplified_html?: string;
  size?: number;
  source_team?: string;
  subject?: string;
  subtype?: string;
  thumb_1024?: string;
  thumb_1024_gif?: string;
  thumb_1024_h?: number;
  thumb_1024_w?: number;
  thumb_160?: string;
  thumb_160_gif?: string;
  thumb_160_h?: number;
  thumb_160_w?: number;
  thumb_360?: string;
  thumb_360_gif?: string;
  thumb_360_h?: number;
  thumb_360_w?: number;
  thumb_480?: string;
  thumb_480_gif?: string;
  thumb_480_h?: number;
  thumb_480_w?: number;
  thumb_64?: string;
  thumb_64_gif?: string;
  thumb_64_h?: number;
  thumb_64_w?: number;
  thumb_720?: string;
  thumb_720_gif?: string;
  thumb_720_h?: number;
  thumb_720_w?: number;
  thumb_80?: string;
  thumb_800?: string;
  thumb_800_gif?: string;
  thumb_800_h?: number;
  thumb_800_w?: number;
  thumb_80_gif?: string;
  thumb_80_h?: number;
  thumb_80_w?: number;
  thumb_960?: string;
  thumb_960_gif?: string;
  thumb_960_h?: number;
  thumb_960_w?: number;
  thumb_gif?: string;
  thumb_pdf?: string;
  thumb_pdf_h?: number;
  thumb_pdf_w?: number;
  thumb_tiny?: string;
  thumb_video?: string;
  thumb_video_h?: number;
  thumb_video_w?: number;
  timestamp?: number;
  title?: string;
  to?: EmailAddress[];
  transcription?: FileTranscription;
  updated?: number;
  url_private: string;
  url_private_download: string;
  user: string;
  user_team: string;
  username: string;
  vtt?: string;
}

export interface EmailAddress {
  address: string;
  name: string;
  original: string;
}

export interface EmailHeaders {
  date: string;
  in_reply_to: string;
  message_id: string;
  reply_to: string;
}

export interface SlackVideoMediaProgress {
  duration_ms: number;
  max_offset_ms: number;
  offset_ms: number;
}

export interface Reaction {
  count: number;
  name: string;
  url: string;
  users: string[];
}

export interface FileShares {
  private?: { [key: string]: ShareDetails[] };
  public?: { [key: string]: ShareDetails[] };
}

export interface ShareDetails {
  share_user_id: string;
  team_id: string;
  channel_name: string;
  ts: string;
  latest_reply?: string;
  reply_count?: number;
  reply_users?: string[];
  reply_users_count?: number;
  thread_ts?: string;
}

export interface FileTranscription {
  locale: string;
  status: string;
}

export interface MessageItem {
  attachments?: MessageAttachment[];
  blocks?: AnyMessageBlock[];
  bot_id?: string;
  bot_profile?: BotProfile;
  client_msg_id: string;
  display_as_bot?: boolean;
  edited?: MessageEdited;
  files?: FileElement[];
  inviter?: string;
  is_locked?: boolean;
  is_starred?: boolean;
  last_read?: string;
  latest_reply?: string;
  permalink: string;
  reactions?: Reaction[];
  reply_count?: number;
  reply_users?: string[];
  reply_users_count?: number;
  subscribed?: boolean;
  subtype?: string;
  team: string;
  text: string;
  thread_ts?: string;
  ts: string;
  type: string;
  upload?: boolean;
  user: string;
  username: string;
}

export interface MessageEdited {
  ts: string;
  user: string;
}

export interface FileElement {
  alt_txt?: string;
  app_id?: string;
  app_name?: string;
  bot_id?: string;
  cc?: EmailAddress[];
  channel_actions_count?: number;
  channel_actions_ts?: string;
  channels?: string[];
  comments_count?: number;
  converted_pdf?: string;
  created?: number;
  deanimate?: string;
  deanimate_gif?: string;
  display_as_bot?: boolean;
  duration_ms?: number;
  edit_link?: string;
  editable?: boolean;
  editor?: string;
  external_id?: string;
  external_type?: string;
  external_url?: string;
  file_access?: string;
  filetype?: string;
  from?: EmailAddress[];
  groups?: string[];
  has_more?: boolean;
  has_more_shares?: boolean;
  has_rich_preview?: boolean;
  headers?: Headers;
  hls?: string;
  hls_embed?: string;
  id?: string;
  image_exif_rotation?: number;
  ims?: string[];
  initial_comment?: FileInitialComment;
  is_external: boolean;
  is_public: boolean;
  is_starred?: boolean;
  last_editor?: string;
  lines?: number;
  lines_more?: number;
  media_display_type?: string;
  media_progress?: SlackVideoMediaProgress;
  mimetype: string;
  mode?: string;
  mp4?: string;
  name: string;
  non_owner_editable?: boolean;
  num_stars?: number;
  original_attachment_count?: number;
  original_h?: number;
  original_w?: number;
  permalink: string;
  permalink_public?: string;
  pinned_to?: string[];
  pjpeg?: string;
  plain_text?: string;
  pretty_type?: string;
  preview?: string;
  preview_highlight?: string;
  preview_is_truncated?: boolean;
  preview_plain_text?: string;
  public_url_shared?: boolean;
  reactions?: Reaction[];
  sent_to_self?: boolean;
  shares?: FileShares;
  simplified_html?: string;
  size?: number;
  source_team?: string;
  subject?: string;
  subtype?: string;
  thumb_1024?: string;
  thumb_1024_gif?: string;
  thumb_1024_h?: number;
  thumb_1024_w?: number;
  thumb_160?: string;
  thumb_160_gif?: string;
  thumb_160_h?: number;
  thumb_160_w?: number;
  thumb_360?: string;
  thumb_360_gif?: string;
  thumb_360_h?: number;
  thumb_360_w?: number;
  thumb_480?: string;
  thumb_480_gif?: string;
  thumb_480_h?: number;
  thumb_480_w?: number;
  thumb_64?: string;
  thumb_64_gif?: string;
  thumb_64_h?: number;
  thumb_64_w?: number;
  thumb_720?: string;
  thumb_720_gif?: string;
  thumb_720_h?: number;
  thumb_720_w?: number;
  thumb_80?: string;
  thumb_800?: string;
  thumb_800_gif?: string;
  thumb_800_h?: number;
  thumb_800_w?: number;
  thumb_80_gif?: string;
  thumb_80_h?: number;
  thumb_80_w?: number;
  thumb_960?: string;
  thumb_960_gif?: string;
  thumb_960_h?: number;
  thumb_960_w?: number;
  thumb_gif?: string;
  thumb_pdf?: string;
  thumb_pdf_h?: number;
  thumb_pdf_w?: number;
  thumb_tiny?: string;
  thumb_video?: string;
  thumb_video_h?: number;
  thumb_video_w?: number;
  timestamp: number;
  title: string;
  to?: EmailAddress[];
  transcription?: FileTranscription;
  updated?: number;
  url_private: string;
  url_private_download: string;
  user: string;
  user_team: string;
  username: string;
  vtt?: string;
}
