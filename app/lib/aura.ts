export const STARTING_AURA = 200;

export function auraKey(address: string | null | undefined): string {
  return address ? `poa_aura_${address}` : "poa_aura_anonymous";
}

export function readAura(address: string | null | undefined): number {
  try { return Number(localStorage.getItem(auraKey(address)) ?? "0") || 0; } catch { return 0; }
}

export function saveAura(address: string | null | undefined, amount: number): void {
  try { localStorage.setItem(auraKey(address), String(amount)); } catch {}
}

/**
 * Returns the player's AURA balance. If they have none (brand-new player),
 * initialises their balance to STARTING_AURA and persists it so every page
 * shows the same number from the very first visit.
 */
export function getOrInitAura(address: string | null | undefined): number {
  const saved = readAura(address);
  if (saved === 0 && address) {
    saveAura(address, STARTING_AURA);
    return STARTING_AURA;
  }
  return saved;
}
