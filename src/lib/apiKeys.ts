/**
 * Workspace API key format and hashing.
 *
 * The plaintext secret is created in a Convex action (the only place randomness is allowed)
 * and returned to the caller once. Only the SHA-256 hash is stored, so a database read never
 * yields a usable key. This module runs in the browser and in the Convex runtime — both
 * provide Web Crypto.
 */

export const API_KEY_PREFIX = "clai";
export const API_KEY_SECRET_HEX_LENGTH = 48;
export const API_KEY_SCOPES = ["read"] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

const SECRET_PATTERN = new RegExp(`^${API_KEY_PREFIX}_[a-f0-9]{${API_KEY_SECRET_HEX_LENGTH}}$`);

export function isApiKeySecret(value: unknown): value is string {
  return typeof value === "string" && SECRET_PATTERN.test(value);
}

/** The non-secret display prefix: `clai_` plus the first 8 hex characters. */
export function apiKeyDisplayPrefix(secret: string): string {
  const body = secret.slice(API_KEY_PREFIX.length + 1);
  return `${API_KEY_PREFIX}_${body.slice(0, 8)}`;
}

export function isApiKeyScope(value: unknown): value is ApiKeyScope {
  return typeof value === "string" && (API_KEY_SCOPES as readonly string[]).includes(value);
}

/** Hex SHA-256. Deterministic, so it is safe inside a Convex query or mutation. */
export async function hashApiKey(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Mint a key in the browser. The plaintext never leaves the client; only the hash is stored. */
export async function generateApiKey(): Promise<{ secret: string; prefix: string; hash: string }> {
  const bytes = crypto.getRandomValues(new Uint8Array(API_KEY_SECRET_HEX_LENGTH / 2));
  const body = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const secret = `${API_KEY_PREFIX}_${body}`;
  return { secret, prefix: apiKeyDisplayPrefix(secret), hash: await hashApiKey(secret) };
}

export function bearerToken(header: string | null): string {
  if (!header) return "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : "";
}
