export type Archetype = {
  id: string;
  name: string;
  role: string;
  tagline: string;
  stat: string;
  unlockCost: number;
  initials: string;
  stats: { aggression: number; defense: number; bluff: number; greed: number };
  passive: string;
  uniqueMove: string;
  strengths: string[];
  weaknesses: string[];
  beats: string[];
  fears: string[];
};

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: "npc",
    name: "NPC",
    role: "Wildcard",
    tagline: "No script. Pure chaos.",
    stat: "BLF 70 · SPD 80",
    unlockCost: 0,
    initials: "NP",
    stats: { aggression: 40, defense: 30, bluff: 70, greed: 50 },
    passive: "Random Routine — 20% chance to auto-play a random move each round",
    uniqueMove: "Glitch — forces opponent to reveal their move 2s early",
    strengths: ["Unpredictable", "Fast decisions", "Low-risk floor"],
    weaknesses: ["Low ceiling", "Weak late-game", "No consistency"],
    beats: ["Sigma", "Doomer"],
    fears: ["Gigachad", "Degen"],
  },
  {
    id: "wojak",
    name: "Wojak",
    role: "Emotional Bluffer",
    tagline: "Feel everything. Bluff harder.",
    stat: "BLF 90 · GRD 60",
    unlockCost: 0,
    initials: "WJ",
    stats: { aggression: 30, defense: 40, bluff: 90, greed: 60 },
    passive: "Pain Immunity — lose a round, gain +15% bluff success next round",
    uniqueMove: "Cope Stack — opponent believes you have nothing when you have everything",
    strengths: ["Elite bluffing", "Emotional resilience", "Mind games"],
    weaknesses: ["Fragile when called", "Low raw damage", "Tilt risk"],
    beats: ["Sigma", "NPC"],
    fears: ["Gigachad", "Degen"],
  },
  {
    id: "doomer",
    name: "Doomer",
    role: "Attrition Tank",
    tagline: "Wait. Wait more. Win.",
    stat: "DEF 95 · BLF 55",
    unlockCost: 500,
    initials: "DM",
    stats: { aggression: 20, defense: 95, bluff: 55, greed: 30 },
    passive: "Entropy — each round with no win, opponent loses 5% bet efficiency",
    uniqueMove: "Blackpill — stalls round timer by 3s (once per match)",
    strengths: ["Extreme tankiness", "Attrition wins", "Timer exploitation"],
    weaknesses: ["Near-zero aggression", "Weak to burst", "Passive-reliant"],
    beats: ["Wojak", "NPC"],
    fears: ["Degen", "Gigachad"],
  },
  {
    id: "sigma",
    name: "Sigma",
    role: "Manipulator",
    tagline: "You already lost before you played.",
    stat: "BLF 85 · AGG 65",
    unlockCost: 1000,
    initials: "SG",
    stats: { aggression: 65, defense: 60, bluff: 85, greed: 70 },
    passive: "Information Asymmetry — sees opponent last-move history summary",
    uniqueMove: "Mind Game — opponent bluff detection drops 25% for 1 round",
    strengths: ["Info advantage", "Highly adaptive", "Multi-layered strategy"],
    weaknesses: ["Complex execution", "Weak vs chaos", "Slow ramp"],
    beats: ["Doomer", "Wojak"],
    fears: ["NPC", "Gigachad"],
  },
  {
    id: "gigachad",
    name: "Gigachad",
    role: "Aggressor",
    tagline: "No bluff. Just dominance.",
    stat: "AGG 100 · DEF 75",
    unlockCost: 2000,
    initials: "GC",
    stats: { aggression: 100, defense: 75, bluff: 45, greed: 80 },
    passive: "Alpha Aura — opponents ranked 2+ below deal 10% less damage",
    uniqueMove: "Sigma Stare — locks opponent move input for 1s",
    strengths: ["Raw power", "Intimidation factor", "Late-game dominant"],
    weaknesses: ["Readable aggression", "Weak vs chaos", "Expensive to unlock"],
    beats: ["Sigma", "Doomer", "Wojak"],
    fears: ["NPC"],
  },
  {
    id: "degen",
    name: "Degen",
    role: "All-In Gambler",
    tagline: "All in. Every time.",
    stat: "GRD 100 · AGG 75",
    unlockCost: 750,
    initials: "DG",
    stats: { aggression: 75, defense: 25, bluff: 65, greed: 100 },
    passive: "Leverage — win doubles point value, loss doubles cost",
    uniqueMove: "Rug Pull — steal 10% of opponent $TEST on round win",
    strengths: ["Explosive upside", "Pressure play", "Surprise factor"],
    weaknesses: ["Maximum variance", "Zero recovery", "One bad round ruins it"],
    beats: ["Doomer", "NPC"],
    fears: ["Sigma", "Wojak"],
  },
];

type Rank = { name: string; min: number; next: number | null };

export const RANKS: readonly Rank[] = [
  { name: "NPC",      min: 0,    next: 500  },
  { name: "Beta",     min: 500,  next: 1500 },
  { name: "Alpha",    min: 1500, next: 3000 },
  { name: "Sigma",    min: 3000, next: 5000 },
  { name: "Gigachad", min: 5000, next: null },
];

export function getCurrentRank(points: number): Rank {
  return [...RANKS].reverse().find((r) => points >= r.min) ?? RANKS[0];
}

export function getNextRank(points: number): Rank | undefined {
  const current = getCurrentRank(points);
  return RANKS.find((r) => r.min === current.next);
}

export function getRankProgress(points: number): number {
  const rank = getCurrentRank(points);
  if (rank.next === null) return 100;
  return Math.min(100, Math.floor(((points - rank.min) / (rank.next - rank.min)) * 100));
}
