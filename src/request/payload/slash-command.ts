// ------------------------------------------
// The Slash command payload
// ------------------------------------------
//
// Slash commands allow users to invoke your app by typing a string into the message composer box. By enabling slash commands, your app can be summoned by users from any conversation in Slack. Slash commands created by developers cannot, however, be invoked in message threads.
// A submitted slash command will cause a payload of data to be sent from Slack to the associated app. The app can then respond in whatever way it wants using the context provided by that payload.
// When part of an app, they can be installed for your workspace as a single workspace app or distributed to other workspaces via the Slack Marketplace.
//
// Built-in slash commands:
// There is a set of built-in slash commands. These include slash commands such as /topic and /remind.
// Built-in slash commands are unique commands with unique additional features - they, along with Giphy app slash commands, are the only slash commands that can be invoked in message threads.
//
// Understanding the structure of slash commands:
// Slash commands require a particular invocation structure that makes them less universally usable compared to other app entry points. Ensure you understand your app's audience before implementation.
// Let's look at an example slash command for an app that stores a list of to-do tasks:
// /todo ask @crushermd to bake a birthday cake for @worf in #d-social
// Here's the structure:
// - /todo - This is the command, the part that tells Slack to treat it as a slash command and where to route it. You'll define yours below.
// - ask @crushermd to bake a birthday cake for @worf in #d-social - This is the text portion, it includes everything after the first space following the command. It is treated as a single parameter that is passed to the app that owns the command (we'll discuss this more below).
// We want to make sure that birthday cake gets baked, so read on to find out how to set up commands for your apps as well as how to handle and respond to them.
//
// See: https://api.slack.com/interactivity/slash-commands

export interface SlashCommand {
  /**
   * (Deprecated) This is a verification token, a deprecated feature that you shouldn't use any more. It was used to verify that requests were legitimately being sent by Slack to your app, but you should use the signed secrets functionality to do this instead.
   */
  token: string;
  /**
   * The command that was entered to trigger this request. This value can be useful if you want to use a single Request URL to service multiple slash commands, as it allows you to tell them apart.
   */
  command: string;
  /**
   * This is the part of the slash command after the command itself, and it can contain absolutely anything the user might decide to type. It is common to use this text parameter to provide extra context for the command. You can prompt users to adhere to a particular format by showing them in the Usage Hint field when creating a command.
   */
  text: string;
  /**
   * A temporary webhook URL that you can use to generate message responses.
   */
  response_url: string;
  /**
   * A short-lived ID that will allow your app to open a modal.
   */
  trigger_id: string;
  /**
   * The ID of the user who triggered the command.
   */
  user_id: string;
  /**
   * (Deprecated) The plain text name of the user who triggered the command. Do not rely on this field as it has been phased out. Use the user_id instead.
   */
  user_name: string;
  /**
   * These IDs provide context about where the user was in Slack when they triggered your app's command (e.g. the workspace, Enterprise Grid, or channel). You may need these IDs for your command response.
   * The various accompanying *_name values provide you with the plain text names for these IDs, but as always you should only rely on the IDs as the names might change arbitrarily.
   * We'll include enterprise_id and enterprise_name parameters on command invocations when the executing workspace is part of an Enterprise Grid.
   */
  team_id: string;
  /**
   * These IDs provide context about where the user was in Slack when they triggered your app's command (e.g. the workspace, Enterprise Grid, or channel). You may need these IDs for your command response.
   * The various accompanying *_name values provide you with the plain text names for these IDs, but as always you should only rely on the IDs as the names might change arbitrarily.
   * We'll include enterprise_id and enterprise_name parameters on command invocations when the executing workspace is part of an Enterprise Grid.
   */
  team_domain: string;
  /**
   * These IDs provide context about where the user was in Slack when they triggered your app's command (e.g. the workspace, Enterprise Grid, or channel). You may need these IDs for your command response.
   * The various accompanying *_name values provide you with the plain text names for these IDs, but as always you should only rely on the IDs as the names might change arbitrarily.
   * We'll include enterprise_id and enterprise_name parameters on command invocations when the executing workspace is part of an Enterprise Grid.
   */
  channel_id: string;
  /**
   * These IDs provide context about where the user was in Slack when they triggered your app's command (e.g. the workspace, Enterprise Grid, or channel). You may need these IDs for your command response.
   * The various accompanying *_name values provide you with the plain text names for these IDs, but as always you should only rely on the IDs as the names might change arbitrarily.
   * We'll include enterprise_id and enterprise_name parameters on command invocations when the executing workspace is part of an Enterprise Grid.
   */
  channel_name: string;
  /**
   * Your Slack app's unique identifier. Use this in conjunction with request signing to verify context for inbound requests.
   */
  api_app_id: string;
  /**
   * These IDs provide context about where the user was in Slack when they triggered your app's command (e.g. the workspace, Enterprise Grid, or channel). You may need these IDs for your command response.
   * The various accompanying *_name values provide you with the plain text names for these IDs, but as always you should only rely on the IDs as the names might change arbitrarily.
   * We'll include enterprise_id and enterprise_name parameters on command invocations when the executing workspace is part of an Enterprise Grid.
   */
  enterprise_id?: string;
  /**
   * These IDs provide context about where the user was in Slack when they triggered your app's command (e.g. the workspace, Enterprise Grid, or channel). You may need these IDs for your command response.
   * The various accompanying *_name values provide you with the plain text names for these IDs, but as always you should only rely on the IDs as the names might change arbitrarily.
   * We'll include enterprise_id and enterprise_name parameters on command invocations when the executing workspace is part of an Enterprise Grid.
   */
  enterprise_name?: string;
  /**
   * These IDs provide context about where the user was in Slack when they triggered your app's command (e.g. the workspace, Enterprise Grid, or channel). You may need these IDs for your command response.
   * The various accompanying *_name values provide you with the plain text names for these IDs, but as always you should only rely on the IDs as the names might change arbitrarily.
   * We'll include enterprise_id and enterprise_name parameters on command invocations when the executing workspace is part of an Enterprise Grid.
   */
  is_enterprise_install?: string;
}
