import {
  OpenIDConnectTokenResponse,
  OpenIDConnectUserInfoResponse,
} from "https://deno.land/x/slack_web_api_client@1.1.7/mod.ts";

/**
 * Data type representing the SIWS login result.
 */
export interface Login {
  enterprise_id?: string;
  team_id: string;
  user_id: string;
  name?: string;
  email?: string;
  picture?: string;

  access_token: string;
  refresh_token?: string; // token rotation
  token_expires_at?: number; // token rotation (epoch time seconds)
}

/**
 * Build a login data by combining two API response data
 * @param token openid.connect.token API response
 * @param userInfo openid.connect.userInfo API response
 * @returns login data
 */
export function toLogin(
  token: OpenIDConnectTokenResponse,
  userInfo: OpenIDConnectUserInfoResponse,
): Login {
  return {
    enterprise_id: userInfo["https://slack.com/enterprise_id"],
    team_id: userInfo["https://slack.com/team_id"]!,
    user_id: userInfo["https://slack.com/user_id"]!,
    email: userInfo.email,
    picture: userInfo.picture,
    access_token: token.access_token!,
    refresh_token: token.refresh_token,
    token_expires_at: token.expires_in
      ? new Date().getTime() / 1000 + token.expires_in
      : undefined,
  };
}
