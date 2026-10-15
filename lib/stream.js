// Shared Stream server-side client. Single place that resolves the API key and
// secret so every integration (call tokens, booking, webhook, transcripts)
// uses the same credentials and fails loudly when they're missing — instead of
// silently creating a client with an undefined secret.
import { StreamClient } from "@stream-io/node-sdk";

export function getStreamCredentials() {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
  const secret = process.env.STREAM_SECRET_KEY || process.env.STREAM_API_SECRET;

  if (!apiKey || !secret) {
    throw new Error(
      "Stream credentials are missing. Set NEXT_PUBLIC_STREAM_API_KEY and STREAM_SECRET_KEY (or STREAM_API_SECRET) in your environment."
    );
  }

  return { apiKey, secret };
}

export function createStreamClient(options) {
  const { apiKey, secret } = getStreamCredentials();
  return new StreamClient(apiKey, secret, options);
}
