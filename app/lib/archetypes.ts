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
    image: "/archetypes/alpha.png",
    stats: { aggression: 85, defense: 60, bluff: 55, greed: 75 },
    passive: "Alpha Presence — opponents targeting you deal 10% less this round",
    uniqueMove: "Intimidate — force one opponent to reveal their chosen move before confirm",
    strengths: ["Raw aggression", "Natural leadership", "Pressure play"],
    weaknesses: ["Overconfident", "Predictably aggressive", "Weak to cunning reads"],
    beats: ["Beta", "Delta"],
    fears: ["Sigma", "Omega"],
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
    stats: { aggression: 25, defense: 80, bluff: 60, greed: 30 },
    passive: "Nice Guy Syndrome — each round you take damage, Counter power +10% next round",
    uniqueMove: "Apologize — reduce the highest-balance opponent's aggression by 20% for 1 round",
    strengths: ["High survivability", "Counter specialist", "Patience wins"],
    weaknesses: ["Near-zero offensive ceiling", "Submissive by default", "Exploitable by aggression"],
    beats: ["Alpha", "Gamma"],
    fears: ["Delta", "Omega"],
  },
  {
    id: "gamma",
    name: "Gamma",
    role: "Wild Card Adventurer",
    tagline: "The world is one big opportunity.",
    description: "Adventurous, eager, aware, empathetic. Thinks big but can lack focus. Adapts fast but overextends. Can be clingy — attaches to whoever is winning.",
    stat: "BLF 75 · AGG 65",
    unlockCost: 500,
    initials: "GM",
    stats: { aggression: 65, defense: 45, bluff: 75, greed: 65 },
    passive: "Momentum — each consecutive round win stacks +8% bluff success",
    uniqueMove: "Pivot — switch your declared target to any player up to 2s before reveal",
    strengths: ["Versatile", "Bluff stack potential", "Strong mid-game"],
    weaknesses: ["Unfocused early game", "Punished by consistency", "Stack resets on loss"],
    beats: ["Delta", "Omega"],
    fears: ["Alpha", "Sigma"],
  },
  {
    id: "delta",
    name: "Delta",
    role: "Resentful Saboteur",
    tagline: "This wasn't my fault.",
    description: "Resentful, blaming, self-sabotaging. A victim of life — and everyone else knows it too. Dangerous when losing because he burns everything down.",
    stat: "BLF 70 · DEF 50",
    unlockCost: 750,
    initials: "DL",
    stats: { aggression: 45, defense: 50, bluff: 70, greed: 40 },
    passive: "Victim Complex — when trailing in round wins, deal +20% to the leader",
    uniqueMove: "Self-Destruct — sacrifice 10 $TEST to force the highest-balance player to fold",
    strengths: ["Comeback mechanic", "Punishes leaders", "Unpredictable when hurt"],
    weaknesses: ["Self-sabotaging", "Weak from a lead", "Emotional tilt risk"],
    beats: ["Sigma", "Alpha"],
    fears: ["Beta", "Gamma"],
  },
  {
    id: "omega",
    name: "Omega",
    role: "Lone Wolf Outsider",
    tagline: "I don't need any of you.",
    description: "The creature outsider. Self-reliant, refuses hierarchy, prefers independence. Driven and intelligent but has no impulse to compete — until cornered. Gains strength from being alone.",
    stat: "DEF 80 · AGG 70",
    unlockCost: 1000,
    initials: "OM",
    stats: { aggression: 70, defense: 80, bluff: 65, greed: 50 },
    passive: "Solitude — for each round you are not targeted, all stats +5% (stacks)",
    uniqueMove: "Ghost — become untargetable for the current round (once per match)",
    strengths: ["Self-sufficient", "Scales when ignored", "Elite late-game"],
    weaknesses: ["Slow ramp", "No synergy plays", "Targeted early = ruined"],
    beats: ["Beta", "Alpha"],
    fears: ["Gamma", "Sigma"],
  },
  {
    id: "sigma",
    name: "Sigma",
    role: "Cold Assassin",
    tagline: "You already lost before you played.",
    description: "Likeable and confident, but cunning and calculating. The cold assassin you didn't see coming. Reads patterns, exploits trust, strikes precisely.",
    stat: "BLF 90 · AGG 75",
    unlockCost: 2000,
    initials: "SG",
    stats: { aggression: 75, defense: 70, bluff: 90, greed: 70 },
    passive: "Information Asymmetry — see a summary of each opponent's last-move tendency",
    uniqueMove: "Cold Read — predict one opponent's next move with 70% accuracy before confirm",
    strengths: ["Elite bluffing", "Pattern exploitation", "Multi-layer strategy"],
    weaknesses: ["Complex execution", "Weak vs true chaos", "Requires patience"],
    beats: ["Omega", "Gamma"],
    fears: ["Delta", "Beta"],
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
