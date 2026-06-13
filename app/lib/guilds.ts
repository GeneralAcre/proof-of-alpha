import { supabase, supabaseReady } from "./supabase";

export type Guild = {
  id: string;
  name: string;
  tag: string;
  motto: string;
  members: string[];   // wallet addresses
  createdBy: string;
  createdAt: number;
  cachedAura: number;  // sum of member aura snapshots
};

export const GUILD_CREATE_COST = 500;

const AURA_KEY = (addr: string) => `poa_aura_${addr}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocalAura(addr: string): number {
  try { return Number(localStorage.getItem(AURA_KEY(addr)) ?? "0") || 0; } catch { return 0; }
}

type GangRow = {
  id: string;
  name: string;
  tag: string;
  motto: string;
  created_by: string;
  created_at: string;
  gang_members: { address: string; aura_snapshot: number }[];
};

function rowToGuild(g: GangRow): Guild {
  return {
    id: g.id,
    name: g.name,
    tag: g.tag,
    motto: g.motto,
    members: g.gang_members.map((m) => m.address),
    createdBy: g.created_by,
    createdAt: new Date(g.created_at).getTime(),
    cachedAura: g.gang_members.reduce((s, m) => s + (m.aura_snapshot ?? 0), 0),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function loadGuilds(): Promise<Guild[]> {
  if (!supabaseReady) return [];
  const { data } = await supabase
    .from("gangs")
    .select("*, gang_members(address, aura_snapshot)");
  return (data as GangRow[] ?? []).map(rowToGuild);
}

export async function getPlayerGuildId(addr: string): Promise<string | null> {
  if (!supabaseReady) return null;
  const { data } = await supabase
    .from("gang_members")
    .select("gang_id")
    .eq("address", addr)
    .maybeSingle();
  return data?.gang_id ?? null;
}

export async function getPlayerGuild(addr: string): Promise<Guild | null> {
  const all = await loadGuilds();
  return all.find((g) => g.members.includes(addr)) ?? null;
}

export function getGuildAura(guild: Guild): number {
  return guild.cachedAura;
}

export function getPlayerAuraBalance(addr: string): number {
  return getLocalAura(addr);
}

export async function createGuild(
  addr: string,
  name: string,
  tag: string,
  motto: string,
): Promise<{ guild: Guild } | { error: string }> {
  if (!supabaseReady) return { error: "Database not configured." };

  const balance = getLocalAura(addr);
  if (balance < GUILD_CREATE_COST) {
    return { error: `Need ${GUILD_CREATE_COST} AURA to found a gang. You have ${balance}.` };
  }

  await leaveGuild(addr);

  const auraAfter = balance - GUILD_CREATE_COST;
  try { localStorage.setItem(AURA_KEY(addr), String(auraAfter)); } catch {}

  const id = `guild_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const { error: gangErr } = await supabase.from("gangs").insert({
    id,
    name: name.trim(),
    tag: tag.trim().toUpperCase().slice(0, 4),
    motto: motto.trim() || "Real ones only.",
    created_by: addr,
  });
  if (gangErr) return { error: "Failed to create gang. Try again." };

  await supabase.from("gang_members").insert({
    address: addr,
    gang_id: id,
    aura_snapshot: auraAfter,
  });

  return {
    guild: {
      id,
      name: name.trim(),
      tag: tag.trim().toUpperCase().slice(0, 4),
      motto: motto.trim() || "Real ones only.",
      members: [addr],
      createdBy: addr,
      createdAt: Date.now(),
      cachedAura: auraAfter,
    },
  };
}

export async function joinGuild(addr: string, guildId: string): Promise<boolean> {
  if (!supabaseReady || guildId.startsWith("seed_")) return false;
  await leaveGuild(addr);
  const aura = getLocalAura(addr);
  const { error } = await supabase.from("gang_members").upsert({
    address: addr,
    gang_id: guildId,
    aura_snapshot: aura,
  });
  return !error;
}

export async function leaveGuild(addr: string): Promise<void> {
  if (!supabaseReady) return;
  await supabase.from("gang_members").delete().eq("address", addr);
}
