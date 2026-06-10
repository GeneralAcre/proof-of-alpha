"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { ARCHETYPES, type Archetype } from "../lib/archetypes";
import { getUnlocked } from "../lib/unlocks";
import { getCharacterLevel } from "../lib/upgrades";
import { useWallet } from "../components/WalletProvider";

const LAST_PICKED_KEY = "poa_last_archetype";

function StatBar({ label, value, cap }: { label: string; value: number; cap: number }) {
  const upgraded = value > cap - (cap - value);
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#91897C]">{label}</span>
      <div className="flex flex-1 gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 transition-all ${
              i < value
                ? "bg-[#EEF083]"
                : i < cap
                ? "bg-[#91897C]/30"
                : "bg-[#91897C]/10"
            }`}
          />
        ))}
      </div>
      <span className="w-10 shrink-0 text-right font-mono text-xs text-[#EEF083]">
        {value}<span className="text-[#91897C]">/{cap}</span>
      </span>
    </div>
  );
}

function CharacterSelectContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { account } = useWallet();
  const mode = params.get("mode") ?? "solo";
  const room = params.get("room") ?? "";

  const walletAddr = account ? String(account.address) : null;
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(["alpha", "beta", "sigma"]));

  useEffect(() => { setUnlocked(getUnlocked(walletAddr)); }, [walletAddr]);

  const [selectedId, setSelectedId] = useState<string>(() =>
    typeof window !== "undefined" ? (localStorage.getItem(LAST_PICKED_KEY) ?? "alpha") : "alpha"
  );
  const [view, setView] = useState<"grid" | "detail">("grid");

  const selected = ARCHETYPES.find((a) => a.id === selectedId) ?? ARCHETYPES[0];

  useEffect(() => { localStorage.setItem(LAST_PICKED_KEY, selectedId); }, [selectedId]);

  function openDetail(a: Archetype) {
    if (!unlocked.has(a.id)) return;
    setSelectedId(a.id);
    setView("detail");
  }

  function confirm() {
    if (mode === "solo") {
      router.push(`/game?mode=solo&archetype=${selected.id}`);
      return;
    }
    const href = room
      ? `/lobby?mode=${mode}&archetype=${selected.id}&room=${room}`
      : `/lobby?mode=${mode}&archetype=${selected.id}`;
    router.push(href);
  }

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (view === "detail") {
    const a = selected;
    const level = getCharacterLevel(walletAddr, a.id);
    const effectiveStats = a.levels[level - 1];
    return (
      <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Back */}
          <button
            className="mb-6 border border-[#91897C] px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083] touch-manipulation"
            onClick={() => setView("grid")}
            type="button"
          >
            Back
          </button>

          <div className="grid gap-6 sm:grid-cols-[1fr_1.1fr] sm:gap-8">

            {/* Portrait */}
            <div className="relative aspect-3/4 w-full overflow-hidden border border-[#91897C] bg-[#1a1710]">
              {a.image ? (
                <Image
                  alt={a.name}
                  className="object-cover object-top grayscale"
                  fill
                  sizes="(max-width: 640px) 100vw, 45vw"
                  src={a.image}
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="font-mono text-6xl font-black text-[#EEF083]/10">{a.initials}</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#241F19]/60 to-transparent" />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-5">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#91897C]">
                  Step 2 of 3 · {mode === "solo" ? "Solo" : "Multiplayer"}
                </p>
                <h1 className="mt-1 text-4xl font-black uppercase leading-none sm:text-5xl">{a.name}</h1>
                <p className="mt-1 text-sm text-[#91897C]">{a.role}</p>
                <p className="mt-3 text-sm leading-7 text-[#d8d4a1]">{a.description}</p>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Stats</p>
                  <p className="font-mono text-[10px] text-[#91897C]">
                    LVL <span className="font-bold text-[#EEF083]">{level}</span>
                    <span className="text-[#91897C]">/10</span>
                    {level < 10 && <span className="ml-2 text-[#91897C]/60">· upgrade in profile</span>}
                  </p>
                </div>
                <StatBar label="Aggression" value={effectiveStats.aggression} cap={a.statCaps.aggression} />
                <StatBar label="Defense"    value={effectiveStats.defense}    cap={a.statCaps.defense} />
                <StatBar label="Bluff"      value={effectiveStats.bluff}      cap={a.statCaps.bluff} />
                <StatBar label="Greed"      value={effectiveStats.greed}      cap={a.statCaps.greed} />
              </div>

              {/* Unique move */}
              <div className="border-t border-[#91897C]/30 pt-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Unique Move</p>
                <p className="text-sm leading-6 text-[#d8d4a1]">{a.uniqueMove}</p>
              </div>

              <p className="font-mono text-[10px] italic text-[#EEF083]/30">&ldquo;{a.tagline}&rdquo;</p>

              {/* Confirm */}
              <button
                className="mt-auto w-full border-2 border-[#EEF083] bg-[#EEF083] py-4 font-black uppercase tracking-[0.12em] text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation"
                onClick={confirm}
                type="button"
              >
                Play as {a.name} →
              </button>
            </div>
          </div>

        </main>
      </div>
    );
  }

  // ── GRID VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
          Step 2 of 3
        </p>
        <h1 className="mb-6 text-3xl font-black uppercase sm:text-5xl">Choose Archetype</h1>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {ARCHETYPES.map((a) => {
            const isAvailable = unlocked.has(a.id);
            return (
              <button
                key={a.id}
                className={`group relative flex flex-col overflow-hidden border bg-[#2f2922] text-left transition touch-manipulation ${
                  isAvailable
                    ? "border-[#91897C] hover:border-[#EEF083] hover:shadow-[4px_4px_0_#91897C]"
                    : "border-[#3a342c] opacity-40 cursor-not-allowed"
                }`}
                disabled={!isAvailable}
                onClick={() => openDetail(a)}
                type="button"
              >
                {/* Portrait */}
                <div className="relative aspect-3/4 w-full overflow-hidden bg-[#1a1710]">
                  {a.image ? (
                    <Image
                      alt={a.name}
                      className="object-cover object-top grayscale transition duration-300 group-hover:grayscale-0"
                      fill
                      sizes="(max-width: 640px) 33vw, 25vw"
                      src={a.image}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="font-mono text-3xl font-black text-[#EEF083]/10">{a.initials}</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#2f2922] via-transparent to-transparent" />
                </div>

                {/* Name strip */}
                <div className="border-t border-[#91897C] px-2 py-2 sm:px-3">
                  <p className="font-black uppercase leading-none text-[#EEF083] text-xs sm:text-sm">{a.name}</p>
                  <p className="mt-0.5 hidden font-mono text-[10px] text-[#91897C] sm:block">{a.role}</p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#91897C]">
          Tap a character to view details and confirm.
        </p>

      </main>
    </div>
  );
}

export default function CharacterSelectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#241F19]" />}>
      <CharacterSelectContent />
    </Suspense>
  );
}
