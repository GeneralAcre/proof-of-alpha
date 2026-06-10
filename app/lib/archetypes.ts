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
    id: "alpha",
    name: "Alpha",
    role: "Charismatic Aggressor",
    tagline: "Born to lead. Built to dominate.",
    description: "Confident, outgoing, a charismatic leader. Enterprising and macho — but aggressive with it. Charges hard and expects the room to move.",
    stat: "AGG 85 · GRD 75",
    unlockCost: 0,
    initials: "AL",
    image: "/charecter/alpha-charecter.png",
    stats: { aggression: 85, defense: 60, bluff: 55, greed: 75 },
    passive: "Alpha Presence — opponents targeting you deal 10% less this round",
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
    stat: "DEF 80 · BLF 60",
    unlockCost: 0,
    initials: "BT",
    image: "/charecter/beta-charecter.png",
    stats: { aggression: 25, defense: 80, bluff: 60, greed: 30 },
    passive: "Nice Guy Syndrome — each round you take damage, Counter power +10% next round",
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
    stat: "BLF 90 · AGG 75",
    unlockCost: 0,
    initials: "SG",
    image: "/charecter/sigma-charecter.png",
    stats: { aggression: 75, defense: 70, bluff: 90, greed: 70 },
    passive: "Information Asymmetry — see a summary of each opponent's last-move tendency",
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
