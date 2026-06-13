"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Nav } from "./components/Nav";

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
      className="fixed inset-0 z-50 overflow-hidden bg-[#000F08] text-[#E4D474]"
      style={{ opacity: out ? 0 : 1, transition: "opacity 0.6s ease" }}
    >
      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(228,212,116,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(228,212,116,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Panel label */}
      <div className="absolute left-5 top-5 z-20 sm:left-8 sm:top-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#a09ab8]">
          {panel.label}&nbsp;/&nbsp;IV
        </p>
      </div>

      {/* Skip button */}
      <button
        onClick={onDone}
        className="absolute right-5 top-5 z-20 sm:right-8 sm:top-7 font-mono text-[10px] uppercase tracking-[0.25em] text-[#E4D474] transition"
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
            sizes="(max-width: 640px) 100vw, 42vw"
            className="object-cover object-top"
            priority
          />
          {/* Gradient fades toward the text area */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-[#000F08] sm:hidden" />
          <div className="pointer-events-none absolute inset-0 hidden bg-linear-to-r from-transparent via-transparent to-[#000F08] sm:block" />

          {/* Character badge */}
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-6">
            <div className="inline-flex items-center gap-2 border border-[#E4D474]/40 bg-[#000F08]/60 px-3 py-1.5 backdrop-blur-sm">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#E4D474]">AL</span>
              <span className="h-3 w-px bg-[#a09ab8]" />
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#a09ab8]">Alpha · Your Guide</span>
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
                className="font-black uppercase leading-[0.82] tracking-tight text-[#E4D474]"
                style={{ fontSize: "clamp(2.4rem, 7vw, 6.5rem)" }}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Alpha's quote */}
          <div className="mb-4 border-l-2 border-[#E4D474]/25 pl-5">
            <p className="font-mono text-sm leading-7 text-[#ffffff] sm:text-base sm:leading-8">
              &ldquo;{panel.quote}&rdquo;
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#a09ab8]">
              — Alpha
            </p>
          </div>

          {panel.sub && (
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-[#a09ab8]">
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
                  backgroundColor: i <= idx ? "#E4D474" : "#1f1040",
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
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#24153E]/90 via-[#24153E]/30 to-transparent" />
        <div className="relative z-10 w-full px-6 pb-16 text-center text-[#E4D474] sm:pb-24">
          <h1 className="mb-4 text-[clamp(3.5rem,14vw,9rem)] font-black uppercase leading-[0.82] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
            Proof of Alpha
          </h1>
          <p className="mx-auto mb-8 max-w-md font-mono text-sm text-[#ffffff]/80">
            The on-chain meme dominance test.
          </p>
          <button
            onClick={() => setScreen("storyboard")}
            className="border-2 border-[#E4D474] bg-[#E4D474] px-12 py-4 text-lg font-black uppercase tracking-[0.18em] text-[#24153E] shadow-[6px_6px_0_rgba(0,0,0,0.4)] transition hover:bg-transparent hover:text-[#E4D474] touch-manipulation"
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
        className="min-h-screen overflow-x-hidden bg-[#24153E] text-[#E4D474]"
        style={{ opacity: screen === "home" ? 1 : 0, transition: "opacity 0.8s ease" }}
      >
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(228,212,116,0.06)_1px,transparent_1px),linear-gradient(rgba(228,212,116,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
          <div className="absolute inset-0 scanlines" />
        </div>

        <div className="relative z-10">
          <Nav />

          {/* ── Partner marquee ── */}
          <section className="overflow-hidden border-b border-[#a09ab8]/25 bg-[#0a0820]">
            <div className="flex items-center">
              <div className="shrink-0 border-r border-[#a09ab8]/25 px-3 py-3 sm:px-5 sm:py-4">
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#a09ab8]">Built with</p>
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
                <p className="mb-5 inline-block bg-[#E4D474] px-3 py-1.5 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#24153E]">
                  AURA-powered · Solana devnet
                </p>
                <h1 className="glitch mb-6 font-black uppercase leading-[0.85] tracking-tight text-[clamp(3rem,9vw,7rem)]">
                  Proof
                  <br />
                  of Alpha.
                </h1>
                <p className="mb-3 max-w-lg text-base leading-8 text-[#ffffff] sm:text-lg">
                  Pick your archetype. Spend AURA to approach. Charm her in 4 messages or get shut down on-chain.
                </p>
                <p className="mb-8 max-w-md font-mono text-sm leading-6 text-[#a09ab8]">
                  Every opener, every flex, every close — recorded on Solana. Earn AURA back by winning.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    className="border-2 border-[#E4D474] bg-[#E4D474] px-8 py-3.5 font-black uppercase tracking-[0.14em] text-[#24153E] shadow-[5px_5px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474] touch-manipulation"
                    href="/character-select"
                  >
                    Play Now
                  </Link>
                  <Link
                    className="border-2 border-[#a09ab8] px-8 py-3.5 font-black uppercase tracking-[0.14em] text-[#E4D474] shadow-[5px_5px_0_#a09ab8] transition hover:border-[#E4D474] touch-manipulation"
                    href="/how-to-play"
                  >
                    How to Play
                  </Link>
                  <Link
                    className="border border-[#a09ab8]/50 px-8 py-3.5 font-black uppercase tracking-[0.14em] text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474] touch-manipulation"
                    href="/tips"
                  >
                    Tips
                  </Link>
                </div>
              </div>

              {/* Right — character */}
              <div className="relative mx-auto w-64 shrink-0 sm:w-80 lg:w-96">
                <div className="relative overflow-hidden border border-[#a09ab8]/30" style={{ aspectRatio: "3/4" }}>
                  <Image
                    src="/charecter/alpha-charecter.png"
                    alt="Alpha"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 256px, (max-width: 1024px) 320px, 384px"
                    priority
                  />
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#24153E]/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 border border-[#E4D474]/30 bg-[#24153E]/70 px-3 py-1.5 backdrop-blur-sm">
                    <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#a09ab8]">Your guide</p>
                    <p className="font-mono text-xs font-black text-[#E4D474]">Alpha</p>
                  </div>
                </div>
                {/* Decorative corner */}
                <div className="absolute -right-2 -top-2 h-8 w-8 border-r-2 border-t-2 border-[#E4D474]/40" />
                <div className="absolute -bottom-2 -left-2 h-8 w-8 border-b-2 border-l-2 border-[#E4D474]/40" />
              </div>
            </div>
          </section>

          {/* ── Feature row ── */}
          <section className="border-t border-[#a09ab8]/20">
            <div className="mx-auto max-w-6xl px-6 py-12 lg:px-12">
              <div className="grid grid-cols-1 gap-px bg-[#a09ab8]/15 sm:grid-cols-3">
                {[
                  { n: "15", label: "Girl Archetypes", sub: "5 per difficulty tier" },
                  { n: "4",  label: "Messages",        sub: "Then pick your closer" },
                  { n: "3×", label: "Max Streak Boost", sub: "Win streaks multiply AURA" },
                ].map((f) => (
                  <div key={f.n} className="bg-[#24153E] px-8 py-8">
                    <p className="font-black text-[clamp(2.5rem,5vw,4rem)] leading-none text-[#E4D474]">{f.n}</p>
                    <p className="mt-1 font-black uppercase text-sm text-[#E4D474]">{f.label}</p>
                    <p className="mt-1 font-mono text-xs text-[#a09ab8]">{f.sub}</p>
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
