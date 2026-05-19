import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Star,
  Send, MoreHorizontal, BookOpen, Calculator,
} from "lucide-react";

const STORAGE_KEY = "cl-welcomed";

const Welcome = () => {
  const navigate = useNavigate();

  // localStorage gate — returning visitors skip straight to /auth
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1") {
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  const [emblaRef, embla] = useEmblaCarousel({
    loop: false,
    align: "center",
    duration: 28, // springy
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

  const finish = (path: "/auth" | "/feed" = "/auth") => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* private mode etc */ }
    navigate(path, { replace: true });
  };

  const isLast = selected === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 sm:px-8 py-4 flex-shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <LogoMark size={18} />
          </div>
          <span className="font-display font-extrabold tracking-tight text-base">
            <span className="text-foreground">Campus</span>{" "}<span className="text-primary">Link</span>
          </span>
        </div>
        <button
          onClick={() => finish("/auth")}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </header>

      {/* Slides */}
      <div className="flex-1 overflow-hidden relative" ref={emblaRef}>
        <div className="flex h-full">
          {SLIDES.map((Slide, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0">
              <Slide />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className="flex-shrink-0 px-5 sm:px-8 pb-8 pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        <div className="max-w-md mx-auto space-y-5">
          {/* Dots */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === selected ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={goPrev}
              disabled={selected === 0}
              className="rounded-full h-12 w-12 p-0 flex-shrink-0 disabled:opacity-30"
              aria-label="Previous"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {isLast ? (
              <Button
                size="lg"
                onClick={() => finish("/auth")}
                className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
              >
                Get started
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={goNext}
                className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   SLIDE LAYOUT — desktop (2-col split, scene-led) vs mobile (stacked)
   Each slide composes a small "live UI" scene rather than a flat icon.
   ──────────────────────────────────────────────────────────── */

const SlideShell = ({
  scene, eyebrow, title, body,
}: {
  scene: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
}) => (
  <div className="h-full grid lg:grid-cols-[1.1fr_1fr] gap-6 lg:gap-12 px-5 sm:px-8 lg:px-16 py-4 lg:py-8 items-center max-w-6xl mx-auto w-full">
    {/* Scene — top on mobile, left on desktop */}
    <div className="relative order-1 flex items-center justify-center min-h-[260px] sm:min-h-[340px] lg:min-h-[520px]">
      {scene}
    </div>

    {/* Copy — bottom on mobile, right on desktop */}
    <div className="order-2 text-center lg:text-left max-w-md lg:max-w-none mx-auto lg:mx-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-3">
        {eyebrow}
      </p>
      <h2 className="text-[28px] sm:text-[34px] lg:text-[42px] font-extrabold tracking-tight leading-[1.08] mb-3">
        {title}
      </h2>
      <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
        {body}
      </p>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────
   SLIDE 1 — Get help, give help
   Scene: a real-looking post card with urgent tag + two reply cards
   floating below, plus an "I can help!" tap target.
   ──────────────────────────────────────────────────────────── */
const Slide1 = () => (
  <SlideShell
    eyebrow="01 · How it starts"
    title="Need help? Drop a post. Help nearby."
    body="Post your assignment, project, or side-gig. Verified peers from your school chime in within minutes — no more refreshing the class WhatsApp group."
    scene={
      <div className="relative w-full max-w-[420px]">
        {/* Soft background blob */}
        <div className="absolute -inset-8 bg-primary/[0.04] rounded-[40px] -z-10" />

        {/* Main post card */}
        <div className="relative bg-card border border-border/50 rounded-2xl shadow-sm p-4 mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-600">
              Urgent · ≤ 48h
            </span>
            <span className="text-[11px] text-muted-foreground">2h ago</span>
          </div>
          <p className="font-bold text-[15px] leading-tight mb-1">
            Help with CSC 201 assignment
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Need to debug a Python script before submission tomorrow morning.
            Will pay ₦1,500 — worth it for me 🙏
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">T</AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold">Tobiloba O.</span>
              <span className="text-[10px] text-muted-foreground">· CSC 200L</span>
            </div>
            <button className="text-[11px] font-bold text-primary inline-flex items-center gap-1">
              I can help
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Reply card 1, offset right */}
        <div className="ml-12 mb-2 bg-card border border-border/50 rounded-xl shadow-sm p-3 flex items-start gap-2.5 max-w-[340px]">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">A</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold leading-tight">Adaeze N.</p>
              <span className="text-[10px] text-muted-foreground">· just now</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
              I've done this exact one — DM me, I'll walk you through.
            </p>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
        </div>

        {/* Reply card 2, offset left */}
        <div className="mr-12 bg-card border border-border/50 rounded-xl shadow-sm p-3 flex items-start gap-2.5 max-w-[340px]">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="bg-amber-500/10 text-amber-600 text-[10px] font-bold">M</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-xs font-bold leading-tight">Marcus K.</p>
              <span className="text-[10px] text-muted-foreground">· 1m</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed mt-0.5">
              Free after 5pm if you're still stuck 🤝
            </p>
          </div>
        </div>

        {/* Tiny floating activity chip */}
        <div className="absolute -top-2 -right-2 sm:-right-4 bg-card border border-border/50 rounded-full shadow-sm px-2.5 py-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-semibold">3 helpers online</span>
        </div>
      </div>
    }
  />
);

/* ────────────────────────────────────────────────────────────
   SLIDE 2 — Buy, sell, discover
   ──────────────────────────────────────────────────────────── */
const Slide2 = () => (
  <SlideShell
    eyebrow="02 · Campus marketplace"
    title="Buy, sell, swap. From your hostel."
    body="Textbooks, calculators, gadgets, even hostel kit — student-to-student, fair prices, no shipping wahala. Your campus is your storefront."
    scene={
      <div className="relative w-full max-w-[420px]">
        <div className="absolute -inset-8 bg-accent/[0.05] rounded-[40px] -z-10" />

        {/* Background secondary card, slightly offset */}
        <div className="absolute top-6 -right-2 sm:-right-6 w-44 bg-card border border-border/50 rounded-2xl shadow-sm p-3 rotate-[3deg]">
          <div className="h-16 bg-muted/50 rounded-lg flex items-center justify-center mb-2">
            <Calculator className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-[11px] font-bold leading-tight">TI-84 Plus</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Like new · barely used</p>
          <p className="text-xs font-bold text-emerald-600 mt-1">₦18,000</p>
        </div>

        {/* Main listing card */}
        <div className="relative bg-card border border-border/50 rounded-2xl shadow-md p-4">
          <div className="h-32 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/30 rounded-xl flex items-center justify-center mb-3 relative overflow-hidden">
            {/* "Book stack" — simple geometric illustration */}
            <div className="relative">
              <div className="absolute top-1 -left-1 w-20 h-24 bg-rose-200 dark:bg-rose-900/60 rounded-md shadow-sm rotate-[-6deg]" />
              <div className="relative w-20 h-24 bg-indigo-300 dark:bg-indigo-800 rounded-md shadow-sm">
                <div className="absolute inset-x-3 top-3 h-1.5 bg-white/40 rounded-full" />
                <div className="absolute inset-x-3 top-6 h-1 bg-white/40 rounded-full" />
              </div>
            </div>
            <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-card/90 text-foreground">
              Buy &amp; Sell
            </span>
          </div>

          <p className="font-bold text-[15px] leading-tight">Calculus, 9th Ed — James Stewart</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Used one semester. Highlights in Ch. 4–6. Pickup at Hall 4.
          </p>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-violet-500/10 text-violet-600 text-[10px] font-bold">A</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[11px] font-semibold leading-none">Adaeze N.</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">CSC · 300L · 4.9 ★</p>
              </div>
            </div>
            <p className="text-base font-extrabold text-emerald-600">₦5,500</p>
          </div>

          <button className="w-full mt-3 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Message Adaeze
          </button>
        </div>

        {/* Bottom-left chip */}
        <div className="absolute -bottom-2 -left-2 sm:-left-4 bg-card border border-border/50 rounded-full shadow-sm px-2.5 py-1 flex items-center gap-1.5">
          <BookOpen className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold">12 listings near you</span>
        </div>
      </div>
    }
  />
);

/* ────────────────────────────────────────────────────────────
   SLIDE 3 — Connect & collaborate
   ──────────────────────────────────────────────────────────── */
const Slide3 = () => (
  <SlideShell
    eyebrow="03 · Real conversations"
    title="DM, group up, swap notes."
    body="Direct messages with read receipts. Comment threads on every post. Study buddies who actually show up — built into the platform, not stuck in WhatsApp."
    scene={
      <div className="relative w-full max-w-[420px]">
        <div className="absolute -inset-8 bg-emerald-500/[0.05] rounded-[40px] -z-10" />

        {/* Chat header */}
        <div className="bg-card border border-border/50 border-b-0 rounded-t-2xl shadow-sm px-4 py-3 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">A</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">Adaeze N.</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-muted-foreground">Online · CSC 300L</span>
            </div>
          </div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Chat body */}
        <div className="bg-card border border-border/50 border-t-0 rounded-b-2xl shadow-sm p-4 pt-3 space-y-2">
          {/* Their bubble */}
          <div className="flex justify-start">
            <div className="bg-muted/60 rounded-2xl rounded-bl-md px-3.5 py-2 max-w-[80%]">
              <p className="text-xs leading-relaxed">Are you joining the study group tomorrow?</p>
            </div>
          </div>

          {/* My bubble */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-3.5 py-2 max-w-[80%]">
              <p className="text-xs leading-relaxed">Yes! What time and where?</p>
            </div>
          </div>

          {/* Their bubble */}
          <div className="flex justify-start">
            <div className="bg-muted/60 rounded-2xl rounded-bl-md px-3.5 py-2 max-w-[85%]">
              <p className="text-xs leading-relaxed">
                7pm at Hall 4 common room. Bringing past questions for CSC 201 📚
              </p>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex justify-start">
            <div className="bg-muted/60 rounded-2xl rounded-bl-md px-3.5 py-2.5 inline-flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>

          {/* Time */}
          <p className="text-[10px] text-muted-foreground/70 text-center pt-1">Today · 6:42pm</p>
        </div>

        {/* Floating reaction chip */}
        <div className="absolute top-12 -right-2 sm:-right-4 bg-card border border-border/50 rounded-full shadow-sm px-2.5 py-1 flex items-center gap-1.5">
          <span className="text-sm">📚</span>
          <span className="text-[10px] font-semibold">4 study groups</span>
        </div>
      </div>
    }
  />
);

/* ────────────────────────────────────────────────────────────
   SLIDE 4 — Safe & trusted
   ──────────────────────────────────────────────────────────── */
const Slide4 = () => (
  <SlideShell
    eyebrow="04 · You're not alone"
    title="Verified students. Real reviews."
    body="Every account is tied to a real Nigerian university. Ratings and reviews keep the community honest, and admins clean up the rest."
    scene={
      <div className="relative w-full max-w-[420px]">
        <div className="absolute -inset-8 bg-primary/[0.04] rounded-[40px] -z-10" />

        {/* Profile card */}
        <div className="relative bg-card border border-border/50 rounded-2xl shadow-sm p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-violet-500/10 text-violet-600 text-base font-bold">A</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center border-2 border-card">
                <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="font-bold text-sm leading-tight">Adaeze Nwosu</p>
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Computer Science · 300L · FUOYE
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-[11px] font-bold">4.9</span>
                <span className="text-[10px] text-muted-foreground">· 24 reviews</span>
              </div>
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40 text-center">
            <div>
              <p className="text-base font-extrabold leading-none">38</p>
              <p className="text-[10px] text-muted-foreground mt-1">Helps given</p>
            </div>
            <div className="border-x border-border/40">
              <p className="text-base font-extrabold leading-none">12</p>
              <p className="text-[10px] text-muted-foreground mt-1">Items sold</p>
            </div>
            <div>
              <p className="text-base font-extrabold leading-none text-emerald-600">4.9</p>
              <p className="text-[10px] text-muted-foreground mt-1">Rating</p>
            </div>
          </div>
        </div>

        {/* Review card 1 */}
        <div className="ml-8 mb-2 bg-card border border-border/50 rounded-xl shadow-sm p-3">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">M</AvatarFallback>
            </Avatar>
            <p className="text-[11px] font-bold">Marcus K.</p>
            <div className="flex gap-0.5 ml-auto">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            Saved me before the CSC 201 test. Patient and clear, walked through every step.
          </p>
        </div>

        {/* Review card 2 */}
        <div className="mr-8 bg-card border border-border/50 rounded-xl shadow-sm p-3">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-rose-500/10 text-rose-600 text-[10px] font-bold">F</AvatarFallback>
            </Avatar>
            <p className="text-[11px] font-bold">Funmi A.</p>
            <div className="flex gap-0.5 ml-auto">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            Bought my textbook from her — fair price, no stories. Highly recommend.
          </p>
        </div>

        {/* Floating trust chip */}
        <div className="absolute -top-2 -right-2 sm:-right-4 bg-card border border-border/50 rounded-full shadow-sm px-2.5 py-1 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-semibold">100% verified</span>
        </div>
      </div>
    }
  />
);

const SLIDES = [Slide1, Slide2, Slide3, Slide4];

export default Welcome;
