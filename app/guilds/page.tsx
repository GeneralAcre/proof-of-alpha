"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "../components/Nav";
import { useWallet } from "../components/WalletProvider";
import { supabase, supabaseReady } from "../lib/supabase";
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
  const [submitting,  setSubmitting]  = useState(false);
  const [name,        setName]        = useState("");
  const [tag,         setTag]         = useState("");
  const [motto,       setMotto]       = useState("");
  const [error,       setError]       = useState("");
  const [joining,     setJoining]     = useState<string | null>(null);

  async function refresh() {
    const all = await loadGuilds();
    const sorted = all.sort((a, b) => getGuildAura(b) - getGuildAura(a));
    setGuilds(sorted);
    if (addr) {
      setMyGuild(sorted.find((g) => g.members.includes(addr)) ?? null);
      setAuraBalance(getPlayerAuraBalance(addr));
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();

    if (!supabaseReady) return;

    const channel = supabase
      .channel("gangs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "gangs" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "gang_members" }, () => void refresh())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [addr]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!addr) { setError("Connect wallet first."); return; }
    if (!name.trim()) { setError("Gang name required."); return; }
    if (!tag.trim() || tag.trim().length < 2) { setError("Tag must be 2–4 chars."); return; }
    setSubmitting(true);
    setError("");
    const result = await createGuild(addr, name, tag, motto);
    setSubmitting(false);
    if ("error" in result) { setError(result.error); return; }
    setCreating(false);
    setName(""); setTag(""); setMotto("");
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
  const canAffordCreate = auraBalance >= GUILD_CREATE_COST;
  const auraAfter = auraBalance - GUILD_CREATE_COST;

  return (
    <div className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <Nav />
      <main className="px-4 py-10 sm:px-8 space-y-10">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Alpha Collective</p>
            <h1 className="mt-1 text-5xl font-black uppercase sm:text-6xl">Gangs</h1>
            <p className="mt-2 font-mono text-sm text-[#91897C]">
              Form a gang, climb the leaderboard together.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {supabaseReady && (
              <div className="flex items-center gap-2 border border-[#91897C]/30 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#00FF9D] animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#91897C]">Live</span>
              </div>
            )}
            {addr && (
              <div className="border border-[#91897C]/30 px-4 py-2 text-right">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#91897C]">Your AURA</p>
                <p className="mt-0.5 font-mono text-xl font-black leading-none text-[#EEF083]">{auraBalance}</p>
              </div>
            )}
          </div>
        </div>

        {/* My gang panel */}
        {myGuild && (
          <section>
            <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#91897C]">Your Gang</p>
            <div className="border-2 border-[#EEF083] bg-[#2f2922] p-5 sm:p-6 shadow-[6px_6px_0_#1a1710]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-[#EEF083] px-2 py-0.5 font-mono text-xs font-black text-[#EEF083]">
                      [{myGuild.tag}]
                    </span>
                    <h2 className="text-2xl font-black uppercase sm:text-3xl">{myGuild.name}</h2>
                  </div>
                  {myGuild.motto && (
                    <p className="mt-1 font-mono text-sm italic text-[#91897C]">"{myGuild.motto}"</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-5 font-mono text-sm text-[#91897C]">
                    <span><span className="font-black text-[#EEF083]">{myGuild.members.length}</span> members</span>
                    <span><span className="font-black text-[#EEF083]">{getGuildAura(myGuild).toLocaleString()}</span> AURA</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/guilds/${myGuild.id}`}
                    className="border border-[#91897C] px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083] touch-manipulation"
                  >
                    View
                  </Link>
                  {!myGuild.id.startsWith("seed_") && (
                    <button
                      className="border border-[#91897C]/40 px-4 py-2.5 font-mono text-xs uppercase tracking-wide text-[#91897C]/50 transition hover:border-red-400 hover:text-red-400 touch-manipulation"
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
        )}

        {/* Create gang */}
        {!myGuild && (
          <section>
            <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#91897C]">Start a Gang</p>

            {!creating ? (
              <div className="space-y-3">
                {/* Cost breakdown */}
                <div className="grid grid-cols-2 divide-x divide-[#91897C]/20 border border-[#91897C]/30 bg-[#1a1710]">
                  <div className="px-5 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#91897C]">Cost to found</p>
                    <p className="mt-1 font-mono text-2xl font-black text-[#ff6b6b]">−{GUILD_CREATE_COST}</p>
                    <p className="font-mono text-[10px] text-[#91897C]">AURA</p>
                  </div>
                  {addr ? (
                    <div className="px-5 py-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#91897C]">Balance after</p>
                      <p className={`mt-1 font-mono text-2xl font-black ${canAffordCreate ? "text-[#EEF083]" : "text-[#ff6b6b]"}`}>
                        {canAffordCreate ? auraAfter : auraBalance}
                      </p>
                      <p className="font-mono text-[10px] text-[#91897C]">
                        {canAffordCreate ? "AURA remaining" : `need ${GUILD_CREATE_COST - auraBalance} more`}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center px-5 py-4">
                      <p className="font-mono text-xs text-[#91897C]">Connect wallet to see your balance</p>
                    </div>
                  )}
                </div>

                <button
                  className="w-full border-2 border-[#EEF083] bg-[#EEF083] py-4 font-mono text-sm font-black uppercase tracking-widest text-[#241F19] shadow-[4px_4px_0_#91897C] transition hover:bg-transparent hover:text-[#EEF083] disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
                  onClick={() => setCreating(true)}
                  type="button"
                  disabled={!addr || !canAffordCreate}
                >
                  {!addr
                    ? "Connect Wallet to Create"
                    : !canAffordCreate
                    ? `Need ${GUILD_CREATE_COST} AURA to Found`
                    : "Create Gang — Spend " + GUILD_CREATE_COST + " AURA"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="border border-[#91897C]/60 bg-[#1a1710]">
                <div className="border-b border-[#91897C]/30 px-5 py-4">
                  <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#EEF083]">New Gang</p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#91897C]">
                    Costs {GUILD_CREATE_COST} AURA · You have {auraBalance} · Balance after: {auraAfter}
                  </p>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#91897C]">
                        Gang Name
                      </label>
                      <input
                        className="w-full border border-[#91897C] bg-[#241F19] px-3 py-3 font-mono text-sm text-[#EEF083] outline-none focus:border-[#EEF083] touch-manipulation"
                        maxLength={32}
                        placeholder="Alpha Legion"
                        autoComplete="off"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#91897C]">
                        Tag <span className="normal-case">(2–4 chars)</span>
                      </label>
                      <input
                        className="w-full border border-[#91897C] bg-[#241F19] px-3 py-3 font-mono text-sm uppercase text-[#EEF083] outline-none focus:border-[#EEF083] touch-manipulation"
                        maxLength={4}
                        placeholder="ALP"
                        autoComplete="off"
                        value={tag}
                        onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-[#91897C]">
                      Motto <span className="normal-case text-[#91897C]/60">(optional)</span>
                    </label>
                    <input
                      className="w-full border border-[#91897C] bg-[#241F19] px-3 py-3 font-mono text-sm text-[#EEF083] outline-none focus:border-[#EEF083] touch-manipulation"
                      maxLength={60}
                      placeholder="Real ones only."
                      autoComplete="off"
                      value={motto}
                      onChange={(e) => setMotto(e.target.value)}
                    />
                  </div>

                  {error && (
                    <p className="border border-[#ff6b6b]/30 bg-[#ff6b6b]/5 px-4 py-3 font-mono text-xs text-[#ff6b6b]">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      className="flex-1 border-2 border-[#EEF083] bg-[#EEF083] py-3 font-mono text-sm font-black uppercase tracking-wide text-[#241F19] transition hover:bg-transparent hover:text-[#EEF083] disabled:opacity-50 touch-manipulation"
                      type="submit"
                      disabled={submitting}
                    >
                      {submitting ? "Founding…" : `Found Gang — −${GUILD_CREATE_COST} AURA`}
                    </button>
                    <button
                      className="border border-[#91897C]/50 px-5 py-3 font-mono text-sm uppercase text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083] touch-manipulation"
                      onClick={() => { setCreating(false); setError(""); }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>
        )}

        {/* All gangs list */}
        <section>
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#91897C]">
              All Gangs — ranked by AURA
            </p>
            {loading && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#91897C] animate-pulse">Loading…</span>
            )}
          </div>

          {/* Header row — 4 cols mobile, 5 cols desktop */}
          <div className="grid grid-cols-[28px_1fr_52px_64px] sm:grid-cols-[32px_1fr_64px_88px_72px] gap-2 sm:gap-3 border border-[#91897C]/30 bg-[#1a1710] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#91897C]">
            <span>#</span>
            <span>Gang</span>
            <span className="text-right">Members</span>
            <span className="text-right hidden sm:block">AURA</span>
            <span className="text-right">Action</span>
          </div>

          <div className="border border-t-0 border-[#91897C]/30 divide-y divide-[#91897C]/15">
            {guilds.length === 0 && !loading ? (
              <div className="bg-[#1a1710] py-12 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-[#91897C]">No gangs yet. Be the first.</p>
              </div>
            ) : guilds.map((g, i) => {
              const isMe = myGuild?.id === g.id;
              const aura = getGuildAura(g);
              const rankColor = i === 0 ? "#EEF083" : i === 1 ? "#aaa" : i === 2 ? "#cd7f32" : "#91897C";

              return (
                <div
                  key={g.id}
                  className={`grid grid-cols-[28px_1fr_52px_64px] sm:grid-cols-[32px_1fr_64px_88px_72px] items-center gap-2 sm:gap-3 px-4 py-3.5 transition ${isMe ? "bg-[#EEF083]/5" : "bg-[#1a1710] hover:bg-[#1e1a14]"}`}
                >
                  {/* Rank */}
                  <span className="font-mono text-sm font-black" style={{ color: rankColor }}>
                    {i + 1}
                  </span>

                  {/* Name + motto */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="shrink-0 border px-1.5 py-px font-mono text-[9px] font-black"
                        style={{ borderColor: isMe ? "#EEF083" : "#91897C55", color: isMe ? "#EEF083" : "#91897C" }}
                      >
                        [{g.tag}]
                      </span>
                      <Link
                        href={`/guilds/${g.id}`}
                        className="truncate font-black uppercase text-sm hover:underline"
                        style={{ color: isMe ? "#EEF083" : "#d8d4a1" }}
                      >
                        {g.name}
                      </Link>
                      {isMe && (
                        <span className="shrink-0 border border-[#EEF083]/40 px-1 font-mono text-[8px] text-[#EEF083]">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-[#91897C]">"{g.motto}"</p>
                  </div>

                  {/* Members */}
                  <span className="text-right font-mono text-sm text-[#91897C]">{g.members.length}</span>

                  {/* AURA — desktop only */}
                  <span className="hidden text-right font-mono text-sm font-black text-[#EEF083] sm:block">
                    {aura.toLocaleString()}
                  </span>

                  {/* Action */}
                  <div className="text-right">
                    {isMe ? (
                      <span className="font-mono text-xs uppercase text-[#EEF083]">Joined</span>
                    ) : canJoin(g) && !myGuild ? (
                      <button
                        className="border border-[#91897C]/50 px-3 py-1.5 font-mono text-xs uppercase text-[#91897C] transition hover:border-[#EEF083] hover:text-[#EEF083] disabled:opacity-40 touch-manipulation"
                        disabled={!addr || joining === g.id}
                        onClick={() => handleJoin(g.id)}
                        type="button"
                      >
                        {joining === g.id ? "…" : "Join"}
                      </button>
                    ) : (
                      <Link
                        href={`/guilds/${g.id}`}
                        className="font-mono text-xs uppercase text-[#91897C] hover:text-[#EEF083] touch-manipulation"
                      >
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
