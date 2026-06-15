import { NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { verifyAwardToken } from "../../lib/award-token";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "9UfB3hWQzQCFg47qjXnTigK2QTSkzSrApx5Z1tq1KkFD",
);

const RPC = process.env.SOLANA_RPC;
if (!RPC) throw new Error("SOLANA_RPC env var not set");

const DISC_AWARD_AURA = Buffer.from([143, 106, 88, 182, 178, 116, 73, 85]);

function configPDA(): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID)[0];
}

function playerPDA(wallet: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("player"), wallet.toBuffer()],
    PROGRAM_ID,
  )[0];
}

function loadAuthority(): Keypair {
  const raw = process.env.BACKEND_AUTHORITY;
  if (!raw) throw new Error("BACKEND_AUTHORITY not set");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body as { token: string };

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Verify the server-issued HMAC token — extracts wallet and amount
    let wallet: string;
    let amount: number;
    try {
      ({ wallet, amount } = verifyAwardToken(token));
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid token" },
        { status: 401 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const player = new PublicKey(wallet);
    const conn = new Connection(RPC, "confirmed");

    // If the PlayerAura PDA doesn't exist yet, tell the client to init it first
    const playerPdaKey = playerPDA(player);
    const playerAcc = await conn.getAccountInfo(playerPdaKey);
    if (!playerAcc) {
      return NextResponse.json({ error: "init_required" }, { status: 402 });
    }

    const authority = loadAuthority();
    const data = Buffer.alloc(8 + 8 + 1);
    DISC_AWARD_AURA.copy(data, 0);
    data.writeBigUInt64LE(BigInt(Math.round(amount)), 8);
    data.writeUInt8(0, 16); // streak tracked off-chain; on-chain field updated to 0 here

    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
    const tx = new Transaction({ feePayer: authority.publicKey, recentBlockhash: blockhash });
    tx.add(
      new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: configPDA(),     isSigner: false, isWritable: false },
          { pubkey: playerPdaKey,    isSigner: false, isWritable: true  },
          { pubkey: player,          isSigner: false, isWritable: false },
          { pubkey: authority.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      }),
    );

    tx.sign(authority);
    const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");

    return NextResponse.json({ success: true, signature: sig });
  } catch (err) {
    console.error("[award-aura]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
