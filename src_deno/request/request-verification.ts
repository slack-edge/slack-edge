/**
 * Verifies if a request's signature is correct. This code could serve as a reference implementation for verifying the signature in a request from Slack.
 * @param signingSecret signing secret
 * @param signingSecret signing secret
 * @param requestHeaders request headers
 * @param requestBody request body
 * @returns true if the given signature is valid
 */
export async function verifySlackRequest(
  signingSecret: string,
  requestHeaders: Headers,
  requestBody: string,
): Promise<boolean> {
  const timestampHeader = requestHeaders.get("x-slack-request-timestamp");
  if (!timestampHeader) {
    console.log("x-slack-request-timestamp header is missing!");
    return false;
  }
  const fiveMinutesAgoSeconds = Math.floor(Date.now() / 1000) - 60 * 5;
  if (Number.parseInt(timestampHeader) < fiveMinutesAgoSeconds) {
    return false;
  }

  const signatureHeader = requestHeaders.get("x-slack-signature");
  if (!timestampHeader || !signatureHeader) {
    console.log("x-slack-signature header is missing!");
    return false;
  }

  const textEncoder = new TextEncoder();
  return await crypto.subtle.verify(
    "HMAC",
    await crypto.subtle.importKey(
      "raw",
      textEncoder.encode(signingSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    ),
    fromHexStringToBytes(signatureHeader.substring(3)),
    textEncoder.encode(`v0:${timestampHeader}:${requestBody}`),
  );
}

function fromHexStringToBytes(hexString: string) {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let idx = 0; idx < hexString.length; idx += 2) {
    bytes[idx / 2] = parseInt(hexString.substring(idx, idx + 2), 16);
  }
  return bytes;
}
