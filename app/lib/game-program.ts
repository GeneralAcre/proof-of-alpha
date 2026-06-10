"use client";

import {
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
import { PROGRAM_ID, connection, derivePlayerPDA } from "./solana-client";

// ─── Anchor discriminators (sha256("global:<name>")[0..8]) ───────────────────
const DISC_INIT_PLAYER = Buffer.from([114, 27, 219, 144, 50, 15, 228, 66]);
const DISC_SPEND_AURA  = Buffer.from([179, 50, 40, 208, 155, 56, 155, 106]);

// ─── Wallet signing helper ────────────────────────────────────────────────────

async function signWithWallet(
  wallet: Wallet,
  account: WalletAccount,
  tx: Transaction,
): Promise<{ tx: Transaction; blockhash: string; lastValidBlockHeight: number }> {
  const feature = (wallet.features as Partial<SolanaSignTransactionFeature>)[
    SolanaSignTransaction
  ];
  if (!feature) throw new Error("Wallet does not support SolanaSignTransaction");

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
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

// ─── init_player ─────────────────────────────────────────────────────────────

/**
 * Create the on-chain PlayerAura account for this wallet.
 * Call once after wallet connects. Costs ~0.001 SOL rent.
 * Silently skips if the account already exists.
 */
export async function initPlayerOnChain(
  wallet: Wallet,
  account: WalletAccount,
): Promise<void> {
  const walletPubkey = new PublicKey(account.address);
  const [playerPDA] = derivePlayerPDA(walletPubkey);

  // Skip if already exists
  const existing = await connection.getAccountInfo(playerPDA);
  if (existing) return;

  const tx = new Transaction();
  tx.add(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: playerPDA,     isSigner: false, isWritable: true  },
        { pubkey: walletPubkey,  isSigner: true,  isWritable: true  },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: DISC_INIT_PLAYER,
    }),
  );

  const bundle = await signWithWallet(wallet, account, tx);
  const raw = bundle.tx.serialize();
  const sig = await connection.sendRawTransaction(raw, { skipPreflight: false, maxRetries: 3 });
  await connection.confirmTransaction(
    { signature: sig, blockhash: bundle.blockhash, lastValidBlockHeight: bundle.lastValidBlockHeight },
    "confirmed",
  );
}

// ─── spend_aura ───────────────────────────────────────────────────────────────

/**
 * Burn AURA from the player's on-chain balance.
 * Phase 1: deducts balance only.
 * Phase 2: will also mint ALPHA tokens to the player.
 */
export async function spendAuraOnChain(
  wallet: Wallet,
  account: WalletAccount,
  amount: number,
): Promise<void> {
  const walletPubkey = new PublicKey(account.address);
  const [playerPDA] = derivePlayerPDA(walletPubkey);

  // Encode amount as u64 little-endian
  const data = Buffer.alloc(8 + 8);
  DISC_SPEND_AURA.copy(data, 0);
  const amountBig = BigInt(amount);
  data.writeBigUInt64LE(amountBig, 8);

  const tx = new Transaction();
  tx.add(
    new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: playerPDA,    isSigner: false, isWritable: true },
        { pubkey: walletPubkey, isSigner: true,  isWritable: false },
      ],
      data,
    }),
  );

  const bundle = await signWithWallet(wallet, account, tx);
  const raw = bundle.tx.serialize();
  const sig = await connection.sendRawTransaction(raw, { skipPreflight: false, maxRetries: 3 });
  await connection.confirmTransaction(
    { signature: sig, blockhash: bundle.blockhash, lastValidBlockHeight: bundle.lastValidBlockHeight },
    "confirmed",
  );
}

// award_aura is intentionally server-side only — see app/api/award-aura/route.ts (to be created)
// The backend signs with the authority keypair stored in BACKEND_AUTHORITY env var.
