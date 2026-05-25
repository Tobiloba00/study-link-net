import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MessageCircle,
  Star,
  Users,
  Loader2,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  course: string | null;
  year_of_study: string | null;
  skills: string[] | null;
  bio: string | null;
  profile_picture: string | null;
  rating: number;
  created_at: string;
}

/* Soft tag colours cycled across skill chips. */
const SKILL_COLORS = [
  "bg-primary/10 text-primary",
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "bg-accent/15 text-accent",
  "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
];

const formatYear = (year: string | null) => {
  if (!year) return null;
  return /level|year/i.test(year) ? year : `${year} Level`;
};

/* Filter chips — only year + meta filters. "Online" stays out until
   real presence tracking ships. */
type FilterKey =
  | "all"
  | "top"
  | "recent"
  | "y100" | "y200" | "y300" | "y400" | "yfinal";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",    label: "All" },
  { key: "top",    label: "Top Rated" },
  { key: "recent", label: "Recently Joined" },
  { key: "y100",   label: "100 Level" },
  { key: "y200",   label: "200 Level" },
  { key: "y300",   label: "300 Level" },
  { key: "y400",   label: "400 Level" },
  { key: "yfinal", label: "Final Year" },
];

const PAGE_SIZE = 20;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [popular, setPopular] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /* ─── Auth + the small "Popular on Campus" set (top 10 by rating) ─── */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: top } = await supabase
        .from("profiles")
        .select("id, name, course, year_of_study, skills, bio, profile_picture, rating, created_at")
        .order("rating", { ascending: false })
        .limit(10);
      setPopular((top as Profile[]) || []);
    })();
  }, []);

  /* ─── Debounce the search input ─── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ─── Build query (shared by initial fetch + infinite scroll) ─── */
  const buildQuery = useCallback(() => {
    let q = supabase
      .from("profiles")
      .select("id, name, course, year_of_study, skills, bio, profile_picture, rating, created_at");

    // Order depends on filter
    if (activeFilter === "top") {
      q = q.order("rating", { ascending: false });
    } else if (activeFilter === "recent") {
      q = q.order("created_at", { ascending: false });
    } else {
      q = q.order("rating", { ascending: false });
    }

    if (debouncedSearch) {
      const term = debouncedSearch.replace(/[%_]/g, "\\$&");
      q = q.or(
        `name.ilike.%${term}%,course.ilike.%${term}%,bio.ilike.%${term}%`,
      );
    }

    if (activeFilter === "recent") {
      const ago = new Date(Date.now() - MONTH_MS).toISOString();
      q = q.gte("created_at", ago);
    } else if (activeFilter.startsWith("y") && activeFilter !== "all") {
      const map: Record<string, string> = {
        y100: "100", y200: "200", y300: "300", y400: "400", yfinal: "Final",
      };
      const prefix = map[activeFilter];
      if (prefix) q = q.ilike("year_of_study", `${prefix}%`);
    }

    return q;
  }, [activeFilter, debouncedSearch]);

  /* ─── Reset + initial fetch when filters change ─── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await buildQuery().range(0, PAGE_SIZE - 1);
      if (cancelled) return;
      const list = ((data as Profile[]) || []).filter((p) => p.id !== currentUser?.id);
      setProfiles(list);
      setHasMore(list.length === PAGE_SIZE);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [buildQuery, currentUser?.id]);

  /* ─── Infinite scroll — IntersectionObserver on a sentinel below the list ─── */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || profiles.length === 0) return;
    const obs = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting) return;
        setLoading(true);
        const start = profiles.length;
        const { data } = await buildQuery().range(start, start + PAGE_SIZE - 1);
        const list = ((data as Profile[]) || []).filter((p) => p.id !== currentUser?.id);
        setProfiles((prev) => [...prev, ...list]);
        setHasMore(list.length === PAGE_SIZE);
        setLoading(false);
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [profiles, hasMore, loading, buildQuery, currentUser?.id]);

  /* ─── Actions ─── */
  const handleMessage = (userId: string) => {
    if (!currentUser) { toast.error("Please log in to send messages"); navigate("/auth"); return; }
    navigate(`/messages?userId=${userId}`);
  };
  const handleRateUser = (userId: string) => {
    if (!currentUser) { toast.error("Please log in to rate users"); navigate("/auth"); return; }
    navigate(`/rate-user/${userId}`);
  };
  const handleInvite = async () => {
    const url = `${window.location.origin}/auth`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join me on CampusLink", text: "Find help, tutors and great people on campus.", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Invite link copied!");
      }
    } catch { /* user cancelled */ }
  };

  const hasActiveFilter = debouncedSearch.length > 0 || activeFilter !== "all";
  const popularToShow = popular.filter((p) => p.id !== currentUser?.id).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-5 pt-[calc(env(safe-area-inset-top,0px)+76px)] pb-32 lg:pb-12">
        {/* ─── Hero ─── */}
        <div className="flex items-start justify-between gap-3 mb-6 animate-hero">
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-[34px] sm:text-[40px] font-extrabold tracking-tight leading-[1.05] mb-2">
              Find People
            </h1>
            <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-sm">
              Connect and collaborate with students on campus.
            </p>
          </div>
          <FindPeopleArtwork />
        </div>

        {/* ─── Search bar ─── */}
        <div className="relative bg-card rounded-2xl border border-border/50 shadow-sm mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by name, course, or bio…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 bg-transparent border-none focus-visible:ring-0 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors px-2"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        {/* ─── Filter pills — horizontally scrollable ─── */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              active={activeFilter === f.key}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </FilterPill>
          ))}
        </div>

        {/* ─── "Popular on Campus" horizontal scroll
             Only shown when there's no search or filter active. ─── */}
        {!hasActiveFilter && popularToShow.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold tracking-tight mb-3">Popular on Campus</h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 scrollbar-hide pb-2">
              {popularToShow.map((p) => (
                <PopularCard
                  key={p.id}
                  profile={p}
                  onMessage={() => handleMessage(p.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── Section header ─── */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold tracking-tight">
            {debouncedSearch
              ? "Results"
              : activeFilter === "all"
                ? "All Students"
                : FILTERS.find((f) => f.key === activeFilter)?.label}
          </h2>
        </div>

        {/* ─── Compact row list — divide-y, no per-row chrome ─── */}
        <div className="bg-card rounded-2xl border border-border/40 divide-y divide-border/30 overflow-hidden">
          {profiles.map((profile, i) => {
            const skill = profile.skills?.find(Boolean);
            const skillColor = SKILL_COLORS[i % SKILL_COLORS.length];
            const yearText = formatYear(profile.year_of_study);
            return (
              <button
                key={profile.id}
                onClick={() => navigate(`/profile?userId=${profile.id}`)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <Avatar className="h-11 w-11 flex-shrink-0">
                  <AvatarImage src={profile.profile_picture || ""} alt={profile.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                    {profile.name?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px] truncate leading-tight">
                    {profile.name}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                    {profile.course || "Student"}
                    {yearText ? ` · ${yearText}` : ""}
                  </p>
                  {skill && (
                    <span className={cn(
                      "inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold",
                      skillColor,
                    )}>
                      {skill}
                    </span>
                  )}
                </div>

                {/* Icon-only actions — frees horizontal space for the name/course */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleMessage(profile.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); handleMessage(profile.id); } }}
                    className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 flex items-center justify-center transition-colors"
                    aria-label={`Message ${profile.name}`}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleRateUser(profile.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); handleRateUser(profile.id); } }}
                    className="h-9 w-9 rounded-full border border-border/50 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:border-amber-200 dark:hover:border-amber-500/30 flex items-center justify-center transition-colors text-foreground/70"
                    aria-label={`Rate ${profile.name}`}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            );
          })}

          {/* Sentinel — observed for infinite scroll */}
          <div ref={sentinelRef} className="h-px" />
        </div>

        {/* ─── Loading / empty / end-of-list ─── */}
        {loading && (
          <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </div>
        )}
        {!loading && profiles.length === 0 && (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="font-semibold mb-1">No users found</p>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch ? `Try a different search term` : "Try another filter"}
            </p>
          </div>
        )}
        {!loading && !hasMore && profiles.length > 0 && (
          <p className="text-[11px] text-muted-foreground/60 text-center py-3">
            End of list · {profiles.length} {profiles.length === 1 ? "person" : "people"} shown
          </p>
        )}

        {/* ─── Grow network CTA ─── */}
        {profiles.length > 0 && !loading && (
          <div className="mt-6 bg-primary/[0.06] dark:bg-primary/[0.08] border border-primary/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Grow your network</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Invite friends so they can find you here too.
              </p>
            </div>
            <Button
              onClick={handleInvite}
              variant="outline"
              className="h-9 rounded-xl border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold flex-shrink-0 px-3"
            >
              Invite
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

/* ────────────────────────────────────────────
   Filter pill (horizontally-scrollable strip)
   ──────────────────────────────────────────── */
const FilterPill = ({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
      active
        ? "bg-primary text-primary-foreground border border-primary"
        : "bg-card border border-border/50 text-foreground hover:bg-muted",
    )}
  >
    {children}
  </button>
);

/* ────────────────────────────────────────────
   "Popular on Campus" — horizontal scroll card
   Compact vertical card, large avatar, tap to message.
   ──────────────────────────────────────────── */
const PopularCard = ({
  profile, onMessage,
}: { profile: Profile; onMessage: () => void }) => (
  <div className="flex-shrink-0 w-[110px] bg-card border border-border/40 rounded-2xl p-2.5 flex flex-col items-center text-center">
    <Avatar className="h-14 w-14 mb-1.5">
      <AvatarImage src={profile.profile_picture || ""} alt={profile.name} />
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {profile.name?.charAt(0).toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
    <p className="text-[12px] font-bold leading-tight truncate w-full">{profile.name}</p>
    <p className="text-[10px] text-muted-foreground leading-tight truncate w-full mt-0.5">
      {profile.course || "Student"}
    </p>
    <Button
      onClick={onMessage}
      size="sm"
      className="mt-2 h-7 w-full rounded-lg text-[10px] font-bold bg-primary hover:bg-primary/90"
    >
      <MessageCircle className="h-3 w-3 mr-1" />
      Message
    </Button>
  </div>
);

/* ────────────────────────────────────────────
   Inline artwork — people circles + magnifier
   ──────────────────────────────────────────── */
const FindPeopleArtwork = () => (
  <svg
    width="118"
    height="118"
    viewBox="0 0 118 118"
    className="flex-shrink-0 sm:w-[140px] sm:h-[140px]"
    fill="none"
    aria-hidden="true"
  >
    {/* Distant person (top-right, faded) */}
    <circle cx="92" cy="22" r="11" fill="hsl(var(--muted))" />
    <circle cx="92" cy="20" r="3.5" fill="hsl(var(--muted-foreground) / 0.45)" />
    <path d="M84 32 Q84 28 92 28 Q100 28 100 32 Z" fill="hsl(var(--muted-foreground) / 0.45)" />

    {/* Mid person */}
    <circle cx="78" cy="28" r="14" fill="hsl(var(--primary) / 0.10)" />
    <circle cx="78" cy="26" r="4.5" fill="hsl(var(--primary) / 0.55)" />
    <path d="M68 38 Q68 33 78 33 Q88 33 88 38 Z" fill="hsl(var(--primary) / 0.55)" />

    {/* Lead person */}
    <circle cx="38" cy="32" r="18" fill="hsl(var(--primary) / 0.14)" />
    <circle cx="38" cy="29" r="6" fill="hsl(var(--primary))" />
    <path d="M25 46 Q25 39 38 39 Q51 39 51 46 Z" fill="hsl(var(--primary))" />

    {/* Magnifying glass */}
    <circle cx="62" cy="68" r="22" stroke="hsl(var(--foreground) / 0.85)" strokeWidth="3" fill="hsl(var(--card))" />
    <circle cx="62" cy="64" r="5" fill="hsl(var(--success))" />
    <path d="M55 76 Q62 71 69 76" stroke="hsl(var(--foreground) / 0.85)" strokeWidth="2" fill="none" strokeLinecap="round" />
    <line x1="80" y1="86" x2="100" y2="106" stroke="hsl(var(--foreground) / 0.85)" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export default UserSearch;
