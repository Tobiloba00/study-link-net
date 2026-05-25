import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Sparkles, Users, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────
   IMAGE ASSETS — live in /public/onboarding/

   Filenames contain spaces, so URLs use %20. If you swap any file,
   either match the name here or update the constant below.
   ──────────────────────────────────────────────────────────────── */
const IMG = {
  // Slide 1 (cream) — strongest "conversation pair":
  //   his gaze angles down-right, hers (mirrored) comes up-left, so eye-lines meet.
  helpMale:    "/onboarding/male%20hair%20fade.png",
  helpFemale:  "/onboarding/female%20braid.png",
  helpThird:   "/onboarding/female%20on%20white.png",  // small avatar, top-left
  // Slide 2 (green) — single composed shot of book + sneakers + headphones
  marketCluster: "/onboarding/Books,headphones%20and%20shoes.png",
  // Slide 3 (peach) — two males for the group avatars + one notifier
  peer1:       "/onboarding/casual%20male.png",          // top pair, left
  peer2:       "/onboarding/male%20lowcut%20hair.png",   // top pair, right
  peer3:       "/onboarding/female%20afro%20hair.png",   // bottom notif card
  // Slide 4 — no photos; design is icon + chips only.
} as const;

const STORAGE_KEY = "cl-welcomed";

/* ────────────────────────────────────────────────────────────────
   Shared atoms
   ──────────────────────────────────────────────────────────── */

const Badge = ({
  index, tone = "emerald",
}: { index: string; tone?: "emerald" | "violet" }) => (
  <div className={cn(
    "absolute top-3 left-3 z-30 text-white text-[11px] font-extrabold tracking-wider px-2 py-0.5 rounded-md shadow-sm",
    tone === "violet" ? "bg-violet-500" : "bg-emerald-500",
  )}>
    {index}
  </div>
);

const WhitePill = ({
  children, className,
}: { children: React.ReactNode; className?: string }) => (
  <div
    className={cn(
      "bg-white rounded-full px-3 py-1.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)] text-[12px] font-bold text-foreground z-30 inline-flex items-center gap-1.5 whitespace-nowrap",
      className,
    )}
  >
    {children}
  </div>
);

/* ────────────────────────────────────────────────────────────────
   Slide 1 — Get help, give help (cream)
   Three-circle composition matching the reference structure:
     • Small third avatar, top-left (decorative third helper)
     • Female main subject, bottom-left, larger circle, white ring
     • Male helper, top-right, larger circle, white ring, mirrored
     • Blue speech bubble with tail, "I can help!" — bottom-centre
   Background and badge stay on our existing design system.
   ──────────────────────────────────────────────────────────── */
const Slide1Hero = () => (
  <div className="relative h-full w-full bg-[#FAF6F0] overflow-hidden">
    <Badge index="01" />

    {/* Centred composition — sized by the hero pane's HEIGHT (not width)
        so it always fits inside the 50dvh pane on every phone. Square
        aspect = tight, balanced triangle of circles + bubble below. */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[88%] max-h-[340px] aspect-square">
      {/* Small third avatar — top-left corner */}
      <img
        src={IMG.helpThird}
        alt="Another student"
        className="absolute top-[2%] left-0 w-[24%] aspect-square rounded-full object-cover border-[3px] border-white shadow-[0_8px_20px_rgba(15,23,42,0.15)] z-30"
      />

      {/* Male — top-right, mirrored so his gaze points down-left toward her */}
      <img
        src={IMG.helpMale}
        alt="Student offering help"
        className="absolute top-[10%] right-0 w-[54%] aspect-square rounded-full object-cover border-[4px] border-white shadow-[0_14px_30px_rgba(15,23,42,0.15)] z-20 scale-x-[-1]"
      />

      {/* Female — bottom-left, natural right-gaze toward him */}
      <img
        src={IMG.helpFemale}
        alt="Student asking for help"
        className="absolute bottom-[10%] left-[4%] w-[58%] aspect-square rounded-full object-cover border-[4px] border-white shadow-[0_14px_30px_rgba(15,23,42,0.15)] z-10"
      />

      {/* "I can help!" — blue bubble with bottom-left tail, just under female */}
      <div className="absolute bottom-0 left-[40%] z-40">
        <div className="relative bg-primary text-primary-foreground rounded-2xl px-3.5 py-2 shadow-[0_10px_24px_rgba(37,99,235,0.30)]">
          <p className="text-[13px] font-bold whitespace-nowrap">I can help!</p>
          {/* Tail — rotated square tucked under the bubble's bottom-left */}
          <div
            className="absolute -bottom-1 left-3 w-2.5 h-2.5 bg-primary rotate-45"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────
   Slide 2 — Buy, sell, discover (green)
   Single composed product shot on a soft mint disc, scattered
   sparkle dots for ambient depth, and the price pill floating
   centered above the cluster — matches the reference's premium feel.
   ──────────────────────────────────────────────────────────── */
const Slide2Hero = () => (
  <div className="relative h-full w-full bg-[#E8F3E8] overflow-hidden">
    <Badge index="02" />

    {/* Soft mint disc — the visual anchor the cluster sits on */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[52%] w-[78%] aspect-square rounded-full bg-emerald-200/60" />

    {/* Ambient sparkle dots — subtle, scattered, for depth */}
    <div className="absolute top-[14%] left-[10%] w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
    <div className="absolute top-[22%] left-[18%] w-1 h-1 rounded-full bg-emerald-500/50" />
    <div className="absolute top-[36%] left-[6%] w-1 h-1 rounded-full bg-emerald-400/60" />
    <div className="absolute top-[18%] right-[12%] w-1 h-1 rounded-full bg-emerald-500/50" />
    <div className="absolute bottom-[28%] right-[8%] w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
    <div className="absolute bottom-[12%] left-[8%] w-1 h-1 rounded-full bg-emerald-500/50" />
    {/* A tiny outline ring for visual variety */}
    <div className="absolute top-[12%] left-[16%] w-3 h-3 rounded-full border border-emerald-400/50" />

    {/* Composed cluster: book + sneakers + headphones, single PNG.
        Crisp shadow + sharp render = premium feel. */}
    <img
      src={IMG.marketCluster}
      alt="Textbook, sneakers and headphones for sale"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[46%] w-[82%] object-contain z-20"
      style={{ filter: "drop-shadow(0 18px 22px rgba(15,23,42,0.18)) drop-shadow(0 6px 10px rgba(15,23,42,0.10))" }}
    />

    {/* ₦3,500 pill — top-center, floating above the cluster */}
    <WhitePill className="absolute top-[12%] left-1/2 -translate-x-1/2 text-emerald-600 z-30">
      ₦3,500
    </WhitePill>
  </div>
);

/* ────────────────────────────────────────────────────────────────
   Slide 3 — Connect & collaborate (peach)
   Two overlapping avatars at top, a centered "Study group" bubble,
   then a notification card at the bottom with another avatar + a
   "Just now" amber pill. Decorative sparkles and a small curved
   swoosh arrow give the slide its ambient personality.
   ──────────────────────────────────────────────────────────── */
const Slide3Hero = () => (
  <div className="relative h-full w-full bg-[#FBEDE0] overflow-hidden">
    <Badge index="03" />

    {/* ─── Decorative ambient elements ─── */}
    {/* Small yellow dot under the badge */}
    <div className="absolute top-[16%] left-[14%] w-1.5 h-1.5 rounded-full bg-amber-400 z-10" />
    {/* 4-point star sparkle on the left */}
    <Sparkles className="absolute top-[24%] left-[6%] w-4 h-4 text-amber-400 z-10" strokeWidth={2.2} />
    {/* Tiny dot, right side mid */}
    <div className="absolute top-[44%] right-[10%] w-1 h-1 rounded-full bg-amber-300 z-10" />
    {/* Curvy swoosh arrow, top-right */}
    <svg
      className="absolute top-[10%] right-[12%] w-7 h-7 z-10"
      viewBox="0 0 32 32"
      fill="none"
      stroke="#f59e0b"
      strokeOpacity={0.7}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 17 C 10 8, 22 8, 27 16" />
      <path d="M22 11 L 27 16 L 22 21" />
    </svg>

    {/* ─── Two overlapping group avatars, top-center ─── */}
    <div className="absolute top-[14%] left-1/2 -translate-x-1/2 flex z-20">
      <img
        src={IMG.peer1}
        alt="Group member"
        className="w-12 h-12 rounded-full object-cover border-[3px] border-white shadow-[0_8px_16px_rgba(15,23,42,0.15)]"
      />
      <img
        src={IMG.peer2}
        alt="Group member"
        className="w-12 h-12 rounded-full object-cover border-[3px] border-white shadow-[0_8px_16px_rgba(15,23,42,0.15)] -ml-3"
      />
    </div>

    {/* ─── Center bubble: "Study group for Data Structures?" ─── */}
    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 bg-white rounded-2xl px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.14)] z-20 w-[78%] max-w-[200px]">
      <p className="text-[13px] font-bold text-foreground leading-snug text-center">
        Study group for<br />Data Structures?
      </p>
    </div>

    {/* ─── Bottom notification card ─── */}
    <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 bg-white rounded-2xl px-2.5 py-2 shadow-[0_12px_28px_rgba(15,23,42,0.14)] z-20 w-[88%] max-w-[230px] flex items-center gap-2">
      <img
        src={IMG.peer3}
        alt="Group notifier"
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
      <p className="text-[11px] font-semibold text-foreground leading-tight flex-1 min-w-0">
        Added you to<br />the group
      </p>
      <span className="bg-amber-300 text-amber-900 text-[9px] font-extrabold tracking-wide px-2 py-1 rounded-full whitespace-nowrap">
        Just now
      </span>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────
   Slide 4 — Verified student community (lavender)
   Centerpiece: violet shield with a Users icon + checkmark, four
   floating white chips around it ("Verified Student", "Active Member",
   "300lvl CSC", "Trusted Community"), plus scattered violet sparkles.
   ──────────────────────────────────────────────────────────── */
const Slide4Hero = () => (
  <div className="relative h-full w-full bg-[#ECE8F7] overflow-hidden">
    <Badge index="04" tone="violet" />

    {/* ─── Ambient sparkles ─── */}
    <Sparkles className="absolute top-[18%] left-[10%] w-3.5 h-3.5 text-violet-400/60 z-10" strokeWidth={2} />
    <Sparkles className="absolute top-[28%] right-[16%] w-2.5 h-2.5 text-violet-300/70 z-10" strokeWidth={2} />
    <Sparkles className="absolute bottom-[26%] left-[8%] w-3 h-3 text-violet-300/60 z-10" strokeWidth={2} />
    <Sparkles className="absolute bottom-[10%] right-[10%] w-3.5 h-3.5 text-violet-400/60 z-10" strokeWidth={2} />
    {/* Tiny dots for extra texture */}
    <div className="absolute top-[36%] right-[8%] w-1 h-1 rounded-full bg-violet-400/50 z-10" />
    <div className="absolute bottom-[36%] left-[14%] w-1 h-1 rounded-full bg-violet-400/50 z-10" />

    {/* ─── Centerpiece: true shield SVG with Users icon + checkmark inside ─── */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] z-20">
      {/* Soft purple halo behind */}
      <div className="absolute inset-0 bg-violet-400/35 rounded-full blur-3xl scale-[1.6]" />

      <div
        className="relative h-28 w-28 sm:h-32 sm:w-32"
        style={{ filter: "drop-shadow(0 20px 40px rgba(124, 58, 237, 0.35))" }}
      >
        {/* Shield shape — soft curves, gradient fill, subtle inner highlight */}
        <svg
          viewBox="0 0 100 110"
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="shield4-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="55%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id="shield4-shine" x1="0%" y1="0%" x2="50%" y2="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Body */}
          <path
            d="M50 5 L88 20 C88 60 78 90 50 105 C22 90 12 60 12 20 Z"
            fill="url(#shield4-grad)"
          />
          {/* Top-left highlight for a subtle 3D feel */}
          <path
            d="M50 5 L88 20 C88 60 78 90 50 105 C22 90 12 60 12 20 Z"
            fill="url(#shield4-shine)"
          />
        </svg>

        {/* Users icon — top portion of the shield */}
        <Users
          className="absolute left-1/2 top-[32%] -translate-x-1/2 -translate-y-1/2 h-9 w-9 sm:h-10 sm:w-10 text-white"
          strokeWidth={2.2}
        />
        {/* Check — lower portion of the shield */}
        <Check
          className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-white"
          strokeWidth={3.5}
        />
      </div>
    </div>

    {/* ─── Floating chip: "Verified Student" — top-right of shield ─── */}
    <div className="absolute top-[16%] right-[8%] bg-white rounded-full pl-2 pr-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.12)] flex items-center gap-1 z-30">
      <Check className="h-3 w-3 text-emerald-500" strokeWidth={3.5} />
      <span className="text-[10px] font-bold text-foreground whitespace-nowrap">Verified Student</span>
    </div>

    {/* ─── Floating chip: "Active Member" — middle-left ─── */}
    <div className="absolute top-[42%] left-[6%] bg-white rounded-full px-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.12)] z-30">
      <span className="text-[10px] font-bold text-foreground whitespace-nowrap">Active Member</span>
    </div>

    {/* ─── Floating chip: "300lvl CSC" — middle-right ─── */}
    <div className="absolute top-[44%] right-[5%] bg-white rounded-full px-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.12)] z-30">
      <span className="text-[10px] font-bold text-foreground whitespace-nowrap">300lvl CSC</span>
    </div>

    {/* ─── Floating chip: "Trusted Community" — bottom-center ─── */}
    <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 bg-white rounded-full pl-2 pr-2.5 py-1 shadow-[0_8px_20px_rgba(15,23,42,0.12)] flex items-center gap-1 z-30">
      <ShieldCheck className="h-3 w-3 text-violet-500" strokeWidth={2.5} />
      <span className="text-[10px] font-bold text-foreground whitespace-nowrap">Trusted Community</span>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────
   Slide data
   ──────────────────────────────────────────────────────────── */
type SlideDef = {
  index: string;
  title: string;
  body: string;
  /** Tailwind bg-* class — used by the Hero components & desktop cards. */
  bg: string;
  /** Raw hex of the same colour — applied via inline style on the mobile
      outer container, guaranteed to bypass any Tailwind JIT / cache quirks
      so the whole viewport always picks up the slide's tint. */
  hex: string;
  Hero: React.FC;
};

const SLIDES: SlideDef[] = [
  {
    index: "01",
    title: "Get help, give help.",
    body: "Post real academic tasks and side-gigs. Skilled student peers chime in within minutes — no chasing the class WhatsApp group.",
    bg: "bg-[#FAF6F0]",
    hex: "#FAF6F0",
    Hero: Slide1Hero,
  },
  {
    index: "02",
    title: "Buy, sell, discover.",
    body: "Find textbooks, gadgets, hostel items and more. Safe, easy, and local.",
    bg: "bg-[#E8F3E8]",
    hex: "#E8F3E8",
    Hero: Slide2Hero,
  },
  {
    index: "03",
    title: "Connect & collaborate.",
    body: "Meet new people, join study groups, and find your campus tribe.",
    bg: "bg-[#FBEDE0]",
    hex: "#FBEDE0",
    Hero: Slide3Hero,
  },
  {
    index: "04",
    title: "Verified student community.",
    body: "Connect with real students, build trust, and collaborate within your campus network.",
    bg: "bg-[#ECE8F7]",
    hex: "#ECE8F7",
    Hero: Slide4Hero,
  },
];

/* ────────────────────────────────────────────────────────────────
   One slide card — same composition mobile & desktop
   ──────────────────────────────────────────────────────────── */
const Slide = ({ title, body, Hero }: SlideDef) => (
  // Mobile: no card chrome — slide IS the page, edge-to-edge.
  // Desktop: full card chrome (rounded, bordered, shadowed) for the grid.
  <div className="relative overflow-hidden bg-card flex flex-col h-full
                  rounded-none md:rounded-2xl
                  border-0 md:border md:border-border/40
                  shadow-none md:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.18)]">
    {/* Hero gets ~68% of the slide on mobile so the visual feels dominant
        instead of leaving a half-empty white block under it. */}
    <div className="relative basis-[68%] md:basis-[62%] grow-0 shrink-0 overflow-hidden">
      <Hero />
    </div>
    <div className="flex-1 p-5 flex flex-col">
      <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-[#0B132B] dark:text-slate-100 leading-tight">
        {title}
      </h3>
      <p className="text-[13px] md:text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
        {body}
      </p>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────
   OnboardingCarousel — the page
   ──────────────────────────────────────────────────────────── */
const OnboardingCarousel = () => {
  const navigate = useNavigate();

  // No auto-skip — /welcome runs every time, by user direction.

  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    align: "center",
    skipSnaps: false,
    containScroll: "trimSnaps",
  });
  const [selected, setSelected] = useState(0);

  const updateSelected = useCallback(() => {
    if (embla) setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", updateSelected);
    embla.on("reInit", updateSelected);
    updateSelected();
  }, [embla, updateSelected]);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private mode */ }
    navigate("/auth", { replace: true });
  };

  const isLast = selected === SLIDES.length - 1;
  const currentSlide = SLIDES[selected];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════
           MOBILE — true full-screen 3-section onboarding
           ┌──────────────────────────────────┐
           │ TOP        (skip)                │   safe-area + h-12
           ├──────────────────────────────────┤
           │                                  │
           │ HERO (50% of viewport)           │   swipeable carousel
           │ — only the illustration swipes — │   slides[i].Hero
           │                                  │
           ├──────────────────────────────────┤
           │ Headline                         │
           │ Body text                        │   stays put, content
           │                                  │   updates with `selected`
           │ ● ○ ○ ○                          │
           │ [ Next → ]   (full-width pill)   │
           └──────────────────────────────────┘
         ═══════════════════════════════════════════════════════════ */}
      <div
        // Outer container tinted with the CURRENT slide's hex via inline
        // style — applied directly to bypass any Tailwind JIT/cache issues
        // so the whole viewport (safe-area top, header, hero, bottom,
        // safe-area bottom) reliably shares one continuous colour.
        // Transitions smoothly as you swipe.
        className="md:hidden h-[100dvh] flex flex-col overflow-hidden transition-colors duration-500"
        style={{
          backgroundColor: currentSlide.hex,
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* ─── TOP: Skip, top-right. Transparent so the outer bg shows through. ─── */}
        <header className="flex-shrink-0 h-12 px-5 flex items-center justify-end">
          <button
            onClick={finish}
            className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Skip
          </button>
        </header>

        {/* ─── MIDDLE: hero carousel, ~50% of viewport height. Each
            slide's own bg matches the outer container so there's never
            a visible seam between hero and the rest of the page. ─── */}
        <div className="basis-1/2 flex-shrink-0 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {SLIDES.map((slide, i) => {
              const HeroEl = slide.Hero;
              return (
                <div
                  key={i}
                  className="flex-[0_0_100%] min-w-0 h-full"
                >
                  <HeroEl />
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── BOTTOM: content + dots + primary CTA. No bg — the outer
            container's slide tint shows through, so everything blends. ─── */}
        <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-4 min-h-0">
          {/* Headline + body — updates with the selected slide */}
          <div className="overflow-y-auto">
            <h3 className="text-2xl font-extrabold tracking-tight text-[#0B132B] dark:text-slate-100 leading-tight">
              {currentSlide.title}
            </h3>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed mt-3">
              {currentSlide.body}
            </p>
          </div>

          {/* Progress dots + primary CTA */}
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-center gap-1.5 justify-center">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => embla?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === selected ? "w-6 bg-primary" : "w-1.5 bg-slate-300 dark:bg-slate-700",
                  )}
                />
              ))}
            </div>

            <Button
              onClick={isLast ? finish : () => embla?.scrollNext()}
              className="w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 text-base active:scale-[0.98] transition-transform"
            >
              {isLast ? "Get started" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
           DESKTOP — unchanged 4-card grid layout
         ═══════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex md:flex-col md:min-h-[100dvh] bg-background">
        <header className="flex-shrink-0 max-w-7xl mx-auto w-full px-8 py-6 flex items-center">
          <span className="font-display font-extrabold text-lg tracking-tight">
            <span className="text-[#0B132B] dark:text-slate-100">Campus</span>{" "}
            <span className="text-primary">Link</span>
          </span>
          <button
            onClick={finish}
            className="ml-auto text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Skip onboarding
          </button>
        </header>

        <div className="grid grid-cols-4 gap-6 max-w-7xl mx-auto px-8 pb-8 w-full flex-1">
          {SLIDES.map((s, i) => (
            <div key={i} className="h-[540px]">
              <Slide {...s} />
            </div>
          ))}
        </div>

        <div className="flex justify-center pb-10">
          <Button
            onClick={finish}
            size="lg"
            className="h-12 px-8 rounded-full bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
          >
            Get started
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
};

export default OnboardingCarousel;
