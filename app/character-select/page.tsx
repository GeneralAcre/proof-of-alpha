"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { ARCHETYPES, type Archetype } from "../lib/archetypes";

const MOCK_UNLOCKED = new Set(["alpha", "beta"]);
const LAST_PICKED_KEY = "poa_last_archetype";

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-6 shrink-0 font-mono text-[9px] uppercase text-[#91897C]">{label}</span>
      <div className="h-1 flex-1 border border-[#91897C]/40 bg-[#241F19]">
        <div className="h-full bg-[#EEF083]" style={{ width: `${value}%` }} />
      </div>
      <span className="w-5 text-right font-mono text-[9px] text-[#EEF083]">{value}</span>
    </div>
  );
}

function CharacterSelectContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const mode    = params.get("mode") ?? "multiplayer";
  const room    = params.get("room") ?? "";

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LAST_PICKED_KEY) ?? "alpha";
    }
    return "alpha";
  });
  // which card is currently flipped to its detail side
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const selected  = ARCHETYPES.find((a) => a.id === selectedId) ?? ARCHETYPES[0];
  const isUnlocked = (a: Archetype) => MOCK_UNLOCKED.has(a.id);

  useEffect(() => {
    localStorage.setItem(LAST_PICKED_KEY, selectedId);
  }, [selectedId]);

  function handleCardClick(a: Archetype) {
    if (!isUnlocked(a)) return;
    setSelectedId(a.id);
    setFlippedId((prev) => (prev === a.id ? null : a.id));
  }

  function confirm() {
    const href = room
      ? `/lobby?mode=${mode}&archetype=${selected.id}&room=${room}`
      : `/lobby?mode=${mode}&archetype=${selected.id}`;
    router.push(href);
  }

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
          Step 2 of 3
        </p>
        <h1 className="mb-8 text-4xl font-black uppercase sm:text-5xl">Choose Archetype</h1>

        {/* ── 6-card flip grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ARCHETYPES.map((a) => {
            const unlocked  = isUnlocked(a);
            const isFlipped = flippedId === a.id;
            const isSelected = selectedId === a.id;

            return (
              <div
                key={a.id}
                className="relative h-64 [perspective:900px] sm:h-72"
              >
                {/* rotating inner */}
                <div
                  className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${
                    isFlipped ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >

                  {/* ── FRONT ── image + name */}
                  <button
                    className={`absolute inset-0 flex flex-col overflow-hidden border [backface-visibility:hidden] transition ${
                      isSelected && !isFlipped
                        ? "border-[#EEF083] shadow-[4px_4px_0_#91897C]"
                        : unlocked
                        ? "border-[#91897C] hover:border-[#EEF083]"
                        : "border-[#91897C] opacity-40 cursor-not-allowed"
                    } bg-[#2f2922]`}
                    disabled={!unlocked}
                    onClick={() => handleCardClick(a)}
                    type="button"
                    aria-label={`View ${a.name}`}
                  >
                    {/* character image */}
                    <div className="relative flex-1 overflow-hidden bg-[#1a1710]">
                      {a.image ? (
                        <Image
                          alt={a.name}
                          className="object-cover object-top grayscale"
                          fill
                          sizes="(max-width: 640px) 50vw, 33vw"
                          src={a.image}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="font-mono text-5xl font-black text-[#EEF083]/10">
                            {a.initials}
                          </span>
                        </div>
                      )}
                      {/* locked overlay */}
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#241F19]/70">
                          <span className="font-mono text-xs text-[#91897C]">
                            {a.unlockCost.toLocaleString()} σ
                          </span>
                        </div>
                      )}
                    </div>

                    {/* name strip */}
                    <div className={`shrink-0 border-t px-3 py-2 text-left ${
                      isSelected && !isFlipped
                        ? "border-[#EEF083] bg-[#EEF083]/10"
                        : "border-[#91897C]"
                    }`}>
                      <p className="text-sm font-black uppercase leading-none text-[#EEF083]">
                        {a.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#91897C]">{a.role}</p>
                    </div>
                  </button>

                  {/* ── BACK ── detail */}
                  <div
                    className="absolute inset-0 flex flex-col overflow-hidden border border-[#EEF083] bg-[#2f2922] shadow-[4px_4px_0_#91897C] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  >
                    {/* close strip */}
                    <button
                      className="flex shrink-0 items-center gap-2 border-b border-[#91897C] px-3 py-2 text-left transition hover:bg-[#EEF083]/5"
                      onClick={() => setFlippedId(null)}
                      type="button"
                      aria-label="Flip back"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#EEF083] font-mono text-[10px] font-black text-[#241F19]">
                        {a.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase leading-none text-[#EEF083]">
                          {a.name}
                        </p>
                        <p className="text-[10px] text-[#91897C]">{a.role}</p>
                      </div>
                      <span className="ml-auto font-mono text-[10px] text-[#91897C]">✕</span>
                    </button>

                    {/* scrollable detail */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      <p className="text-[10px] leading-[1.45] text-[#91897C]">
                        {a.description}
                      </p>

                      {/* stats */}
                      <div className="space-y-1 pt-1">
                        <MiniBar label="AGG" value={a.stats.aggression} />
                        <MiniBar label="DEF" value={a.stats.defense} />
                        <MiniBar label="BLF" value={a.stats.bluff} />
                        <MiniBar label="GRD" value={a.stats.greed} />
                      </div>

                      {/* passive */}
                      <div className="border-t border-[#91897C]/30 pt-2">
                        <p className="mb-0.5 font-mono text-[9px] uppercase text-[#91897C]">
                          Passive
                        </p>
                        <p className="text-[10px] leading-[1.4] text-[#d8d4a1]">
                          {a.passive}
                        </p>
                      </div>

                      {/* unique move */}
                      <div className="border-t border-[#91897C]/30 pt-2">
                        <p className="mb-0.5 font-mono text-[9px] uppercase text-[#91897C]">
                          Unique Move
                        </p>
                        <p className="text-[10px] leading-[1.4] text-[#d8d4a1]">
                          {a.uniqueMove}
                        </p>
                      </div>

                      <p className="pt-1 font-mono text-[9px] italic text-[#EEF083]/40">
                        &ldquo;{a.tagline}&rdquo;
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
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
