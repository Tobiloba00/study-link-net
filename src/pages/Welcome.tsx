import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ArrowLeft, ShieldCheck, MessageCircle, Tag,
} from "lucide-react";

const STORAGE_KEY = "cl-welcomed";

/* ────────────────────────────────────────────────────────────
   Per-slide config
   ──────────────────────────────────────────────────────────── */
type SlideConfig = {
  index: string;          // "01"
  title: string;
  body: string;
  bg: string;             // illustration-pane bg color (Tailwind)
  pill: string;           // index pill bg color
  pillText: string;       // index pill text color
  art: React.ReactNode;   // the illustration block — photo + overlays
};

/* Placeholder Unsplash images.
   Swap with /onboarding/*.jpg once we drop our own photos in public/. */
const IMG_HELP    = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=720&h=900&fit=crop&q=80";
const IMG_MARKET  = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=720&h=900&fit=crop&q=80";
const IMG_CONNECT = "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=720&h=900&fit=crop&q=80";

const SLIDES: SlideConfig[] = [
  {
    index: "01",
    title: "Get help, give help.",
    body: "Post real academic tasks and side-gigs. Skilled student peers chime in within minutes — no chasing the class WhatsApp group.",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    pill: "bg-emerald-500",
    pillText: "text-white",
    art: <ArtHelp />,
  },
  {
    index: "02",
    title: "Buy, sell, discover.",
    body: "Textbooks, calculators, hostel kit, gadgets — student-to-student, fair Naira prices, no shipping wahala.",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    pill: "bg-emerald-500",
    pillText: "text-white",
    art: <ArtMarket />,
  },
  {
    index: "03",
    title: "Connect & collaborate.",
    body: "Meet peers in your faculty, join study groups, swap notes, build campus rep — without leaving the app.",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    pill: "bg-emerald-500",
    pillText: "text-white",
    art: <ArtConnect />,
  },
  {
    index: "04",
    title: "Safe & trusted.",
    body: "Every account is tied to a real Nigerian university. Reviews, ratings and admin moderation keep the community honest.",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    pill: "bg-emerald-500",
    pillText: "text-white",
    art: <ArtTrust />,
  },
];

/* ────────────────────────────────────────────────────────────
   The page
   ──────────────────────────────────────────────────────────── */
const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    align: "center",
    duration: 30,
    skipSnaps: false,
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

  const goPrev = () => embla?.scrollPrev();
  const goNext = () => embla?.scrollNext();
  const goTo = (i: number) => embla?.scrollTo(i);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private mode */ }
    navigate("/auth", { replace: true });
  };

  const isLast = selected === SLIDES.length - 1;

  return (
    <div
      className="h-[100dvh] bg-background flex flex-col overflow-hidden"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Top bar — fixed, slim */}
      <header className="flex-shrink-0 h-14 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <LogoMark size={18} />
          </div>
          <span className="font-display font-extrabold tracking-tight text-base">
            <span className="text-foreground">Campus</span>{" "}<span className="text-primary">Link</span>
          </span>
        </div>
        <button
          onClick={finish}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
        >
          Skip
        </button>
      </header>

      {/* Slides — fill remaining viewport.
          Mobile: each slide takes the full width, edge-to-edge, no card chrome.
          Desktop (lg+): show one centred 28rem card with rounded corners and
          a peek of the neighbours, so the page reads as a deck of slides. */}
      <div className="flex-1 min-h-0 overflow-hidden lg:py-4" ref={emblaRef}>
        <div className="flex h-full">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className="flex-[0_0_100%] lg:flex-[0_0_28rem] min-w-0 lg:px-3"
            >
              <SlideCard config={slide} active={i === selected} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls — pinned, always visible without scroll */}
      <div className="flex-shrink-0 h-16 px-5 sm:px-8 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={selected === 0}
          className="rounded-full h-11 w-11 border-border/60 bg-card disabled:opacity-30"
          aria-label="Previous slide"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {isLast ? (
          <Button
            onClick={finish}
            className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
          >
            Get started
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={goNext}
            className="rounded-full h-11 w-11 bg-primary text-primary-foreground shadow-md shadow-primary/25"
            aria-label="Next slide"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   The card itself — themed illustration pane on top, copy below.
   Mirrors the reference exactly: 01/02/03/04 emerald pill in the
   top-left, 3-dot active indicator in the bottom-left of the
   text pane, soft tinted bg, full-bleed image.
   ──────────────────────────────────────────────────────────── */
const SlideCard = ({ config, active }: { config: SlideConfig; active: boolean }) => {
  // Used by the in-card dots indicator
  const myIndex = SLIDES.findIndex((s) => s.index === config.index);

  return (
    <div
      className={cn(
        // Always fill the carousel column. No max-height — content shapes the
        // distribution between photo and copy.
        "h-full w-full bg-card flex flex-col overflow-hidden",
        // Mobile: edge-to-edge (no border/shadow/round). Desktop: card chrome.
        "lg:rounded-[28px] lg:border lg:border-border/40 lg:shadow-sm",
        "transition-all duration-500",
        active ? "opacity-100 scale-100" : "opacity-60 scale-[0.97]"
      )}
    >
      {/* Illustration pane — fills remaining vertical space after the copy
          block has claimed its content height. flex-1 + min-h-0 is what
          keeps it from pushing the copy off-screen. */}
      <div className={cn("relative flex-1 min-h-0", config.bg)}>
        <div className="absolute inset-0 flex items-center justify-center">
          {config.art}
        </div>

        {/* Number pill (top-left) */}
        <div className={cn(
          "absolute top-4 left-4 rounded-md px-2.5 py-1 text-[11px] font-extrabold tracking-wider shadow-sm",
          config.pill, config.pillText
        )}>
          {config.index}
        </div>
      </div>

      {/* Copy pane — fixed-height-ish, never grows past content. */}
      <div className="flex-shrink-0 px-5 sm:px-6 pt-5 pb-4 space-y-2">
        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
          {config.title}
        </h3>
        <p className="text-[13px] sm:text-[15px] text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
          {config.body}
        </p>

        {/* Tiny in-card dots indicator */}
        <div className="flex items-center gap-1.5 pt-2">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                active && i === myIndex
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Per-slide illustrations.
   Photo as base layer + branded overlay chips (chat bubble, price
   tag, etc.) so the scenes still feel campus-specific.
   Swap Unsplash URLs with /onboarding/*.jpg when you drop real
   photos into public/onboarding/.
   ──────────────────────────────────────────────────────────── */
function ArtHelp() {
  return (
    <div className="relative h-full w-full">
      <img
        src={IMG_HELP}
        alt="Student smiling, ready to offer help"
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      {/* Soft warm gradient overlay so the photo feels editorial, not stock */}
      <div className="absolute inset-0 bg-gradient-to-t from-rose-100/40 via-transparent to-transparent" />

      {/* "I can help!" speech bubble */}
      <div className="absolute right-3 bottom-6 bg-white rounded-2xl rounded-br-md px-3 py-2 shadow-md flex items-center gap-1.5 max-w-[160px]">
        <span className="text-base">🙌</span>
        <span className="text-xs font-bold text-foreground">I can help!</span>
      </div>
    </div>
  );
}

function ArtMarket() {
  return (
    <div className="relative h-full w-full">
      <img
        src={IMG_MARKET}
        alt="Textbook and study items on a desk"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-100/40 via-transparent to-transparent" />

      {/* Naira price tag */}
      <div className="absolute top-12 right-4 bg-emerald-500 text-white rounded-2xl px-3 py-1.5 shadow-md flex items-center gap-1.5 -rotate-6">
        <Tag className="h-3 w-3" />
        <span className="text-xs font-extrabold tracking-tight">₦1,000</span>
      </div>

      {/* Tiny "Financial Accounting" textbook chip */}
      <div className="absolute bottom-6 left-4 bg-white rounded-xl px-2.5 py-1.5 shadow-md max-w-[180px]">
        <p className="text-[10px] font-bold text-muted-foreground">CSC TEXTBOOK</p>
        <p className="text-xs font-bold text-foreground leading-tight truncate">Financial Accounting</p>
      </div>
    </div>
  );
}

function ArtConnect() {
  return (
    <div className="relative h-full w-full">
      <img
        src={IMG_CONNECT}
        alt="Two students sharing a phone"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-100/40 via-transparent to-transparent" />

      {/* Chat bubble overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl rounded-bl-md px-3 py-2 shadow-md max-w-[180px]">
        <div className="flex items-center gap-1.5 mb-1">
          <MessageCircle className="h-3 w-3 text-primary" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Group invite</p>
        </div>
        <p className="text-xs font-semibold text-foreground leading-snug">
          Study group for Data Structures?
        </p>
      </div>
    </div>
  );
}

function ArtTrust() {
  // Pure illustration — no photo, matches the reference's slide 4.
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <div className="relative">
        {/* Soft halo behind the shield */}
        <div className="absolute inset-0 bg-violet-300/40 rounded-full blur-3xl scale-150" />

        {/* Shield */}
        <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-3xl bg-gradient-to-br from-violet-500 to-violet-700 shadow-xl flex items-center justify-center">
          <ShieldCheck className="h-16 w-16 sm:h-20 sm:w-20 text-white" strokeWidth={1.6} />
        </div>

        {/* Floating verification chips */}
        <div className="absolute -top-2 -left-6 bg-white rounded-full shadow-md px-2.5 py-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold">Verified ✓</span>
        </div>
        <div className="absolute -bottom-2 -right-6 bg-white rounded-full shadow-md px-2.5 py-1 flex items-center gap-1">
          <span className="text-[10px]">⭐</span>
          <span className="text-[10px] font-bold">4.9 rating</span>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
