export type StatKey = "aggression" | "defense" | "bluff" | "greed";
export type StatUpgrades = Record<StatKey, number>;

export const UPGRADE_COST = 200;

const ZERO: StatUpgrades = { aggression: 0, defense: 0, bluff: 0, greed: 0 };

function storageKey(addr: string | null | undefined, archetypeId: string) {
  return `poa_upg_${addr ?? "anon"}_${archetypeId}`;
}

export function getUpgrades(
  addr: string | null | undefined,
  archetypeId: string,
): StatUpgrades {
  try {
    const raw = localStorage.getItem(storageKey(addr, archetypeId));
    return raw ? { ...ZERO, ...JSON.parse(raw) } : { ...ZERO };
  } catch {
    return { ...ZERO };
  }
}

export function saveUpgrade(
  addr: string | null | undefined,
  archetypeId: string,
  stat: StatKey,
  points: number,
): void {
  const current = getUpgrades(addr, archetypeId);
  current[stat] = points;
  try {
    localStorage.setItem(storageKey(addr, archetypeId), JSON.stringify(current));
  } catch {}
}
