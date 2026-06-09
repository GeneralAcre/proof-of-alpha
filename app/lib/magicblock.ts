export const MAGICBLOCK_ENDPOINTS = {
  baseRpc: "https://api.devnet.solana.com",
  routerRpc: "https://devnet-router.magicblock.app",
  routerWs: "wss://devnet-router.magicblock.app",
  erRpc: "https://devnet.magicblock.app",
  erWs: "wss://devnet.magicblock.app",
} as const;

export const MAGICBLOCK_PROGRAMS = {
  delegationProgram: "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh",
  magicProgram: "Magic11111111111111111111111111111111111111",
  magicContext: "MagicContext1111111111111111111111111111111",
} as const;

export const MAGICBLOCK_GAME_PLAN = [
  {
    label: "Mobile auth",
    detail: "Wallet signs only explicit setup/entry transactions.",
  },
  {
    label: "ER match loop",
    detail: "Turns, timers, bluff actions, and eliminations run through Magic Router.",
  },
  {
    label: "VRF fairness",
    detail: "Match seed, target assignment, and random events use MagicBlock VRF in the game program.",
  },
  {
    label: "Base commit",
    detail: "Final match state syncs back to Solana devnet through delegation commit.",
  },
] as const;

