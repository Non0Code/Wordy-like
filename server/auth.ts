/**
 * Authentification par e-mail + mot de passe.
 * - Mots de passe hachés avec scrypt (sel aléatoire, comparaison en temps constant).
 * - Jetons de session aléatoires ; seul leur hachage SHA-256 est stocké.
 */
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { Db } from "./db";

const SESSION_DAYS = 60;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export function createSession(db: Db, userId: string): string {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  db.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    sha(token),
    userId,
    now,
    now + SESSION_DAYS * 86_400_000,
  );
  return token;
}

export function deleteSession(db: Db, token: string) {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
}

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; name: string };
  token?: string;
}

export function authMiddleware(db: Db) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Authentification requise." });
    const row = db
      .prepare(
        "SELECT u.id, u.email, u.name, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
      )
      .get(sha(token)) as { id: string; email: string; name: string; expires_at: number } | undefined;
    if (!row || row.expires_at < Date.now()) return res.status(401).json({ error: "Session expirée. Reconnectez-vous." });
    req.user = { id: row.id, email: row.email, name: row.name };
    req.token = token;
    next();
  };
}

export function register(db: Db, email: string, name: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) throw new HttpError(400, "Adresse e-mail invalide.");
  if (password.length < 8) throw new HttpError(400, "Le mot de passe doit contenir au moins 8 caractères.");
  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(cleanEmail);
  if (exists) throw new HttpError(409, "Un compte existe déjà avec cette adresse.");
  const id = randomUUID();
  db.prepare("INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(
    id,
    cleanEmail,
    name.trim().slice(0, 60) || cleanEmail.split("@")[0],
    hashPassword(password),
    Date.now(),
  );
  return { id, email: cleanEmail };
}

export function login(db: Db, email: string, password: string) {
  const row = db.prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?").get(email.trim().toLowerCase()) as
    | { id: string; email: string; name: string; password_hash: string }
    | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) throw new HttpError(401, "E-mail ou mot de passe incorrect.");
  return row;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
