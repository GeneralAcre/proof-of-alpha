export type StatKey = "aggression" | "defense" | "bluff" | "greed";

export const MAX_LEVEL = 10;

/** AURA cost to go from `level` → `level + 1`. Scales with level. */
export function levelUpCost(currentLevel: number): number {
  return currentLevel * 150;
}

function storageKey(addr: string | null | undefined, archetypeId: string) {
  return `poa_lvl_${addr ?? "anon"}_${archetypeId}`;
}

export function getCharacterLevel(
  addr: string | null | undefined,
  archetypeId: string,
): number {
  try {
    const raw = localStorage.getItem(storageKey(addr, archetypeId));
    const n = raw ? parseInt(raw, 10) : 1;
    return Math.min(Math.max(n, 1), MAX_LEVEL);
  } catch {
    return 1;
  }
}

export function saveCharacterLevel(
  addr: string | null | undefined,
  archetypeId: string,
  level: number,
): void {
  try {
    localStorage.setItem(storageKey(addr, archetypeId), String(level));
  } catch {}
}
