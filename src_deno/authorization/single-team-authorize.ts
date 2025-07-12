import { AuthorizeError } from "../errors.ts";
import {
  AuthTestResponse,
  SlackAPIClient,
  SlackAPIError,
} from "https://deno.land/x/slack_web_api_client@1.1.7/mod.ts";
import { Authorize } from "./authorize.ts";

/**
 * Authorize function for an app tha is installed only into a single workspace.
 * @param req request from Slack
 * @returns valid AuthorizeResult object
 */
export const singleTeamAuthorize: Authorize = async (req) => {
  // This authorize function supports only the bot token for a workspace
  const botToken = req.env.SLACK_BOT_TOKEN!;
  const client = new SlackAPIClient(botToken);
  try {
    const response: AuthTestResponse = await client.auth.test();
    const scopes = response.headers.get("x-oauth-scopes") ?? "";
    return {
      botToken,
      enterpriseId: response.enterprise_id,
      teamId: response.team_id,
      team: response.team,
      url: response.url,
      botId: response.bot_id!,
      botUserId: response.user_id!,
      userId: response.user_id,
      user: response.user,
      botScopes: scopes.split(","),
      userToken: undefined, // As mentioned above, user tokens are not supported in this module
      userScopes: undefined, // As mentioned above, user tokens are not supported in this module
    };
  } catch (e) {
    throw new AuthorizeError(
      `Failed to call auth.test API due to ${(e as SlackAPIError).message}`,
    );
  }
};
