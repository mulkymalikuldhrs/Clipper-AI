/* Defensive validation for the local bridge ingest boundary. */

export const MAX_INGEST_BYTES = 1024 * 1024;
export const MAX_CAMPAIGNS = 500;
export const MAX_JOINED_CAMPAIGNS = 500;
export const MAX_EARNINGS_ROWS = 500;
export const CONTENT_REWARDS_SOURCE = "content_rewards";
export const INGEST_SOURCES = ["bridge", CONTENT_REWARDS_SOURCE] as const;
export type IngestSource = (typeof INGEST_SOURCES)[number];

export type ValidatedIngest = {
  email: string;
  source: IngestSource;
  requestId?: string;
  snapshot: Record<string, unknown>;
};

type ValidationFailure = { ok: false; status: 400 | 413; error: string };
type ValidationSuccess = { ok: true; value: ValidatedIngest };
export type IngestValidation = ValidationFailure | ValidationSuccess;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function checkArray(value: unknown, max: number, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > max) {
    return `${label} must be an array with at most ${max} items`;
  }
  if (!value.every(isRecord)) return `${label} must contain objects only`;
  return undefined;
}

/** Validate shape and resource limits before any Convex mutation is attempted. */
export function validateIngestPayload(input: unknown): IngestValidation {
  if (!isRecord(input)) return { ok: false, status: 400, error: "payload must be an object" };

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!isBoundedString(email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, status: 400, error: "a valid email is required" };
  }

  const source = input.source === undefined ? "bridge" : input.source;
  if (source !== "bridge" && source !== CONTENT_REWARDS_SOURCE) {
    return { ok: false, status: 400, error: "unsupported ingest source" };
  }

  const requestId = input.requestId;
  if (requestId !== undefined && (!isBoundedString(requestId, 100) || !/^[a-zA-Z0-9._:-]+$/.test(requestId))) {
    return { ok: false, status: 400, error: "requestId must be a short opaque token" };
  }

  if (input.snapshot !== undefined && !isRecord(input.snapshot)) {
    return { ok: false, status: 400, error: "snapshot must be an object" };
  }
  const snapshot = isRecord(input.snapshot) ? input.snapshot : {};
  const campaignsError = checkArray(snapshot.campaigns, MAX_CAMPAIGNS, "snapshot.campaigns");
  if (campaignsError) return { ok: false, status: 400, error: campaignsError };

  const joined = isRecord(snapshot.joined) ? snapshot.joined : undefined;
  const joinedError = checkArray(joined?.campaigns, MAX_JOINED_CAMPAIGNS, "snapshot.joined.campaigns");
  if (joinedError) return { ok: false, status: 400, error: joinedError };

  const earningsError = checkArray(snapshot.earningsRows, MAX_EARNINGS_ROWS, "snapshot.earningsRows");
  if (earningsError) return { ok: false, status: 400, error: earningsError };

  return {
    ok: true,
    value: {
      email,
      source,
      ...(requestId ? { requestId } : {}),
      snapshot,
    },
  };
}
