"use client";

import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import type { WalletAccount } from "@wallet-standard/base";
import type { Wallet } from "@wallet-standard/base";
import {
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
import {
  PROGRAM_ID,
  connection,
  erConnection,
  MOVE_ID,
  hashMove,
  randomSalt,
  deriveGamePDA,
} from "./solana-client";

// ─── Anchor discriminators (sha256("global:<ix_name>")[0..8]) ─────────────────
// Pre-computed; regenerate with: anchor discriminator <ix_name>
const DISC: Record<string, Buffer> = {
  create_game:   Buffer.from([124,  69,  75,  66, 184, 220,  72, 206]),
  add_bot:       Buffer.from([ 33, 251, 240, 162, 159,  44,  51,  74]),
  start_game:    Buffer.from([249,  47, 252, 172, 184, 162, 245,  14]),
  commit_move:   Buffer.from([ 27,  16,  69, 212, 175, 110, 123, 189]),
  reveal_move:   Buffer.from([ 30, 133, 198,  26, 106,  44,  55, 149]),
  resolve_round: Buffer.from([165, 114, 237, 158,   1,  36,  70, 254]),
  close_game:    Buffer.from([237, 236, 157, 201, 253,  20, 248,  67]),
};

// ─── Wallet-standard signing bridge ──────────────────────────────────────────

type SignedTxBundle = {
  tx: Transaction;
  blockhash: string;
  lastValidBlockHeight: number;
};

async function signWithWallet(
  wallet: Wallet,
  account: WalletAccount,
  tx: Transaction,
  conn = connection,
): Promise<SignedTxBundle> {
  const feature = (wallet.features as Partial<SolanaSignTransactionFeature>)[
    SolanaSignTransaction
  ];
  if (!feature) throw new Error("Wallet does not support SolanaSignTransaction");

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = new PublicKey(account.address);

  const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  const result = await feature.signTransaction({
    transaction: serialized,
    account,
    chain: "solana:devnet",
  });
  return {
    tx: Transaction.from(result[0].signedTransaction as Buffer),
    blockhash,
    lastValidBlockHeight,
  };
}

/** Send a signed transaction and wait for confirmation. */
async function sendAndConfirm(bundle: SignedTxBundle, conn = connection): Promise<string> {
  const raw = bundle.tx.serialize();
  let sig: string;
  try {
    sig = await conn.sendRawTransaction(raw, { skipPreflight: false, maxRetries: 3 });
  } catch (err) {
    throw new Error(`Send failed: ${String(err)}`);
  }
  await conn.confirmTransaction(
    { signature: sig, blockhash: bundle.blockhash, lastValidBlockHeight: bundle.lastValidBlockHeight },
    "confirmed",
  );
  return sig;
}

// ─── Instruction builders ─────────────────────────────────────────────────────

function encodeU8(v: number): Buffer {
  return Buffer.from([v]);
}
function encodeU32(v: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(v, 0);
  return b;
}
function encodePubkey(pk: PublicKey): Buffer {
  return pk.toBuffer();
}

/** create_game(room_code: [u8;8], modifier: u8, archetype: u8) */
export async function ix_createGame(
  creator: PublicKey,
  roomCode: string,
  modifier: number,
  archetype: number,
): Promise<TransactionInstruction> {
  const [gamePDA] = deriveGamePDA(roomCode);
  const codeBytes = Buffer.alloc(4);
  Buffer.from(roomCode.replace("POA-", "")).copy(codeBytes);

  const data = Buffer.concat([
    DISC.create_game,
    codeBytes,
    encodeU8(modifier),
    encodeU8(archetype),
  ]);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePDA,                isSigner: false, isWritable: true },
      { pubkey: creator,                isSigner: true,  isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/** add_bot(archetype: u8, bot_pubkey: Pubkey) */
export function ix_addBot(
  creator: PublicKey,
  gamePDA: PublicKey,
  archetype: number,
  botPubkey: PublicKey,
): TransactionInstruction {
  const data = Buffer.concat([
    DISC.add_bot,
    encodeU8(archetype),
    encodePubkey(botPubkey),
  ]);
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePDA,  isSigner: false, isWritable: true  },
      { pubkey: creator,  isSigner: true,  isWritable: false },
    ],
    data,
  });
}

/** start_game() */
export function ix_startGame(creator: PublicKey, gamePDA: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePDA, isSigner: false, isWritable: true  },
      { pubkey: creator, isSigner: true,  isWritable: false },
    ],
    data: DISC.start_game,
  });
}

/** commit_move(player_idx: u8, move_hash: [u8;32]) */
export function ix_commitMove(
  signer: PublicKey,
  gamePDA: PublicKey,
  playerIdx: number,
  moveHash: Uint8Array,
): TransactionInstruction {
  const data = Buffer.concat([DISC.commit_move, encodeU8(playerIdx), Buffer.from(moveHash)]);
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePDA, isSigner: false, isWritable: true  },
      { pubkey: signer,  isSigner: true,  isWritable: false },
    ],
    data,
  });
}

/** reveal_move(player_idx: u8, move_id: u8, target_idx: u8, salt: [u8;32]) */
export function ix_revealMove(
  signer: PublicKey,
  gamePDA: PublicKey,
  playerIdx: number,
  moveId: number,
  targetIdx: number,
  salt: Uint8Array,
): TransactionInstruction {
  const data = Buffer.concat([
    DISC.reveal_move,
    encodeU8(playerIdx),
    encodeU8(moveId),
    encodeU8(targetIdx),
    Buffer.from(salt),
  ]);
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePDA, isSigner: false, isWritable: true  },
      { pubkey: signer,  isSigner: true,  isWritable: false },
    ],
    data,
  });
}

/** resolve_round() */
export function ix_resolveRound(signer: PublicKey, gamePDA: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: gamePDA, isSigner: false, isWritable: true  },
      { pubkey: signer,  isSigner: true,  isWritable: false },
    ],
    data: DISC.resolve_round,
  });
}

// ─── High-level game actions ──────────────────────────────────────────────────

const BOT_ARCHETYPES = [1, 2, 3, 4, 5]; // Beta=1, Gamma=2, Delta=3, Omega=4, Sigma=5
const ARCHETYPE_ID: Record<string, number> = {
  alpha: 0, beta: 1, gamma: 2, delta: 3, omega: 4, sigma: 5,
};

export type OnchainGame = {
  gamePDA: PublicKey;
  roomCode: string;
  pendingSalts: Map<number, Uint8Array>;
};

/**
 * Create a game room on-chain, add 5 bots, start the game.
 * Returns the on-chain game context used for subsequent rounds.
 */
export async function createOnchainGame(
  wallet: Wallet,
  account: WalletAccount,
  roomCode: string,
  modifier: number,
  archetypeId: string,
): Promise<OnchainGame> {
  const creator = new PublicKey(account.address);
  const [gamePDA] = deriveGamePDA(roomCode);

  // If the PDA already exists (e.g. same room code reused), skip creation
  const existing = await connection.getAccountInfo(gamePDA);
  if (!existing) {
    const botPubkeys = Array.from({ length: 5 }, () => Keypair.generate().publicKey);
    const tx = new Transaction();
    tx.add(await ix_createGame(creator, roomCode, modifier, ARCHETYPE_ID[archetypeId] ?? 0));
    for (let i = 0; i < 5; i++) {
      tx.add(ix_addBot(creator, gamePDA, BOT_ARCHETYPES[i], botPubkeys[i]));
    }
    tx.add(ix_startGame(creator, gamePDA));
    const bundle = await signWithWallet(wallet, account, tx);
    await sendAndConfirm(bundle);
  }

  return { gamePDA, roomCode, pendingSalts: new Map() };
}

/**
 * Commit the player's move and all bot moves in a single transaction.
 * Returns the salts used (needed for reveal).
 */
export async function commitRoundMoves(
  wallet: Wallet,
  account: WalletAccount,
  onchain: OnchainGame,
  playerMoveId: number,
  playerTargetIdx: number,
  botDecisions: Array<{ moveId: number; targetIdx: number }>,
): Promise<Map<number, Uint8Array>> {
  const creator = new PublicKey(account.address);
  const tx = new Transaction();

  const salts = new Map<number, Uint8Array>();

  // Player is index 0
  const playerSalt = randomSalt();
  salts.set(0, playerSalt);
  const playerHash = await hashMove(playerMoveId, playerTargetIdx, playerSalt);
  tx.add(ix_commitMove(creator, onchain.gamePDA, 0, playerHash));

  // Bots are indices 1-5
  for (let i = 0; i < 5; i++) {
    const { moveId, targetIdx } = botDecisions[i];
    const salt = randomSalt();
    salts.set(i + 1, salt);
    const hash = await hashMove(moveId, targetIdx, salt);
    tx.add(ix_commitMove(creator, onchain.gamePDA, i + 1, hash));
  }

  const bundle = await signWithWallet(wallet, account, tx, erConnection);
  await sendAndConfirm(bundle, erConnection);

  return salts;
}

/**
 * Reveal all moves (player + bots) and resolve the round.
 */
export async function revealAndResolve(
  wallet: Wallet,
  account: WalletAccount,
  onchain: OnchainGame,
  playerMoveId: number,
  playerTargetIdx: number,
  botDecisions: Array<{ moveId: number; targetIdx: number }>,
  salts: Map<number, Uint8Array>,
): Promise<void> {
  const creator = new PublicKey(account.address);
  const tx = new Transaction();

  // Player reveal (index 0)
  const playerSalt = salts.get(0)!;
  tx.add(ix_revealMove(creator, onchain.gamePDA, 0, playerMoveId, playerTargetIdx, playerSalt));

  // Bot reveals (indices 1-5)
  for (let i = 0; i < 5; i++) {
    const { moveId, targetIdx } = botDecisions[i];
    const salt = salts.get(i + 1)!;
    tx.add(ix_revealMove(creator, onchain.gamePDA, i + 1, moveId, targetIdx, salt));
  }

  // Resolve
  tx.add(ix_resolveRound(creator, onchain.gamePDA));

  const bundle = await signWithWallet(wallet, account, tx, erConnection);
  await sendAndConfirm(bundle, erConnection);
}

/** Fetch raw game account data — reads from ER (live state during a match) */
export async function fetchGameState(gamePDA: PublicKey): Promise<Uint8Array | null> {
  const info = await erConnection.getAccountInfo(gamePDA);
  if (!info) return null;
  return info.data;
}

/**
 * Close the finished game account and reclaim the creator's entry lamports.
 * Silently skips if the account no longer exists (already closed or never created).
 */
export async function closeOnchainGame(
  wallet: Wallet,
  account: WalletAccount,
  onchain: OnchainGame,
): Promise<void> {
  const creator = new PublicKey(account.address);
  const existing = await connection.getAccountInfo(onchain.gamePDA);
  if (!existing) return;

  const tx = new Transaction();
  tx.add(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: onchain.gamePDA, isSigner: false, isWritable: true },
        { pubkey: creator,         isSigner: true,  isWritable: true },
      ],
      data: DISC.close_game,
    }),
  );
  const bundle = await signWithWallet(wallet, account, tx);
  await sendAndConfirm(bundle);
}
