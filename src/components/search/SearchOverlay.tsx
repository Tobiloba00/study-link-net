import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, ArrowUpRight, History, TrendingUp, MessageCircle, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────
   Search overlay — handles States 2 (focused/blank) and 3 (typing)
   from the Twitter-style search spec.

   • State 2: shows Recent Searches (localStorage) + Trending tags.
   • State 3: shows top-5 fuzzy matches across name + course + bio,
              with a "Go to {name}" shortcut row when there's an
              exact name match, and a "See all results for X →"
              footer that submits the query.

   Search input lives in the PARENT so the overlay is purely the
   dropdown panel. The parent owns focus/blur lifecycle.
   ──────────────────────────────────────────────────────────── */

interface SearchOverlayProfile {
  id: string;
  name: string;
  course: string | null;
  year_of_study: string | null;
  profile_picture: string | null;
}

type Props = {
  query: string;
  /** Recent searches list + actions, passed in from parent (useRecentSearches). */
  recent: string[];
  onRecentRemove: (q: string) => void;
  onRecentClear: () => void;
  /** Trending tag/skill strings (top 5). Computed once by the parent. */
  trending: string[];
  /** Pick a row → submit / navigate. */
  onSubmit: (query: string) => void;
  onGoToProfile: (userId: string) => void;
  onMessage: (userId: string) => void;
  /** Layout — mobile shows full-screen overlay, desktop shows anchored dropdown */
  isMobile: boolean;
};

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 5;

const formatYear = (year: string | null) => {
  if (!year) return null;
  return /level|year/i.test(year) ? year : `${year} Level`;
};

export const SearchOverlay = ({
  query,
  recent, onRecentRemove, onRecentClear,
  trending,
  onSubmit, onGoToProfile, onMessage,
  isMobile,
}: Props) => {
  const [results, setResults] = useState<SearchOverlayProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const reqIdRef = useRef(0);

  /* Strip a leading @ — treats "@Carlos" as a request for exact name match */
  const cleanedQuery = useMemo(() => query.replace(/^@+/, "").trim(), [query]);
  const isHandleQuery = query.trim().startsWith("@");

  /* ─── Debounced server-side typeahead ───
       300ms debounce + request-id guard (drops stale client-side) +
       AbortController so the in-flight HTTP request is cancelled
       server-side too when the user keeps typing. Only the columns
       actually shown go in the SELECT, and the OR is restricted to
       `name` + `course` (both backed by trigram GIN indexes per
       migration 20260526100000). `bio` is dropped — wide text column,
       low match probability for 1–4 char typeahead terms. */
  useEffect(() => {
    if (!cleanedQuery) { setResults([]); setSearching(false); return; }
    const id = ++reqIdRef.current;
    const controller = new AbortController();
    setSearching(true);

    const t = setTimeout(async () => {
      const term = cleanedQuery.replace(/[%_]/g, "\\$&");
      const { data } = await supabase
        .from("profiles")
        .select("id, name, course, year_of_study, profile_picture")
        .or(`name.ilike.%${term}%,course.ilike.%${term}%`)
        .order("rating", { ascending: false })
        .limit(MAX_RESULTS)
        .abortSignal(controller.signal);

      // Drop stale responses if the user typed more characters since
      if (id !== reqIdRef.current) return;
      setResults((data as SearchOverlayProfile[]) || []);
      setSearching(false);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [cleanedQuery]);

  /* ─── Exact-name match → "Go to {name}" shortcut row ─── */
  const exactMatch = useMemo(() => {
    const lower = cleanedQuery.toLowerCase();
    if (!lower) return null;
    return results.find((p) => p.name?.toLowerCase() === lower) || null;
  }, [results, cleanedQuery]);

  const isTyping = cleanedQuery.length > 0;

  /* ────────────────────────────────────────────────────────────
     Mobile layout: full-screen overlay rooted to viewport top.
     Desktop layout: panel anchored under the search input (parent
     positions us via wrapper).
     ──────────────────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        isMobile
          // Mobile: starts BELOW the fixed search bar (safe-area + 72px)
          // so it never physically overlaps the input. z-[60] keeps it
          // above the page content but below the input row (z-[100]).
          ? "fixed left-0 right-0 bottom-0 z-[60] bg-background overflow-y-auto px-4 pb-32"
          : "absolute left-0 right-0 top-full mt-2 z-50 bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden",
      )}
      style={
        isMobile
          ? { top: "calc(env(safe-area-inset-top, 0px) + 72px)" }
          : undefined
      }
    >
      {/* Cancel is rendered by the parent (UserSearch) next to the
          input on mobile — keeps it pinned to the search bar instead
          of floating awkwardly over the page. */}

      {/* ─── State 3: typing — top results ─── */}
      {isTyping ? (
        <div className={cn(isMobile ? "" : "py-2")}>
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Top Results
            </p>
            {searching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>

          {results.length === 0 && !searching && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches for "{cleanedQuery}"
            </p>
          )}

          <div className={cn(isMobile ? "" : "max-h-[400px] overflow-y-auto")}>
            {results.map((p) => {
              const yearText = formatYear(p.year_of_study);
              return (
                <button
                  key={p.id}
                  onClick={() => onGoToProfile(p.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={p.profile_picture || ""} alt={p.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {p.name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {[yearText, p.course].filter(Boolean).join(" · ") || "Student"}
                    </p>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onMessage(p.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onMessage(p.id); } }}
                    className="h-8 w-8 rounded-full border border-border/50 flex items-center justify-center text-primary hover:bg-primary/5 flex-shrink-0"
                    aria-label={`Message ${p.name}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>

          {/* "Go to {name}" shortcut — only when input is @handle-style OR exact name match */}
          {exactMatch && (
            <button
              onClick={() => onGoToProfile(exactMatch.id)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 border-t border-border/40 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ArrowUpRight className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-sm">
                  <span className="text-muted-foreground">Go to </span>
                  <span className="font-bold text-primary">{isHandleQuery ? `@${exactMatch.name}` : exactMatch.name}</span>
                </p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </button>
          )}

          {/* "See all results for X →" — submits the query */}
          {results.length > 0 && (
            <button
              onClick={() => onSubmit(cleanedQuery)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 border-t border-border/40 text-left hover:bg-muted/40 transition-colors"
            >
              <p className="text-sm font-semibold text-primary">
                See all results for "{cleanedQuery}"
              </p>
              <ArrowRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
            </button>
          )}
        </div>
      ) : (
        /* ─── State 2: focused / blank input — Recent + Trending ─── */
        <div className={cn(isMobile ? "space-y-5" : "py-2")}>
          {/* Recent Searches */}
          {recent.length > 0 && (
            <section className={cn(isMobile ? "" : "pb-2")}>
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Recent Searches
                </p>
                <button
                  onClick={onRecentClear}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Clear all
                </button>
              </div>
              {recent.map((q) => (
                <div
                  key={q}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-muted/40 transition-colors"
                >
                  <button
                    onClick={() => onSubmit(q)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    <History className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{q}</span>
                  </button>
                  <button
                    onClick={() => onRecentRemove(q)}
                    className="h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground/70 flex-shrink-0"
                    aria-label={`Remove "${q}" from recent searches`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </section>
          )}

          {/* Trending Searches */}
          {trending.length > 0 && (
            <section className={cn(isMobile ? "" : "border-t border-border/30 pt-1")}>
              <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Trending Searches
                </p>
              </div>
              {trending.map((t) => (
                <button
                  key={t}
                  onClick={() => onSubmit(t)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{t}</span>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                </button>
              ))}
            </section>
          )}

          {/* Empty hint when both are empty */}
          {recent.length === 0 && trending.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Start typing to search students by name, course or bio.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchOverlay;
