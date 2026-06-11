"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "./components/Nav";

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
    heading: ["THREE", "WOMEN"],
    quote: "Crypto Degen. High-Maintenance Influencer. Gym Girl. Each one is a completely different kind of war.",
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
      className="fixed inset-0 z-50 overflow-hidden bg-[#0a0906] text-[#EEF083]"
      style={{ opacity: out ? 0 : 1, transition: "opacity 0.6s ease" }}
    >
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(238,240,131,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(238,240,131,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Panel label */}
      <div className="absolute left-5 top-5 z-20 sm:left-8 sm:top-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#91897C]">
          {panel.label}&nbsp;/&nbsp;IV
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={onDone}
        className="absolute right-5 top-5 z-20 sm:right-8 sm:top-7 font-mono text-[10px] uppercase tracking-[0.25em] text-[#EEF083] transition"
        type="button"
      >
        Skip
      </button>

      {/* Main layout — stacked on mobile, side-by-side on desktop */}
      <div className="flex h-full flex-col sm:flex-row">

        {/* ── Alpha character portrait ── */}
        <div className="relative h-[38vh] w-full shrink-0 overflow-hidden sm:h-full sm:w-[42%]">
          <Image
            src="/charecter/alpha-charecter.png"
            alt="Alpha"
            fill
            className="object-cover object-top"
            priority
          />
          {/* Gradient fades toward the text area */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#0a0906] sm:hidden" />
          <div className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-transparent via-transparent to-[#0a0906] sm:block" />

          {/* Character badge */}
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-6">
            <div className="inline-flex items-center gap-2 border border-[#EEF083]/40 bg-[#0a0906]/60 px-3 py-1.5 backdrop-blur-sm">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#EEF083]">AL</span>
              <span className="h-3 w-px bg-[#91897C]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#91897C]">Alpha · Your Guide</span>
            </div>
          </div>
        </div>

        {/* ── Text content ── */}
        <div className="flex flex-1 flex-col justify-center px-6 py-6 sm:px-10 sm:py-16 lg:px-14 lg:py-20">

          {/* Heading */}
          <div className="mb-5 sm:mb-7">
            {panel.heading.map((line, i) => (
              <p
                key={i}
                className="font-black uppercase leading-[0.82] tracking-tight text-[#EEF083]"
                style={{ fontSize: "clamp(2.4rem, 7vw, 6.5rem)" }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Alpha's quote */}
          <div className="mb-4 border-l-2 border-[#EEF083]/25 pl-5">
            <p className="font-mono text-sm leading-7 text-[#d8d4a1] sm:text-base sm:leading-8">
              &ldquo;{panel.quote}&rdquo;
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#91897C]">
              — Alpha
            </p>
          </div>

          {panel.sub && (
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#91897C]">
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
                  backgroundColor: i <= idx ? "#EEF083" : "#2a2520",
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

export default function Home() {
  const [screen, setScreen] = useState<Screen>("lobby");
  const onStoryboardDone = useCallback(() => setScreen("home"), []);

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
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#241F19]/90 via-[#241F19]/30 to-transparent" />
        <div className="relative z-10 w-full px-6 pb-16 text-center text-[#EEF083] sm:pb-24">
          <h1 className="mb-4 text-[clamp(3.5rem,14vw,9rem)] font-black uppercase leading-[0.82] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            Proof of Alpha
          </h1>
          <p className="mx-auto mb-8 max-w-md font-mono text-sm text-[#d8d4a1]/80">
            The on-chain meme dominance test.
          </p>
          <button
            onClick={() => setScreen("storyboard")}
            className="border-2 border-[#EEF083] bg-[#EEF083] px-12 py-4 text-lg font-black uppercase tracking-[0.18em] text-[#241F19] shadow-[6px_6px_0_rgba(0,0,0,0.4)] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === "storyboard" && <Storyboard onDone={onStoryboardDone} />}

      {/* Landing page — fades in after storyboard */}
      <div
        className="min-h-screen overflow-x-hidden bg-[#241F19] text-[#EEF083]"
        style={{ opacity: screen === "home" ? 1 : 0, transition: "opacity 0.8s ease" }}
      >
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(238,240,131,0.06)_1px,transparent_1px),linear-gradient(rgba(238,240,131,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="absolute inset-0 scanlines" />
        </div>

        <div className="relative z-10">
          <Nav />
          <section className="flex min-h-[calc(100vh-64px)] items-center">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="mb-6 inline-block bg-[#EEF083] px-3 py-1.5 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#241F19]">
                AURA-powered · Solana devnet
              </p>
              <h1 className="glitch mb-8 text-[clamp(3.5rem,12vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
                Proof
                <br />
                of Alpha.
              </h1>
              <p className="mb-4 max-w-2xl text-lg font-semibold leading-8 text-[#d8d4a1] sm:text-xl">
                Pick your archetype. Spend AURA to approach. Charm her in 4 messages
                or get shut down on-chain.
              </p>
              <p className="mb-10 max-w-lg font-mono text-sm leading-6 text-[#91897C]">
                Every opener, every flex, every number close — recorded on Solana.
                Buy AURA in the store. Earn it back by winning.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  className="border-2 border-[#EEF083] bg-[#EEF083] px-8 py-4 text-lg font-black uppercase tracking-[0.14em] text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
                  href="/map"
                >
                  Play Now
                </Link>
                <Link
                  className="border-2 border-[#91897C] px-8 py-4 text-lg font-black uppercase tracking-[0.14em] text-[#EEF083] shadow-[6px_6px_0_#91897C] transition hover:border-[#EEF083] touch-manipulation"
                  href="/store"
                >
                  Buy AURA
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
