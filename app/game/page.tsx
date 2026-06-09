"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "../components/WalletProvider";
import { ARCHETYPES, getCurrentRank } from "../lib/archetypes";
import { createOnchainGame, commitRoundMoves, revealAndResolve, fetchGameState, type OnchainGame } from "../lib/game-program";
import { MOVE_ID, parseGameRoom } from "../lib/solana-client";
import { sfx, initSounds } from "../lib/sounds";

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

  // CHAOS_MODE: shuffle targets for alive players before resolution
  let effective = { ...decisions };
  if (modifier === "Chaos Mode") {
    const alive = players.filter((p) => !p.isEliminated);
    const ids   = alive.map((p) => p.id);
    // Fisher-Yates shuffle of target ids
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    effective = { ...decisions };
    ids.forEach((id, idx) => {
      if (effective[id]) {
        let tgt = shuffled[idx];
        if (tgt === id) tgt = shuffled[(idx + 1) % ids.length];
        effective[id] = { ...effective[id], targetId: tgt };
      }
    });
  }

  function isCountering(defenderId: string, attackerId: string): boolean {
    const d = effective[defenderId];
    return !!d && d.moveId === "counter" && d.targetId === attackerId;
  }

  // Tax / Steal / Rob
  for (const [actorId, { moveId, targetId }] of Object.entries(effective)) {
    if (!["tax", "steal", "rob"].includes(moveId)) continue;
    const actor  = players.find((p) => p.id === actorId);
    const target = players.find((p) => p.id === targetId);
    if (!actor || !target || actor.isEliminated || target.isEliminated) continue;

    const base: Record<string, number> = { tax: 5, steal: 10, rob: 20 };
    const amount   = (base[moveId] ?? 0) * greed;
    const countered = isCountering(targetId, actorId);

    if (countered) {
      deltas[actorId]  -= amount;
      deltas[targetId] += amount;
    } else {
      deltas[actorId]  += amount;
      deltas[targetId] -= amount;
    }
  }

  // Bluff: +5 if target wasted a Counter on the bluffer
  for (const [actorId, { moveId, targetId }] of Object.entries(effective)) {
    if (moveId !== "bluff") continue;
    const actor  = players.find((p) => p.id === actorId);
    const target = players.find((p) => p.id === targetId);
    if (!actor || !target || actor.isEliminated || target.isEliminated) continue;
    if (effective[targetId]?.moveId === "counter" && effective[targetId]?.targetId === actorId) {
      deltas[actorId] += 5;
    }
  }

  // Counter penalty — fired but no attacker came
  for (const [actorId, { moveId }] of Object.entries(effective)) {
    if (moveId !== "counter") continue;
    const wasAttacked = Object.entries(effective).some(
      ([oid, { moveId: om, targetId: ot }]) =>
        oid !== actorId && ot === actorId && ["tax", "steal", "rob"].includes(om),
    );
    if (!wasAttacked) deltas[actorId] -= 5;
  }

  // NUKE
  for (const [actorId, { moveId, targetId }] of Object.entries(effective)) {
    if (moveId !== "nuke") continue;
    const actor  = players.find((p) => p.id === actorId);
    const target = players.find((p) => p.id === targetId);
    if (!actor || !target || actor.isEliminated) continue;
    deltas[actorId] -= 30;
    const targetFinal = target.balance + deltas[targetId];
    if (targetFinal <= 30) nukeElim.add(targetId);
  }

  return players.map((p) => {
    const delta    = deltas[p.id] ?? 0;
    const newBal   = Math.max(0, p.balance + delta);
    const broke    = newBal === 0;
    const nuked    = nukeElim.has(p.id);

    // FINAL_STAND: first time going broke (not nuked, had >1 balance) → survive at 1
    const savedByStand =
      modifier === "Final Stand" && broke && !nuked && p.balance > 1;

    return {
      ...p,
      revealedMove:   effective[p.id]?.moveId   ?? "fold",
      revealedTarget: effective[p.id]?.targetId ?? null,
      balanceDelta:   delta,
      balance:        savedByStand ? 1 : newBal,
      isEliminated:   p.isEliminated || nuked || (broke && !savedByStand),
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

function toOnchainTargetIdx(targetId: string): number {
  if (targetId === "you") return 0;
  const m = targetId.match(/^bot(\d)$/);
  return m ? parseInt(m[1]) + 1 : 0;
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
  const { truncatedAddress, selectedWallet, account } = useWallet();

  const archetypeId  = params.get("archetype") ?? "npc";
  const mode         = params.get("mode")      ?? "multiplayer";
  const roundParam   = Number(params.get("round") ?? 1);
  const myArchetype  = ARCHETYPES.find((a) => a.id === archetypeId) ?? ARCHETYPES[0];
  const modifierRef  = useRef<Modifier>(MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)]);
  const modifier     = modifierRef.current;
  const roomCode     = params.get("room") ?? "POA-SOLO";

  const [round,       setRound]      = useState(roundParam);
  const [phase,       setPhase]      = useState<Phase>("select");
  const [timer,       setTimer]      = useState(10);
  const [move,        setMove]       = useState<MoveId | null>(null);
  const [targetId,    setTargetId]   = useState<string | null>(null);
  const [elimBanners,  setElimBanners]  = useState<string[]>([]);
  const [history,      setHistory]     = useState<string[]>([]);
  const [onchain,      setOnchain]     = useState<OnchainGame | null>(null);
  const [txStatus,     setTxStatus]    = useState<string | null>(null);
  const [onchainError, setOnchainError] = useState<string | null>(null);

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

  useEffect(() => { initSounds(); }, []);

  /* ── On-chain game setup ── */
  useEffect(() => {
    if (!selectedWallet || !account) return;
    if (round > 1) {
      const savedPda = sessionStorage.getItem("poa_onchain_pda");
      if (savedPda) {
        setOnchain({ gamePDA: new PublicKey(savedPda), roomCode, pendingSalts: new Map() });
      }
      return;
    }
    const modifierNum = Array.from(MODIFIERS).indexOf(modifier);
    setTxStatus("Creating game on-chain…");
    createOnchainGame(selectedWallet, account, roomCode, modifierNum, archetypeId)
      .then((og) => {
        setOnchain(og);
        sessionStorage.setItem("poa_onchain_pda", og.gamePDA.toBase58());
        setTxStatus(null);
      })
      .catch((err) => {
        console.warn("[PoA] on-chain game creation failed:", err);
        setTxStatus(null);
        setOnchainError("Game setup failed — playing offline. Sigma points still count.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // On-chain: fire commit → reveal pipeline in background (doesn't block UI)
    let cancelled = false;
    if (onchain && selectedWallet && account) {
      const playerMoveNum = MOVE_ID[playerMove] ?? 6;
      const playerTargNum = toOnchainTargetIdx(playerTarget);
      const onchainBots   = BOT_NAMES.map((_, i) => {
        const d = decisions[`bot${i}`] as Decision | undefined;
        return { moveId: MOVE_ID[d?.moveId ?? "fold"] ?? 6, targetIdx: toOnchainTargetIdx(d?.targetId ?? "bot0") };
      });
      void (async () => {
        try {
          if (!cancelled) setTxStatus("Committing moves…");
          const salts = await commitRoundMoves(
            selectedWallet, account, onchain, playerMoveNum, playerTargNum, onchainBots,
          );
          if (cancelled) return;
          setTxStatus("Revealing on-chain…");
          await revealAndResolve(
            selectedWallet, account, onchain, playerMoveNum, playerTargNum, onchainBots, salts,
          );
          if (cancelled) return;

          // Sync balances from chain — makes on-chain state authoritative
          const raw = await fetchGameState(onchain.gamePDA);
          if (raw && !cancelled) {
            const chainState = parseGameRoom(raw);
            setPlayers((prev) =>
              prev.map((p) => {
                // player is index 0; bots are 1-5
                const chainIdx = p.isYou ? 0 : (parseInt(p.id.replace("bot", "")) + 1);
                const cp = chainState.players[chainIdx];
                if (!cp) return p;
                return {
                  ...p,
                  balance: cp.balance,
                  roundWins: cp.roundWins,
                  isEliminated: cp.isEliminated,
                };
              }),
            );
          }
          if (!cancelled) setTxStatus(null);
        } catch (err) {
          console.warn("[PoA] on-chain round failed:", err);
          if (!cancelled) {
            setTxStatus(null);
            setOnchainError("Round tx failed — result recorded locally only.");
          }
        }
      })();
    }

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
        sfx.elimination();
      }
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(outerTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ── reveal → round_end auto-advance (separate effect to avoid cleanup race) ── */
  useEffect(() => {
    if (phase !== "reveal") return;
    const id = setTimeout(() => setPhase("round_end"), 3200);
    return () => clearTimeout(id);
  }, [phase]);

  function handleConfirm() {
    if (!move || !targetId) return;
    sfx.moveConfirm();
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
      won ? sfx.matchWin() : sfx.matchLoss();
      router.push(`/end?won=${won}&archetype=${archetypeId}&earned=${earned}&elims=${elims}&mode=${mode}`);
      return;
    }

    sfx.roundWin();
    router.push(`/locker-room?round=${round}&archetype=${archetypeId}&mode=${mode}`);
  }

  const activePlayers = players.filter((p) => !p.isEliminated);
  const myWins        = myPlayer?.roundWins ?? 0;
  const topBotWins    = Math.max(0, ...players.filter((p) => !p.isYou).map((p) => p.roundWins));
  const score         = `${myWins} — ${topBotWins}`;

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">

      {/* ── ON-CHAIN ERROR BANNER ── */}
      {onchainError && (
        <div className="flex items-center justify-between gap-3 bg-[#3a1a1a] px-4 py-2 text-[#ffb1a1]">
          <p className="font-mono text-[11px]">{onchainError}</p>
          <button
            className="shrink-0 font-mono text-[11px] uppercase hover:text-white"
            onClick={() => setOnchainError(null)}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── TX STATUS (mobile-visible) ── */}
      {txStatus && (
        <div className="bg-[#241F19] px-4 py-1.5 text-center">
          <p className="animate-pulse font-mono text-[10px] uppercase tracking-widest text-[#91897C]">
            {txStatus}
          </p>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[#91897C] bg-[#241F19] px-4 py-3">
        {/* Left: round + modifier */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 font-mono text-xs font-bold uppercase text-[#91897C]">R{round}</span>
          <span className="border border-[#EEF083]/60 px-2 py-0.5 font-mono text-[10px] uppercase text-[#EEF083] truncate">
            {modifier}
          </span>
        </div>

        {/* Center: your balance + round wins */}
        <div className="flex flex-col items-center">
          <span className={`font-mono text-sm font-bold leading-none ${myEliminated ? "text-[#ffb1a1]" : "text-[#EEF083]"}`}>
            {myPlayer?.balance ?? 0} $T
          </span>
          <div className="mt-1 flex gap-0.5">
            {[0,1,2,3,4].map((i) => (
              <div key={i} className={`h-1 w-1 border ${i < myWins ? "border-[#EEF083] bg-[#EEF083]" : "border-[#91897C]"}`} />
            ))}
          </div>
        </div>

        {/* Right: timer + exit */}
        <div className="flex items-center gap-2">
          {mode !== "solo" && (
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-sm font-bold transition ${
              phase === "select" && timer <= 3 ? "animate-pulse border-[#ff8080] text-[#ff8080]" : "border-[#91897C] text-[#EEF083]"
            }`}>
              {phase === "select" ? String(timer).padStart(2,"0") : "—"}
            </div>
          )}
          <Link className="border border-[#91897C] px-2.5 py-1.5 font-mono text-[10px] uppercase text-[#91897C] transition hover:text-[#EEF083]" href="/mode-select">
            Exit
          </Link>
        </div>
      </div>

      {/* ── ELIMINATION BANNERS ── */}
      {elimBanners.map((addr) => (
        <div key={addr} className="fixed inset-x-0 top-14 z-30 mx-4 border-2 border-[#ffb1a1] bg-[#241F19] px-5 py-3 text-center shadow-[6px_6px_0_#ffb1a1]">
          <p className="text-lg font-black uppercase text-[#ffb1a1]">IT&apos;S JOEVER FOR {addr}</p>
        </div>
      ))}

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4">

        {/* ── ARENA ── */}
        <section>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#91897C]">
            {activePlayers.length} / 6 active — {phase === "select" && !myEliminated ? (targetId ? `targeting ${players.find(p=>p.id===targetId)?.addr}` : "tap a player to target") : phase === "locked" ? "bots deciding…" : phase === "reveal" ? "moves revealed" : "round over"}
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
        </section>

        {/* ── ACTION PANEL ── */}
        <section className="border border-[#91897C] bg-[#2f2922] p-4">

          {myEliminated ? (
            <p className="text-sm text-[#91897C]">You&apos;ve been eliminated. Spectating.</p>

          ) : (phase === "select" || phase === "locked") ? (
            <>
              <div className="grid grid-cols-4 gap-2">
                {MOVES.map((m) => {
                  const blocked   = modifier === "Scarcity" && (m.id === "rob" || m.id === "nuke");
                  const canAfford = myPlayer.balance >= m.cost && !blocked;
                  const selected  = move === m.id;
                  return (
                    <button
                      key={m.id}
                      className={`border py-3 text-center transition touch-manipulation ${
                        !canAfford
                          ? "cursor-not-allowed border-[#91897C]/30 opacity-30"
                          : selected
                          ? "border-[#EEF083] bg-[#EEF083] text-[#241F19]"
                          : "border-[#91897C] hover:border-[#EEF083]"
                      }`}
                      disabled={!canAfford || phase !== "select"}
                      onClick={() => { sfx.moveSelect(); setMove(m.id); }}
                      title={m.desc}
                      type="button"
                    >
                      <p className="text-xs font-bold uppercase">{m.name}</p>
                      <p className={`mt-0.5 font-mono text-[10px] ${selected ? "text-[#241F19]/60" : "text-[#91897C]"}`}>
                        {m.cost === 0 ? "Free" : `${m.cost} $T`}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <button
                  className="border-2 border-[#EEF083] bg-[#EEF083] px-6 py-3 text-sm font-bold uppercase text-[#241F19] shadow-[4px_4px_0_#91897C] transition touch-manipulation hover:bg-transparent hover:text-[#EEF083] disabled:cursor-not-allowed disabled:border-[#91897C] disabled:bg-transparent disabled:text-[#91897C] disabled:shadow-none"
                  disabled={!move || !targetId || phase !== "select"}
                  onClick={handleConfirm}
                  type="button"
                >
                  {phase === "locked" ? "Locked In" : "Confirm Move"}
                </button>
                <span className="font-mono text-xs text-[#91897C]">
                  {phase === "locked" ? "waiting for bots…" : !targetId ? "pick a target first" : !move ? "pick a move" : `${move.toUpperCase()} → ${players.find(p=>p.id===targetId)?.addr}`}
                </span>
              </div>
            </>

          ) : phase === "reveal" ? (
            <div className="space-y-2">
              {players.filter((p) => !p.isEliminated || p.revealedMove).map((p) => {
                const tgt = players.find((t) => t.id === p.revealedTarget);
                return (
                  <div key={p.id} className="flex items-center gap-2 font-mono text-xs">
                    <span className={`w-14 truncate font-bold ${p.isYou ? "text-[#EEF083]" : "text-[#d8d4a1]"}`}>
                      {p.isYou ? "You" : p.addr.slice(0,8)}
                    </span>
                    <span className="border border-[#EEF083]/50 bg-[#EEF083]/10 px-1.5 py-0.5 uppercase text-[#EEF083]">
                      {p.revealedMove ?? "—"}
                    </span>
                    {tgt && p.revealedMove !== "fold" && p.revealedMove !== "bluff" && (
                      <span className="text-[#91897C]">→ {tgt.isYou ? "you" : tgt.addr.slice(0,8)}</span>
                    )}
                    {p.balanceDelta !== 0 && (
                      <span className={`ml-auto font-bold ${p.balanceDelta > 0 ? "text-[#a8e6a3]" : "text-[#ffb1a1]"}`}>
                        {p.balanceDelta > 0 ? "+" : ""}{p.balanceDelta}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          ) : phase === "round_end" ? (
            <button
              className="w-full border-2 border-[#EEF083] bg-[#EEF083] py-4 text-sm font-bold uppercase text-[#241F19] shadow-[4px_4px_0_#91897C] transition touch-manipulation hover:bg-transparent hover:text-[#EEF083]"
              onClick={nextRound}
              type="button"
            >
              Next Round →
            </button>
          ) : null}
        </section>

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
