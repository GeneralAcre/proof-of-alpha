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

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "9UfB3hWQzQCFg47qjXnTigK2QTSkzSrApx5Z1tq1KkFD",
);

const RPC = "https://api.devnet.solana.com";
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
    const { playerWallet, amount, streak = 0 } = body as {
      playerWallet: string;
      amount: number;
      streak?: number;
    };

    if (!playerWallet || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const authority = loadAuthority();
    const player = new PublicKey(playerWallet);

    const data = Buffer.alloc(8 + 8 + 1);
    DISC_AWARD_AURA.copy(data, 0);
    data.writeBigUInt64LE(BigInt(Math.round(amount)), 8);
    data.writeUInt8(Math.min(streak, 255), 16);

    const conn = new Connection(RPC, "confirmed");
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");

    const tx = new Transaction({ feePayer: authority.publicKey, recentBlockhash: blockhash });
    tx.add(
      new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: configPDA(),             isSigner: false, isWritable: false },
          { pubkey: playerPDA(player),       isSigner: false, isWritable: true  },
          { pubkey: player,                  isSigner: false, isWritable: false },
          { pubkey: authority.publicKey,     isSigner: true,  isWritable: true  },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data,
      }),
    );

    tx.sign(authority);
    const conn2 = new Connection(RPC, "confirmed");
    const sig = await conn2.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    await conn2.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");

    return NextResponse.json({ success: true, signature: sig });
  } catch (err) {
    console.error("[award-aura]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
