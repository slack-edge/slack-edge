/**
 * Parses a request payload's data. This code could serve as a reference implementation for parsing various Slack payload patterns.
 * @param requestHeaders request headers
 * @param requestBody request body
 * @returns parsed object
 */
// deno-lint-ignore require-await
export async function parseRequestBody(
  requestHeaders: Headers,
  requestBody: string,
): // deno-lint-ignore no-explicit-any
Promise<Record<string, any>> {
  const contentType = requestHeaders.get("content-type");
  if (
    contentType?.startsWith("application/json") || requestBody.startsWith("{")
  ) {
    return JSON.parse(requestBody);
  }
  const params = new URLSearchParams(requestBody);
  if (params.has("payload")) {
    const payload = params.get("payload")!;
    return JSON.parse(payload);
  }
  // deno-lint-ignore no-explicit-any
  const formBody: any = {};
  for (const k of params.keys()) {
    formBody[k] = params.get(k);
  }
  return formBody;
}
