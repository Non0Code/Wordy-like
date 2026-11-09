/** Client HTTP de l'API Parla (serveur Node). */
import { getMeta } from "../db/db";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, body?: unknown, opts: { method?: string; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.auth) {
    const token = await getMeta<string | null>("authToken", null);
    if (token) headers.authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method ?? (body === undefined ? "GET" : "POST"),
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Serveur injoignable. Vérifiez votre connexion ou que le serveur Parla est lancé.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Erreur ${res.status}`);
  return data as T;
}

export interface Health {
  ok: boolean;
  ai: boolean;
  model: string | null;
  sync: boolean;
}

let healthCache: Promise<Health> | null = null;
export function health(force = false): Promise<Health> {
  if (!healthCache || force) {
    healthCache = api<Health>("/health").catch(() => ({ ok: false, ai: false, model: null, sync: false }));
  }
  return healthCache;
}

export const aiChat = (body: {
  mode: "tutor" | "conversation";
  level: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  weakWords?: Array<{ lemma: string; translation: string }>;
  scenario?: string;
}) => api<{ reply: string }>("/ai/chat", body);

export const aiCorrect = (sentence: string, level: string) =>
  api<{
    correct: boolean;
    corrected: string;
    explanation: string;
    errors: Array<{ wrong: string; right: string; rule: string }>;
    exercises: Array<{ prompt: string; answer: string }>;
  }>("/ai/correct", { sentence, level });

export const aiTranslate = (word: string, sentence: string) =>
  api<{ translation: string; explanation: string }>("/ai/translate", { word, sentence });
