/**
 * Base de données locale persistante (IndexedDB via Dexie).
 * L'application fonctionne entièrement hors ligne ; la synchronisation
 * multi-appareils (server/) est facultative et se fait par fusion
 * « dernière écriture gagnante » sur le champ updatedAt.
 */
import Dexie, { type Table } from "dexie";
import type {
  ActivityDay,
  Badge,
  LessonProgress,
  ReviewLog,
  Settings,
  UserVideo,
  VocabRecord,
} from "../core/types";

export interface MetaRow {
  key: string;
  value: unknown;
}

export interface ChatRow {
  id: string;
  mode: "tutor" | "conversation";
  title: string;
  messages: Array<{ role: "user" | "assistant"; content: string; demo?: boolean }>;
  updatedAt: number;
}

export class ParlaDB extends Dexie {
  vocab!: Table<VocabRecord, string>;
  reviews!: Table<ReviewLog, string>;
  lessons!: Table<LessonProgress, string>;
  activity!: Table<ActivityDay, string>;
  settings!: Table<Settings, string>;
  badges!: Table<Badge, string>;
  videos!: Table<UserVideo, string>;
  chats!: Table<ChatRow, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = "parla") {
    super(name);
    this.version(1).stores({
      vocab: "id, status, level, pos, dueAt, firstSeenAt, updatedAt, lemma",
      reviews: "id, wordId, at, updatedAt",
      lessons: "id, updatedAt",
      activity: "id, updatedAt",
      settings: "id, updatedAt",
      badges: "id, updatedAt",
      videos: "id, createdAt",
      chats: "id, mode, updatedAt",
      meta: "key",
    });
  }
}

export const db = new ParlaDB();

/** Tables synchronisées avec le serveur (les vidéos locales restent sur l'appareil). */
export const SYNC_TABLES = ["vocab", "reviews", "lessons", "activity", "settings", "badges", "chats"] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return (row?.value as T) ?? fallback;
}
export async function setMeta(key: string, value: unknown) {
  await db.meta.put({ key, value });
}

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
