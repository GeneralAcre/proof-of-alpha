"use client";

import { useMemo, useState } from "react";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { SolanaWalletConnect } from "./SolanaWalletConnect";

type Character = {
  name: string;
  role: string;
  stat: string;
};

type PlayLobbyProps = {
  characters: readonly Character[];
};

const modes = [
  { name: "Solo", detail: "You vs 4 AI" },
  { name: "Multiplayer", detail: "Humans plus AI fill to 5" },
] as const;

export function PlayLobby({ characters }: PlayLobbyProps) {
  const [account, setAccount] = useState<WalletAccount>();
  const [wallet, setWallet] = useState<Wallet>();
  const [mode, setMode] = useState<(typeof modes)[number]["name"]>("Solo");
  const [characterName, setCharacterName] = useState(characters[0]?.name ?? "");
  const [queuedLobbyKey, setQueuedLobbyKey] = useState<string>();

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.name === characterName) ?? characters[0],
    [characterName, characters],
  );

  const canEnterLobby = Boolean(account && selectedCharacter);
  const lobbyKey = account && selectedCharacter ? `${account.address}:${mode}:${selectedCharacter.name}` : undefined;
  const hasQueuedLobby = Boolean(lobbyKey && queuedLobbyKey === lobbyKey);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5">
        <SolanaWalletConnect
          onAccountChange={(nextAccount, nextWallet) => {
            setAccount(nextAccount);
            setWallet(nextWallet);
          }}
        />
      </section>

      <section className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#EEF083]">Pick mode</p>
        <div className="mt-5 grid gap-3">
          {modes.map((nextMode) => {
            const isSelected = mode === nextMode.name;

            return (
              <button
                className={`rounded-lg border px-4 py-3 text-left text-sm font-black uppercase transition ${
                  isSelected
                    ? "border-[#EEF083] bg-[#EEF083] text-[#241F19]"
                    : "border-[#91897C] bg-[#241F19]/70 text-[#EEF083] hover:border-[#EEF083]"
                }`}
                key={nextMode.name}
                onClick={() => setMode(nextMode.name)}
                type="button"
              >
                {nextMode.name}
                <span className={`block text-xs font-semibold normal-case ${isSelected ? "text-[#241F19]" : "text-[#91897C]"}`}>
                  {nextMode.detail}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5 md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#EEF083]">Pick character</p>
          <div className="rounded-md border border-[#91897C] bg-[#241F19]/70 px-3 py-2 font-mono text-xs uppercase text-[#d8d4a1]">
            {wallet ? `${wallet.name} ready` : "Wallet required"}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {characters.map((character) => {
            const isSelected = character.name === characterName;

            return (
              <button
                className={`rounded-lg border p-4 text-left transition ${
                  isSelected
                    ? "border-[#EEF083] bg-[#EEF083] text-[#241F19]"
                    : "border-[#91897C] bg-[#241F19]/70 text-[#EEF083] hover:border-[#EEF083]"
                }`}
                key={character.name}
                onClick={() => setCharacterName(character.name)}
                type="button"
              >
                <span
                  className={`flex h-16 items-center justify-center rounded-md border font-black uppercase ${
                    isSelected ? "border-[#241F19] bg-[#241F19] text-[#EEF083]" : "border-[#EEF083] bg-[#EEF083]/10 text-[#EEF083]"
                  }`}
                >
                  {character.name.slice(0, 2)}
                </span>
                <span className="mt-4 block text-lg font-black">{character.name}</span>
                <span className={`mt-1 block text-sm ${isSelected ? "text-[#241F19]" : "text-[#d8d4a1]"}`}>{character.role}</span>
                <span className="mt-3 block font-mono text-xs uppercase tracking-[0.12em]">{character.stat}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-[#91897C] bg-[#2f2922] p-5 md:col-span-2">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#EEF083]">Lobby ticket</p>
            <p className="mt-2 text-sm leading-6 text-[#d8d4a1]">
              {account
                ? `${mode} as ${selectedCharacter?.name}. Entry is staged for Solana devnet plus MagicBlock ER.`
                : "Authorize a Solana Mobile wallet to stage the devnet lobby entry."}
            </p>
          </div>
          <button
            className="rounded-lg border border-[#EEF083] bg-[#EEF083] px-5 py-3 text-sm font-black uppercase text-[#241F19] transition hover:bg-[#f5f6a5] disabled:cursor-not-allowed disabled:border-[#91897C] disabled:bg-[#241F19]/70 disabled:text-[#91897C]"
            disabled={!canEnterLobby}
            onClick={() => setQueuedLobbyKey(lobbyKey)}
            type="button"
          >
            {hasQueuedLobby ? "Lobby staged" : "Enter lobby"}
          </button>
        </div>
        {hasQueuedLobby ? (
          <div className="mt-4 rounded-lg border border-[#EEF083] bg-[#EEF083]/10 p-4 font-mono text-xs uppercase tracking-[0.14em] text-[#EEF083]">
            Ready for MagicBlock ER. Transaction signing stays off until the game program and escrow are implemented.
          </div>
        ) : null}
      </section>
    </div>
  );
}
