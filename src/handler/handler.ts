import { EventRequest, MessageEventHandler } from "../app";
import { SlackAppEnv } from "../app-env";
import { BlockAction, BlockElementAction, BlockElementActions, BlockElementTypes } from "../request/payload/block-action";
import { BlockSuggestion } from "../request/payload/block-suggestion";
import { GlobalShortcut } from "../request/payload/global-shortcut";
import { MessageShortcut } from "../request/payload/message-shortcut";
import { SlashCommand } from "../request/payload/slash-command";
import { ViewClosed } from "../request/payload/view-closed";
import { ViewSubmission } from "../request/payload/view-submission";
import {
  SlackRequest,
  SlackRequestWithAssistantUtilities,
  SlackRequestWithOptionalRespond,
  SlackRequestWithRespond,
} from "../request/request";
import { SlackResponse } from "../response/response";
import { MessageAckResponse } from "./message-handler";
import { OptionsAckResponse } from "./options-handler";
import { ViewAckResponse } from "./view-handler";
import {
  AssistantThreadContextChangedEvent,
  AssistantThreadStartedEvent,
  FileShareMessageEvent,
  GenericMessageEvent,
  SupportedEventType,
} from "../request/payload/event";
import { AppRateLimited } from "../request/payload/app-rate-limited";

/**
 * Returned data from an ack function.
 */
export type AckResponse = SlackResponse | string | void;

/**
 * The set of ack and lazy handlers.
 */
export interface SlackHandler<E extends SlackAppEnv, Payload> {
  ack(request: SlackRequest<E, Payload>): Promise<AckResponse>;
  lazy(request: SlackRequest<E, Payload>): Promise<void>;
}

// ----------------------------------------
// Slash commands
// ----------------------------------------

/**
 * ack function for slash command handling.
 */
export type SlashCommandAckHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequestWithRespond<E, SlashCommand>,
) => Promise<MessageAckResponse>;

/**
 * lazy function for slash command handling.
 */
export type SlashCommandLazyHandler<E extends SlackAppEnv = SlackAppEnv> = (req: SlackRequestWithRespond<E, SlashCommand>) => Promise<void>;

// ----------------------------------------
// Events API
// ----------------------------------------

/**
 * lazy function for Events API handling.
 */
export type EventLazyHandler<Type extends SupportedEventType, E extends SlackAppEnv = SlackAppEnv> = (
  req: EventRequest<E, Type>,
) => Promise<void>;

/**
 * lazy function for message event handling.
 */
export type MessageEventLazyHandler<E extends SlackAppEnv = SlackAppEnv> = MessageEventHandler<E>;

export type AssistantThreadEventRequest<
  E extends SlackAppEnv,
  Type extends AssistantThreadStartedEvent | AssistantThreadContextChangedEvent | GenericMessageEvent | FileShareMessageEvent,
> = SlackRequestWithAssistantUtilities<E, Type>;

export type AssistantEventLazyHandler<
  Type extends AssistantThreadStartedEvent | AssistantThreadContextChangedEvent | GenericMessageEvent | FileShareMessageEvent,
  E extends SlackAppEnv = SlackAppEnv,
> = (req: AssistantThreadEventRequest<E, Type>) => Promise<void>;

export type AssistantUserMessageEventRequest<E extends SlackAppEnv> = SlackRequestWithAssistantUtilities<
  E,
  GenericMessageEvent | FileShareMessageEvent
>;

export type AssistantBotMessageEventRequest<E extends SlackAppEnv> = SlackRequestWithAssistantUtilities<E, GenericMessageEvent>;

// ----------------------------------------
// Shortcuts
// ----------------------------------------

/**
 * ack function for global/message shortcut handling.
 */
export type ShortcutAckHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequest<E, GlobalShortcut> | SlackRequestWithRespond<E, MessageShortcut>,
) => Promise<AckResponse>;

/**
 * ack function for global shortcut handling.
 */
export type GlobalShortcutAckHandler<E extends SlackAppEnv = SlackAppEnv> = (req: SlackRequest<E, GlobalShortcut>) => Promise<AckResponse>;

/**
 * ack function for message shortcut handling.
 */
export type MessageShortcutAckHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequestWithRespond<E, MessageShortcut>,
) => Promise<AckResponse>;

/**
 * lazy function for global/message shortcut handling.
 */
export type ShortcutLazyHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequest<E, GlobalShortcut> | SlackRequestWithRespond<E, MessageShortcut>,
) => Promise<void>;

/**
 * lazy function for global shortcut handling.
 */
export type GlobalShortcutLazyHandler<E extends SlackAppEnv = SlackAppEnv> = (req: SlackRequest<E, GlobalShortcut>) => Promise<void>;

/**
 * lazy function for message shortcut handling.
 */
export type MessageShortcutLazyHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequestWithRespond<E, MessageShortcut>,
) => Promise<void>;

// ----------------------------------------
// Block Kit actions
// ----------------------------------------

/**
 * ack function for block_actions request handling.
 */
export type BlockActionAckHandler<
  T extends BlockElementTypes,
  E extends SlackAppEnv = SlackAppEnv,
  A extends BlockAction<Extract<BlockElementActions, { type: T }>> = BlockAction<Extract<BlockElementActions, { type: T }>>,
> = (req: SlackRequestWithOptionalRespond<E, A>) => Promise<AckResponse>;

/**
 * ack function for block_actions request handling.
 */
export type SourceSpecifiedBlockActionAckHandler<
  E extends SlackAppEnv = SlackAppEnv,
  A extends BlockAction<BlockElementAction> = BlockAction<BlockElementAction>,
> = (req: SlackRequestWithOptionalRespond<E, A>) => Promise<AckResponse>;

/**
 * lazy function for block_actions request handling.
 */
export type BlockActionLazyHandler<
  T extends BlockElementTypes,
  E extends SlackAppEnv = SlackAppEnv,
  A extends BlockAction<Extract<BlockElementActions, { type: T }>> = BlockAction<Extract<BlockElementActions, { type: T }>>,
> = (req: SlackRequestWithOptionalRespond<E, A>) => Promise<void>;

export type SourceSpecifiedBlockActionLazyHandler<
  E extends SlackAppEnv = SlackAppEnv,
  A extends BlockAction<BlockElementAction> = BlockAction<BlockElementAction>,
> = (req: SlackRequestWithOptionalRespond<E, A>) => Promise<void>;

/**
 * ack function for block_suggestion request handling.
 */
export type BlockSuggestionAckHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequest<E, BlockSuggestion>,
) => Promise<OptionsAckResponse>;

// ----------------------------------------
// View submission/closed
// ----------------------------------------

/**
 * ack function for view_submission/view_closed request handling.
 */
export type ViewAckHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequestWithOptionalRespond<E, ViewSubmission> | SlackRequest<E, ViewClosed>,
) => Promise<ViewAckResponse>;

/**
 * ack function for view_submission request handling.
 */
export type ViewSubmissionAckHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequestWithOptionalRespond<E, ViewSubmission>,
) => Promise<ViewAckResponse>;

/**
 * ack function for view_closed request handling.
 */
export type ViewClosedAckHandler<E extends SlackAppEnv = SlackAppEnv> = (req: SlackRequest<E, ViewClosed>) => Promise<ViewAckResponse>;

/**
 * lazy function for view_submission/view_closed request handling.
 */
export type ViewLazyHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequestWithOptionalRespond<E, ViewSubmission> | SlackRequest<E, ViewClosed>,
) => Promise<void>;

/**
 * lazy function for view_submission request handling.
 */
export type ViewSubmissionLazyHandler<E extends SlackAppEnv = SlackAppEnv> = (
  req: SlackRequestWithOptionalRespond<E, ViewSubmission>,
) => Promise<void>;

/**
 * lazy function for view_closed request handling.
 */
export type ViewClosedLazyHandler<E extends SlackAppEnv = SlackAppEnv> = (req: SlackRequest<E, ViewClosed>) => Promise<void>;

// ----------------------------------------
// App rate limited
// ----------------------------------------

/**
 * lazy function for app_rate_limited request handling.
 */
export type AppRateLimitedLazyHandler<E extends SlackAppEnv = SlackAppEnv> = (req: SlackRequest<E, AppRateLimited>) => Promise<void>;
