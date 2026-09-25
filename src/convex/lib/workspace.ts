/* Bounds for the login-free operator workspace.
 *
 * The console has no sign-in. A browser mints one opaque key, keeps it locally, and that
 * key owns the plans and organism state it creates. The key is a capability, so it is
 * validated strictly and never derived from user input beyond this shape.
 */

export const WORKSPACE_KEY_PATTERN = /^[a-f0-9]{32}$/;

/** Upper bounds so an unauthenticated console cannot grow tables without limit. */
export const MAX_WORKSPACE_PLANS = 80;
export const MAX_WORKSPACE_GOALS = 60;
export const MAX_WORKSPACE_TASKS_PER_PLAN = 120;

export function isValidWorkspaceKey(value: unknown): value is string {
  return typeof value === "string" && WORKSPACE_KEY_PATTERN.test(value);
}
