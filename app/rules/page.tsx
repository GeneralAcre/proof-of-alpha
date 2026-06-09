import Link from "next/link";

const matchSteps = [
  ["Connect wallet", "Queue with a Solana wallet and enter the arena."],
  ["Pick mode", "Solo puts you against 4 AI. Multiplayer fills humans plus AI to 5."],
  ["Pick character", "Lock Gigachad, Sigma, Doomer, NPC, or Wojak before the match starts."],
  ["Match starts", "All 5 players receive 100 $TEST."],
  ["Round starts", "You have 10 seconds to secretly choose a move and target."],
  ["Reveal", "All 5 moves reveal simultaneously."],
  ["Resolve on-chain", "$TEST transfers settle and anyone at 0 $TEST is eliminated."],
  ["Locker room", "30 seconds to read scores, swap character, and prepare for the next modifier."],
  ["First to 3", "Round wins decide the match winner and update ranks on-chain."],
];

const modifiers = [
  ["Round 1", "Standard", "Clean baseline rules."],
  ["Round 2", "Greed Mode", "$TEST gains pay 2x."],
  ["Round 3", "Chaos Mode", "A random move hits everyone."],
  ["Round 4", "Scarcity", "No regen between turns."],
  ["Round 5", "Final Stand", "Dead players vote sabotage."],
];

const scoreEvents = [
  ["Win round", "+10 Sigma Points"],
  ["Eliminate someone", "+15 Sigma Points"],
  ["Win match", "+50 Sigma Points"],
];

const ranks = ["NPC", "Beta", "Alpha", "Sigma", "Gigachad"];

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#91897C] bg-[#241F19] p-4">
          <Link className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#EEF083]" href="/">
            Proof of Alpha
          </Link>
          <Link className="rounded-md border border-[#EEF083] bg-[#EEF083] px-3 py-2 text-sm font-black uppercase text-[#241F19]" href="/play">
            Enter arena
          </Link>
        </nav>

        <header className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5 sm:p-7">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Rulebook</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black uppercase leading-none text-[#EEF083] sm:text-6xl">
            First to 3 round wins becomes the match alpha.
          </h1>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Round engine</p>
                <h2 className="mt-2 text-2xl font-black uppercase text-[#EEF083]">Secret picks, public pain.</h2>
              </div>
              <div className="rounded-md border border-[#EEF083] bg-[#EEF083]/10 px-3 py-2 font-mono text-xs uppercase text-[#EEF083]">
                It&apos;s joever broadcast active
              </div>
            </div>

            <ol className="mt-6 grid gap-3">
              {matchSteps.map(([title, detail], index) => (
                <li key={title} className="grid gap-3 rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4 sm:grid-cols-[3rem_1fr]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#91897C] bg-[#241F19] font-mono text-sm text-[#EEF083]">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-[#EEF083]">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#d8d4a1]">{detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>

          <aside className="grid gap-5">
            <section className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Live reveal</p>
              <div className="mt-5 rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4 font-mono text-sm leading-7 text-[#d8d4a1]">
                00:10 pick move + target secretly
                <br />
                00:00 all players reveal
                <br />
                transfer: $TEST settles on-chain
                <br />
                zero balance: eliminated
                <br />
                broadcast: IT&apos;S JOEVER FOR [wallet]
              </div>
            </section>

            <section className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Locker room</p>
              <div className="mt-5 grid gap-3 text-sm text-[#d8d4a1]">
                <p className="rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4">30 seconds between rounds.</p>
                <p className="rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4">Scores visible. Characters can be switched.</p>
                <p className="rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4">Dead players respawn with 50 $TEST.</p>
                <p className="rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4">Round winner starts next round with +20 $TEST.</p>
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr_0.9fr]">
          <article className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Round modifiers</p>
            <div className="mt-5 grid gap-3">
              {modifiers.map(([round, name, detail]) => (
                <div key={round} className="rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#91897C]">{round}</p>
                  <h3 className="mt-1 font-black text-[#EEF083]">{name}</h3>
                  <p className="mt-1 text-sm text-[#d8d4a1]">{detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">Sigma Points</p>
            <div className="mt-5 grid gap-3">
              {scoreEvents.map(([event, reward]) => (
                <div key={event} className="flex items-center justify-between gap-4 rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4">
                  <span className="text-sm text-[#d8d4a1]">{event}</span>
                  <strong className="text-right text-[#EEF083]">{reward}</strong>
                </div>
              ))}
            </div>
            <p className="mt-5 rounded-lg border border-[#EEF083] bg-[#EEF083]/10 p-4 text-sm text-[#EEF083]">
              First player to 3 round wins takes the match payout.
            </p>
          </article>

          <article className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#91897C]">On-chain rank</p>
            <div className="mt-5 flex flex-col gap-2">
              {ranks.map((rank, index) => (
                <div key={rank} className="flex items-center gap-3 rounded-lg border border-[#91897C] bg-[#241F19]/70 p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#EEF083] bg-[#EEF083]/10 font-mono text-xs text-[#EEF083]">
                    {index + 1}
                  </span>
                  <span className="font-black uppercase text-[#EEF083]">{rank}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
