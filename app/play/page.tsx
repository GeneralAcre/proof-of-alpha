import Link from "next/link";
import { PlayLobby } from "../components/PlayLobby";

const characters = [
  { name: "Gigachad", role: "Pressure bruiser", stat: "+5 intimidation" },
  { name: "Sigma", role: "Counter trader", stat: "+1 Sigma Point odds" },
  { name: "Doomer", role: "Last-life menace", stat: "Stronger under 25 $TEST" },
  { name: "NPC", role: "Defensive default", stat: "+10 starting shield" },
  { name: "Wojak", role: "Swingy wildcard", stat: "High variance steals" },
];

export default function PlayPage() {
  return (
    <main className="min-h-screen bg-[#241F19] text-[#EEF083]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#91897C] bg-[#241F19] p-4">
          <Link className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#EEF083]" href="/">
            Proof of Alpha
          </Link>
          <Link className="rounded-md border border-[#91897C] px-3 py-2 text-sm text-[#EEF083] transition hover:bg-[#EEF083] hover:text-[#241F19]" href="/rules">
            Rules
          </Link>
        </nav>

        <header className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="flex flex-col justify-between rounded-lg border border-[#91897C] bg-[#2f2922] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.38)] sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#EEF083]">Match lobby</p>
              <div className="rounded-md border border-[#EEF083] bg-[#EEF083]/10 px-3 py-1 font-mono text-xs text-[#EEF083]">
                5 players
              </div>
            </div>

            <div className="my-10 space-y-6">
              <h1 className="max-w-3xl text-4xl font-black uppercase leading-[0.95] text-[#EEF083] sm:text-6xl lg:text-7xl">
                Queue the alpha test.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#d8d4a1] sm:text-lg">
                Connect, pick Solo or Multiplayer, choose an archetype, then enter the first 100 $TEST round.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Bankroll", "100 $TEST"],
                ["Turn timer", "10 sec"],
                ["Match target", "3 rounds"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[#91897C] bg-[#241F19]/70 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#91897C]">{label}</p>
                  <p className="mt-2 text-xl font-bold text-[#EEF083]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <PlayLobby characters={characters} />
        </header>
      </section>
    </main>
  );
}
