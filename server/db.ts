/**
 * Base de données serveur : SQLite intégré à Node (node:sqlite, sans dépendance native).
 * Stocke les comptes, les sessions et une copie synchronisée des données
 * d'apprentissage de chaque utilisateur.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function openDb(file = process.env.PARLA_DB ?? resolve("data/parla.db")) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS records (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tbl TEXT NOT NULL,
      id TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      seq INTEGER NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (user_id, tbl, id)
    );
    CREATE INDEX IF NOT EXISTS records_seq ON records(user_id, seq);
    CREATE TABLE IF NOT EXISTS counters (user_id TEXT PRIMARY KEY, seq INTEGER NOT NULL);
  `);
  return db;
}

export type Db = ReturnType<typeof openDb>;
