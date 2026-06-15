import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { connection } from "./solana-client";

export const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_TREASURY ?? "";

export function isTreasuryConfigured(): boolean {
  try {
    if (!TREASURY_ADDRESS) return false;
    new PublicKey(TREASURY_ADDRESS);
    return true;
  } catch {
    return false;
  }
}

// Inline base58 — avoids adding a dependency (bs58 is already a transitive dep but
// not in package.json, so we encode inline for reliability)
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

type SignAndSendFeature = {
  signAndSendTransaction: (
    ...inputs: Array<{ account: WalletAccount; transaction: Uint8Array; chain?: string }>
  ) => Promise<ReadonlyArray<{ signature: Uint8Array }>>;
};

/**
 * Send `solAmount` SOL from the connected wallet to the treasury.
 * Returns the base58 transaction signature on success.
 */
export async function sendSolPayment(
  wallet: Wallet,
  account: WalletAccount,
  solAmount: number,
): Promise<string> {
  if (!isTreasuryConfigured()) {
    throw new Error("Treasury wallet not configured. Set NEXT_PUBLIC_TREASURY in .env.local");
  }

  const treasury = new PublicKey(TREASURY_ADDRESS);
  const feePayer = new PublicKey(account.address);
  const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({ feePayer, recentBlockhash: blockhash }).add(
    SystemProgram.transfer({ fromPubkey: feePayer, toPubkey: treasury, lamports }),
  );

  const feature = (wallet.features as Record<string, unknown>)[
    "solana:signAndSendTransaction"
  ] as SignAndSendFeature | undefined;

  if (!feature) {
    throw new Error("Wallet does not support solana:signAndSendTransaction");
  }

  const rawTx = tx.serialize({ requireAllSignatures: false, verifySignatures: false });

  const [{ signature: sigBytes }] = await feature.signAndSendTransaction({
    account,
    transaction: new Uint8Array(rawTx),
    chain: "solana:mainnet",
  });

  const signature = toBase58(new Uint8Array(sigBytes));
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

  return signature;
}
