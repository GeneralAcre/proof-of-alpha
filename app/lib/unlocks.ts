// Archetype unlock state — persisted to localStorage per wallet address.
// Alpha and Beta are always free.

const FREE: ReadonlySet<string> = new Set(["alpha", "beta"]);

function storageKey(addr: string | null): string {
  return addr ? `poa_unlocked_${addr}` : "poa_unlocked_anon";
}

export function getUnlocked(addr: string | null): Set<string> {
  const out = new Set(FREE);
  try {
    const raw = localStorage.getItem(storageKey(addr));
    if (raw) {
      for (const id of JSON.parse(raw) as string[]) out.add(id);
    }
  } catch {}
  return out;
}

export function saveUnlock(addr: string | null, archetypeId: string): void {
  const current = getUnlocked(addr);
  current.add(archetypeId);
  const extras = [...current].filter((id) => !FREE.has(id));
  try {
    localStorage.setItem(storageKey(addr), JSON.stringify(extras));
  } catch {}
}

export function isFree(archetypeId: string): boolean {
  return FREE.has(archetypeId);
}
