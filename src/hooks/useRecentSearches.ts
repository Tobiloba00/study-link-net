import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "cl-recent-searches";
const MAX_ITEMS = 5;

/**
 * Cached "Recent Searches" list (max 5) backed by localStorage.
 * Used by the search overlay in State 2 (focused / blank input).
 *
 * Items are deduped case-insensitively and trimmed. Newest first.
 */
export const useRecentSearches = () => {
  const [items, setItems] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, MAX_ITEMS) : [];
    } catch {
      return [];
    }
  });

  const persist = useCallback((next: string[]) => {
    setItems(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
  }, []);

  /** Push a new query to the top, dedupe, cap at MAX_ITEMS. */
  const push = useCallback((rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    setItems((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== lower)].slice(0, MAX_ITEMS);
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }, []);

  /** Remove a single query (X-button on a chip). */
  const remove = useCallback((rawQuery: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.toLowerCase() !== rawQuery.toLowerCase());
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }, []);

  /** Clear all — "Clear all" button. */
  const clear = useCallback(() => persist([]), [persist]);

  // Sync across tabs (so clearing on tab A reflects on tab B)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(parsed)) setItems(parsed);
      } catch { /* */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { items, push, remove, clear };
};
