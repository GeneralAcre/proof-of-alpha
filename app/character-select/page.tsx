"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Nav } from "../components/Nav";
import { ARCHETYPES, type Archetype } from "../lib/archetypes";
import { getUnlocked } from "../lib/unlocks";
import { useWallet } from "../components/WalletProvider";

const LAST_PICKED_KEY = "poa_last_archetype";

function StatBar({ label, value, big }: { label: string; value: number; big?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`shrink-0 font-mono uppercase text-[#91897C] ${big ? "w-7 text-[11px]" : "w-6 text-[9px]"}`}>
        {label}
      </span>
      <div className={`flex-1 border border-[#91897C]/40 bg-[#241F19] ${big ? "h-1.5" : "h-1"}`}>
        <div className="h-full bg-[#EEF083] transition-all" style={{ width: `${value}%` }} />
      </div>
      <span className={`shrink-0 text-right font-mono text-[#EEF083] ${big ? "w-6 text-[11px]" : "w-5 text-[9px]"}`}>
        {value}
      </span>
    </div>
  );
}

/* ── Hover popup (desktop/mouse only) ───────────────────────────────────── */
type PopupPos = { x: number; y: number; side: "right" | "left" };

function HoverPopup({ archetype, pos }: { archetype: Archetype; pos: PopupPos }) {
  const a = archetype;
  const style: React.CSSProperties = {
    position: "fixed",
    top: pos.y,
    ...(pos.side === "right" ? { left: pos.x } : { right: pos.x }),
    width: 288,
    zIndex: 200,
    pointerEvents: "none",
  };

  return (
    <div style={style} className="border border-[#EEF083] bg-[#2f2922] shadow-[8px_8px_0_#91897C]">
      {a.image && (
        <div className="relative h-44 w-full overflow-hidden bg-[#1a1710]">
          <Image
            alt={a.name}
            className="object-cover object-top grayscale"
            fill
            sizes="288px"
            src={a.image}
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#2f2922] via-transparent to-transparent" />
        </div>
      )}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-xl font-black uppercase leading-none text-[#EEF083]">{a.name}</p>
          <p className="mt-0.5 text-sm text-[#91897C]">{a.role}</p>
          <p className="mt-1 text-xs leading-5 text-[#91897C]">{a.description}</p>
        </div>
        <div className="space-y-1.5">
          <StatBar big label="AGG" value={a.stats.aggression} />
          <StatBar big label="DEF" value={a.stats.defense} />
          <StatBar big label="BLF" value={a.stats.bluff} />
          <StatBar big label="GRD" value={a.stats.greed} />
        </div>
        <div className="border-t border-[#91897C]/30 pt-2">
          <p className="mb-1 font-mono text-[10px] uppercase text-[#91897C]">Passive</p>
          <p className="text-xs leading-5 text-[#d8d4a1]">{a.passive}</p>
        </div>
        <div className="border-t border-[#91897C]/30 pt-2">
          <p className="mb-1 font-mono text-[10px] uppercase text-[#91897C]">Unique Move</p>
          <p className="text-xs leading-5 text-[#d8d4a1]">{a.uniqueMove}</p>
        </div>
        <p className="font-mono text-[10px] italic text-[#EEF083]/40">&ldquo;{a.tagline}&rdquo;</p>
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
function CharacterSelectContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { account } = useWallet();
  const mode   = params.get("mode") ?? "multiplayer";
  const room   = params.get("room") ?? "";

  const walletAddr = account ? String(account.address) : null;
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set(["alpha", "beta"]));

  useEffect(() => {
    setUnlocked(getUnlocked(walletAddr));
  }, [walletAddr]);

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(LAST_PICKED_KEY) ?? "alpha";
    }
    return "alpha";
  });
  const [flippedId,  setFlippedId]  = useState<string | null>(null);
  const [hoveredId,  setHoveredId]  = useState<string | null>(null);
  const [popupPos,   setPopupPos]   = useState<PopupPos | null>(null);

  const selected   = ARCHETYPES.find((a) => a.id === selectedId) ?? ARCHETYPES[0];
  const isUnlocked = (a: Archetype) => unlocked.has(a.id);

  useEffect(() => { localStorage.setItem(LAST_PICKED_KEY, selectedId); }, [selectedId]);

  function handlePointerEnter(a: Archetype, e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    if (!isUnlocked(a)) return;
    const rect   = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const PW     = 296;
    const spaceR = window.innerWidth - rect.right;
    const side   = spaceR >= PW ? "right" : "left";
    const maxY   = window.innerHeight - 500;
    const y      = Math.min(Math.max(rect.top, 8), maxY > 8 ? maxY : 8);
    const x      = side === "right" ? rect.right + 8 : window.innerWidth - rect.left + 8;
    setHoveredId(a.id);
    setPopupPos({ x, y, side });
  }

  function handlePointerLeave(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    setHoveredId(null);
    setPopupPos(null);
  }

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

  const hoveredArchetype = ARCHETYPES.find((a) => a.id === hoveredId);

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        <p className="mb-1 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
          Step 2 of 3
        </p>
        <h1 className="mb-6 text-3xl font-black uppercase sm:mb-8 sm:text-5xl">Choose Archetype</h1>

        {/* ── 6-card grid ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ARCHETYPES.map((a) => {
            const unlocked   = isUnlocked(a);
            const isFlipped  = flippedId === a.id;
            const isSelected = selectedId === a.id;

            return (
              <div
                key={a.id}
                className="relative h-64 perspective-[900px] sm:h-80"
                onPointerEnter={(e) => handlePointerEnter(a, e)}
                onPointerLeave={(e) => handlePointerLeave(e)}
              >
                {/* rotating inner */}
                <div
                  className={`relative h-full w-full will-change-transform transition-transform duration-500 transform-3d ${
                    isFlipped ? "transform-[rotateY(180deg)]" : ""
                  }`}
                >

                  {/* ── FRONT ── */}
                  <button
                    className={`absolute inset-0 flex flex-col overflow-hidden border backface-hidden transition touch-manipulation ${
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
                    {/* image */}
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

                  {/* ── BACK (tap detail) ── */}
                  <div className="absolute inset-0 flex flex-col overflow-hidden border border-[#EEF083] bg-[#2f2922] shadow-[4px_4px_0_#91897C] backface-hidden transform-[rotateY(180deg)]">
                    {/* header / close */}
                    <button
                      className="flex shrink-0 items-center gap-2 border-b border-[#91897C] px-3 py-2.5 text-left transition hover:bg-[#EEF083]/5 touch-manipulation"
                      onClick={() => setFlippedId(null)}
                      type="button"
                      aria-label="Flip back"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#EEF083] font-mono text-xs font-black text-[#241F19]">
                        {a.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black uppercase leading-none text-[#EEF083]">
                          {a.name}
                        </p>
                        <p className="text-[11px] text-[#91897C]">{a.role}</p>
                      </div>
                      <span className="font-mono text-sm text-[#91897C]">✕</span>
                    </button>

                    {/* scrollable detail */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2.5">
                      <p className="text-xs leading-5 text-[#91897C]">{a.description}</p>

                      <div className="space-y-1.5">
                        <StatBar label="AGG" value={a.stats.aggression} />
                        <StatBar label="DEF" value={a.stats.defense} />
                        <StatBar label="BLF" value={a.stats.bluff} />
                        <StatBar label="GRD" value={a.stats.greed} />
                      </div>

                      <div className="border-t border-[#91897C]/30 pt-2">
                        <p className="mb-1 font-mono text-[10px] uppercase text-[#91897C]">Passive</p>
                        <p className="text-xs leading-5 text-[#d8d4a1]">{a.passive}</p>
                      </div>

                      <div className="border-t border-[#91897C]/30 pt-2">
                        <p className="mb-1 font-mono text-[10px] uppercase text-[#91897C]">Unique Move</p>
                        <p className="text-xs leading-5 text-[#d8d4a1]">{a.uniqueMove}</p>
                      </div>

                      <p className="pt-1 font-mono text-[10px] italic text-[#EEF083]/40">
                        &ldquo;{a.tagline}&rdquo;
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* tap hint — mobile only */}
        <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-[#91897C] sm:hidden">
          Tap a card to see details
        </p>

        {/* ── CONFIRM ── */}
        <div className="mt-6 flex flex-col gap-3 border-t border-[#91897C] pt-5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:pt-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#91897C]">
              Entering as
            </p>
            <p className="text-lg font-black uppercase text-[#EEF083] sm:text-xl">
              {selected.name}{" "}
              <span className="text-sm font-normal text-[#91897C]">— {selected.role}</span>
            </p>
            <p className="font-mono text-xs text-[#91897C]">
              {mode === "solo" ? "Solo · 0.5x points" : "Multiplayer · Full points"}
              {room && ` · Room ${room}`}
            </p>
          </div>
          <button
            className="w-full border-2 border-[#EEF083] bg-[#EEF083] px-8 py-4 font-black uppercase text-[#241F19] shadow-[6px_6px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] touch-manipulation sm:w-auto"
            onClick={confirm}
            type="button"
          >
            Confirm &amp; Enter Lobby
          </button>
        </div>

      </main>

      {/* ── fixed hover popup (mouse/desktop only — never renders on touch) ── */}
      {hoveredArchetype && popupPos && (
        <HoverPopup archetype={hoveredArchetype} pos={popupPos} />
      )}
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
