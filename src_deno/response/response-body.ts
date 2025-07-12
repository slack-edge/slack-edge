import {
  AnyMessageBlock,
  AnyTextField,
  MessageAttachment,
  MessageMetadata,
  ModalView,
} from "https://deno.land/x/slack_web_api_client@1.1.7/mod.ts";

/**
 * Response for sending a message.
 */
export interface MessageResponse {
  response_type?: "ephemeral" | "in_channel";
  text: string;
  blocks?: AnyMessageBlock[];
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
  thread_ts?: string;
}

/**
 * Response to update the existing modal view.
 */
export interface ViewUpdateResponse {
  response_action: "update";
  view: ModalView;
}

/**
 * Response to push a new modal view on top of the existing modal view.
 */
export interface ViewPushResponse {
  response_action: "push";
  view: ModalView;
}

/**
 * Response to close all the existing modal views.
 */
export interface ViewClearResponse {
  response_action: "clear";
}

/**
 * Response to render input validation errors on the existing modal view.
 */
export interface ViewErrorsResponse {
  response_action: "errors";
  errors: { [blockId: string]: string };
}

export type AnyViewResponse =
  | ViewUpdateResponse
  | ViewPushResponse
  | ViewClearResponse
  | ViewErrorsResponse;

export interface Option {
  value: string;
  text: AnyTextField;
  description?: AnyTextField;
}

export interface OptionGroup {
  label: AnyTextField;
  options: Option[];
}

export interface OptionsResponse {
  options: Option[];
}
export interface OptionGroupsResponse {
  option_groups: OptionGroup[];
}

export type AnyOptionsResponse = OptionsResponse | OptionGroupsResponse;
