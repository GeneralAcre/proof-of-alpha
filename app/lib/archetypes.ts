export type StatBlock = { aggression: number; defense: number; bluff: number; greed: number };

export type Archetype = {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  stat: string;
  unlockCost: number;
  initials: string;
  image?: string;
  /** Level 1–10 stats. Index 0 = level 1, index 9 = level 10 (max). */
  levels: readonly StatBlock[];
  /** Convenience aliases derived from levels */
  stats: StatBlock;
  statCaps: StatBlock;
  uniqueMove: string;
  strengths: string[];
  weaknesses: string[];
  beats: string[];
  fears: string[];
};

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: "alpha",
    name: "Alpha",
    role: "Charismatic Aggressor",
    tagline: "Born to lead. Built to dominate.",
    description: "Confident, outgoing, a charismatic leader. Enterprising and macho — but aggressive with it. Charges hard and expects the room to move.",
    stat: "AGG · GRD",
    unlockCost: 0,
    initials: "AL",
    image: "/charecter/alpha-charecter.png",
    levels: [
      { aggression: 4, defense: 3, bluff: 2, greed: 3 }, // 1
      { aggression: 5, defense: 3, bluff: 2, greed: 4 }, // 2  +agg +greed
      { aggression: 6, defense: 3, bluff: 2, greed: 4 }, // 3  +agg
      { aggression: 6, defense: 4, bluff: 2, greed: 5 }, // 4  +def +greed
      { aggression: 7, defense: 4, bluff: 3, greed: 5 }, // 5  +agg +bluff
      { aggression: 7, defense: 5, bluff: 3, greed: 6 }, // 6  +def +greed
      { aggression: 8, defense: 5, bluff: 4, greed: 7 }, // 7  +agg +bluff +greed
      { aggression: 9, defense: 6, bluff: 5, greed: 7 }, // 8  +agg +def +bluff
      { aggression: 9, defense: 6, bluff: 6, greed: 8 }, // 9  +bluff +greed
      { aggression: 10, defense: 7, bluff: 6, greed: 9 }, // 10 +agg +def +greed
    ],
    get stats()    { return this.levels[0]; },
    get statCaps() { return this.levels[9]; },
    uniqueMove: "Intimidate — force one opponent to reveal their chosen move before confirm",
    strengths: ["Raw aggression", "Natural leadership", "Pressure play"],
    weaknesses: ["Overconfident", "Predictably aggressive", "Weak to cunning reads"],
    beats: ["Beta"],
    fears: ["Sigma"],
  },
  {
    id: "beta",
    name: "Beta",
    role: "Defensive Loyalist",
    tagline: "At least I tried.",
    description: "Friendly, reserved, loyal, collaborative. The quintessential nice guy nobody wants to be. His default state is submissive — but he outlasts everyone.",
    stat: "DEF · BLF",
    unlockCost: 0,
    initials: "BT",
    image: "/charecter/beta-charecter.png",
    levels: [
      { aggression: 1, defense: 4, bluff: 3, greed: 1 }, // 1
      { aggression: 1, defense: 5, bluff: 3, greed: 1 }, // 2  +def
      { aggression: 1, defense: 6, bluff: 4, greed: 2 }, // 3  +def +bluff +greed
      { aggression: 2, defense: 6, bluff: 4, greed: 2 }, // 4  +agg
      { aggression: 2, defense: 7, bluff: 5, greed: 3 }, // 5  +def +bluff +greed
      { aggression: 2, defense: 8, bluff: 5, greed: 3 }, // 6  +def
      { aggression: 3, defense: 8, bluff: 6, greed: 4 }, // 7  +agg +bluff +greed
      { aggression: 3, defense: 9, bluff: 7, greed: 4 }, // 8  +def +bluff
      { aggression: 4, defense: 9, bluff: 7, greed: 5 }, // 9  +agg +greed
      { aggression: 4, defense: 10, bluff: 8, greed: 6 }, // 10 +def +bluff +greed
    ],
    get stats()    { return this.levels[0]; },
    get statCaps() { return this.levels[9]; },
    uniqueMove: "Apologize — reduce the highest-balance opponent's aggression by 20% for 1 round",
    strengths: ["High survivability", "Counter specialist", "Patience wins"],
    weaknesses: ["Near-zero offensive ceiling", "Submissive by default", "Exploitable by aggression"],
    beats: ["Alpha"],
    fears: ["Sigma"],
  },
  {
    id: "sigma",
    name: "Sigma",
    role: "Cold Assassin",
    tagline: "You already lost before you played.",
    description: "Likeable and confident, but cunning and calculating. The cold assassin you didn't see coming. Reads patterns, exploits trust, strikes precisely.",
    stat: "BLF · AGG",
    unlockCost: 0,
    initials: "SG",
    image: "/charecter/sigma-charecter.png",
    levels: [
      { aggression: 3, defense: 3, bluff: 5, greed: 3 }, // 1
      { aggression: 3, defense: 3, bluff: 6, greed: 3 }, // 2  +bluff
      { aggression: 4, defense: 3, bluff: 7, greed: 4 }, // 3  +agg +bluff +greed
      { aggression: 4, defense: 4, bluff: 7, greed: 4 }, // 4  +def
      { aggression: 5, defense: 4, bluff: 8, greed: 5 }, // 5  +agg +bluff +greed
      { aggression: 5, defense: 5, bluff: 8, greed: 5 }, // 6  +def
      { aggression: 6, defense: 5, bluff: 9, greed: 6 }, // 7  +agg +bluff +greed
      { aggression: 6, defense: 6, bluff: 9, greed: 7 }, // 8  +def +greed
      { aggression: 7, defense: 7, bluff: 9, greed: 8 }, // 9  +agg +def +greed
      { aggression: 8, defense: 8, bluff: 10, greed: 9 }, // 10 +agg +def +bluff +greed
    ],
    get stats()    { return this.levels[0]; },
    get statCaps() { return this.levels[9]; },
    uniqueMove: "Cold Read — predict one opponent's next move with 70% accuracy before confirm",
    strengths: ["Elite bluffing", "Pattern exploitation", "Multi-layer strategy"],
    weaknesses: ["Complex execution", "Weak vs true chaos", "Requires patience"],
    beats: ["Alpha"],
    fears: ["Beta"],
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
