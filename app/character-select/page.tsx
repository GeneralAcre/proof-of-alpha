"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { ARCHETYPES, type Archetype } from "../lib/archetypes";
import { getUnlocked } from "../lib/unlocks";
import { getCharacterLevel, saveCharacterLevel, levelUpCost, MAX_LEVEL } from "../lib/upgrades";
import { useWallet } from "../components/WalletProvider";
import { getOrInitAura, saveAura } from "../lib/aura";

const LAST_PICKED_KEY = "poa_last_archetype";

function auraStorageKey(addr: string | null | undefined) {
  return addr ? `poa_aura_${addr}` : "poa_aura_anonymous";
}

function StatBar({ label, value, cap, nextValue }: {
  label: string; value: number; cap: number; nextValue?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-[#a09ab8]">{label}</span>
      <div className="flex flex-1 gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 transition-all ${
              i < value
                ? "bg-[#E4D474]"
                : nextValue && i < nextValue
                ? "bg-[#E4D474]/30"
                : i < cap
                ? "bg-[#a09ab8]/20"
                : "bg-[#a09ab8]/08"
            }`}
          />
        ))}
      </div>
      <span className="w-14 shrink-0 text-right font-mono text-xs text-[#E4D474]">
        {value}
        {nextValue && nextValue > value && (
          <span className="text-[#E4D474]/50"> {nextValue}</span>
        )}
        <span className="text-[#a09ab8]">/{cap}</span>
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
  const [unlocked,   setUnlocked]   = useState<Set<string>>(new Set(["alpha", "beta", "sigma"]));
  const [charLevels, setCharLevels] = useState<Record<string, number>>({});
  const [aura,       setAura]       = useState(0);

  useEffect(() => { setUnlocked(getUnlocked(walletAddr)); }, [walletAddr]);

  useEffect(() => {
    const levels: Record<string, number> = {};
    for (const a of ARCHETYPES) levels[a.id] = getCharacterLevel(walletAddr, a.id);
    setCharLevels(levels);
    setAura(getOrInitAura(walletAddr));
  }, [walletAddr]);

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

  function handleLevelUp(archetypeId: string, currentLevel: number) {
    const cost = levelUpCost(currentLevel);
    if (aura < cost) return;
    const newAura = aura - cost;
    saveAura(walletAddr, newAura);
    setAura(newAura);
    const newLevel = currentLevel + 1;
    saveCharacterLevel(walletAddr, archetypeId, newLevel);
    setCharLevels((prev) => ({ ...prev, [archetypeId]: newLevel }));
  }

  function confirm() {
    if (mode === "solo") {
      router.push(`/map?archetype=${selected.id}`);
      return;
    }
    const href = room
      ? `/lobby?mode=${mode}&archetype=${selected.id}&room=${room}`
      : `/lobby?mode=${mode}&archetype=${selected.id}`;
    router.push(href);
  }

  // ── DETAIL VIEW ────────────────────────────────────────────────────────────
  if (view === "detail") {
    const a        = selected;
    const level    = charLevels[a.id] ?? 1;
    const maxed    = level >= MAX_LEVEL;
    const cost     = levelUpCost(level);
    const canAfford = aura >= cost;
    const cur      = a.levels[level - 1];
    const next     = !maxed ? a.levels[level] : null;

    return (
      <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8">

          {/* Back */}
          <button
            className="mb-6 border border-[#a09ab8] px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-[#a09ab8] transition hover:border-[#E4D474] hover:text-[#E4D474] touch-manipulation"
            onClick={() => setView("grid")}
            type="button"
          >
            Back
          </button>

          <div className="grid gap-6 sm:grid-cols-[1fr_1.1fr] sm:gap-8">

            {/* Portrait */}
            <div className="relative aspect-3/4 w-full overflow-hidden border border-[#a09ab8] bg-[#160c2c]">
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
                  <span className="font-mono text-6xl font-black text-[#E4D474]/10">{a.initials}</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#24153E]/60 to-transparent" />

              {/* Level badge on portrait */}
              <div className="absolute bottom-3 left-3 border border-[#E4D474]/40 bg-[#24153E]/80 px-3 py-1.5 backdrop-blur-sm">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#a09ab8]">Level</p>
                <p className="font-mono text-2xl font-black leading-none text-[#E4D474]">
                  {level}<span className="text-sm text-[#a09ab8]">/{MAX_LEVEL}</span>
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#a09ab8]">
                  Step 2 of 3 · {mode === "solo" ? "Solo" : "Multiplayer"}
                </p>
                <h1 className="mt-1 text-4xl font-black uppercase leading-none sm:text-5xl">{a.name}</h1>
                <p className="mt-1 text-sm text-[#a09ab8]">{a.role}</p>
                <p className="mt-3 text-sm leading-7 text-[#ffffff]">{a.description}</p>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Stats</p>
                <StatBar label="Aggression" value={cur.aggression} cap={a.statCaps.aggression} nextValue={next?.aggression} />
                <StatBar label="Defense"    value={cur.defense}    cap={a.statCaps.defense}    nextValue={next?.defense} />
                <StatBar label="Bluff"      value={cur.bluff}      cap={a.statCaps.bluff}      nextValue={next?.bluff} />
                <StatBar label="Greed"      value={cur.greed}      cap={a.statCaps.greed}      nextValue={next?.greed} />
              </div>

              {/* Level-up block */}
              <div className="border border-[#a09ab8]/40 bg-[#2d1a4a] p-3">
                {/* Level pips */}
                <div className="mb-2.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-[#a09ab8]">LVL</span>
                  <div className="flex flex-1 gap-0.5">
                    {Array.from({ length: MAX_LEVEL }, (_, i) => (
                      <div key={i} className={`h-1.5 flex-1 ${i < level ? "bg-[#E4D474]" : "bg-[#a09ab8]/20"}`} />
                    ))}
                  </div>
                  <span className="font-mono text-xs font-bold text-[#E4D474]">{level}/{MAX_LEVEL}</span>
                </div>

                {maxed ? (
                  <p className="text-center font-mono text-xs uppercase tracking-widest text-[#E4D474]/40">Max Level</p>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleLevelUp(a.id, level)}
                      className={`w-full border-2 py-3 font-mono text-xs font-black uppercase tracking-widest transition touch-manipulation ${
                        canAfford
                          ? "border-[#E4D474] bg-[#E4D474] text-[#24153E] hover:bg-transparent hover:text-[#E4D474]"
                          : "border-[#a09ab8]/40 text-[#a09ab8]/40 cursor-not-allowed"
                      }`}
                    >
                      Level Up — LVL {level + 1}
                    </button>
                    <div className="mt-1.5 flex items-center justify-between font-mono text-[10px]">
                      <span className={canAfford ? "text-[#E4D474]" : "text-red-400"}>
                        {cost} AURA
                      </span>
                      <span className="text-[#a09ab8]">
                        Balance: {aura.toLocaleString()} AURA
                        {!canAfford && (
                          <> · <a href="/store" className="text-[#E4D474] underline">Buy more</a></>
                        )}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Unique move */}
              <div className="border-t border-[#a09ab8]/30 pt-3">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[#a09ab8]">Unique Move</p>
                <p className="text-sm leading-6 text-[#ffffff]">{a.uniqueMove}</p>
              </div>

              <p className="font-mono text-[10px] italic text-[#E4D474]/30">&ldquo;{a.tagline}&rdquo;</p>

              {/* Confirm */}
              <button
                className="mt-auto w-full border-2 border-[#E4D474] bg-[#E4D474] py-4 font-black uppercase tracking-[0.12em] text-[#24153E] shadow-[6px_6px_0_#a09ab8] transition hover:bg-transparent hover:text-[#E4D474] touch-manipulation"
                onClick={confirm}
                type="button"
              >
                Play as {a.name}
              </button>
            </div>
          </div>

        </main>
      </div>
    );
  }

  // ── GRID VIEW ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#24153E] text-[#E4D474]">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">

        <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#a09ab8]">
          Step 2 of 3
        </p>
        <h1 className="mb-6 text-3xl font-black uppercase sm:text-5xl">Choose Archetype</h1>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {ARCHETYPES.map((a) => {
            const isAvailable = unlocked.has(a.id);
            const lvl = charLevels[a.id] ?? 1;
            return (
              <button
                key={a.id}
                className={`group relative flex flex-col overflow-hidden border bg-[#2d1a4a] text-left transition touch-manipulation ${
                  isAvailable
                    ? "border-[#a09ab8] hover:border-[#E4D474] hover:shadow-[4px_4px_0_#a09ab8]"
                    : "border-[#170b2e] opacity-40 cursor-not-allowed"
                }`}
                disabled={!isAvailable}
                onClick={() => openDetail(a)}
                type="button"
              >
                {/* Portrait */}
                <div className="relative aspect-3/4 w-full overflow-hidden bg-[#160c2c]">
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
                      <span className="font-mono text-3xl font-black text-[#E4D474]/10">{a.initials}</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#2d1a4a] via-transparent to-transparent" />
                </div>

                {/* Name strip */}
                <div className="border-t border-[#a09ab8] px-2 py-2 sm:px-3">
                  <p className="font-black uppercase leading-none text-[#E4D474] text-xs sm:text-sm">{a.name}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-[#a09ab8]">
                    {isAvailable ? `LVL ${lvl}` : a.role}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#a09ab8]">
          Tap a character to view details and upgrade.
        </p>

      </main>
    </div>
  );
}

export default function CharacterSelectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#24153E]" />}>
      <CharacterSelectContent />
    </Suspense>
  );
}
