"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { hasBsol, BSOL_UNLOCK_AREAS } from "../lib/solblaze";

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
  { id: "vault",     name: "The Yacht Club",    subtitle: "Members only. AURA required.",             difficulty: "hard",   locked: true,  unlockCost: 300 },
  { id: "chamber",   name: "The Penthouse Pool",subtitle: "Top floor. Not your crowd.",               difficulty: "hard",   locked: true,  unlockCost: 500 },
  { id: "islandDAO", name: "islandDAO",          subtitle: "The only door is bSOL. No exceptions.",   difficulty: "hard",   locked: true,  unlockCost: 0   },
];

const AURA_KEY   = (addr: string) => `poa_aura_${addr}`;
const UNLOCK_KEY = (addr: string, id: string) => `poa_area_${addr}_${id}`;

const DIFF_LABEL: Record<string, string> = { easy: "WARM", medium: "COLD", hard: "ICY" };

const CARD_CFG: Record<string, { colSpan: string; clip: string }> = {
  common:   { colSpan: "col-span-2",               clip: "polygon(0% 0%, 88% 0%, 100% 14%, 100% 100%, 0% 100%)"           },
  frost:    { colSpan: "col-span-1",               clip: "polygon(16% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 18%)"           },
  darkhall: { colSpan: "col-span-1",               clip: "polygon(0% 0%, 82% 0%, 100% 20%, 100% 100%, 0% 100%)"           },
  mine:     { colSpan: "col-span-1 sm:col-span-2", clip: "polygon(0% 18%, 14% 0%, 100% 0%, 100% 100%, 0% 100%)"           },
  vault:    { colSpan: "col-span-1",               clip: "polygon(12% 0%, 88% 0%, 100% 14%, 100% 100%, 0% 100%, 0% 14%)"  },
  chamber:   { colSpan: "col-span-2",               clip: "polygon(0% 0%, 86% 0%, 100% 18%, 100% 100%, 12% 100%, 0% 86%)"  },
  islandDAO: { colSpan: "col-span-2 sm:col-span-3", clip: "polygon(0% 0%, 98% 0%, 100% 10%, 100% 90%, 98% 100%, 2% 100%, 0% 90%, 0% 10%)" },
};

function AreaCard({ area, aura, addr, bsolHolder, onEnter, onUnlock }: {
  area: Area;
  aura: number;
  addr: string | null;
  bsolHolder: boolean;
  onEnter: (a: Area) => void;
  onUnlock: (a: Area) => void;
}) {
  const cfg           = CARD_CFG[area.id];
  const bsolUnlocks   = bsolHolder && BSOL_UNLOCK_AREAS.includes(area.id);
  const isUnlocked    = !area.locked || bsolUnlocks || (addr ? localStorage.getItem(UNLOCK_KEY(addr, area.id)) === "1" : false);
  const canAfford     = aura >= area.unlockCost;
  const isBsolGate    = area.locked && area.unlockCost === 0; // bSOL-only, AURA can't unlock

  const accent = (area.id === "islandDAO" && isUnlocked) ? "#9945FF" : isUnlocked ? "#EEF083" : "#91897C";

  return (
    <div
      className={`relative flex flex-col justify-between p-4 sm:p-8 ${cfg.colSpan}`}
      style={{ backgroundColor: "#241F19", clipPath: cfg.clip, minHeight: "clamp(180px, 35vw, 280px)" }}
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
        <div className="flex items-center gap-2">
          <span
            className="border px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
            style={{ borderColor: accent + "55", color: accent }}
          >
            {area.id === "islandDAO" ? "DAO" : DIFF_LABEL[area.difficulty]}
          </span>
          {(bsolUnlocks || area.id === "islandDAO") && (
            <span className="border border-[#9945FF]/60 bg-[#9945FF]/10 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[#9945FF]">
              bSOL
            </span>
          )}
        </div>
        {area.locked && !isUnlocked && (
          isBsolGate ? (
            <span className="font-mono text-[10px] uppercase tracking-wide text-[#9945FF]/70">
              Hold bSOL to enter
            </span>
          ) : (
            <span className="font-mono text-xs uppercase tracking-wide text-[#91897C]">
              🔒 {area.unlockCost} AURA
            </span>
          )
        )}
      </div>

      {/* Name + subtitle */}
      <div className="relative z-10 mt-4 flex-1">
        <h3
          className="font-black uppercase leading-[0.88] tracking-tight"
          style={{
            color: accent,
            fontSize: "clamp(16px, 2.5vw + 6px, 36px)",
          }}
        >
          {isUnlocked ? area.name : "???"}
        </h3>
        <p className="mt-2 font-mono text-[11px] sm:text-sm italic leading-4 sm:leading-5 text-[#91897C]">
          {area.subtitle}
        </p>
      </div>

      {/* Action */}
      <div className="relative z-10 mt-6">
        {isUnlocked ? (
          !addr ? (
            <button
              className="border border-[#91897C]/50 px-4 py-2 sm:px-6 sm:py-3 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#91897C] opacity-60 cursor-not-allowed touch-manipulation"
              disabled
              type="button"
            >
              Connect Wallet
            </button>
          ) : (
            <button
              className={`px-4 py-2 sm:px-6 sm:py-3 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#241F19] transition hover:opacity-75 touch-manipulation ${area.id === "islandDAO" ? "bg-[#9945FF]" : "bg-[#EEF083]"}`}
              onClick={() => onEnter(area)}
              type="button"
            >
              Enter
            </button>
          )
        ) : isBsolGate ? (
          <Link
            href="/saura"
            className="inline-block border border-[#9945FF]/50 bg-[#9945FF]/5 px-4 py-2 sm:px-6 sm:py-3 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#9945FF] transition hover:bg-[#9945FF]/15 touch-manipulation"
          >
            Get bSOL to Enter
          </Link>
        ) : (
          <button
            className="border border-[#91897C]/50 px-4 py-2 sm:px-6 sm:py-3 font-mono text-[10px] sm:text-xs font-black uppercase tracking-widest transition disabled:opacity-25 touch-manipulation"
            style={{ color: canAfford ? "#EEF083" : "#91897C" }}
            disabled={!addr || !canAfford}
            onClick={() => onUnlock(area)}
            type="button"
          >
            {!addr
              ? "Connect Wallet"
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

  const [aura,        setAura]        = useState(0);
  const [rev,         setRev]         = useState(0);
  const [bsolHolder,  setBsolHolder]  = useState(false);

  useEffect(() => {
    if (!addr) return;
    setAura(Number(localStorage.getItem(AURA_KEY(addr)) ?? "0") || 0);
    void hasBsol(addr).then(setBsolHolder);
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

      <main className="px-4 py-10 sm:px-8">

        {/* Wallet gate banner */}
        {!addr && (
          <div className="mb-6 flex items-center justify-between gap-4 border border-[#EEF083]/30 bg-[#EEF083]/5 px-5 py-4">
            <div>
              <p className="font-black uppercase text-sm text-[#EEF083]">Connect your wallet to play</p>
              <p className="font-mono text-xs text-[#91897C] mt-0.5">You need a Solana wallet to enter any area.</p>
            </div>
            <div className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[#91897C]">
              Use Connect in the nav
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Proof of Alpha</p>
            <h1 className="mt-1 text-5xl font-black uppercase sm:text-6xl">Select Area</h1>
            <p className="mt-2 font-mono text-sm text-[#91897C]">7 areas. 4 open. 2 locked. 1 bSOL exclusive.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {bsolHolder && (
              <div className="border border-[#9945FF]/50 bg-[#9945FF]/10 px-3 py-2.5 text-right">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9945FF]">bSOL Holder</p>
                <p className="mt-0.5 font-mono text-xs font-black text-[#9945FF]">Vault + islandDAO unlocked</p>
              </div>
            )}
            {addr && (
              <div className="border border-[#91897C]/30 px-4 py-2.5 text-right">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#91897C]">Your AURA</p>
                <p className="mt-0.5 font-mono text-2xl font-black leading-none text-[#EEF083]">{aura}</p>
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-3">
          {AREAS.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              aura={aura}
              addr={addr}
              bsolHolder={bsolHolder}
              onEnter={handleEnter}
              onUnlock={handleUnlock}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-5 font-mono text-xs uppercase tracking-[0.14em] text-[#91897C]">
          <span><span className="text-[#EEF083]">■</span> Warm — easy approach</span>
          <span><span className="text-[#EEF083]">■</span> Cold — selective</span>
          <span><span className="text-[#91897C]">■</span> Icy — elite only</span>
          <span><span className="text-[#9945FF]">■</span> DAO — bSOL holders only</span>
        </div>

      </main>
    </div>
  );
}
