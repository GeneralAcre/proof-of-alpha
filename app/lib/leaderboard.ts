import { supabase, supabaseReady } from "./supabase";

export type PlayerRow = {
  address: string;
  aura: number;
  matches_played: number;
  matches_won: number;
  best_streak: number;
  updated_at: string;
};

export async function syncPlayerStats(
  address: string,
  aura: number,
  won: boolean,
  streak: number,
): Promise<void> {
  if (!supabaseReady || !address) return;

  const { data: existing } = await supabase
    .from("players")
    .select("matches_played, matches_won, best_streak")
    .eq("address", address)
    .maybeSingle();

  await supabase.from("players").upsert({
    address,
    aura,
    matches_played: (existing?.matches_played ?? 0) + 1,
    matches_won:    (existing?.matches_won    ?? 0) + (won ? 1 : 0),
    best_streak:    Math.max(existing?.best_streak ?? 0, streak),
    updated_at:     new Date().toISOString(),
  });
}

export async function loadPlayerProfile(address: string): Promise<PlayerRow | null> {
  if (!supabaseReady) return null;
  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("address", address)
    .maybeSingle();
  return (data as PlayerRow) ?? null;
}

export async function loadLeaderboard(sortBy: "aura" | "best_streak" = "aura"): Promise<PlayerRow[]> {
  if (!supabaseReady) return [];
  const { data } = await supabase
    .from("players")
    .select("*")
    .order(sortBy, { ascending: false })
    .limit(50);
  return (data as PlayerRow[]) ?? [];
}
