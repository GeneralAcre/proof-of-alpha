import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { MAGICBLOCK_ENDPOINTS } from "./magicblock";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "9UfB3hWQzQCFg47qjXnTigK2QTSkzSrApx5Z1tq1KkFD",
);

export const connection = new Connection(
  MAGICBLOCK_ENDPOINTS.baseRpc,
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
