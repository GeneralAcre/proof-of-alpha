import { NextResponse } from "next/server";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createClient } from "@supabase/supabase-js";

const PACKS: Record<string, { aura: number; sol: number }> = {
  starter:  { aura: 300,    sol: 0.01  },
  grinder:  { aura: 1_000,  sol: 0.025 },
  chad:     { aura: 3_000,  sol: 0.05  },
  gigachad: { aura: 10_000, sol: 0.10  },
};

const RPC      = process.env.SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";
const TREASURY = process.env.NEXT_PUBLIC_TREASURY ?? "";

export async function POST(req: Request) {
  try {
    const { playerWallet, packId, txSignature } = await req.json() as {
      playerWallet: string;
      packId: string;
      txSignature: string;
    };

    const pack = PACKS[packId];
    if (!pack || !playerWallet || !txSignature) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }
    if (!TREASURY) {
      return NextResponse.json({ error: "Treasury not configured" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    );

    // ── 1. Replay protection — reject if this tx was already claimed ─────────
    // Requires: CREATE TABLE store_purchases (tx_signature TEXT PRIMARY KEY, claimed_at TIMESTAMPTZ NOT NULL DEFAULT now());
    try {
      const { error: insertErr } = await supabase
        .from("store_purchases")
        .insert({ tx_signature: txSignature });

      if (insertErr) {
        if (insertErr.code === "23505") {
          // unique_violation — already claimed
          return NextResponse.json({ error: "Transaction already claimed" }, { status: 409 });
        }
        // Table may not exist yet — log and continue (non-blocking)
        console.warn("[store-purchase] store_purchases dedup skipped:", insertErr.message);
      }
    } catch {
      console.warn("[store-purchase] store_purchases table unavailable — skipping dedup");
    }

    // ── 2. Verify transaction on-chain ───────────────────────────────────────
    const conn = new Connection(RPC, "confirmed");
    const tx = await conn.getParsedTransaction(txSignature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx)          return NextResponse.json({ error: "Transaction not found" },        { status: 400 });
    if (tx.meta?.err) return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });

    // Reject if older than 5 minutes (secondary replay protection)
    const age = Math.floor(Date.now() / 1000) - (tx.blockTime ?? 0);
    if (age > 300) return NextResponse.json({ error: "Transaction too old" }, { status: 400 });

    // Confirm: playerWallet sent correct lamports to TREASURY
    const expectedLamports = Math.round(pack.sol * LAMPORTS_PER_SOL);
    const instructions = tx.transaction.message.instructions;
    const verified = instructions.some((ix) => {
      if (!("parsed" in ix)) return false;
      const { type, info } = ix.parsed as { type: string; info: Record<string, unknown> };
      return (
        type              === "transfer"     &&
        info.source       === playerWallet   &&
        info.destination  === TREASURY       &&
        Number(info.lamports) === expectedLamports
      );
    });

    if (!verified) {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    // ── 3. Increment AURA in Supabase ────────────────────────────────────────
    const { data: existing } = await supabase
      .from("players")
      .select("aura")
      .eq("address", playerWallet)
      .maybeSingle();

    const newAura = (existing?.aura ?? 0) + pack.aura;

    await supabase.from("players").upsert(
      { address: playerWallet, aura: newAura, updated_at: new Date().toISOString() },
      { onConflict: "address" },
    );

    return NextResponse.json({ success: true, aura: pack.aura });
  } catch (err) {
    console.error("[store-purchase]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
