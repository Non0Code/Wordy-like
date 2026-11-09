/**
 * Client de synchronisation : envoie les enregistrements modifiés depuis la
 * dernière synchronisation et applique ceux reçus du serveur s'ils sont plus récents.
 */
import { db, getMeta, setMeta, SYNC_TABLES, type SyncTable } from "./db";
import { api } from "../ai/api";

interface Change {
  table: SyncTable;
  id: string;
  updatedAt: number;
  data: { id: string; updatedAt: number };
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  at: number;
}

const table = (t: SyncTable) => db.table(t);

/** Fusion « dernière écriture gagnante » (exportée pour les tests). */
export function shouldApply(local: { updatedAt?: number } | undefined, remote: { updatedAt: number }): boolean {
  return !local || (local.updatedAt ?? 0) < remote.updatedAt;
}

export async function syncNow(): Promise<SyncResult> {
  const token = await getMeta<string | null>("authToken", null);
  if (!token) throw new Error("Connectez-vous pour synchroniser vos appareils.");
  const lastPush = await getMeta<number>("lastPushAt", 0);
  let cursor = await getMeta<number>("syncCursor", 0);
  const startedAt = Date.now();

  const changes: Change[] = [];
  for (const t of SYNC_TABLES) {
    const rows = (await table(t).where("updatedAt").above(lastPush).toArray()) as Array<{ id: string; updatedAt: number }>;
    for (const r of rows) changes.push({ table: t, id: r.id, updatedAt: r.updatedAt, data: r });
  }

  let pulled = 0;
  let pushedOnce = false;
  let more = true;
  while (more) {
    const res = await api<{ accepted: number; changes: Change[]; cursor: number; more: boolean }>(
      "/sync",
      { since: cursor, changes: pushedOnce ? [] : changes },
      { auth: true },
    );
    pushedOnce = true;
    await db.transaction("rw", SYNC_TABLES.map((t) => table(t)), async () => {
      for (const c of res.changes) {
        if (!(SYNC_TABLES as readonly string[]).includes(c.table)) continue;
        const local = (await table(c.table).get(c.id)) as { updatedAt?: number } | undefined;
        if (shouldApply(local, c)) {
          await table(c.table).put(c.data);
          pulled++;
        }
      }
    });
    cursor = res.cursor;
    more = res.more;
  }
  await setMeta("syncCursor", cursor);
  await setMeta("lastPushAt", startedAt);
  await setMeta("lastSyncAt", Date.now());
  return { pushed: changes.length, pulled, at: Date.now() };
}

export async function logout() {
  try {
    await api("/auth/logout", {}, { auth: true });
  } catch {
    /* déconnexion locale même si le serveur est injoignable */
  }
  await setMeta("authToken", null);
  await setMeta("authUser", null);
  await setMeta("syncCursor", 0);
  await setMeta("lastPushAt", 0);
}
