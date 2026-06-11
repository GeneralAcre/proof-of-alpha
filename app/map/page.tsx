"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";

type Area = {
  id: string;
  name: string;
  subtitle: string;
  difficulty: "easy" | "medium" | "hard";
  locked: boolean;
  unlockCost: number;
};

const AREAS: Area[] = [
  { id: "common",   name: "The Corner Café",   subtitle: "Free seating. No dress code.",            difficulty: "easy",   locked: false, unlockCost: 0   },
  { id: "frost",    name: "The Campus Quad",   subtitle: "Three deadlines, zero patience.",          difficulty: "easy",   locked: false, unlockCost: 0   },
  { id: "darkhall", name: "The Rooftop Bar",   subtitle: "Cocktails at sunset. She knows your type.",difficulty: "medium", locked: false, unlockCost: 0   },
  { id: "mine",     name: "The Gym Floor",     subtitle: "She's on a program. You better be too.",   difficulty: "medium", locked: false, unlockCost: 0   },
  { id: "vault",    name: "The Yacht Club",    subtitle: "Members only. AURA required.",             difficulty: "hard",   locked: true,  unlockCost: 300 },
  { id: "chamber",  name: "The Penthouse Pool",subtitle: "Top floor. Not your crowd.",               difficulty: "hard",   locked: true,  unlockCost: 500 },
];

const AURA_KEY   = (addr: string) => `poa_aura_${addr}`;
const UNLOCK_KEY = (addr: string, id: string) => `poa_area_${addr}_${id}`;

const DIFF_LABEL: Record<string, string> = { easy: "WARM", medium: "COLD", hard: "ICY" };

const CARD_CFG: Record<string, { colSpan: string; clip: string }> = {
  common:   { colSpan: "col-span-2",               clip: "polygon(0% 0%, 100% 0%, 100% 74%, 91% 100%, 0% 100%)"                                 },
  frost:    { colSpan: "col-span-1",               clip: "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 18%)"                                 },
  darkhall: { colSpan: "col-span-1",               clip: "polygon(0% 0%, 84% 0%, 100% 18%, 100% 100%, 0% 100%)"                                 },
  mine:     { colSpan: "col-span-1 sm:col-span-2", clip: "polygon(0% 0%, 100% 0%, 100% 100%, 15% 100%, 0% 80%)"                                 },
  vault:    { colSpan: "col-span-1",               clip: "polygon(10% 0%, 90% 0%, 100% 12%, 100% 88%, 90% 100%, 10% 100%, 0% 88%, 0% 12%)"     },
  chamber:  { colSpan: "col-span-2",               clip: "polygon(0% 15%, 11% 0%, 100% 0%, 100% 85%, 89% 100%, 0% 100%)"                       },
};

function AreaCard({ area, aura, addr, onEnter, onUnlock }: {
  area: Area;
  aura: number;
  addr: string | null;
  onEnter: (a: Area) => void;
  onUnlock: (a: Area) => void;
}) {
  const cfg        = CARD_CFG[area.id];
  const isUnlocked = !area.locked || (addr ? localStorage.getItem(UNLOCK_KEY(addr, area.id)) === "1" : false);
  const canAfford  = aura >= area.unlockCost;

  // Unlocked → yellow accent. Locked → grey accent.
  const accent = isUnlocked ? "#EEF083" : "#91897C";

  return (
    <div
      className={`relative flex flex-col justify-between p-5 sm:p-6 ${cfg.colSpan}`}
      style={{ backgroundColor: "#241F19", clipPath: cfg.clip, minHeight: 210 }}
    >
      {/* Grid overlay */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`gp-${area.id}`} width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M22 0L0 0 0 22" fill="none" stroke="#EEF083" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#gp-${area.id})`} />
      </svg>

      {/* Top color strip */}
      <div className="absolute left-0 right-0 top-0 h-0.5" style={{ backgroundColor: accent }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className="border px-1.5 py-0.5 font-mono text-[7px] font-black uppercase tracking-[0.22em]"
          style={{ borderColor: accent + "55", color: accent }}
        >
          {DIFF_LABEL[area.difficulty]}
        </span>
        {area.locked && !isUnlocked && (
          <span className="font-mono text-[8px] uppercase tracking-wide text-[#91897C]">
            🔒 {area.unlockCost} AURA
          </span>
        )}
      </div>

      {/* Name + subtitle */}
      <div className="relative z-10 mt-4 flex-1">
        <h3
          className="font-black uppercase leading-[0.88] tracking-tight"
          style={{
            color: accent,
            fontSize: "clamp(17px, 2.2vw + 6px, 27px)",
          }}
        >
          {isUnlocked ? area.name : "???"}
        </h3>
        <p className="mt-2 font-mono text-[10px] italic leading-4 text-[#91897C]">
          {area.subtitle}
        </p>
      </div>

      {/* Action */}
      <div className="relative z-10 mt-6">
        {isUnlocked ? (
          <button
            className="bg-[#EEF083] px-5 py-2.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#241F19] transition hover:opacity-75 touch-manipulation"
            onClick={() => onEnter(area)}
            type="button"
          >
            Enter
          </button>
        ) : (
          <button
            className="border border-[#91897C]/50 px-5 py-2.5 font-mono text-[10px] font-black uppercase tracking-widest transition disabled:opacity-25 touch-manipulation"
            style={{ color: canAfford ? "#EEF083" : "#91897C" }}
            disabled={!addr || !canAfford}
            onClick={() => onUnlock(area)}
            type="button"
          >
            {!addr
              ? "Connect wallet"
              : canAfford
              ? `Unlock — ${area.unlockCost} AURA`
              : `Need ${area.unlockCost} AURA`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  const router = useRouter();
  const { account } = useWallet();
  const addr = account ? String(account.address) : null;

  const [aura, setAura] = useState(0);
  const [rev,  setRev]  = useState(0);

  useEffect(() => {
    if (!addr) return;
    setAura(Number(localStorage.getItem(AURA_KEY(addr)) ?? "0") || 0);
  }, [addr, rev]);

  function handleEnter(area: Area) {
    router.push(`/game?difficulty=${area.difficulty}`);
  }

  function handleUnlock(area: Area) {
    if (!addr || aura < area.unlockCost) return;
    const next = aura - area.unlockCost;
    localStorage.setItem(AURA_KEY(addr), String(next));
    localStorage.setItem(UNLOCK_KEY(addr, area.id), "1");
    setAura(next);
    setRev((r) => r + 1);
  }

  return (
    <div className="min-h-screen bg-[#0e0c09] text-[#EEF083]">
      <Nav />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Proof of Alpha</p>
            <h1 className="mt-1 text-5xl font-black uppercase">Select Area</h1>
            <p className="mt-2 font-mono text-xs text-[#91897C]">6 areas. 4 open. 2 locked.</p>
          </div>
          {addr && (
            <div className="shrink-0 border border-[#91897C]/30 px-4 py-2.5 text-right">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#91897C]">Your AURA</p>
              <p className="mt-0.5 font-mono text-2xl font-black leading-none text-[#EEF083]">{aura}</p>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {AREAS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              aura={aura}
              addr={addr}
              onEnter={handleEnter}
              onUnlock={handleUnlock}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#91897C]">
          <span><span className="text-[#EEF083]">■</span> Warm — easy approach</span>
          <span><span className="text-[#EEF083]">■</span> Cold — selective</span>
          <span><span className="text-[#91897C]">■</span> Icy — elite only</span>
        </div>

      </main>
    </div>
  );
}
