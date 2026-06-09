"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { ARCHETYPES, type Archetype } from "../lib/archetypes";

const MOCK_UNLOCKED = new Set(["alpha", "beta"]);
const LAST_PICKED_KEY = "poa_last_archetype";

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-xs uppercase tracking-[0.12em]">
        <span className="text-[#91897C]">{label}</span>
        <span className="font-black text-[#EEF083]">{value}</span>
      </div>
      <div className="h-1.5 w-full border border-[#91897C] bg-[#241F19]">
        <div className="h-full bg-[#EEF083] transition-all duration-300" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function CharacterSelectContent() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode") ?? "multiplayer";
  const room = params.get("room") ?? "";

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LAST_PICKED_KEY) ?? "npc";
    }
    return "npc";
  });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayId = hoveredId ?? selectedId;
  const display = ARCHETYPES.find((a) => a.id === displayId) ?? ARCHETYPES[0];
  const selected = ARCHETYPES.find((a) => a.id === selectedId) ?? ARCHETYPES[0];
  const isUnlocked = (a: Archetype) => MOCK_UNLOCKED.has(a.id);

  useEffect(() => {
    localStorage.setItem(LAST_PICKED_KEY, selectedId);
  }, [selectedId]);

  function confirm() {
    const href = room
      ? `/lobby?mode=${mode}&archetype=${selected.id}&room=${room}`
      : `/lobby?mode=${mode}&archetype=${selected.id}`;
    router.push(href);
  }

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
          Step 2 of 3
        </p>
        <h1 className="mb-8 text-4xl font-black uppercase sm:text-5xl">Choose Archetype</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── CARD GRID ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ARCHETYPES.map((a) => {
              const unlocked = isUnlocked(a);
              const isSelected = selectedId === a.id;
              return (
                <button
                  key={a.id}
                  className={`border p-4 text-left transition ${
                    isSelected
                      ? "border-[#EEF083] bg-[#EEF083] text-[#241F19] shadow-[6px_6px_0_#91897C]"
                      : unlocked
                      ? "border-[#91897C] bg-[#2f2922] text-[#EEF083] hover:border-[#EEF083]"
                      : "border-[#91897C] bg-[#2f2922] text-[#91897C] opacity-50 cursor-not-allowed"
                  }`}
                  disabled={!unlocked}
                  onClick={() => unlocked && setSelectedId(a.id)}
                  onMouseEnter={() => setHoveredId(a.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  type="button"
                >
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center border font-mono text-xl font-black ${
                      isSelected
                        ? "border-[#241F19] bg-[#241F19] text-[#EEF083]"
                        : "border-current bg-current/10"
                    }`}
                  >
                    {a.initials}
                  </div>
                  <p className="text-base font-black uppercase">{a.name}</p>
                  <p
                    className={`mt-0.5 text-xs ${
                      isSelected ? "text-[#241F19]/70" : "text-[#91897C]"
                    }`}
                  >
                    {a.role}
                  </p>
                  {!unlocked && (
                    <p className="mt-2 font-mono text-xs text-[#91897C]">
                      {a.unlockCost.toLocaleString()} σ
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── DETAIL PANEL ── */}
          <div className="border border-[#91897C] bg-[#2f2922] shadow-[6px_6px_0_#91897C] lg:sticky lg:top-20 lg:self-start">

            {/* Character art */}
            {display.image ? (
              <div className="relative h-56 w-full overflow-hidden border-b border-[#91897C] bg-[#241F19]">
                <Image
                  alt={display.name}
                  className="object-cover object-top grayscale"
                  fill
                  src={display.image}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#2f2922]" />
              </div>
            ) : (
              <div className="flex h-32 w-full items-center justify-center border-b border-[#91897C] bg-[#241F19]/60">
                <span className="font-mono text-6xl font-black text-[#EEF083]/20">{display.initials}</span>
              </div>
            )}

            <div className="p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">
                  {hoveredId ? "Previewing" : "Selected"}
                </p>
                <p className="mt-0.5 text-2xl font-black uppercase">{display.name}</p>
                <p className="text-sm text-[#91897C]">{display.role}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#EEF083] bg-[#EEF083]/10 font-mono text-sm font-black text-[#EEF083]">
                {display.initials}
              </div>
            </div>

            <p className="mb-3 text-xs leading-5 text-[#91897C]">{display.description}</p>
            <p className="mb-4 italic text-sm text-[#d8d4a1]">&ldquo;{display.tagline}&rdquo;</p>

            {/* Stat bars */}
            <div className="mb-4 space-y-2.5">
              <StatBar label="Aggression" value={display.stats.aggression} />
              <StatBar label="Defense"    value={display.stats.defense} />
              <StatBar label="Bluff"      value={display.stats.bluff} />
              <StatBar label="Greed"      value={display.stats.greed} />
            </div>

            <div className="mb-3 border-t border-[#91897C] pt-3">
              <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#91897C]">
                Passive
              </p>
              <p className="text-sm leading-5 text-[#d8d4a1]">{display.passive}</p>
            </div>

            <div className="mb-3 border-t border-[#91897C] pt-3">
              <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.14em] text-[#91897C]">
                Unique Move
              </p>
              <p className="text-sm leading-5 text-[#d8d4a1]">{display.uniqueMove}</p>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3 border-t border-[#91897C] pt-3">
              <div>
                <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.12em] text-[#91897C]">
                  Strengths
                </p>
                {display.strengths.map((s) => (
                  <p key={s} className="text-xs text-[#EEF083]">+ {s}</p>
                ))}
              </div>
              <div>
                <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.12em] text-[#91897C]">
                  Weaknesses
                </p>
                {display.weaknesses.map((w) => (
                  <p key={w} className="text-xs text-[#d8d4a1]">- {w}</p>
                ))}
              </div>
            </div>

            {/* Matchup chart */}
            <div className="grid grid-cols-2 gap-3 border-t border-[#91897C] pt-3">
              <div>
                <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.12em] text-[#EEF083]">
                  Beats
                </p>
                {display.beats.map((b) => (
                  <p key={b} className="text-xs text-[#EEF083]">{b}</p>
                ))}
              </div>
              <div>
                <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.12em] text-[#91897C]">
                  Fears
                </p>
                {display.fears.map((f) => (
                  <p key={f} className="text-xs text-[#d8d4a1]">{f}</p>
                ))}
              </div>
            </div>
            </div>{/* end p-5 */}
          </div>
        </div>

        {/* ── CONFIRM ── */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#91897C] pt-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#91897C]">
              Entering as
            </p>
            <p className="text-xl font-black uppercase text-[#EEF083]">
              {selected.name}{" "}
              <span className="text-sm font-normal text-[#91897C]">— {selected.role}</span>
            </p>
            <p className="font-mono text-xs text-[#91897C]">
              {mode === "solo" ? "Solo · 0.5x points" : "Multiplayer · Full points"}
              {room && ` · Room ${room}`}
            </p>
          </div>
          <button
            className="border-2 border-[#EEF083] bg-[#EEF083] px-8 py-4 font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
            onClick={confirm}
            type="button"
          >
            Confirm &amp; Enter Lobby
          </button>
        </div>
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
