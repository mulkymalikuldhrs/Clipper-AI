/* The login-free operator workspace.
 *
 * The console has no sign-in. A browser mints one opaque key, keeps it locally, and that
 * key owns the plans and organism state it creates. The key is a capability, so it is
 * validated strictly and never derived from user input beyond this shape.
 *
 * Resource limits are not defined here: they belong to the plan catalog in `src/lib/plans.ts`,
 * because a limit is only real if the mutation that consumes it reads it.
 */

export const WORKSPACE_KEY_PATTERN = /^[a-f0-9]{32}$/;

export function isValidWorkspaceKey(value: unknown): value is string {
  return typeof value === "string" && WORKSPACE_KEY_PATTERN.test(value);
}
