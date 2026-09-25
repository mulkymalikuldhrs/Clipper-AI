import { useMemo, useState } from "react";
import { useConvexAuth, useConvexConnectionState } from "convex/react";

const STORAGE_KEY = "super-clipper.workspace";
const KEY_PATTERN = /^[a-f0-9]{32}$/;

function mintKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** One opaque key per browser. It is the only identity the console needs — there is no sign-in. */
function readWorkspaceKey(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && KEY_PATTERN.test(existing)) return existing;
    const created = mintKey();
    window.localStorage.setItem(STORAGE_KEY, created);
    return created;
  } catch {
    return mintKey();
  }
}

/** Forget the current workspace key. Plans and organism state created with it become unreachable. */
export function resetWorkspace() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: the in-memory key is already gone on reload.
  }
}

/** False until the Convex backend has answered at least once for this page load. */
export function useBackendReachable(): boolean {
  return useConvexConnectionState().hasEverConnected;
}

export function useWorkspace() {
  const [key] = useState(readWorkspaceKey);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const args = useMemo(() => ({ workspaceKey: key }), [key]);
  return {
    key,
    args,
    isLoading,
    /** A signed-in Convex Auth session, when the deployment provides one. */
    isAccount: isAuthenticated,
    /** True only while the auth state is still resolving. */
    pending: isLoading,
  };
}
