import { Connection, PublicKey } from "@solana/web3.js";
import { MAGICBLOCK_ENDPOINTS } from "./magicblock";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "9UfB3hWQzQCFg47qjXnTigK2QTSkzSrApx5Z1tq1KkFD",
);

/** Solana devnet — used for setup/settlement (createGame, close) */
export const connection = new Connection(
  MAGICBLOCK_ENDPOINTS.baseRpc,
  { commitment: "confirmed" },
);

/** MagicBlock Ephemeral Rollup — used for round transactions (commit/reveal/resolve) */
export const erConnection = new Connection(
  MAGICBLOCK_ENDPOINTS.erRpc,
  { commitment: "confirmed" },
);

// Move IDs — must stay in sync with programs/proof-of-alpha/src/lib.rs
export const MOVE_ID: Record<string, number> = {
  tax: 0, steal: 1, rob: 2, bluff: 3, counter: 4, nuke: 5, fold: 6,
};
export const MOVE_NAME: Record<number, string> = {
  0: "tax", 1: "steal", 2: "rob", 3: "bluff", 4: "counter", 5: "nuke", 6: "fold",
};

// Phase IDs
export const PHASE = { LOBBY: 0, COMMIT: 1, REVEAL: 2, RESOLVE: 3, FINISHED: 4 } as const;

export function deriveGamePDA(roomCode: string): [PublicKey, number] {
  const codeBytes = Buffer.alloc(4);
  Buffer.from(roomCode.replace("POA-", "")).copy(codeBytes);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("game"), codeBytes],
    PROGRAM_ID,
  );
}

/** SHA-256 hash of [move_id, target_idx, ...salt] — matches Rust side */
export async function hashMove(
  moveId: number,
  targetIdx: number,
  salt: Uint8Array,
): Promise<Uint8Array> {
  const preimage = new Uint8Array(34);
  preimage[0] = moveId;
  preimage[1] = targetIdx;
  preimage.set(salt, 2);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", preimage));
}

export function randomSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

// ─── GameRoom account deserialization ────────────────────────────────────────
// Layout (after 8-byte Anchor discriminator):
//   room_code [u8;4], modifier u8, round u8, phase u8, player_count u8,
//   creator Pubkey(32), bump u8, created_at i64(8), players [PlayerEntry;6]
// PlayerEntry (76 bytes each):
//   pubkey(32), archetype u8, balance u32(4), round_wins u8,
//   move_hash [u8;32], move_revealed u8, target_revealed u8,
//   has_committed bool, has_revealed bool, is_bot bool, is_eliminated bool

export type PlayerEntry = {
  pubkey: PublicKey;
  archetype: number;
  balance: number;
  roundWins: number;
  moveHash: Uint8Array;
  moveRevealed: number;
  targetRevealed: number;
  hasCommitted: boolean;
  hasRevealed: boolean;
  isBot: boolean;
  isEliminated: boolean;
};

export type GameRoomState = {
  roomCode: string;
  modifier: number;
  round: number;
  phase: number;
  playerCount: number;
  creator: PublicKey;
  players: PlayerEntry[];
};

// GameRoom account size = 8 discriminator + 57 header + 6×76 players = 513 bytes
const GAME_ROOM_SIZE = 513;

/** Return all non-finished games currently on-chain. */
export async function fetchOpenRooms(): Promise<GameRoomState[]> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [{ dataSize: GAME_ROOM_SIZE }],
    });
    const rooms: GameRoomState[] = [];
    for (const { account } of accounts) {
      try {
        const state = parseGameRoom(new Uint8Array(account.data));
        if (state.phase < 4) rooms.push(state); // exclude FINISHED
      } catch {}
    }
    return rooms.sort((a, b) => a.round - b.round);
  } catch {
    return [];
  }
}

export function parseGameRoom(data: Uint8Array): GameRoomState {
  const v = new DataView(data.buffer, data.byteOffset);
  let off = 8; // skip 8-byte Anchor discriminator

  const roomCodeBytes = data.slice(off, off + 4); off += 4;
  const roomCode = "POA-" + Buffer.from(roomCodeBytes).toString("ascii").replace(/\0/g, "");
  const modifier    = data[off++];
  const round       = data[off++];
  const phase       = data[off++];
  const playerCount = data[off++];
  const creator     = new PublicKey(data.slice(off, off + 32)); off += 32;
  off += 1; // bump
  off += 8; // created_at i64

  const players: PlayerEntry[] = [];
  for (let i = 0; i < 6; i++) {
    const pubkey       = new PublicKey(data.slice(off, off + 32)); off += 32;
    const archetype    = data[off++];
    const balance      = v.getUint32(off, true); off += 4;
    const roundWins    = data[off++];
    const moveHash     = data.slice(off, off + 32); off += 32;
    const moveRevealed    = data[off++];
    const targetRevealed  = data[off++];
    const hasCommitted    = data[off++] !== 0;
    const hasRevealed     = data[off++] !== 0;
    const isBot           = data[off++] !== 0;
    const isEliminated    = data[off++] !== 0;
    players.push({ pubkey, archetype, balance, roundWins, moveHash, moveRevealed, targetRevealed, hasCommitted, hasRevealed, isBot, isEliminated });
  }

  return { roomCode, modifier, round, phase, playerCount, creator, players };
}
