"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import {
  loadGuilds,
  getGuildAura,
  createGuild,
  joinGuild,
  leaveGuild,
  getPlayerAuraBalance,
  GUILD_CREATE_COST,
  type Guild,
} from "../lib/guilds";

export default function GuildsPage() {
  const { account } = useWallet();
  const addr = account ? String(account.address) : null;

  const [guilds,      setGuilds]      = useState<Guild[]>([]);
  const [myGuild,     setMyGuild]     = useState<Guild | null>(null);
  const [auraBalance, setAuraBalance] = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [creating,    setCreating]    = useState(false);
  const [name,        setName]        = useState("");
  const [tag,         setTag]         = useState("");
  const [motto,       setMotto]       = useState("");
  const [error,       setError]       = useState("");
  const [joining,     setJoining]     = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    const all = await loadGuilds();
    const sorted = all.sort((a, b) => getGuildAura(b) - getGuildAura(a));
    setGuilds(sorted);
    if (addr) {
      setMyGuild(sorted.find((g) => g.members.includes(addr)) ?? null);
      setAuraBalance(getPlayerAuraBalance(addr));
    }
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, [addr]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!addr) { setError("Connect wallet first."); return; }
    if (!name.trim()) { setError("Name required."); return; }
    if (!tag.trim() || tag.trim().length < 2) { setError("Tag must be 2–4 chars."); return; }
    const result = await createGuild(addr, name, tag, motto);
    if ("error" in result) { setError(result.error); return; }
    setCreating(false);
    setName(""); setTag(""); setMotto(""); setError("");
    await refresh();
  }

  async function handleJoin(guildId: string) {
    if (!addr) return;
    setJoining(guildId);
    await joinGuild(addr, guildId);
    setJoining(null);
    await refresh();
  }

  async function handleLeave() {
    if (!addr) return;
    await leaveGuild(addr);
    await refresh();
  }

  const canJoin = (g: Guild) => !g.id.startsWith("seed_");

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">

        {/* Header */}
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#91897C]">Alpha Collective</p>
          <h1 className="text-5xl font-black uppercase">Gangs</h1>
          <p className="mt-2 text-sm text-[#d8d4a1]">
            Form a gang, climb the leaderboard together. Collective AURA = gang strength.
          </p>
        </div>

        {/* My gang */}
        {myGuild ? (
          <section>
            <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#91897C]">Your Gang</p>
            <div className="border-2 border-[#EEF083] bg-[#2f2922] p-5 shadow-[6px_6px_0_#1a1710]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black border border-[#EEF083] px-2 py-0.5 text-[#EEF083]">
                      [{myGuild.tag}]
                    </span>
                    <h2 className="text-2xl font-black uppercase">{myGuild.name}</h2>
                  </div>
                  <p className="mt-1 font-mono text-xs italic text-[#d8d4a1]">"{myGuild.motto}"</p>
                  <div className="mt-3 flex gap-6 font-mono text-xs text-[#91897C]">
                    <span><span className="text-[#EEF083] font-black">{myGuild.members.length}</span> members</span>
                    <span><span className="text-[#EEF083] font-black">{getGuildAura(myGuild).toLocaleString()}</span> AURA</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/guilds/${myGuild.id}`}
                    className="border border-[#91897C] px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083]"
                  >
                    View
                  </Link>
                  {!myGuild.id.startsWith("seed_") && (
                    <button
                      className="border border-[#91897C]/40 px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#91897C]/50 transition hover:border-red-400 hover:text-red-400"
                      onClick={handleLeave}
                      type="button"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#91897C]">Start a Gang</p>

            {!creating ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border border-[#91897C]/30 bg-[#2f2922] px-4 py-3">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#91897C]">Cost to found a gang</p>
                    <p className="font-mono text-xl font-black text-[#ff6b6b] mt-0.5">−{GUILD_CREATE_COST} AURA</p>
                  </div>
                  {addr && (
                    <div className="text-right">
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#91897C]">Your balance</p>
                      <p className={`font-mono text-xl font-black mt-0.5 ${auraBalance >= GUILD_CREATE_COST ? "text-[#EEF083]" : "text-[#ff6b6b]"}`}>
                        {auraBalance} AURA
                      </p>
                    </div>
                  )}
                </div>
                <button
                  className="w-full border-2 border-[#EEF083] bg-[#EEF083] py-4 font-mono text-sm font-black uppercase tracking-widest text-[#241F19] shadow-[4px_4px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => setCreating(true)}
                  type="button"
                  disabled={!addr || auraBalance < GUILD_CREATE_COST}
                >
                  {!addr ? "Connect Wallet to Create" : auraBalance < GUILD_CREATE_COST ? `Need ${GUILD_CREATE_COST} AURA` : "Create Gang"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="border border-[#91897C] bg-[#2f2922] p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#91897C] mb-1">Gang Name</label>
                    <input
                      className="w-full border border-[#91897C] bg-[#241F19] px-3 py-2 font-mono text-sm text-[#EEF083] outline-none focus:border-[#EEF083]"
                      maxLength={32}
                      placeholder="Alpha Legion"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#91897C] mb-1">Tag (2–4 chars)</label>
                    <input
                      className="w-full border border-[#91897C] bg-[#241F19] px-3 py-2 font-mono text-sm text-[#EEF083] uppercase outline-none focus:border-[#EEF083]"
                      maxLength={4}
                      placeholder="ALP"
                      value={tag}
                      onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#91897C] mb-1">Motto</label>
                  <input
                    className="w-full border border-[#91897C] bg-[#241F19] px-3 py-2 font-mono text-sm text-[#EEF083] outline-none focus:border-[#EEF083]"
                    maxLength={60}
                    placeholder="Real ones only."
                    value={motto}
                    onChange={(e) => setMotto(e.target.value)}
                  />
                </div>
                {error && <p className="font-mono text-xs text-[#ff6b6b]">{error}</p>}
                <div className="flex gap-3">
                  <button
                    className="flex-1 border-2 border-[#EEF083] bg-[#EEF083] py-3 font-mono text-xs font-black uppercase text-[#241F19] transition hover:bg-transparent hover:text-[#EEF083]"
                    type="submit"
                  >
                    Found Gang
                  </button>
                  <button
                    className="border border-[#91897C] px-4 py-3 font-mono text-xs uppercase text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083]"
                    onClick={() => { setCreating(false); setError(""); }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* All gangs */}
        <section>
          <p className="mb-3 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#91897C]">
            All Gangs — sorted by AURA
          </p>

          <div className="grid grid-cols-[28px_1fr_60px_70px_80px] gap-3 border border-[#91897C]/30 bg-[#1a1710] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#91897C]">
            <span>#</span>
            <span>Gang</span>
            <span className="text-right">Members</span>
            <span className="text-right hidden sm:block">AURA</span>
            <span className="text-right">Action</span>
          </div>

          <div className="border border-t-0 border-[#91897C]/30 bg-[#2f2922] divide-y divide-[#91897C]/15">
            {loading ? (
              <div className="py-10 text-center font-mono text-xs uppercase tracking-widest text-[#91897C] animate-pulse">
                Loading gangs…
              </div>
            ) : guilds.map((g, i) => {
              const isMe  = myGuild?.id === g.id;
              const aura  = getGuildAura(g);
              return (
                <div
                  key={g.id}
                  className={`grid grid-cols-[28px_1fr_60px_70px_80px] items-center gap-3 px-4 py-3 transition ${isMe ? "bg-[#EEF083]/5" : ""}`}
                >
                  <span className="font-mono text-xs font-black" style={{ color: i === 0 ? "#EEF083" : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : "#91897C" }}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[8px] font-black border px-1.5 py-px"
                        style={{ borderColor: isMe ? "#EEF083" : "#91897C", color: isMe ? "#EEF083" : "#91897C" }}>
                        [{g.tag}]
                      </span>
                      <Link
                        href={`/guilds/${g.id}`}
                        className="font-black uppercase text-sm truncate hover:underline"
                        style={{ color: isMe ? "#EEF083" : "#d8d4a1" }}
                      >
                        {g.name}
                      </Link>
                      {isMe && <span className="font-mono text-[8px] text-[#EEF083] border border-[#EEF083]/40 px-1">YOU</span>}
                    </div>
                    <p className="font-mono text-[9px] text-[#91897C] truncate">"{g.motto}"</p>
                  </div>
                  <span className="text-right font-mono text-xs text-[#91897C]">{g.members.length}</span>
                  <span className="hidden text-right font-mono text-xs font-black text-[#EEF083] sm:block">
                    {aura.toLocaleString()}
                  </span>
                  <div className="text-right">
                    {isMe ? (
                      <span className="font-mono text-[8px] uppercase text-[#EEF083]">Joined</span>
                    ) : canJoin(g) && !myGuild ? (
                      <button
                        className="border border-[#91897C] px-2 py-1 font-mono text-[8px] uppercase text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083] disabled:opacity-40"
                        disabled={!addr || joining === g.id}
                        onClick={() => handleJoin(g.id)}
                        type="button"
                      >
                        {joining === g.id ? "…" : "Join"}
                      </button>
                    ) : (
                      <Link href={`/guilds/${g.id}`} className="font-mono text-[8px] uppercase text-[#91897C] hover:text-[#EEF083]">
                        View
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}
