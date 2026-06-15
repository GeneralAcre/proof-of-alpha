import type { StatBlock } from "./archetypes";

// Minimal shape needed — both Girl and GirlArchetype satisfy this
type GirlEconomy = {
  approachCost: number;
  flirtWin: number;
  flexWin: number;
  difficulty: string;
};

export function getStreakMultiplier(streak: number): number {
  if (streak >= 5) return 3.0;
  if (streak >= 3) return 1.75;
  if (streak >= 2) return 1.25;
  return 1.0;
}

const DIFF_PENALTY: Record<string, number> = { easy: 0, medium: -12, hard: -25 };

function statBonus(closer: "flirt" | "flex" | "leave", stats: StatBlock): number {
  if (closer === "flirt") return Math.round(((stats.bluff + stats.aggression) / 20) * 15);
  if (closer === "flex")  return Math.round(((stats.aggression + stats.greed) / 20) * 15);
  return 0;
}

export function calcWinChance(
  closer: "flirt" | "flex" | "leave",
  totalScore: number,
  difficulty: string,
  stats: StatBlock,
): number {
  const score = Math.max(-20, Math.min(40, totalScore));
  const t = (score + 20) / 60;
  let base = 0;
  if (closer === "flirt") base = 15 + t * 75;
  else if (closer === "flex") base = 35 + t * 35;
  else return 0;
  const penalty = DIFF_PENALTY[difficulty] ?? 0;
  const bonus   = statBonus(closer, stats);
  return Math.min(95, Math.max(5, Math.round(base + penalty + bonus)));
}

export function calcAura(
  closer: "flirt" | "flex" | "leave",
  totalScore: number,
  girl: GirlEconomy,
  streak: number,
  stats: StatBlock,
): { aura: number; win: boolean; winChance: number } {
  const mult = getStreakMultiplier(streak);
  if (closer === "leave") {
    return { aura: Math.round(girl.approachCost * 0.5), win: false, winChance: 0 };
  }
  const winChance = calcWinChance(closer, totalScore, girl.difficulty, stats);
  const won = Math.random() * 100 < winChance;
  const payout = closer === "flirt" ? girl.flirtWin : girl.flexWin;
  return { aura: won ? Math.round(payout * mult) : 0, win: won, winChance };
}
