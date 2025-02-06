## Slack Edge

The **slack-edge** library is a Slack app development framework designed
specifically for the following runtimes:

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions/quickstart)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

Not only does it work with the above, but it also functions with the latest
versions of [Deno](https://deno.com/), [Bun](https://bun.sh/), and
[Node.js](https://nodejs.org/en/about).

This framework draws significant inspiration from Slack's
[Bolt framework](https://api.slack.com/tools/bolt), but its design does not
strictly follow the [bolt-js](https://github.com/slackapi/bolt-js) blueprint.
Key differences include:

- **Edge function ready**: Out-of-the-box edge function (e.g., Cloudflare
  Workers) support
- **TypeScript focused**: Enhances type safety and clarifies typings for
  developers
- **Lazy listener enabled**:
  [bolt-python's lazy listener feature](https://tools.slack.dev/bolt-python/concepts/lazy-listeners)
  is provided out of the box
- **Zero additional dependencies**: No other dependencies required beyond
  TypeScript types and
  [slack-web-api-client](https://github.com/slack-edge/slack-web-api-client)
  (our fetch-function-based Slack API client)

## Getting Started

### Run with Deno

```typescript
import {
  SlackApp,
  SlackEdgeAppEnv,
} from "https://deno.land/x/slack_edge@1.3.6/mod.ts";

const app = new SlackApp<SlackEdgeAppEnv>({
  env: {
    SLACK_SIGNING_SECRET: Deno.env.get("SLACK_SIGNING_SECRET")!,
    SLACK_BOT_TOKEN: Deno.env.get("SLACK_BOT_TOKEN"),
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

// Add listeners here

await Deno.serve({ port: 3000 }, async (request) => {
  return await app.run(request);
});
```

You can run the app by:

```bash
# Terminal A
deno run --watch --allow-net --allow-env my-app.ts
# Terminal B
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://localhost:3000
```

### Run with Deno (Socket Mode: Experimental)

**Important Notice:** The Socket Mode support provided by slack-edge is still
experimental and is not designed to handle reconnections for production-grade
applications. It is recommended to use this mode only for local development and
testing purposes.

Thanks to Deno's built-in WebSocket implementation, you can quickly and easily
run a Socket Mode app as below:

```typescript
import {
  SlackApp,
  SlackSocketModeAppEnv,
} from "https://deno.land/x/slack_edge@1.3.6/mod.ts";

const app = new SlackApp<SlackSocketModeAppEnv>({
  env: {
    SLACK_APP_TOKEN: Deno.env.get("SLACK_APP_TOKEN")!,
    SLACK_BOT_TOKEN: Deno.env.get("SLACK_BOT_TOKEN"),
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

// Add listeners here

await app.connect();
setTimeout(() => {}, Number.MAX_SAFE_INTEGER);
```

You can run this app by `deno run --watch --allow-net --allow-env my-app.ts`.

### Reference

#### Middleware

This framework offers ways to globally customize your app's behavior, like you
do when developing web apps. A common example is to attach extra data to the
`context` object for following listeners.

| Pattern                                       | Description                                                                                                                                                                      |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| app.beforeAuthorize                           | The passed function does something before calling `authorize()` function. If this method returns `SlackResponse`, the following middleware and listeners won't be executed.      |
| app.afterAuthorize / app.use / app.middleware | The passed function does something right after calling `authorize()` function. If this method returns `SlackResponse`, the following middleware and listeners won't be executed. |

#### `ack` / `lazy` Functions

You may be unfamiliar with the "lazy listener" concept in this framework. To
learn more about it, please read bolt-python's documentation:
https://tools.slack.dev/bolt-python/concepts/lazy-listeners

The `ack` function must complete within 3 seconds, while the `lazy` function can
perform time-consuming tasks. It's important to note that not all request
handlers support the ack or lazy functions. For more information, please refer
to the following table, which covers all the patterns in detail.

Starting from v0.9, if desired, you can execute lazy listeners after the
completion of their ack function. To customize the behavior in this manner, you
can pass `startLazyListenerAfterAck: true` as one of the arguments in the `App`
constructor.

| Pattern                                                 | Description                                                                                                                                                                                                                                                                                                                                                            | `ack` function | `lazy` function |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------- |
| app.assistant                                           | The passed collection of functions handles an assistant thread request pattern. The feature needs to be turned on in advance.                                                                                                                                                                                                                                          | x              | ◯               |
| app.command                                             | The passed function handles a slash command request pattern. If the function returns a message, the message will be posted in the channel where the end-user invoked the command.                                                                                                                                                                                      | ◯              | ◯               |
| app.event                                               | The passed function asynchronously does something when an Events API request that matches the constraints comes in. Please note that manually acknowledge a request is unsupported. You can pass only one function, which can be executed as a lazy listener.                                                                                                          | x              | ◯               |
| app.function                                            | The passed function asynchronously does something when a "function_executed" event request that matches the constraints comes in. Please note that manually acknowledge a request is unsupported. You can pass only one function, which can be executed as a lazy listener.                                                                                            | x              | ◯               |
| app.message / app.anyMessage                            | The passed function asynchronously does something when an a message event comes in. Please note that manually acknowledge a request is unsupported. You can pass only one function, which can be executed as a lazy listener. If the message pattern argument can be any of string, regexp, and undefined. When you pass undefined, the listener matches all messages. | x              | ◯               |
| app.shortcut / app.globalShortcut / app.messageShortcut | The passed function handles a global/message shortcut request pattern. Please note that returning a message text in the `ack` function does not work for shortcuts. Instead, you can use `context.respond` for it.                                                                                                                                                     | ◯              | ◯               |
| app.action                                              | The passed function handles a user interaction on a Block Kit component such as button clicks, item selection in a select menu, and so on.                                                                                                                                                                                                                             | ◯              | ◯               |
| app.options                                             | The passed function handles an external data source reqeust for Block Kit select menus. You cannnot respond to this request pattern asynchronously, so slack-edge enables developers to pass only `ack` function, which must complete within 3 seconds, here.                                                                                                          | ◯              | x               |
| app.view / app.viewSubmission / app.viewClosed          | The passed function handles either a modal data submission or the "Close" button click event. `ack` function can return various `response_action`s (errors, update, push, clear) and their associated data. If you want to simply close the modal, you don't need to return anything.                                                                                  | ◯              | ◯               |
