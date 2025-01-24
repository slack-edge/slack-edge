## Slack Edge

[![npm version](https://badge.fury.io/js/slack-edge.svg)](https://badge.fury.io/js/slack-edge) 
[![deno module](https://shield.deno.dev/x/slack_edge)](https://deno.land/x/slack_edge)

The **slack-edge** library is a Slack app development framework designed specifically for the following runtimes:

* [Cloudflare Workers](https://workers.cloudflare.com/)
* [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions/quickstart)
* [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

Not only does it work with the above, but it also functions with the latest versions of [Deno](https://deno.com/), [Bun](https://bun.sh/), and [Node.js](https://nodejs.org/en/about).

This framework draws significant inspiration from Slack's [Bolt framework](https://api.slack.com/tools/bolt), but its design does not strictly follow the [bolt-js](https://github.com/slackapi/bolt-js) blueprint. Key differences include:

* **Edge function ready**: Out-of-the-box edge function (e.g., Cloudflare Workers) support
* **TypeScript focused**: Enhances type safety and clarifies typings for developers
* **Lazy listener enabled**: [bolt-python's lazy listener feature](https://tools.slack.dev/bolt-python/concepts/lazy-listeners) is provided out of the box
* **Zero additional dependencies**: No other dependencies required beyond TypeScript types and [slack-web-api-client](https://github.com/slack-edge/slack-web-api-client) (our fetch-function-based Slack API client)

## Getting Started

Currently, you can use this library for three different platforms.

### Cloudflare Workers

[Cloudflare Workers](https://workers.cloudflare.com/) is an edge function platform for quickly deploying an app.

The only additional thing you need to do is to add [the **slack-cloudflare-workers** package](https://github.com/slack-edge/slack-cloudflare-workers) to your Cloudflare Workers app project. The **slack-cloudflare-workers** package enhances **slack-edge** with Cloudflare Workers-specific features, such as KV-based installation stores.

```bash
npm install -g wrangler@latest
npx wrangler generate my-slack-app
cd my-slack-app
npm i slack-cloudflare-workers@latest
```

A simple app that handles a slash command can be structured like this:

```typescript
import { SlackApp, SlackEdgeAppEnv } from "slack-cloudflare-workers";

export default {
  async fetch(
    request: Request,
    env: SlackEdgeAppEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    const app = new SlackApp({ env })
      .command("/hello-cf-workers",
        async (req) => {
          // sync handler, which is resposible to ack the request
          return ":wave: This app runs on Cloudflare Workers!";
          // If you don't have anything to do here, the function doesn't need to return anything
          // This means in that case, simply having `async () => {}` works for you
        },
        async ({ context: { respond } }) => {
          // Lazy listener, which can be executed asynchronously
          // You can do whatever may take longer than 3 seconds here
          await respond({ text: "This is an async reply. How are you doing?" });
        }
      );
    return await app.run(request, ctx);
  },
};
```

Also, before running this app, don't forget to create a `.dev.vars` file with your env variables for local development:

```
SLACK_SIGNING_SECRET=....
SLACK_BOT_TOKEN=xoxb-...
SLACK_LOGGING_LEVEL=DEBUG
```

When you run `wrangler dev --port 3000`, your app process spins up, and it starts handling API requests at `http://localhost:3000/slack/events`. You may want to run Cloudflare Tunnel or something equivalent to forward public endpoint requests to this local app process.

Refer to https://github.com/slack-edge/slack-cloudflare-workers/blob/main/docs/index.md for further guidance.

### Vercel Edge Functions

[Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions) is an edge function platform, which is part of [Vercel](https://vercel.com/)'s Frontend Cloud.

Create a new Next.js project w/ slack-edge library by following these steps:

```bash
npx create-next-app@latest --typescript
cd your-app-name
npm i slack-edge
```

Create a new source file `app/api/slack.ts` that contains the following code:

```typescript
import type { NextRequest } from "next/server";
import { waitUntil } from '@vercel/functions';
import { SlackApp } from "slack-edge";

export const config = {
  runtime: "edge",
};

const app = new SlackApp({
  env: {
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

app.command("/hello-edge",
  async (req) => {
    // sync handler, which is resposible to ack the request
    return ":wave: This app runs on Vercel Edge Function platform!";
    // If you don't have anything to do here, the function doesn't need to return anything
    // This means in that case, simply having `async () => {}` works for you
  },
  async ({ context: { respond } }) => {
    // Lazy listener, which can be executed asynchronously
    // You can do whatever may take longer than 3 seconds here
    await respond({ text: "This is an async reply. How are you doing?" });
  }
);

export async function POST(req: NextRequest) {
  return await app.run(req, { waitUntil });
}
```

With this code, your **Request URL** for handling requests from Slack API server will be `https://{your public domain}/api/slack` instead of `/slack/events`.

Lastly, you can run the app by following these steps:

```bash
export SLACK_SIGNING_SECRET="..."
export SLACK_BOT_TOKEN="xoxb-..."
npm run dev
```

If you use Cloudflare Tunnel or something equivalent, you may want to run `cloudflared tunnel --url http://localhost:3000` in a different terminal window.

We are currently working on the **slack-vercel-edge-functions** package, which offers Vercel-specific features in addition to the core ones provided by **slack-edge**. Until its release, please use slack-edge directly and implement the missing features on your own as necessary.

### Supabase Edge Functions

[Supabase](https://supabase.com/) is a BaaS that provides a full PostgreSQL database, along with other products such as [Supabase Edge Functions](https://supabase.com/docs/guides/functions).

Create a new Supabase project locally by following these steps:

```bash
mkdir myapp
cd myapp

brew install supabase/tap/supabase
supabase init
supabase functions new hello-world
```

Open the source file `supabase/functions/hello-world/index.ts` and replace it with the following:

```typescript
import {
  SlackApp,
  SlackEdgeAppEnv,
} from "https://deno.land/x/slack_edge@1.3.5/mod.ts";

const app = new SlackApp<SlackEdgeAppEnv>({
  env: {
    SLACK_SIGNING_SECRET: Deno.env.get("SLACK_SIGNING_SECRET")!,
    SLACK_BOT_TOKEN: Deno.env.get("SLACK_BOT_TOKEN"),
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

app.command("/hello-edge", async (req) => {
  // sync handler, which is resposible to ack the request
  return ":wave: This app runs on Vercel Edge Function platform!";
  // If you don't have anything to do here, the function doesn't need to return anything
  // This means in that case, simply having `async () => {}` works for you
}, async ({ context: { respond } }) => {
  // Lazy listener, which can be executed asynchronously
  // You can do whatever may take longer than 3 seconds here
  await respond({ text: "This is an async reply. How are you doing?" });
});

Deno.serve(async (req) => {
  return await app.run(req);
});
```

#### Run locally

Create a `supabase/functions/.env` file with the following:

```sh
export SLACK_SIGNING_SECRET="..."
export SLACK_BOT_TOKEN="xoxb-..."
```

Then run:

```sh
# Terminal A
supabase start
supabase functions serve --env-file supabase/functions/.env

# Terminal B
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://127.0.0.1:54321
```

#### Run in the cloud

In a browser, login to your Supabase account and create a new project.

Then open a terminal in your `myapp`'s project directory and run:

```sh
supabase login
```

Link the Supabase project you just made:

```sh
supabase link
```

Deploy your `hello-world` edge function.

```sh
supabase functions deploy hello-world --no-verify-jwt
```

Finally, add your environment variables:

* Go to your Supabase project
* Go to the Edge Functions tab, and click on your edge functions
* Tap on Manage Secrets and then add your `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET`

### Run Your App with Deno / Bun / Node.js

This library is available not only for edge function use cases but also for any JavaScript runtime use cases. Specifically, you can run an app with [Deno](https://deno.com/), [Bun](https://bun.sh/), and [Node.js](https://nodejs.org/en/about). To learn more about this, please check the example files under the `./test` directory.

#### Run with Bun

```typescript
import { SlackApp } from "slack-edge";

const app = new SlackApp({
  env: {
    SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

// Add listeners here

export default {
  port: 3000,
  async fetch(request) {
    return await app.run(request);
  },
};
```

You can run the app by:

```bash
# Terminal A
bun run --watch my-app.ts
# Terminal B
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://localhost:3000
```

#### Run with Deno

Please refer to [README for the Deno module](https://github.com/slack-edge/slack-edge/blob/main/src_deno/README.md).

#### Run with Node.js (Socket Mode: Production-ready)

If you need a stable Socket Mode integration, we recommend using `@slack/socket-mode` along with this package. With Node 20+, the following example works for you:

```typescript
// npm i slack-edge @slack/socket-mode
import {
  SlackApp,
  fromSocketModeToRequest,
  fromResponseToSocketModePayload,
} from "slack-edge";
import { SocketModeClient } from "@slack/socket-mode";
import { LogLevel } from "@slack/logger";

const app = new SlackApp({
  socketMode: true,
  env: {
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN!,
    SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN!,
    SLACK_LOGGING_LEVEL: "DEBUG",
  },
});

// Add listeners here
app.command("/hello", async ({}) => {
  return "Hi!";
});

// Start a Socket Mode client
const socketModeClient = new SocketModeClient({
  appToken: process.env.SLACK_APP_TOKEN!,
  logLevel: LogLevel.DEBUG,
});
socketModeClient.on("slack_event", async ({ body, ack, retry_num: retryNum, retry_reason: retryReason }) => {
  const request = fromSocketModeToRequest({ body, retryNum, retryReason });
  if (!request) { return; }
  const response = await app.run(request);
  await ack(await fromResponseToSocketModePayload({ response }));
},);
(async () => {
  await socketModeClient.start();
})();
```

If you want to build a Slack app this way, [this project template](https://github.com/slack-edge/slack-edge-app-template) should be pretty useful for you!

#### Run with Remix + Node.js

If you're looking for a way to serve Slack app using [Remix](https://remix.run/), slack-edge is the best way to go! Here is a simple example to run your Slack app as part of a Remix app:

```typescript
import { LoaderFunctionArgs } from "@remix-run/node";
import { SlackApp } from "slack-edge";

export async function action({ request }: LoaderFunctionArgs) {
  const app = new SlackApp({
    env: {
      SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
      SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET!,
    }
  });
  // Add listeners here

  return await app.run(request);
}
```

You can run the app by following these steps:
* `npx create-remix@latest`
* `cd my-remix-app`
* `npm i @remix-run/serve @remix-run/node slack-edge`
* Add `app/routes/api.slack.tsx` (if you go with `POST /api/slack`) with the above code
* `export SLACK_SIGNING_SECRET=...`
* `export SLACK_BOT_TOKEN=xoxb-...`
* `npm run dev`

### Reference

#### Middleware

This framework offers ways to globally customize your app's behavior, like you do when developing web apps. A common example is to attach extra data to the `context` object for following listeners.

|Pattern|Description|
|-|-|
|app.beforeAuthorize|The passed function does something before calling `authorize()` function. If this method returns `SlackResponse`, the following middleware and listeners won't be executed.|
|app.afterAuthorize / app.use / app.middleware|The passed function does something right after calling `authorize()` function. If this method returns `SlackResponse`, the following middleware and listeners won't be executed.|

#### `ack` / `lazy` Functions

You may be unfamiliar with the "lazy listener" concept in this framework. To learn more about it, please read bolt-python's documentation: https://tools.slack.dev/bolt-python/concepts/lazy-listeners

The `ack` function must complete within 3 seconds, while the `lazy` function can perform time-consuming tasks. It's important to note that not all request handlers support the ack or lazy functions. For more information, please refer to the following table, which covers all the patterns in detail.

Starting from v0.9, if desired, you can execute lazy listeners after the completion of their ack function. To customize the behavior in this manner, you can pass `startLazyListenerAfterAck: true` as one of the arguments in the `App` constructor.

|Pattern|Description|`ack` function|`lazy` function|
|-|-|-|-|
|app.assistant|The passed collection of functions handles an assistant thread request pattern. The feature needs to be turned on in advance.|x|◯|
|app.command|The passed function handles a slash command request pattern. If the function returns a message, the message will be posted in the channel where the end-user invoked the command.|◯|◯|
|app.event|The passed function asynchronously does something when an Events API request that matches the constraints comes in. Please note that manually acknowledge a request is unsupported. You can pass only one function, which can be executed as a lazy listener.|x|◯|
|app.function|The passed function asynchronously does something when a "function_executed" event request that matches the constraints comes in. Please note that manually acknowledge a request is unsupported. You can pass only one function, which can be executed as a lazy listener.|x|◯|
|app.message / app.anyMessage|The passed function asynchronously does something when an a message event comes in. Please note that manually acknowledge a request is unsupported. You can pass only one function, which can be executed as a lazy listener. If the message pattern argument can be any of string, regexp, and undefined. When you pass undefined, the listener matches all messages.|x|◯|
|app.shortcut / app.globalShortcut / app.messageShortcut|The passed function handles a global/message shortcut request pattern. Please note that returning a message text in the `ack` function does not work for shortcuts. Instead, you can use `context.respond` for it.|◯|◯|
|app.action|The passed function handles a user interaction on a Block Kit component such as button clicks, item selection in a select menu, and so on.|◯|◯|
|app.options|The passed function handles an external data source reqeust for Block Kit select menus. You cannnot respond to this request pattern asynchronously, so slack-edge enables developers to pass only `ack` function, which must complete within 3 seconds, here.|◯|x|
|app.view / app.viewSubmission / app.viewClosed|The passed function handles either a modal data submission or the "Close" button click event. `ack` function can return various `response_action`s (errors, update, push, clear) and their associated data. If you want to simply close the modal, you don't need to return anything.|◯|◯|
