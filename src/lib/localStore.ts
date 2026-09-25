/**
 * Browser storage helpers.
 *
 * The product was renamed, so every persisted key moved to a `clipper-ai.*` namespace. These
 * helpers read the new key first and migrate the old one once, so an existing browser keeps its
 * workspace, provider settings, swarm sessions, and social accounts after the rename.
 */

type ReadableStore = Pick<Storage, "getItem"> & Partial<Pick<Storage, "setItem" | "removeItem">>;

export function readWithLegacy(store: ReadableStore, key: string, legacyKey?: string): string | null {
  const current = store.getItem(key);
  if (current !== null) return current;
  if (!legacyKey) return null;
  const legacy = store.getItem(legacyKey);
  if (legacy === null) return null;
  try {
    store.setItem?.(key, legacy);
    store.removeItem?.(legacyKey);
  } catch {
    // Storage blocked or full: keep serving the legacy value instead of losing it.
  }
  return legacy;
}
