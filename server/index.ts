/**
 * Serveur Parla : API (comptes, synchronisation, professeur IA) +
 * fichiers statiques de l'application en production.
 */
import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { openDb, type Db } from "./db";
import { authMiddleware, createSession, deleteSession, HttpError, login, register, type AuthedRequest } from "./auth";
import { applySync } from "./sync";
import { AiError, MODEL, aiAvailable, chat, correct, translateInContext } from "./ai";

export function createApp(db: Db = openDb()) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "5mb" }));
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    next();
  });

  // Limitation de débit simple, en mémoire (par IP et par route).
  const hits = new Map<string, { n: number; reset: number }>();
  const limit = (max: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const h = hits.get(key);
    if (!h || h.reset < now) hits.set(key, { n: 1, reset: now + windowMs });
    else if (++h.n > max) return res.status(429).json({ error: "Trop de requêtes, patientez un instant." });
    next();
  };

  const wrap =
    (fn: (req: AuthedRequest, res: Response) => unknown) => async (req: AuthedRequest, res: Response, next: NextFunction) => {
      try {
        await fn(req, res);
      } catch (e) {
        next(e);
      }
    };

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ai: aiAvailable(), model: aiAvailable() ? MODEL : null, sync: true });
  });

  // ——— Comptes ———
  app.post(
    "/api/auth/register",
    limit(10, 60_000),
    wrap((req, res) => {
      const { email, password, name } = req.body ?? {};
      if (typeof email !== "string" || typeof password !== "string") throw new HttpError(400, "Champs manquants.");
      const user = register(db, email, typeof name === "string" ? name : "", password);
      const token = createSession(db, user.id);
      res.status(201).json({ token, user: { id: user.id, email: user.email, name: name || user.email.split("@")[0] } });
    }),
  );
  app.post(
    "/api/auth/login",
    limit(20, 60_000),
    wrap((req, res) => {
      const { email, password } = req.body ?? {};
      if (typeof email !== "string" || typeof password !== "string") throw new HttpError(400, "Champs manquants.");
      const user = login(db, email, password);
      const token = createSession(db, user.id);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    }),
  );
  const auth = authMiddleware(db);
  app.get("/api/auth/me", auth, (req: AuthedRequest, res) => res.json({ user: req.user }));
  app.post("/api/auth/logout", auth, (req: AuthedRequest, res) => {
    deleteSession(db, req.token!);
    res.json({ ok: true });
  });
  app.delete(
    "/api/auth/account",
    auth,
    wrap((req, res) => {
      db.prepare("DELETE FROM users WHERE id = ?").run(req.user!.id);
      res.json({ ok: true });
    }),
  );

  // ——— Synchronisation ———
  app.post(
    "/api/sync",
    auth,
    limit(60, 60_000),
    wrap((req, res) => {
      const since = Number(req.body?.since ?? 0) || 0;
      res.json(applySync(db, req.user!.id, since, req.body?.changes ?? []));
    }),
  );

  // ——— Professeur IA ———
  const aiLimit = limit(30, 60_000);
  app.post(
    "/api/ai/chat",
    aiLimit,
    wrap(async (req, res) => {
      const { mode, level, messages, weakWords, scenario } = req.body ?? {};
      if (!Array.isArray(messages)) throw new HttpError(400, "Messages manquants.");
      const reply = await chat({
        mode: mode === "conversation" ? "conversation" : "tutor",
        level: typeof level === "string" ? level : "A1",
        messages,
        weakWords: Array.isArray(weakWords) ? weakWords : [],
        scenario: typeof scenario === "string" ? scenario.slice(0, 300) : undefined,
      });
      res.json({ reply });
    }),
  );
  app.post(
    "/api/ai/correct",
    aiLimit,
    wrap(async (req, res) => {
      const { sentence, level } = req.body ?? {};
      if (typeof sentence !== "string" || !sentence.trim()) throw new HttpError(400, "Phrase manquante.");
      res.json(await correct(sentence, typeof level === "string" ? level : "A1"));
    }),
  );
  app.post(
    "/api/ai/translate",
    aiLimit,
    wrap(async (req, res) => {
      const { word, sentence } = req.body ?? {};
      if (typeof word !== "string" || typeof sentence !== "string") throw new HttpError(400, "Paramètres manquants.");
      res.json(await translateInContext(word, sentence));
    }),
  );

  app.use("/api", (_req, res) => res.status(404).json({ error: "Route inconnue." }));

  // ——— Application (production) ———
  const dist = resolve("dist");
  if (existsSync(dist)) {
    app.use(express.static(dist, { maxAge: "1h", index: false }));
    app.get("*", (_req, res) => res.sendFile(resolve(dist, "index.html")));
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError || err instanceof AiError) return res.status(err.status).json({ error: err.message });
    if (err instanceof SyntaxError) return res.status(400).json({ error: "JSON invalide." });
    console.error(err);
    res.status(500).json({ error: "Erreur interne du serveur." });
  });
  return app;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.dirname ?? ".", "index.ts");
if (isMain) {
  const port = Number(process.env.PORT ?? 8787);
  createApp().listen(port, () => {
    console.log(`Parla API sur http://localhost:${port}  (IA : ${aiAvailable() ? MODEL : "non configurée — mode démo"})`);
  });
}
