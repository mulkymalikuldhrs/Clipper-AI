export type SocialPlatform = "tiktok" | "instagram";

export type SocialAccount = {
  id: string;
  platform: SocialPlatform;
  displayName: string;
  handle: string;
  profileUrl: string;
  connection: "not_configured" | "ready";
  publishMode: "review_required";
  lastVerifiedAt: string | null;
};

const STORAGE_KEY = "super-clipper.social-accounts.v1";

function safeUrl(value: string): string {
  const url = value.trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export function normalizeSocialAccounts(value: unknown): SocialAccount[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const platform = row.platform === "tiktok" || row.platform === "instagram" ? row.platform : null;
    const displayName = typeof row.displayName === "string" ? row.displayName.trim().slice(0, 80) : "";
    const handle = typeof row.handle === "string" ? row.handle.trim().slice(0, 80) : "";
    if (!platform || !displayName || !handle) return [];
    return [{
      id: typeof row.id === "string" && row.id ? row.id.slice(0, 80) : `${platform}-${index + 1}`,
      platform,
      displayName,
      handle,
      profileUrl: safeUrl(typeof row.profileUrl === "string" ? row.profileUrl : ""),
      connection: row.connection === "ready" ? "ready" : "not_configured",
      publishMode: "review_required",
      lastVerifiedAt: typeof row.lastVerifiedAt === "string" ? row.lastVerifiedAt : null,
    } satisfies SocialAccount];
  });
}

export function loadSocialAccounts(): SocialAccount[] {
  if (typeof window === "undefined") return [];
  try {
    return normalizeSocialAccounts(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function saveSocialAccounts(accounts: SocialAccount[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSocialAccounts(accounts)));
}

export function removeSocialAccount(id: string): void {
  saveSocialAccounts(loadSocialAccounts().filter((account) => account.id !== id));
}
