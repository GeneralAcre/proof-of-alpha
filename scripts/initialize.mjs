// One-time program initialization — sets BACKEND_AUTHORITY as the on-chain authority.
// Run once after mainnet deploy: node scripts/initialize.mjs
import {
  Connection, Keypair, PublicKey, Transaction,
  TransactionInstruction, SystemProgram,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const PROGRAM_ID  = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID);
const RPC         = process.env.SOLANA_RPC;
const DISC_INIT   = Buffer.from([0xaf, 0xaf, 0x6d, 0x1f, 0x0d, 0x98, 0x9b, 0xed]);

// Payer = deployer wallet (needs SOL)
const payerRaw  = JSON.parse(readFileSync("\\\\wsl$\\Ubuntu\\home\\acresanpaphat\\.config\\solana\\deployer.json", "utf8"));
const payer     = Keypair.fromSecretKey(Uint8Array.from(payerRaw));

// Authority = BACKEND_AUTHORITY from .env.local
const authRaw   = JSON.parse(process.env.BACKEND_AUTHORITY);
const authority = Keypair.fromSecretKey(Uint8Array.from(authRaw));

const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);

console.log("Program ID  :", PROGRAM_ID.toBase58());
console.log("Config PDA  :", configPDA.toBase58());
console.log("Authority   :", authority.publicKey.toBase58());
console.log("Payer       :", payer.publicKey.toBase58());
console.log("RPC         :", RPC);

const conn = new Connection(RPC, "confirmed");

// Check if already initialized
const existing = await conn.getAccountInfo(configPDA);
if (existing && existing.data.length >= 41) {
  console.log("\nConfig PDA already exists — already initialized.");
  process.exit(0);
}

// Build instruction data: discriminator (8) + authority pubkey (32)
const data = Buffer.alloc(8 + 32);
DISC_INIT.copy(data, 0);
authority.publicKey.toBuffer().copy(data, 8);

const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
const tx = new Transaction({ feePayer: payer.publicKey, recentBlockhash: blockhash }).add(
  new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: configPDA,               isSigner: false, isWritable: true  },
      { pubkey: payer.publicKey,         isSigner: true,  isWritable: true  },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  }),
);

tx.sign(payer);
const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false });
await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");

console.log("\nInitialized! Signature:", sig);
console.log("Explorer  :", `https://explorer.solana.com/tx/${sig}`);
