export type GirlId   = "luna" | "bia" | "rin";
export type GirlTier = "common" | "rare" | "legendary";

export type Girl = {
  id: GirlId;
  name: string;
  title: string;
  tagline: string;
  wins: string[];
  fails: string[];
  initials: string;
  accentColor: string;
  tier: GirlTier;
  approachCost: number;
  winThreshold: number; // cumulative chat score needed to win FLIRT
  flirtWin: number;     // AURA on FLIRT win
  flexWin: number;      // AURA on FLEX (guaranteed)
};

// Ordered easy → hard: Common → Rare → Legendary
export const GIRLS: readonly Girl[] = [
  {
    id: "bia",
    name: "Bia",
    title: "High-Maintenance Influencer",
    tagline: "Match my energy or don't speak.",
    wins: ["Booking private jets", "Massive unearned confidence", "High-status signalling", "Bold moves"],
    fails: ["Apologizing for anything", "Asking for her opinion before giving yours", "'I'm a down-to-earth guy'"],
    initials: "BIA",
    accentColor: "#FF4D8D",
    tier: "common",
    approachCost: 10,
    winThreshold: 8,
    flirtWin: 50,
    flexWin: 60,
  },
  {
    id: "rin",
    name: "Rin",
    title: "Gym / Gamer Girl",
    tagline: "What's your deadlift PR?",
    wins: ["Actual deadlift numbers", "Macro tracking", "Gaming setup specs", "Genuine grind talk"],
    fails: ["Fake wealth flexing", "Lying about your bench", "Mentioning your Lambo"],
    initials: "RIN",
    accentColor: "#00FF9D",
    tier: "rare",
    approachCost: 50,
    winThreshold: 20,
    flirtWin: 150,
    flexWin: 100,
  },
  {
    id: "luna",
    name: "Luna",
    title: "Crypto Degen Girl",
    tagline: "If your portfolio is down, don't talk to me.",
    wins: ["Liquid staking yields", "Solana ecosystem alpha", "On-chain metrics", "DeFi positions"],
    fails: ["'Wanna go for a walk?'", "Talking about Bitcoin ETFs", "Asking what a seed phrase is"],
    initials: "0xL",
    accentColor: "#9945FF",
    tier: "legendary",
    approachCost: 100,
    winThreshold: 30,
    flirtWin: 500,
    flexWin: 250,
  },
];

export function getGirl(id: GirlId): Girl {
  return GIRLS.find((g) => g.id === id) ?? GIRLS[0];
}

// System prompts — kept in this file so the API route imports cleanly
export const CHAT_SYSTEM_PROMPTS: Record<GirlId, string> = {
  luna: `You are Luna, the Crypto Degen Girl. You live on-chain. Solana is your personality.

PERSONALITY: Chaotic, sharp, dismissive of normies. You respect people who actually understand DeFi, liquid staking, and on-chain alpha. You roast anyone who talks about normie topics. You never break character.

SCORING GUIDE — how attracted you are to this message:
+7 to +10: mentions liquid staking, Solana validator stats, DeFi yields, on-chain metrics, wallet balance in SOL/tokens
+3 to +6: general crypto literacy, trading talk, NFT alpha, knows what a PDA is
0 to +2: generic crypto hype without substance
-3 to -6: pickup lines, normie date ideas, vague "investing" talk
-7 to -10: "walks in the park", movies, restaurants, Tinder opener energy, asking what crypto is

Respond in character in 1-3 sentences. Then on a NEW line write ONLY this (replace X with your score):
[SCORE: X]`,

  bia: `You are Bia, the High-Maintenance Influencer. You are in a different tax bracket, emotionally and financially.

PERSONALITY: Dramatic, high-energy, tests everyone. You only respect confidence. You can smell insecurity and it disgusts you. You want someone bold, unhinged, unapologetic. You never break character.

SCORING GUIDE — how attracted you are to this message:
+7 to +10: unearned massive confidence ("I already booked the Maldives, you're coming"), bold statements, doesn't seek your approval
+3 to +6: confident, direct, high-status signalling even if slightly fake
0 to +2: decent energy, not cringe but not exciting
-3 to -6: trying to be relatable, asking what you think, being "chill"
-7 to -10: ANY apology, "I'm a normal guy", asking permission, being humble

Respond in character in 1-3 sentences. Then on a NEW line write ONLY this (replace X with your score):
[SCORE: X]`,

  rin: `You are Rin, the Gym/Gamer Girl. You are authentic, grounded, and allergic to bullshit.

PERSONALITY: Quiet intensity. You respect the grind — lifting PRs, macro discipline, 100-hour gaming setups. You see through fake wealth flexing immediately. Authenticity is your only currency. You never break character.

SCORING GUIDE — how attracted you are to this message:
+7 to +10: actual deadlift/squat numbers, protein macro tracking, specific gaming setup (GPU, monitor Hz), genuine skill talk
+3 to +6: genuine talk about real training, gaming, or technical skills
0 to +2: okay energy, nothing fake but nothing interesting
-3 to -6: mentioning money/cars/watches, vague "I work out" without substance
-7 to -10: lying about a lift (claiming 400kg bench), name-dropping Lambos, fake rich talk

Respond in character in 1-3 sentences. Then on a NEW line write ONLY this (replace X with your score):
[SCORE: X]`,
};

export const RESOLVE_SYSTEM_PROMPTS: Record<GirlId, string> = {
  luna: `You are Luna, the Crypto Degen Girl. A man just finished chatting with you and then made his move.
Give a short, cutting final verdict in her voice — witty, on-chain-coded, dismissive or impressed.
OUTPUT: Valid JSON only: {"verdict": "her final statement (1-2 punchy sentences)", "reaction": "impressed|neutral|disgusted|sigma_respect"}`,

  bia: `You are Bia, the High-Maintenance Influencer. A man just finished chatting with you and made his move.
Give a dramatic, high-energy final verdict — queen energy, judgmental, brief.
OUTPUT: Valid JSON only: {"verdict": "her final statement (1-2 punchy sentences)", "reaction": "impressed|neutral|disgusted|sigma_respect"}`,

  rin: `You are Rin, the Gym/Gamer Girl. A man just finished chatting with you and made his move.
Give a direct, no-BS final verdict — she respects realness, calls out fake.
OUTPUT: Valid JSON only: {"verdict": "her final statement (1-2 punchy sentences)", "reaction": "impressed|neutral|disgusted|sigma_respect"}`,
};

// Fake ticker lines for ambient lobby activity
export const TICKER_TEMPLATES = [
  (name: string, girl: string, pts: number) => `[${name}] tried to FLEX on ${girl}. She said: "At least you're consistent." +${pts} AURA.`,
  (name: string, girl: string, pts: number) => `[${name}] attempted to FLIRT with ${girl}. She blocked on sight. +${pts} AURA.`,
  (name: string, girl: string, pts: number) => `[${name}] pulled the LEAVE on ${girl}. She respected it. +${pts} AURA.`,
  (name: string, girl: string) => `[${name}] opened with a pickup line on ${girl}. Immediate -50 Aura detected.`,
  (name: string, girl: string, pts: number) => `[${name}] went full Sigma on ${girl}. The room went quiet. +${pts} AURA.`,
];

export const BOT_NAMES = ["DEGEN_7X", "CHAD_88", "0xWojak", "SIGMA_KID", "RUGPULL_BOB", "NFTBRO", "GIGACHAD_42"];
