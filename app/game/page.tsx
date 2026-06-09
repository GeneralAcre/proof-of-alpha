"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank } from "../lib/archetypes";

/* ─── Types & Constants ─────────────────────────────── */

const MOVES = [
  { id: "tax",     name: "Tax",     cost: 5,  desc: "Take 5 from target — reflected by Counter"     },
  { id: "steal",   name: "Steal",   cost: 10, desc: "Take 10 from target — reflected by Counter"    },
  { id: "rob",     name: "Rob",     cost: 20, desc: "Take 20 from target — reflected by Counter"    },
  { id: "bluff",   name: "Bluff",   cost: 0,  desc: "Fake aggression — wastes opponent's Counter"   },
  { id: "counter", name: "Counter", cost: 5,  desc: "Reflect incoming Tax/Steal/Rob. Costs 5 if no attacker" },
  { id: "nuke",    name: "NUKE",    cost: 30, desc: "Eliminate target if their balance ≤ 30"        },
  { id: "fold",    name: "Fold",    cost: 0,  desc: "Skip round — protect your $TEST"               },
] as const;

type MoveId = (typeof MOVES)[number]["id"];

const MODIFIERS = ["Standard", "Greed Mode", "Chaos Mode", "Scarcity", "Final Stand"] as const;
type Modifier = (typeof MODIFIERS)[number];

const BOT_NAMES  = ["Beta",  "Gamma", "Delta", "Omega", "Sigma"] as const;
const BOT_INITS  = ["BT",    "GM",    "DL",    "OM",    "SG"]    as const;
const BOT_ADDRS  = ["7xKm",  "B2Qs",  "Vn4L",  "P8Hj",  "F3Dz"] as const;

type Phase = "select" | "locked" | "reveal" | "round_end";

type PlayerState = {
  id: string;
  addr: string;
  archetype: string;
  initials: string;
  balance: number;
  rank: string;
  roundWins: number;
  isYou: boolean;
  isEliminated: boolean;
  revealedMove: MoveId | null;
  revealedTarget: string | null;
  balanceDelta: number;
};

type Decision = { moveId: MoveId; targetId: string };

/* ─── Move Resolution Engine ─────────────────────────── */

function resolveMoves(
  players: PlayerState[],
  decisions: Record<string, Decision>,
  modifier: Modifier,
): PlayerState[] {
  const deltas: Record<string, number> = {};
  const nukeElim = new Set<string>();

  for (const p of players) deltas[p.id] = 0;

  const greed = modifier === "Greed Mode" ? 2 : 1;

  function isCountering(defenderId: string, attackerId: string): boolean {
    const d = decisions[defenderId];
    return !!d && d.moveId === "counter" && d.targetId === attackerId;
  }

  // Resolve Tax / Steal / Rob
  for (const [actorId, { moveId, targetId }] of Object.entries(decisions)) {
    if (!["tax", "steal", "rob"].includes(moveId)) continue;
    const actor  = players.find((p) => p.id === actorId);
    const target = players.find((p) => p.id === targetId);
    if (!actor || !target || actor.isEliminated || target.isEliminated) continue;

    const base: Record<string, number> = { tax: 5, steal: 10, rob: 20 };
    const amount = (base[moveId] ?? 0) * greed;
    const countered = isCountering(targetId, actorId);

    if (countered) {
      deltas[actorId]  -= amount;
      deltas[targetId] += amount;
    } else {
      deltas[actorId]  += amount;
      deltas[targetId] -= amount;
    }
  }

  // Counter penalty — fired counter but nobody attacked with tax/steal/rob
  for (const [actorId, { moveId }] of Object.entries(decisions)) {
    if (moveId !== "counter") continue;
    const wasAttacked = Object.entries(decisions).some(
      ([oid, { moveId: om, targetId: ot }]) =>
        oid !== actorId && ot === actorId && ["tax", "steal", "rob"].includes(om),
    );
    if (!wasAttacked) deltas[actorId] -= 5;
  }

  // Resolve NUKE
  for (const [actorId, { moveId, targetId }] of Object.entries(decisions)) {
    if (moveId !== "nuke") continue;
    const actor  = players.find((p) => p.id === actorId);
    const target = players.find((p) => p.id === targetId);
    if (!actor || !target || actor.isEliminated) continue;
    deltas[actorId] -= 30;
    const targetFinal = target.balance + deltas[targetId];
    if (targetFinal <= 30) nukeElim.add(targetId);
  }

  return players.map((p) => {
    const delta      = deltas[p.id] ?? 0;
    const newBal     = Math.max(0, p.balance + delta);
    const brokeOut   = !p.isYou && newBal <= 0;
    const nuked      = nukeElim.has(p.id);
    return {
      ...p,
      revealedMove:   decisions[p.id]?.moveId   ?? "fold",
      revealedTarget: decisions[p.id]?.targetId ?? null,
      balanceDelta:   delta,
      balance:        newBal,
      isEliminated:   p.isEliminated || brokeOut || nuked,
    };
  });
}

/* ─── Bot AI ─────────────────────────────────────────── */

function botDecide(bot: PlayerState, allPlayers: PlayerState[], modifier: Modifier): Decision {
  const alive = allPlayers.filter((p) => !p.isEliminated && p.id !== bot.id);
  if (alive.length === 0) return { moveId: "fold", targetId: bot.id };

  // Prefer highest-balance target
  const richest = alive.reduce((best, p) => (p.balance > best.balance ? p : best), alive[0]);

  const forbidden = new Set<MoveId>();
  if (modifier === "Scarcity") { forbidden.add("rob"); forbidden.add("nuke"); }

  const can = (m: (typeof MOVES)[number]) => bot.balance >= m.cost && !forbidden.has(m.id);

  let pool: MoveId[] = [];
  if (bot.balance > 70) {
    if (can(MOVES[2])) pool.push("rob",  "rob",  "rob");
    if (can(MOVES[1])) pool.push("steal","steal","steal");
    if (can(MOVES[0])) pool.push("tax",  "tax");
    pool.push("bluff");
  } else if (bot.balance > 40) {
    if (can(MOVES[1])) pool.push("steal","steal","steal");
    if (can(MOVES[0])) pool.push("tax",  "tax",  "tax");
    pool.push("counter", "counter", "bluff");
  } else {
    pool.push("fold", "fold", "fold", "counter", "counter", "bluff");
    if (can(MOVES[0])) pool.push("tax");
  }

  const moveId: MoveId = pool[Math.floor(Math.random() * pool.length)] ?? "fold";

  // Counter targets someone aggressive (highest balance = most likely to attack)
  const counterTarget = alive.find((p) => !p.isYou) ?? alive[0];
  const finalTarget   = moveId === "counter" ? counterTarget : richest;

  return { moveId, targetId: finalTarget.id };
}

/* ─── Sub-components ─────────────────────────────────── */

function TestBar({ value, delta }: { value: number; delta: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-1 h-1.5 w-full border border-[#91897C] bg-[#241F19]">
      <div
        className={`h-full transition-all duration-700 ${delta < 0 ? "bg-[#ffb1a1]" : "bg-[#EEF083]"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PlayerSlot({
  player, isTargeted, onTarget, phase,
}: {
  player: PlayerState;
  isTargeted: boolean;
  onTarget: () => void;
  phase: Phase;
}) {
  return (
    <button
      className={`relative border p-3 text-left transition ${
        player.isYou
          ? "border-[#EEF083] bg-[#EEF083]/10"
          : player.isEliminated
          ? "cursor-default border-[#91897C]/30 bg-[#241F19] opacity-40"
          : isTargeted
          ? "border-[#EEF083] bg-[#EEF083]/15 shadow-[0_0_0_2px_#EEF083]"
          : "border-[#91897C] bg-[#2f2922] hover:border-[#EEF083]/60"
      }`}
      disabled={player.isYou || player.isEliminated || phase !== "select"}
      onClick={onTarget}
      type="button"
    >
      <div
        className={`mb-2 flex h-10 w-10 items-center justify-center border font-mono text-sm font-black ${
          player.isYou
            ? "border-[#EEF083] bg-[#EEF083] text-[#241F19]"
            : "border-[#91897C] bg-[#241F19]/80 text-[#EEF083]"
        }`}
      >
        {player.initials}
      </div>

      <p className="truncate font-mono text-xs font-black text-[#EEF083]">
        {player.addr}
        {player.isYou && <span className="ml-1 text-[#91897C]">(you)</span>}
      </p>
      <p className="text-[10px] text-[#91897C]">{player.archetype}</p>

      <div className="mt-1.5 flex items-center justify-between">
        <span
          className={`font-mono text-xs font-black ${
            phase === "reveal" && player.balanceDelta > 0
              ? "text-[#a8e6a3]"
              : phase === "reveal" && player.balanceDelta < 0
              ? "text-[#ffb1a1]"
              : "text-[#EEF083]"
          }`}
        >
          {player.balance} $TEST
          {phase === "reveal" && player.balanceDelta !== 0 && (
            <span> ({player.balanceDelta > 0 ? "+" : ""}{player.balanceDelta})</span>
          )}
        </span>
        <span className="border border-[#91897C] px-1 font-mono text-[9px] uppercase text-[#91897C]">
          {player.rank}
        </span>
      </div>
      <TestBar value={player.balance} delta={player.balanceDelta} />

      <div className="mt-1.5 flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 border ${
              i < player.roundWins ? "border-[#EEF083] bg-[#EEF083]" : "border-[#91897C]"
            }`}
          />
        ))}
      </div>

      {phase === "reveal" && player.revealedMove && !player.isEliminated && (
        <div className="flip-in mt-2 border border-[#EEF083] bg-[#EEF083]/10 px-2 py-1 font-mono text-xs uppercase text-[#EEF083]">
          {player.revealedMove}
        </div>
      )}

      {(phase === "locked" || phase === "reveal") && player.isYou && player.revealedMove === null && (
        <div className="mt-2 border border-[#91897C] px-2 py-1 font-mono text-[10px] uppercase text-[#91897C]">
          locked
        </div>
      )}

      {phase === "locked" && !player.isYou && !player.isEliminated && (
        <div className="mt-2 border border-[#91897C] px-2 py-1 font-mono text-[10px] uppercase text-[#91897C]">
          locked
        </div>
      )}

      {player.isEliminated && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="stamp-in border-2 border-[#ffb1a1] bg-[#241F19]/90 px-2 py-0.5 font-mono text-xs font-black uppercase text-[#ffb1a1]">
            IT&apos;S JOEVER
          </p>
        </div>
      )}

      {isTargeted && !player.isEliminated && phase === "select" && (
        <div className="absolute right-2 top-2 font-mono text-[10px] uppercase text-[#EEF083]">
          TARGET
        </div>
      )}
    </button>
  );
}

/* ─── Main page ──────────────────────────────────────── */

function GameContent() {
  const params             = useSearchParams();
  const router             = useRouter();
  const { truncatedAddress } = useWallet();

  const archetypeId  = params.get("archetype") ?? "npc";
  const mode         = params.get("mode")      ?? "multiplayer";
  const roundParam   = Number(params.get("round") ?? 1);
  const myArchetype  = ARCHETYPES.find((a) => a.id === archetypeId) ?? ARCHETYPES[0];
  const modifierRef  = useRef<Modifier>(MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]);
  const modifier     = modifierRef.current;

  const [round,       setRound]      = useState(roundParam);
  const [phase,       setPhase]      = useState<Phase>("select");
  const [timer,       setTimer]      = useState(10);
  const [move,        setMove]       = useState<MoveId | null>(null);
  const [targetId,    setTargetId]   = useState<string | null>(null);
  const [elimBanners, setElimBanners] = useState<string[]>([]);
  const [history,     setHistory]    = useState<string[]>([]);

  const initPlayers = useCallback((): PlayerState[] => {
    if (roundParam > 1) {
      try {
        const saved = sessionStorage.getItem("poa_game_state");
        if (saved) {
          const state = JSON.parse(saved) as {
            players: Array<{
              id: string; addr: string; arch: string; initials: string;
              balance: number; roundWins: number; alive: boolean;
            }>;
          };
          return state.players.map((p) => ({
            id: p.id, addr: p.addr, archetype: p.arch, initials: p.initials,
            balance: p.balance, rank: getCurrentRank(0).name,
            roundWins: p.roundWins, isYou: p.id === "you",
            isEliminated: !p.alive,
            revealedMove: null, revealedTarget: null, balanceDelta: 0,
          }));
        }
      } catch {}
    }
    return [
      {
        id: "you", addr: truncatedAddress ?? "You",
        archetype: myArchetype.name, initials: myArchetype.initials,
        balance: 100, rank: getCurrentRank(0).name,
        roundWins: 0, isYou: true, isEliminated: false,
        revealedMove: null, revealedTarget: null, balanceDelta: 0,
      },
      ...BOT_NAMES.map((arch, i) => ({
        id: `bot${i}`, addr: `Bot_${BOT_ADDRS[i]}`, archetype: arch,
        initials: BOT_INITS[i], balance: 100,
        rank: (["NPC","Beta","Alpha","Beta","Sigma"] as const)[i],
        roundWins: 0, isYou: false, isEliminated: false,
        revealedMove: null, revealedTarget: null, balanceDelta: 0,
      })),
    ];
  }, [myArchetype, truncatedAddress, roundParam]);

  const [players, setPlayers] = useState<PlayerState[]>(initPlayers);

  const myPlayer    = players.find((p) => p.isYou)!;
  const myEliminated = myPlayer?.isEliminated ?? false;

  /* ── Timer countdown (multiplayer only) ── */
  useEffect(() => {
    if (phase !== "select") return;

    // Auto-proceed if player is already eliminated
    if (myEliminated) {
      setPhase("locked");
      return;
    }

    // Solo: no timer — player confirms when ready
    if (mode === "solo") return;

    if (timer <= 0) {
      const autoMove: MoveId = move ?? "fold";
      const fallbackTarget   = players.find((p) => !p.isYou && !p.isEliminated)?.id ?? `bot0`;
      if (!move)     setMove(autoMove);
      if (!targetId) setTargetId(fallbackTarget);
      setPhase("locked");
      return;
    }

    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timer]);

  /* ── Bot resolution + reveal ── */
  useEffect(() => {
    if (phase !== "locked") return;

    // Collect all decisions
    const decisions: Record<string, Decision> = {};

    const playerMove     = move     ?? "fold";
    const fallbackTarget = players.find((p) => !p.isYou && !p.isEliminated)?.id ?? "bot0";
    const playerTarget   = targetId ?? fallbackTarget;
    decisions["you"] = { moveId: playerMove, targetId: playerTarget };

    const aliveIds = players.filter((p) => !p.isEliminated).map((p) => p.id);

    for (const bot of players.filter((p) => !p.isYou && !p.isEliminated)) {
      const d = botDecide(bot, players, modifier);
      if (modifier === "Chaos Mode") {
        const others = aliveIds.filter((id) => id !== bot.id);
        d.targetId = others[Math.floor(Math.random() * others.length)] ?? bot.id;
      }
      decisions[bot.id] = d;
    }

    let innerTimer: ReturnType<typeof setTimeout>;

    const outerTimer = setTimeout(() => {
      const resolved = resolveMoves(players, decisions, modifier);
      setPlayers(resolved);
      setPhase("reveal");

      // Build round log entries
      const entries: string[] = [`── Round ${round} ──`];
      for (const p of resolved) {
        const d = decisions[p.id];
        if (!d) continue;
        const tgt = resolved.find((t) => t.id === d.targetId)?.addr ?? "?";
        const deltaStr = p.balanceDelta !== 0
          ? ` (${p.balanceDelta > 0 ? "+" : ""}${p.balanceDelta})`
          : "";
        entries.push(`${p.isYou ? "You" : p.addr} → ${d.moveId.toUpperCase()} ${d.moveId !== "fold" && d.moveId !== "bluff" ? `→ ${tgt}` : ""}${deltaStr}`);
      }
      setHistory((h) => [...entries, ...h].slice(0, 30));

      // Elimination banners (auto-dismiss after 3s)
      const newElims = resolved
        .filter((p) => p.isEliminated && !players.find((old) => old.id === p.id)?.isEliminated)
        .map((p) => p.addr);
      if (newElims.length > 0) {
        setElimBanners(newElims);
        setTimeout(() => setElimBanners([]), 3000);
      }

      innerTimer = setTimeout(() => setPhase("round_end"), 3200);
    }, 1200);

    return () => {
      clearTimeout(outerTimer);
      clearTimeout(innerTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleConfirm() {
    if (!move || !targetId) return;
    setPhase("locked");
  }

  function nextRound() {
    const aliveNow = players.filter((p) => !p.isEliminated);

    // Round winner: highest positive balance delta among alive players
    let roundWinnerId: string | null = null;
    if (aliveNow.length > 0) {
      const best = aliveNow.reduce(
        (b, p) => (p.balanceDelta > b.balanceDelta ? p : b),
        aliveNow[0],
      );
      if (best.balanceDelta > 0) roundWinnerId = best.id;
    }

    const updated = players.map((p) => ({
      ...p,
      roundWins:     p.id === roundWinnerId ? p.roundWins + 1 : p.roundWins,
      revealedMove:  null as null,
      revealedTarget: null as null,
      balanceDelta:  0,
    }));

    const stillAlive  = updated.filter((p) => !p.isEliminated);
    const matchWinner = updated.find((p) => p.roundWins >= 5);
    const matchOver   = !!matchWinner || stillAlive.length <= 1;

    sessionStorage.setItem(
      "poa_game_state",
      JSON.stringify({
        round,
        players: updated.map((p) => ({
          id: p.id, addr: p.addr, arch: p.archetype, initials: p.initials,
          balance: p.balance, roundWins: p.roundWins, alive: !p.isEliminated,
        })),
      }),
    );

    if (matchOver) {
      const won    = matchWinner?.isYou ?? (stillAlive.length === 1 && !!stillAlive[0]?.isYou);
      const elims  = updated.filter((p) => !p.isYou && p.isEliminated).length;
      let earned   = won ? 50 : -12;
      earned      += elims * 8;
      if (won)          earned += 10;
      if (mode === "solo") earned -= 5;
      router.push(`/end?won=${won}&archetype=${archetypeId}&earned=${earned}&elims=${elims}&mode=${mode}`);
      return;
    }

    router.push(`/locker-room?round=${round}&archetype=${archetypeId}&mode=${mode}`);
  }

  const activePlayers = players.filter((p) => !p.isEliminated);
  const myWins        = myPlayer?.roundWins ?? 0;
  const topBotWins    = Math.max(0, ...players.filter((p) => !p.isYou).map((p) => p.roundWins));
  const score         = `${myWins} — ${topBotWins}`;

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">

      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[#91897C] bg-[#241F19] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs font-black uppercase tracking-[0.16em] text-[#91897C]">
            Round {round}
          </span>
          <span className="border border-[#EEF083] bg-[#EEF083]/10 px-2 py-0.5 font-mono text-xs uppercase text-[#EEF083]">
            {modifier}
          </span>
          <span className="hidden font-mono text-xs text-[#91897C] sm:block">
            {modifier === "Greed Mode"  && "All gains ×2"}
            {modifier === "Chaos Mode"  && "Targets randomised"}
            {modifier === "Scarcity"    && "No Rob or NUKE"}
            {modifier === "Final Stand" && "Eliminated can last-bet"}
            {modifier === "Standard"    && "Normal rules"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-lg font-black text-[#EEF083]">{score}</span>
          {mode !== "solo" && (
            <div
              className={`flex h-9 w-9 items-center justify-center border font-mono text-xl font-black transition ${
                phase === "select" && timer <= 3
                  ? "animate-pulse border-[#ff8080] text-[#ff8080]"
                  : "border-[#91897C] text-[#EEF083]"
              }`}
            >
              {phase === "select" ? String(timer).padStart(2, "0") : "—"}
            </div>
          )}
          <Link
            className="border border-[#91897C] px-3 py-1.5 font-mono text-xs uppercase text-[#91897C] transition hover:text-[#EEF083]"
            href="/dashboard"
          >
            Exit
          </Link>
        </div>
      </div>

      {/* ── ELIMINATION BANNERS ── */}
      {elimBanners.map((addr) => (
        <div
          key={addr}
          className="fixed inset-x-0 top-14 z-30 mx-auto max-w-lg border-2 border-[#ffb1a1] bg-[#241F19] px-6 py-4 text-center shadow-[8px_8px_0_#ffb1a1]"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Elimination</p>
          <p className="mt-1 text-2xl font-black uppercase text-[#ffb1a1]">
            IT&apos;S JOEVER FOR {addr}
          </p>
          <p className="mt-0.5 font-mono text-xs text-[#91897C]">Balance hit zero</p>
        </div>
      ))}

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_260px]">

        {/* ── LEFT: ARENA + MOVE PANEL ── */}
        <div className="space-y-4">

          {/* ARENA */}
          <section>
            <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
              Arena — {activePlayers.length} active
            </p>
            <div className="grid grid-cols-3 gap-3">
              {players.map((p) => (
                <PlayerSlot
                  key={p.id}
                  isTargeted={targetId === p.id}
                  onTarget={() => {
                    if (!p.isYou && !p.isEliminated && phase === "select" && !myEliminated)
                      setTargetId(p.id);
                  }}
                  phase={phase}
                  player={p}
                />
              ))}
            </div>

            {phase === "select" && !myEliminated && (
              <p className="mt-2 font-mono text-xs text-[#91897C]">
                {targetId
                  ? `Target: ${players.find((p) => p.id === targetId)?.addr} — pick a move below`
                  : "Click a player to target, then pick your move"}
              </p>
            )}
          </section>

          {/* MOVE PANEL */}
          <section className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
            <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
              {myEliminated
                ? "Eliminated — spectating"
                : phase === "select"
                ? "Choose Move"
                : phase === "locked"
                ? "Locked — bots deciding..."
                : phase === "reveal"
                ? "Reveal"
                : "Round Over"}
            </p>

            {myEliminated ? (
              <p className="text-sm text-[#91897C]">
                You have been eliminated. Watch the remaining players finish.
              </p>

            ) : (phase === "select" || phase === "locked") ? (
              <>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                  {MOVES.map((m) => {
                    const blocked    = modifier === "Scarcity" && (m.id === "rob" || m.id === "nuke");
                    const canAfford  = myPlayer.balance >= m.cost && !blocked;
                    const isSelected = move === m.id;
                    return (
                      <button
                        key={m.id}
                        className={`border p-2 text-left text-xs transition ${
                          !canAfford
                            ? "cursor-not-allowed border-[#91897C]/30 opacity-30"
                            : isSelected
                            ? "border-[#EEF083] bg-[#EEF083] text-[#241F19] shadow-[3px_3px_0_#91897C]"
                            : "border-[#91897C] bg-[#241F19] text-[#EEF083] hover:border-[#EEF083]"
                        }`}
                        disabled={!canAfford || phase !== "select"}
                        onClick={() => setMove(m.id)}
                        title={m.desc}
                        type="button"
                      >
                        <p className="font-black uppercase">{m.name}</p>
                        <p className={`mt-0.5 font-mono text-[10px] ${isSelected ? "text-[#241F19]/70" : "text-[#91897C]"}`}>
                          {m.cost === 0 ? "Free" : `${m.cost} $T`}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    className="border-2 border-[#EEF083] bg-[#EEF083] px-6 py-2.5 font-black uppercase text-[#241F19] shadow-[4px_4px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] disabled:cursor-not-allowed disabled:border-[#91897C] disabled:bg-transparent disabled:text-[#91897C] disabled:shadow-none"
                    disabled={!move || !targetId || phase !== "select"}
                    onClick={handleConfirm}
                    type="button"
                  >
                    {phase === "locked" ? "Locked In" : "Confirm Move"}
                  </button>

                  {phase === "select" && move && targetId && (
                    <span className="font-mono text-xs text-[#91897C]">
                      {move.toUpperCase()} on {players.find((p) => p.id === targetId)?.addr}
                    </span>
                  )}
                  {phase === "select" && (!move || !targetId) && (
                    <span className="font-mono text-xs text-[#91897C]">
                      {!targetId ? "Pick a target first" : "Pick a move"}
                      {mode !== "solo" && " — auto-folds at 0"}
                    </span>
                  )}
                </div>
              </>

            ) : phase === "reveal" ? (
              <div className="space-y-2">
                {players.filter((p) => !p.isEliminated || p.revealedMove).map((p) => {
                  const tgt = players.find((t) => t.id === p.revealedTarget);
                  return (
                    <div key={p.id} className="flex items-center gap-3 font-mono text-xs">
                      <span className={`w-16 truncate font-black ${p.isYou ? "text-[#EEF083]" : "text-[#d8d4a1]"}`}>
                        {p.isYou ? "You" : p.addr.slice(0, 8)}
                      </span>
                      <span className="border border-[#EEF083] bg-[#EEF083]/10 px-2 py-0.5 uppercase text-[#EEF083]">
                        {p.revealedMove ?? "—"}
                      </span>
                      {tgt && p.revealedMove !== "fold" && p.revealedMove !== "bluff" && (
                        <span className="text-[#91897C]">→ {tgt.isYou ? "you" : tgt.addr.slice(0, 8)}</span>
                      )}
                      {p.balanceDelta !== 0 && (
                        <span className={p.balanceDelta > 0 ? "text-[#a8e6a3]" : "text-[#ffb1a1]"}>
                          {p.balanceDelta > 0 ? "+" : ""}{p.balanceDelta}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

            ) : phase === "round_end" ? (
              <button
                className="border-2 border-[#EEF083] bg-[#EEF083] px-8 py-3 font-black uppercase text-[#241F19] shadow-[4px_4px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083]"
                onClick={nextRound}
                type="button"
              >
                Next Round →
              </button>
            ) : null}
          </section>
        </div>

        {/* ── SIDE PANEL ── */}
        <div className="space-y-4">

          {/* Live $TEST */}
          <section className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
            <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
              Live $TEST
            </p>
            {players.map((p) => (
              <div key={p.id} className="mb-2.5 last:mb-0">
                <div className="flex justify-between font-mono text-xs">
                  <span className={p.isYou ? "font-black text-[#EEF083]" : "text-[#d8d4a1]"}>
                    {p.isYou ? "You" : p.addr.slice(0, 10)}
                  </span>
                  <span
                    className={
                      p.isEliminated
                        ? "text-[#91897C]/50 line-through"
                        : phase === "reveal" && p.balanceDelta > 0
                        ? "text-[#a8e6a3]"
                        : phase === "reveal" && p.balanceDelta < 0
                        ? "text-[#ffb1a1]"
                        : "text-[#EEF083]"
                    }
                  >
                    {p.balance} $T
                    {phase === "reveal" && p.balanceDelta !== 0 && (
                      <span> ({p.balanceDelta > 0 ? "+" : ""}{p.balanceDelta})</span>
                    )}
                  </span>
                </div>
                <TestBar value={p.balance} delta={p.balanceDelta} />
              </div>
            ))}
          </section>

          {/* Round Log */}
          <section className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
            <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
              Round Log
            </p>
            {history.length === 0 ? (
              <p className="text-xs text-[#91897C]">No moves yet.</p>
            ) : (
              <div className="max-h-52 space-y-0.5 overflow-y-auto">
                {history.map((h, i) => (
                  <p
                    key={i}
                    className={`text-xs leading-5 ${
                      h.startsWith("──")
                        ? "mt-2 font-black uppercase tracking-[0.1em] text-[#EEF083]/40 first:mt-0"
                        : "text-[#d8d4a1]"
                    }`}
                  >
                    {h}
                  </p>
                ))}
              </div>
            )}
          </section>

          {/* Your status */}
          <section
            className={`border p-4 ${
              myEliminated ? "border-[#ffb1a1] bg-[#ffb1a1]/5" : "border-[#EEF083] bg-[#EEF083]/5"
            }`}
          >
            <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
              You
            </p>
            <p className={`text-2xl font-black ${myEliminated ? "text-[#ffb1a1]" : ""}`}>
              {myPlayer?.balance ?? 0} $TEST
            </p>
            {myEliminated && (
              <p className="mt-0.5 font-mono text-xs uppercase text-[#ffb1a1]">Eliminated</p>
            )}
            <p className="mt-0.5 font-mono text-xs text-[#91897C]">{myArchetype.name}</p>
            <div className="mt-2 flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-2 border ${
                    i < (myPlayer?.roundWins ?? 0)
                      ? "border-[#EEF083] bg-[#EEF083]"
                      : "border-[#91897C]"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 font-mono text-xs text-[#91897C]">round wins</p>
          </section>

          {/* Move guide */}
          <section className="border border-[#91897C] bg-[#2f2922] p-4 shadow-[4px_4px_0_#91897C]">
            <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.2em] text-[#91897C]">
              Move Guide
            </p>
            <div className="space-y-1.5">
              {MOVES.map((m) => (
                <div key={m.id} className="flex gap-2 font-mono text-[10px]">
                  <span className="w-12 shrink-0 font-black uppercase text-[#EEF083]">{m.name}</span>
                  <span className="text-[#91897C]">{m.desc}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#241F19]" />}>
      <GameContent />
    </Suspense>
  );
}
