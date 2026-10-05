"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "./components/Nav";
import { RizzTestModal } from "./components/RizzTestModal";

// ─── Partner logos ────────────────────────────────────────────────────────────

const PARTNERS = [
  { name: "islandDAO", src: "/project/islanddao-wordmark-light.png" },
  { name: "Phantom",   src: "/project/Phantom-Logo-White.png" },
  { name: "SolBlaze",  src: "/project/solblaze_grayscale_transparent.png" },
  { name: "Solflare",  src: "/project/solflare-logo.png" },
];

// ─── Storyboard panels ───────────────────────────────────────────────────────

const PANELS = [
  {
    label: "I",
    heading: ["PROOF", "OF ALPHA"],
    quote: "So you think you've got game? Spend your AURA and prove it.",
    sub: "— an online meme dominance test —",
    duration: 3000,
  },
  {
    label: "II",
    heading: ["WOMENS", "BE", "LIKE"],
    quote: "Each one is a completely different kind of war.",
    sub: null,
    duration: 3000,
  },
  {
    label: "III",
    heading: ["4 MESSAGES", "ONE SHOT"],
    quote: "Say the right things and she's impressed. Say the wrong things... she ends you on the spot.",
    sub: null,
    duration: 3000,
  },
  {
    label: "IV",
    heading: ["PROVE", "YOUR", "ALPHA"],
    quote: "This is your only warning.",
    sub: null,
    duration: 3000,
  },
];


function Storyboard({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOut(true), PANELS[idx].duration);
    return () => clearTimeout(t);
  }, [idx]);

  useEffect(() => {
    if (!out) return;
    const t = setTimeout(() => {
      if (idx >= PANELS.length - 1) {
        onDone();
      } else {
        setIdx((i) => i + 1);
        setOut(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [out, idx, onDone]);

  const panel = PANELS[idx];

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-[#f8f7fc] text-[#5e548e]"
      style={{ opacity: out ? 0 : 1, transition: "opacity 0.6s ease" }}
    >
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(228,212,116,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(228,212,116,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Panel label */}
      <div className="absolute left-5 top-5 z-20 sm:left-8 sm:top-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#716a7e]">
          {panel.label}&nbsp;/&nbsp;IV
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={onDone}
        className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 border-2 border-[#5e548e] bg-[#5e548e] px-5 py-2.5 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#f8f7fc] shadow-[4px_4px_0_rgba(94,84,142,0.3)] transition hover:bg-[#f8f7fc] hover:text-[#5e548e] touch-manipulation sm:right-8 sm:top-6 sm:text-sm"
        type="button"
      >
        Skip <span aria-hidden>→</span>
      </button>

      {/* Main layout — stacked on mobile, side-by-side on desktop */}
      <div className="flex h-full flex-col sm:flex-row">

        {/* ── Alpha character portrait ── */}
        <div className="relative h-[38vh] w-full shrink-0 overflow-hidden sm:h-full sm:w-[42%]">
          <Image
            src="/charecter/alpha-charecter.png"
            alt="Alpha"
            fill
            sizes="(max-width: 640px) 100vw, 42vw"
            className="object-cover object-top"
            priority
          />
          {/* Gradient fades toward the text area */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#f8f7fc] sm:hidden" />
          <div className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-transparent via-transparent to-[#f8f7fc] sm:block" />

          {/* Character badge */}
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-6">
            <div className="inline-flex items-center gap-2 border border-[#5e548e]/40 bg-[#f8f7fc]/60 px-3 py-1.5 backdrop-blur-sm">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#5e548e]">AL</span>
              <span className="h-3 w-px bg-[#716a7e]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#716a7e]">Alpha · Your Guide</span>
            </div>
          </div>
        </div>

        {/* ── Text content ── */}
        <div className="flex flex-1 flex-col justify-center px-6 py-6 sm:px-10 sm:py-16 lg:px-14 lg:py-20">

          {/* Heading */}
          <div className="mb-5 sm:mb-7 space-y-2">
            {panel.heading.map((line, i) => (
              <p
                key={i}
                className="font-black uppercase leading-[0.9] tracking-tight text-[#5e548e]"
                style={{ fontSize: "clamp(2.4rem, 7vw, 6.5rem)" }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Alpha's quote */}
          <div className="mb-4 border-l-2 border-[#5e548e]/25 pl-5">
            <p className="font-mono text-sm leading-7 text-[#231942] sm:text-base sm:leading-8">
              &ldquo;{panel.quote}&rdquo;
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#716a7e]">
              — Alpha
            </p>
          </div>

          {panel.sub && (
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#716a7e]">
              {panel.sub}
            </p>
          )}

          {/* Progress bars */}
          <div className="mt-6 flex gap-2 sm:mt-10">
            {PANELS.map((_, i) => (
              <div
                key={i}
                className="h-[3px] rounded-none transition-all duration-500"
                style={{
                  width: i === idx ? "2.5rem" : "0.6rem",
                  backgroundColor: i <= idx ? "#5e548e" : "#f3f0fa",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

type Screen = "lobby" | "storyboard" | "home";

function HomeContent() {
  const [screen, setScreen] = useState<Screen>(() => {
    if (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("skip") === "1") {
      return "home";
    }
    return "lobby";
  });
  const [showRizzModal, setShowRizzModal] = useState(false);
  const onStoryboardDone = useCallback(() => {
    setScreen("home");
    setShowRizzModal(true);
  }, []);

  // ── Lobby — big background picture + Start ──────────────────────────────────
  if (screen === "lobby") {
    return (
      <div
        className="relative flex h-svh items-end justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#f8f7fc]/90 via-[#f8f7fc]/30 to-transparent" />
        <div className="relative z-10 w-full px-6 pb-16 text-center text-[#5e548e] sm:pb-24">
          <h1 className="mb-4 text-[clamp(2.4rem,10vw,6.5rem)] font-black uppercase tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            <span className="block leading-[0.9] mb-2">Proof</span>
            <span className="block leading-[0.9]">of Alpha</span>
          </h1>
          <p className="mx-auto mb-8 max-w-md font-mono text-sm text-[#231942]/80">
            A fully on-chain dating-practice game on Solana.
          </p>
          <button
            onClick={() => setScreen("storyboard")}
            className="border-2 border-[#5e548e] bg-[#5e548e] px-12 py-4 text-lg font-black uppercase tracking-[0.18em] text-white shadow-[6px_6px_0_rgba(0,0,0,0.4)] transition hover:bg-transparent hover:text-[#5e548e] touch-manipulation"
          >
            Enter
          </button>
          <p className="mt-4 font-mono text-xs text-[#231942]/50 mx-auto leading-5 px-4">
            By entering, you agree to our{" "}
            <Link href="/terms" className="whitespace-nowrap text-[#5e548e]/70 underline underline-offset-2 hover:text-[#5e548e] transition">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="whitespace-nowrap text-[#5e548e]/70 underline underline-offset-2 hover:text-[#5e548e] transition">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === "storyboard" && <Storyboard onDone={onStoryboardDone} />}
      {showRizzModal && <RizzTestModal onClose={() => setShowRizzModal(false)} />}

      {/* Landing page — fades in after storyboard */}
      <div
        className="min-h-screen overflow-x-hidden bg-[#f8f7fc] text-[#5e548e]"
        style={{ opacity: screen === "home" ? 1 : 0, transition: "opacity 0.8s ease" }}
      >

        <div className="relative z-10">
          <Nav />

          {/* ── Partner marquee ── */}
          <section className="overflow-hidden border-b border-[#ddd6ea]/25 bg-[#0a0820]">
            <div className="flex items-center">
              <div className="shrink-0 border-r border-[#ddd6ea]/25 px-3 py-3 sm:px-5 sm:py-4">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white font-black">Built with</p>
              </div>
              <div className="overflow-hidden flex-1">
                <div
                  className="flex items-center whitespace-nowrap py-3 sm:py-4"
                  style={{ animation: "ticker 10s linear infinite" }}
                >
                  {Array.from({ length: 8 }, () => PARTNERS).flat().map((p, i) => (
                    <span key={i} className="inline-flex shrink-0 items-center px-6 sm:px-12">
                      <Image
                        src={p.src}
                        alt={p.name}
                        height={0}
                        width={0}
                        sizes="200px"
                        className="h-5 w-auto object-contain brightness-200 opacity-90 transition-opacity hover:opacity-100 sm:h-8"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Hero ── */}
          <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24 lg:px-12">
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

              {/* Left — text */}
              <div className="flex-1">
                <p className="mb-5 inline-block bg-[#5e548e] px-3 py-1.5 font-mono text-xs font-black uppercase tracking-[0.18em] text-white">
                  AURA-powered · Solana
                </p>
                <h1 className="glitch mb-6 font-black uppercase tracking-tight text-[clamp(3rem,9vw,7rem)]">
                  <span className="block leading-[0.9] mb-2">Proof</span>
                  <span className="block leading-[0.9]">of Alpha</span>
                </h1>
                <p className="mb-3 max-w-lg text-base leading-8 text-[#231942] sm:text-lg">
                  Pick your archetype. Spend AURA to approach. Charm her in 4 messages or get shut down on-chain.
                </p>
                <p className="mb-8 max-w-md font-mono text-sm leading-6 text-[#716a7e]">
                  Every opener, every flex, every close — recorded on Solana. Earn AURA back by winning.
                </p>
                <div className="flex flex-row gap-3">
                  <Link
                    className="border-2 border-[#5e548e] bg-[#5e548e] px-8 py-3.5 font-black uppercase tracking-[0.14em] text-white shadow-[5px_5px_0_#716a7e] transition hover:bg-transparent hover:text-[#5e548e] touch-manipulation"
                    href="/character-select"
                  >
                    Play Now
                  </Link>
                  <Link
                    className="border-2 border-[#ddd6ea] px-8 py-3.5 font-black uppercase tracking-[0.14em] text-[#5e548e] shadow-[5px_5px_0_#716a7e] transition hover:border-[#5e548e] touch-manipulation"
                    href="/how-to-play"
                  >
                    How to Play
                  </Link>
                </div>
              </div>

              {/* Right — character */}
              <div className="relative mx-auto w-64 shrink-0 sm:w-80 lg:w-96">
                <div className="relative overflow-hidden border border-[#ddd6ea]/30" style={{ aspectRatio: "3/4" }}>
                  <Image
                    src="/charecter/alpha-charecter.png"
                    alt="Alpha"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 256px, (max-width: 1024px) 320px, 384px"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#f8f7fc]/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 border border-[#5e548e]/30 bg-[#f8f7fc]/70 px-3 py-1.5 backdrop-blur-sm">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#716a7e]">Your guide</p>
                    <p className="font-mono text-xs font-black text-[#5e548e]">Alpha</p>
                  </div>
                </div>
                {/* Decorative corner */}
                <div className="absolute -right-2 -top-2 h-8 w-8 border-r-2 border-t-2 border-[#5e548e]/40" />
                <div className="absolute -bottom-2 -left-2 h-8 w-8 border-b-2 border-l-2 border-[#5e548e]/40" />
              </div>
            </div>
          </section>

          {/* ── Feature row ── */}
          <section className="border-t border-[#ddd6ea]/20">
            <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
              <div className="grid grid-cols-1 gap-px bg-[#716a7e]/15 sm:grid-cols-3">
                {[
                  { n: "15", label: "Girl Archetypes", sub: "5 per difficulty tier" },
                  { n: "4",  label: "Messages",        sub: "Then pick your closer" },
                  { n: "3×", label: "Max Streak Boost", sub: "Win streaks multiply AURA" },
                ].map((f) => (
                  <div key={f.n} className="bg-[#f8f7fc] px-8 py-8">
                    <p className="font-black text-[clamp(2.5rem,5vw,4rem)] leading-none text-[#5e548e]">{f.n}</p>
                    <p className="mt-1 font-black uppercase text-sm text-[#5e548e]">{f.label}</p>
                    <p className="mt-1 font-mono text-xs text-[#716a7e]">{f.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}

export default function Home() {
  return <HomeContent />;
}
