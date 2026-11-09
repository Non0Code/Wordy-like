/**
 * Synchronisation multi-appareils.
 * Chaque enregistrement porte un updatedAt (horodatage client) ; le serveur
 * conserve la version la plus récente et attribue un numéro de séquence
 * croissant par utilisateur. Un appareil envoie ses modifications et reçoit
 * tout ce qui a changé depuis son dernier curseur.
 */
import type { Db } from "./db";

export const SYNC_TABLES = new Set(["vocab", "reviews", "lessons", "activity", "settings", "badges", "chats"]);
const MAX_CHANGES = 5000;
const MAX_RECORD_BYTES = 200_000;

export interface Change {
  table: string;
  id: string;
  updatedAt: number;
  data: unknown;
}

export function applySync(db: Db, userId: string, since: number, changes: Change[]) {
  if (!Array.isArray(changes)) throw new Error("Format de synchronisation invalide.");
  if (changes.length > MAX_CHANGES) throw new Error("Trop de modifications en une fois.");
  const getSeq = db.prepare("SELECT seq FROM counters WHERE user_id = ?");
  const setSeq = db.prepare("INSERT INTO counters (user_id, seq) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET seq = excluded.seq");
  const getRec = db.prepare("SELECT updated_at FROM records WHERE user_id = ? AND tbl = ? AND id = ?");
  const upsert = db.prepare(
    `INSERT INTO records (user_id, tbl, id, updated_at, seq, data) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, tbl, id) DO UPDATE SET updated_at = excluded.updated_at, seq = excluded.seq, data = excluded.data`,
  );
  let accepted = 0;
  const pushedSeqs = new Set<number>();
  db.exec("BEGIN");
  try {
    let seq = ((getSeq.get(userId) as { seq: number } | undefined)?.seq ?? 0);
    for (const c of changes) {
      if (!SYNC_TABLES.has(c.table) || typeof c.id !== "string" || typeof c.updatedAt !== "number") continue;
      const json = JSON.stringify(c.data);
      if (json.length > MAX_RECORD_BYTES) continue;
      const cur = getRec.get(userId, c.table, c.id) as { updated_at: number } | undefined;
      if (cur && cur.updated_at >= c.updatedAt) continue; // la version serveur est plus récente
      seq += 1;
      upsert.run(userId, c.table, c.id, c.updatedAt, seq, json);
      pushedSeqs.add(seq);
      accepted++;
    }
    setSeq.run(userId, seq);
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
  const rows = db
    .prepare("SELECT tbl, id, updated_at, seq, data FROM records WHERE user_id = ? AND seq > ? ORDER BY seq LIMIT ?")
    .all(userId, since, MAX_CHANGES) as Array<{ tbl: string; id: string; updated_at: number; seq: number; data: string }>;
  const cursor = ((getSeq.get(userId) as { seq: number } | undefined)?.seq ?? 0);
  const out = rows
    .filter((r) => !pushedSeqs.has(r.seq))
    .map((r) => ({ table: r.tbl, id: r.id, updatedAt: r.updated_at, data: JSON.parse(r.data) }));
  const lastSeq = rows.length ? rows[rows.length - 1].seq : cursor;
  return { accepted, changes: out, cursor: rows.length === MAX_CHANGES ? lastSeq : cursor, more: rows.length === MAX_CHANGES };
}
