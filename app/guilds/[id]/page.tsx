"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Nav } from "../../components/Nav";
import { useWallet } from "../../components/WalletProvider";
import { loadGuilds, getGuildAura, joinGuild, leaveGuild, type Guild } from "../../lib/guilds";

function truncAddr(addr: string) {
  return addr.startsWith("seed_") ? `BOT_${addr.slice(-3).toUpperCase()}` : `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function GuildDetailPage() {
  const params  = useParams<{ id: string }>();
  const guildId = decodeURIComponent(params.id);
  const { account } = useWallet();
  const addr = account ? String(account.address) : null;

  const [guild,   setGuild]   = useState<Guild | null>(null);
  const [myGuild, setMyGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);

  async function refresh() {
    setLoading(true);
    const all = await loadGuilds();
    setGuild(all.find((g) => g.id === guildId) ?? null);
    if (addr) setMyGuild(all.find((g) => g.members.includes(addr)) ?? null);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, [guildId, addr]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleJoin() {
    if (!addr) return;
    setActing(true);
    await joinGuild(addr, guildId);
    await refresh();
    setActing(false);
  }

  async function handleLeave() {
    if (!addr) return;
    setActing(true);
    await leaveGuild(addr);
    await refresh();
    setActing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="font-mono text-xs uppercase animate-pulse text-[#91897C]">Loading…</p>
        </main>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="font-mono text-xs uppercase text-[#91897C]">Gang not found.</p>
          <Link href="/guilds" className="mt-4 inline-block font-mono text-xs text-[#EEF083] underline">Back to Gangs</Link>
        </main>
      </div>
    );
  }

  const isMyGuild = myGuild?.id === guild.id;
  const canJoin   = !guild.id.startsWith("seed_") && !myGuild && !!addr;
  const totalAura = getGuildAura(guild);

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 space-y-8">

        <Link href="/guilds" className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#91897C] transition hover:text-[#EEF083]">
          All Gangs
        </Link>

        {/* Guild card */}
        <div className="border-2 border-[#EEF083] bg-[#2f2922] p-6 shadow-[8px_8px_0_#1a1710]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm font-black border-2 border-[#EEF083] px-3 py-1 text-[#EEF083]">
                  [{guild.tag}]
                </span>
                <h1 className="text-3xl font-black uppercase sm:text-4xl">{guild.name}</h1>
              </div>
              <p className="mt-2 font-mono text-sm italic text-[#d8d4a1]">"{guild.motto}"</p>
            </div>
            {canJoin && (
              <button
                className="shrink-0 border-2 border-[#EEF083] bg-[#EEF083] px-6 py-3 font-mono text-xs font-black uppercase text-[#241F19] transition hover:bg-transparent hover:text-[#EEF083] disabled:opacity-40"
                disabled={acting}
                onClick={handleJoin}
                type="button"
              >
                {acting ? "Joining…" : "Join Gang"}
              </button>
            )}
            {isMyGuild && !guild.id.startsWith("seed_") && (
              <button
                className="shrink-0 border border-[#91897C]/40 px-4 py-3 font-mono text-xs uppercase text-[#91897C] transition hover:border-red-400 hover:text-red-400"
                onClick={handleLeave}
                type="button"
              >
                Leave
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 divide-x divide-[#91897C]/30 border border-[#91897C]/30">
            <div className="px-4 py-3 text-center">
              <p className="font-mono text-[9px] uppercase text-[#91897C]">Members</p>
              <p className="mt-1 font-mono text-2xl font-black">{guild.members.length}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="font-mono text-[9px] uppercase text-[#91897C]">Total AURA</p>
              <p className="mt-1 font-mono text-2xl font-black text-[#EEF083]">{totalAura.toLocaleString()}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="font-mono text-[9px] uppercase text-[#91897C]">Avg AURA</p>
              <p className="mt-1 font-mono text-2xl font-black text-[#d8d4a1]">
                {guild.members.length > 0 ? Math.round(totalAura / guild.members.length).toLocaleString() : "0"}
              </p>
            </div>
          </div>
        </div>

        {/* Member list */}
        <section>
          <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#91897C]">
            Roster — {guild.members.length} members
          </p>
          <div className="border border-[#91897C]/30 bg-[#2f2922] divide-y divide-[#91897C]/15">
            {guild.members.map((member, i) => {
              const isYou     = member === addr;
              const isFounder = member === guild.createdBy;
              return (
                <div key={member} className={`flex items-center gap-3 px-4 py-3 ${isYou ? "bg-[#EEF083]/5" : ""}`}>
                  <span className="font-mono text-[10px] text-[#91897C]/50 w-5">{i + 1}</span>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center border font-mono text-[9px] font-black"
                    style={{ borderColor: isYou ? "#EEF083" : "#91897C", color: isYou ? "#EEF083" : "#91897C" }}>
                    {truncAddr(member).slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-mono text-xs font-black" style={{ color: isYou ? "#EEF083" : "#d8d4a1" }}>
                      {isYou ? "You" : truncAddr(member)}
                    </p>
                    {isFounder && <p className="font-mono text-[8px] uppercase text-[#91897C]">Founder</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Invite link */}
        {isMyGuild && !guild.id.startsWith("seed_") && (
          <section>
            <p className="mb-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#91897C]">Invite Link</p>
            <div className="flex items-center gap-2 border border-[#91897C]/40 bg-[#1a1710] px-4 py-3">
              <span className="flex-1 font-mono text-xs text-[#d8d4a1] truncate">
                {typeof window !== "undefined" ? `${window.location.origin}/guilds/${guild.id}` : `/guilds/${guild.id}`}
              </span>
              <button
                className="shrink-0 border border-[#91897C] px-3 py-1.5 font-mono text-[9px] uppercase text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083]"
                onClick={() => {
                  if (typeof window !== "undefined")
                    navigator.clipboard.writeText(`${window.location.origin}/guilds/${guild.id}`).catch(() => {});
                }}
                type="button"
              >
                Copy
              </button>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
