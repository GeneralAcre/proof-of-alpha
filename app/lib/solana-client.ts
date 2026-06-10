import { Connection, PublicKey } from "@solana/web3.js";
import { MAGICBLOCK_ENDPOINTS } from "./magicblock";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "9UfB3hWQzQCFg47qjXnTigK2QTSkzSrApx5Z1tq1KkFD",
);

/** Solana devnet — used for player accounts and AURA settlement */
export const connection = new Connection(
  MAGICBLOCK_ENDPOINTS.baseRpc,
  { commitment: "confirmed" },
);

/** MagicBlock Ephemeral Rollup — reserved for future multiplayer */
export const erConnection = new Connection(
  MAGICBLOCK_ENDPOINTS.erRpc,
  { commitment: "confirmed" },
);

// ─── PDA derivation ───────────────────────────────────────────────────────────

export function deriveConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function derivePlayerPDA(wallet: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), wallet.toBuffer()],
    PROGRAM_ID,
  );
}

// ─── PlayerAura account ───────────────────────────────────────────────────────

export type PlayerAuraState = {
  wallet: string;
  balance: number;        // spendable AURA
  lifetimeEarned: number; // all-time earned
  gamesPlayed: number;
  bestStreak: number;
};

/**
 * Read a player's on-chain AURA balance.
 * Returns null if the account doesn't exist yet (player hasn't called init_player).
 */
export async function fetchPlayerAura(wallet: PublicKey): Promise<PlayerAuraState | null> {
  const [pda] = derivePlayerPDA(wallet);
  try {
    const info = await connection.getAccountInfo(pda);
    if (!info || info.data.length < 62) return null;
    return parsePlayerAura(new Uint8Array(info.data));
  } catch {
    return null;
  }
}

function parsePlayerAura(data: Uint8Array): PlayerAuraState {
  const view = new DataView(data.buffer, data.byteOffset);
  let off = 8; // skip 8-byte Anchor discriminator

  const walletBytes = data.slice(off, off + 32); off += 32;
  const wallet = new PublicKey(walletBytes).toBase58();

  const balance = Number(view.getBigUint64(off, true)); off += 8;
  const lifetimeEarned = Number(view.getBigUint64(off, true)); off += 8;
  const gamesPlayed = view.getUint32(off, true); off += 4;
  const bestStreak = data[off];

  return { wallet, balance, lifetimeEarned, gamesPlayed, bestStreak };
}
