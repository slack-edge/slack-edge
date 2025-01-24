import {
  AuthTestResponse,
  OAuthV2AccessResponse,
} from "https://deno.land/x/slack_web_api_client@1.1.5/mod.ts";
import { InvalidStateParameter, OAuthErrorCode } from "./error-codes.ts";
import { Installation } from "./installation.ts";
import {
  OAuthCompletionPageRenderer,
  OAuthErrorPageRenderer,
  OAuthStartPageRenderer,
  renderDefaultOAuthCompletionPage,
  renderDefaultOAuthErrorPage,
  renderDefaultOAuthStartPage,
} from "./oauth-page-renderer.ts";
import { LoggingEnv } from "../app-env.ts";

/**
 * beforeInstallation args
 */
export interface BeforeInstallationArgs {
  env: LoggingEnv;
  request: Request;
}

/**
 * beforeInstallation hook
 */
export type BeforeInstallation = (
  args: BeforeInstallationArgs,
) => Promise<Response | undefined | void>;

/**
 * afterInstallation args
 */
export interface AfterInstallationArgs {
  env: LoggingEnv;
  installation: Installation;
  request: Request;
}

/**
 * afterInstallation hook
 */
export type AfterInstallation = (
  args: AfterInstallationArgs,
) => Promise<Response | undefined | void>;

/**
 * onStateValidationError args
 */
export interface OnStateValidationErrorArgs {
  env: LoggingEnv;
  startPath: string;
  request: Request;
}

/**
 * onStateValidationError hook
 */
export type OnStateValidationError = (
  args: OnStateValidationErrorArgs,
) => Promise<Response>;

/**
 * The default onStateValidationError implementation.
 */
export function defaultOnStateValidationError(
  renderer?: OAuthErrorPageRenderer,
): OnStateValidationError {
  return async ({ startPath }) => {
    const renderPage = renderer ?? renderDefaultOAuthErrorPage;
    return new Response(
      await renderPage({
        installPath: startPath,
        reason: InvalidStateParameter,
      }),
      {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  };
}

/**
 * onFailure args
 */
export interface OnFailureArgs {
  env: LoggingEnv;
  startPath: string;
  reason: OAuthErrorCode;
  request: Request;
}

/**
 * onFailure hook
 */
export type OnFailure = (args: OnFailureArgs) => Promise<Response>;

/**
 * The default onFailure implementation.
 * @param startPath the path to start the OAuth flow again
 * @param reason the error reason code
 * @returns response
 */
export function defaultOnFailure(renderer?: OAuthErrorPageRenderer): OnFailure {
  return async ({ startPath, reason }) => {
    const renderPage = renderer ?? renderDefaultOAuthErrorPage;
    return new Response(await renderPage({ installPath: startPath, reason }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };
}

/**
 * OAuthStart args
 */
export interface OAuthStartArgs {
  env: LoggingEnv;
  authorizeUrl: string;
  stateCookieName: string;
  stateValue: string;
  request: Request;
}

/**
 * OAuthStart hook
 */
export type OAuthStart = (args: OAuthStartArgs) => Promise<Response>;

/**
 * The default OAuthStart implementation.
 */
export function defaultOAuthStart(
  startImmediateRedirect?: boolean,
  renderer?: OAuthStartPageRenderer,
): OAuthStart {
  return async ({ authorizeUrl, stateCookieName, stateValue }) => {
    const immediateRedirect = startImmediateRedirect !== false;
    const status = immediateRedirect ? 302 : 200;
    const renderPage = renderer ?? renderDefaultOAuthStartPage;
    return new Response(
      await renderPage({ immediateRedirect, url: authorizeUrl }),
      {
        status,
        headers: {
          Location: authorizeUrl,
          "Set-Cookie":
            `${stateCookieName}=${stateValue}; Secure; HttpOnly; Path=/; Max-Age=300`,
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  };
}

/**
 * OAuthCallback args
 */
export interface OAuthCallbackArgs {
  env: LoggingEnv;
  oauthAccess: OAuthV2AccessResponse;
  enterpriseUrl: string | undefined;
  stateCookieName: string;
  request: Request;
  installation: Installation;
  authTestResponse: AuthTestResponse;
}

/**
 * OAuthCallback hook
 */
export type OAuthCallback = (args: OAuthCallbackArgs) => Promise<Response>;

/**
 * The default OAuthCallback implementation.
 */
export function defaultOAuthCallback(
  renderer?: OAuthCompletionPageRenderer,
): OAuthCallback {
  return async (
    {
      oauthAccess,
      enterpriseUrl,
      stateCookieName,
      installation,
      authTestResponse,
    },
  ) => {
    const renderPage = renderer ?? renderDefaultOAuthCompletionPage;
    return new Response(
      await renderPage({
        appId: oauthAccess.app_id!,
        teamId: oauthAccess.team?.id!,
        isEnterpriseInstall: oauthAccess.is_enterprise_install,
        enterpriseUrl,
        installation,
        authTestResponse,
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie":
            `${stateCookieName}=deleted; Secure; HttpOnly; Path=/; Max-Age=0`,
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  };
}
