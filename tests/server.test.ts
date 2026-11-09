import { describe, expect, it, beforeAll, afterAll } from "vitest";
import type { Server } from "node:http";
import { createApp } from "../server/index";
import { openDb } from "../server/db";
import { hashPassword, verifyPassword } from "../server/auth";

let server: Server;
let base = "";

beforeAll(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const app = createApp(openDb(":memory:"));
  await new Promise<void>((r) => {
    server = app.listen(0, () => r());
  });
  const addr = server.address();
  base = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}/api`;
});
afterAll(() => server.close());

const post = (path: string, body: unknown, token?: string) =>
  fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

describe("Serveur", () => {
  it("hache et vérifie les mots de passe", () => {
    const h = hashPassword("secret-123");
    expect(h).not.toContain("secret-123");
    expect(verifyPassword("secret-123", h)).toBe(true);
    expect(verifyPassword("autre", h)).toBe(false);
  });

  it("signale l'absence d'IA sans simuler de réponse", async () => {
    const h = await (await fetch(base + "/health")).json();
    expect(h).toMatchObject({ ok: true, ai: false });
    const r = await post("/ai/chat", { messages: [{ role: "user", content: "ciao" }] });
    expect(r.status).toBe(503);
  });

  it("inscrit, connecte et refuse un mauvais mot de passe", async () => {
    const r = await post("/auth/register", { email: "Test@Parla.it", password: "password123", name: "Test" });
    expect(r.status).toBe(201);
    expect((await post("/auth/register", { email: "test@parla.it", password: "password123" })).status).toBe(409);
    expect((await post("/auth/login", { email: "test@parla.it", password: "mauvais!!" })).status).toBe(401);
    expect((await post("/auth/login", { email: "test@parla.it", password: "password123" })).status).toBe(200);
    expect((await post("/auth/register", { email: "x@y.z", password: "court" })).status).toBe(400);
  });

  it("synchronise deux appareils (dernière écriture gagnante)", async () => {
    const { token } = await (await post("/auth/register", { email: "sync@parla.it", password: "password123" })).json();
    const a = await (await post("/sync", { since: 0, changes: [{ table: "vocab", id: "casa", updatedAt: 10, data: { id: "casa", status: "learning", updatedAt: 10 } }] }, token)).json();
    expect(a.accepted).toBe(1);
    // Appareil B : version plus ancienne → ignorée ; il reçoit la version du serveur.
    const b = await (await post("/sync", { since: 0, changes: [{ table: "vocab", id: "casa", updatedAt: 5, data: { id: "casa", status: "unknown", updatedAt: 5 } }] }, token)).json();
    expect(b.accepted).toBe(0);
    expect(b.changes[0].data.status).toBe("learning");
    // Table inconnue refusée silencieusement
    const c = await (await post("/sync", { since: b.cursor, changes: [{ table: "users", id: "x", updatedAt: 1, data: {} }] }, token)).json();
    expect(c.accepted).toBe(0);
    expect(c.changes).toEqual([]);
  });

  it("exige une authentification pour la synchronisation", async () => {
    expect((await post("/sync", { since: 0, changes: [] })).status).toBe(401);
    expect((await post("/sync", { since: 0, changes: [] }, "jeton-invalide")).status).toBe(401);
  });
});
