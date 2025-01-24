import { OAuthV2AccessResponse } from "https://deno.land/x/slack_web_api_client@1.1.5/mod.ts";

/**
 * Slack app installation data.
 */
export interface Installation {
  app_id: string;
  is_enterprise_install?: boolean;
  enterprise_id?: string; // only for Enterprise Grid installations
  team_id?: string; // can be absent when is_enterprise_install is true
  user_id: string;

  // bot token
  bot_token?: string;
  bot_user_id?: string;
  bot_scopes?: string[];
  bot_refresh_token?: string; // token rotation
  bot_token_expires_at?: number; // token rotation (epoch time seconds)

  // user token
  user_token?: string;
  user_scopes?: string[];
  user_refresh_token?: string; // token rotation
  user_token_expires_at?: number; // token rotation (epoch time seconds)

  // Only when having incoming-webhooks
  incoming_webhook_url?: string;
  incoming_webhook_channel_id?: string;
  incoming_webhook_configuration_url?: string;
}

/**
 * Converts a response from oauth.v2.access API endpoint to an installation data.
 * @param oauthAccess oauth.v2.access API response data
 * @returns installation data
 */
export function toInstallation(
  oauthAccess: OAuthV2AccessResponse,
): Installation {
  const installation: Installation = {
    app_id: oauthAccess.app_id!,
    is_enterprise_install: oauthAccess.is_enterprise_install,
    enterprise_id: oauthAccess.enterprise?.id,
    team_id: oauthAccess.team?.id,
    user_id: oauthAccess.authed_user?.id!,
    // bot token
    bot_token: oauthAccess.access_token,
    bot_user_id: oauthAccess.bot_user_id,
    bot_scopes: oauthAccess.scope?.split(","),
    bot_refresh_token: oauthAccess.refresh_token,
    bot_token_expires_at: oauthAccess.expires_in
      ? new Date().getTime() / 1000 + oauthAccess.expires_in
      : undefined,

    // user token
    user_token: oauthAccess.authed_user?.access_token,
    user_scopes: oauthAccess.authed_user?.scope?.split(","),
    user_refresh_token: oauthAccess.authed_user?.refresh_token,
    user_token_expires_at: oauthAccess.authed_user?.expires_in
      ? new Date().getTime() / 1000 + oauthAccess.authed_user?.expires_in
      : undefined,

    // Only when having incoming-webhooks
    incoming_webhook_url: oauthAccess.incoming_webhook?.url,
    incoming_webhook_channel_id: oauthAccess.incoming_webhook?.channel_id,
    incoming_webhook_configuration_url: oauthAccess.incoming_webhook?.url,
  };
  return installation;
}
