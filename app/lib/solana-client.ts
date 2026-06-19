import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import type { Wallet, WalletAccount } from "@wallet-standard/base";

const RPC = process.env.NEXT_PUBLIC_RPC ?? "https://api.mainnet-beta.solana.com";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "DkwFvvRSqAqADDVdnnkyDYhG7WqY6uC5htjbJeLYrtoU",
);

export const connection = new Connection(RPC, { commitment: "confirmed" });

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
  balance: number;
  lifetimeEarned: number;
  gamesPlayed: number;
  bestStreak: number;
};

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
  let off = 8;
  const walletBytes = data.slice(off, off + 32); off += 32;
  const wallet = new PublicKey(walletBytes).toBase58();
  const balance = Number(view.getBigUint64(off, true)); off += 8;
  const lifetimeEarned = Number(view.getBigUint64(off, true)); off += 8;
  const gamesPlayed = view.getUint32(off, true); off += 4;
  const bestStreak = data[off];
  return { wallet, balance, lifetimeEarned, gamesPlayed, bestStreak };
}

// ─── init_player ─────────────────────────────────────────────────────────────
// Creates the PlayerAura PDA on-chain. Must be called once per wallet before
// award_aura will work. The player's wallet signs and pays rent (~0.001 SOL).

const DISC_INIT_PLAYER = Buffer.from([0x72, 0x1b, 0xdb, 0x90, 0x32, 0x0f, 0xe4, 0x42]);

type SignAndSendFeature = {
  signAndSendTransaction: (
    ...inputs: Array<{ account: WalletAccount; transaction: Uint8Array; chain?: string }>
  ) => Promise<ReadonlyArray<{ signature: Uint8Array }>>;
};

function toBase58(bytes: Uint8Array): string {
  const ALPHA = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const hex = Buffer.from(bytes).toString("hex");
  if (!hex) return "";
  let n = BigInt("0x" + hex);
  let s = "";
  while (n > 0n) { s = ALPHA[Number(n % 58n)] + s; n /= 58n; }
  for (const b of bytes) { if (b !== 0) break; s = "1" + s; }
  return s;
}

/**
 * Creates the PlayerAura PDA if it doesn't already exist.
 * Returns true if initialization was sent, false if already existed.
 * Throws if the wallet doesn't support signAndSendTransaction.
 */
export async function initPlayerOnChain(
  wallet: Wallet,
  account: WalletAccount,
): Promise<boolean> {
  const pubkey = new PublicKey(account.address);
  const [playerPda] = derivePlayerPDA(pubkey);

  const info = await connection.getAccountInfo(playerPda);
  if (info !== null) return false; // already initialized

  const feature = (wallet.features as Record<string, unknown>)[
    "solana:signAndSendTransaction"
  ] as SignAndSendFeature | undefined;

  if (!feature) throw new Error("Wallet does not support signAndSendTransaction");

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({ feePayer: pubkey, recentBlockhash: blockhash }).add(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: playerPda,                 isSigner: false, isWritable: true  },
        { pubkey,                            isSigner: true,  isWritable: true  },
        { pubkey: SystemProgram.programId,   isSigner: false, isWritable: false },
      ],
      data: DISC_INIT_PLAYER,
    }),
  );

  const rawTx = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
  const [{ signature: sigBytes }] = await feature.signAndSendTransaction({
    account,
    transaction: new Uint8Array(rawTx),
    chain: "solana:mainnet",
  });

  const signature = toBase58(new Uint8Array(sigBytes));
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  return true;
}
