/**
 * Accès aux données : vocabulaire personnel (sans doublons), révisions,
 * activité quotidienne, leçons, paramètres, badges.
 */
import { db, uid } from "./db";
import { entry, lang, pronunciationOf, allLessons } from "../content";
import { slug } from "../content/it/dsl";
import { deriveStatus, forceStatus, newCardState, schedule, dayKey, successRate } from "../core/srs";
import type {
  ActivityDay,
  Cefr,
  Pos,
  ReviewGrade,
  Settings,
  VocabRecord,
  WordContext,
  WordStatus,
} from "../core/types";
import { BADGES, XP, computeStreak, emptyDay, type BadgeDef } from "../core/gamification";
import { pronounce } from "../core/phonetics";

// ——— Bus d'événements (toasts XP / badges) ———
type Listener = (e: AppEvent) => void;
export type AppEvent = { type: "xp"; amount: number } | { type: "badge"; badge: BadgeDef } | { type: "toast"; text: string };
const listeners = new Set<Listener>();
export const onAppEvent = (l: Listener) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const emit = (e: AppEvent) => listeners.forEach((l) => l(e));

// ——— Paramètres ———
export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  level: "A1",
  dailyXpGoal: 100,
  newWordsPerDay: 8,
  reviewsPerDay: 50,
  explanationLang: "fr",
  playbackRate: 1,
  notifications: false,
  exerciseDifficulty: "normal",
  showTranslationByDefault: true,
  onboarded: false,
  displayName: "",
  updatedAt: 0,
};

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await db.settings.get("settings")) ?? {}) };
}
export async function saveSettings(patch: Partial<Settings>) {
  const cur = await getSettings();
  await db.settings.put({ ...cur, ...patch, id: "settings", updatedAt: Date.now() });
}

// ——— Vocabulaire ———
function recordFromEntry(entryId: string, now: number): VocabRecord | null {
  const e = entry(entryId);
  if (!e) return null;
  return {
    id: e.id,
    lang: lang().code,
    lemma: e.lemma,
    translation: e.senses.map((s) => s.fr).slice(0, 3).join(" ; "),
    pronunciation: pronunciationOf(e).ipa,
    pos: e.pos,
    level: e.level,
    example: e.examples[0]?.[0],
    status: "unknown",
    firstSeenAt: now,
    contexts: [],
    ...newCardState(),
    updatedAt: now,
  };
}

function mergeContext(list: WordContext[], ctx?: WordContext): WordContext[] {
  if (!ctx) return list;
  const dup = list.some((c) => c.sentence && c.sentence === ctx.sentence && c.sourceId === ctx.sourceId);
  return dup ? list : [...list, ctx].slice(-30);
}

/**
 * Ajoute (ou retrouve) un mot dans le dictionnaire personnel.
 * Un mot rencontré plusieurs fois garde UNE seule fiche, avec tous ses contextes.
 */
export async function ensureWord(entryId: string, ctx?: WordContext): Promise<VocabRecord | null> {
  const now = Date.now();
  return db.transaction("rw", db.vocab, async () => {
    const existing = await db.vocab.get(entryId);
    if (existing && !existing.deleted) {
      const contexts = mergeContext(existing.contexts, ctx);
      if (contexts !== existing.contexts) {
        const upd = { ...existing, contexts, updatedAt: now };
        await db.vocab.put(upd);
        return upd;
      }
      return existing;
    }
    const rec = recordFromEntry(entryId, now);
    if (!rec) return null;
    rec.contexts = mergeContext([], ctx);
    if (ctx?.source === "scene" && ctx.sourceTitle) rec.discoveredIn = ctx.sourceTitle;
    await db.vocab.put(rec);
    return rec;
  });
}

export async function addCustomWord(input: {
  lemma: string;
  translation: string;
  pos: Pos;
  level: Cefr;
  example?: string;
  ctx?: WordContext;
}): Promise<VocabRecord> {
  const now = Date.now();
  const lemma = input.lemma.trim().toLowerCase();
  // Si le mot existe dans le dictionnaire, on réutilise sa fiche (pas de doublon).
  const known = lang().byId.get(slug(lemma));
  if (known) return (await ensureWord(known.id, input.ctx))!;
  const id = `custom:${slug(lemma)}`;
  const existing = await db.vocab.get(id);
  if (existing && !existing.deleted) {
    const upd = { ...existing, translation: input.translation || existing.translation, contexts: mergeContext(existing.contexts, input.ctx), updatedAt: now };
    await db.vocab.put(upd);
    return upd;
  }
  const rec: VocabRecord = {
    id,
    lang: lang().code,
    lemma,
    translation: input.translation.trim(),
    pronunciation: pronounce(lemma).ipa,
    pos: input.pos,
    level: input.level,
    example: input.example,
    status: "unknown",
    firstSeenAt: now,
    contexts: mergeContext([], input.ctx),
    ...newCardState(),
    updatedAt: now,
  };
  await db.vocab.put(rec);
  return rec;
}

export async function updateWord(id: string, patch: Partial<VocabRecord>) {
  const w = await db.vocab.get(id);
  if (!w) return;
  await db.vocab.put({ ...w, ...patch, updatedAt: Date.now() });
}

export async function deleteWord(id: string) {
  // Suppression « douce » pour que la synchronisation la propage.
  await updateWord(id, { deleted: true });
}

export async function setWordStatus(id: string, status: WordStatus) {
  const w = await db.vocab.get(id);
  if (!w) return;
  const card = forceStatus(w, status);
  await db.vocab.put({ ...w, ...card, status, manualStatus: true, updatedAt: Date.now() });
}

/**
 * Enregistre une réponse : recalcule la prochaine révision, journalise,
 * met à jour l'activité du jour et vérifie les badges.
 */
export async function recordAnswer(wordId: string, grade: ReviewGrade, exercise: string, durationMs = 0) {
  const now = Date.now();
  const w = await db.vocab.get(wordId);
  if (!w) return null;
  const isNew = w.step < 0;
  const next = schedule(w, grade, now);
  const updated: VocabRecord = { ...w, ...next, updatedAt: now, manualStatus: false };
  updated.status = deriveStatus(updated);
  await db.transaction("rw", db.vocab, db.reviews, db.activity, async () => {
    await db.vocab.put(updated);
    await db.reviews.put({
      id: uid(),
      wordId,
      grade,
      at: now,
      exercise,
      prevInterval: w.intervalDays,
      nextInterval: next.intervalDays,
      durationMs,
      updatedAt: now,
    });
    await bumpActivity({
      xp: XP.review[grade] + (isNew ? XP.newWord : 0),
      reviews: isNew ? 0 : 1,
      newWords: isNew ? 1 : 0,
      answers: 1,
      correct: grade === "again" ? 0 : 1,
      studySeconds: Math.min(120, Math.round(durationMs / 1000)),
    });
  });
  emit({ type: "xp", amount: XP.review[grade] + (isNew ? XP.newWord : 0) });
  void checkBadges();
  return updated;
}

// ——— Activité ———
export async function bumpActivity(delta: Partial<Omit<ActivityDay, "id" | "updatedAt">>, when = Date.now()) {
  const id = dayKey(when);
  const cur = (await db.activity.get(id)) ?? emptyDay(id);
  const next: ActivityDay = { ...cur, updatedAt: Date.now() };
  for (const [k, v] of Object.entries(delta)) {
    (next as unknown as Record<string, number>)[k] = ((cur as unknown as Record<string, number>)[k] ?? 0) + (v as number);
  }
  await db.activity.put(next);
}

export async function awardXp(amount: number, extra: Partial<Omit<ActivityDay, "id" | "updatedAt">> = {}) {
  await bumpActivity({ xp: amount, ...extra });
  if (amount > 0) emit({ type: "xp", amount });
  void checkBadges();
}

// ——— Leçons ———
export async function completeLesson(lessonId: string, score: number) {
  const now = Date.now();
  const cur = await db.lessons.get(lessonId);
  const firstTime = !cur?.completedAt;
  await db.lessons.put({
    id: lessonId,
    completedAt: cur?.completedAt ?? now,
    bestScore: Math.max(cur?.bestScore ?? 0, score),
    attempts: (cur?.attempts ?? 0) + 1,
    updatedAt: now,
  });
  await awardXp(firstTime ? XP.lessonDone : Math.round(XP.lessonDone / 3));
}

// ——— Badges ———
let checking = false;
export async function checkBadges() {
  if (checking) return;
  checking = true;
  try {
    const [words, days, lessons, owned, reviews] = await Promise.all([
      db.vocab.toArray(),
      db.activity.toArray(),
      db.lessons.toArray(),
      db.badges.toArray(),
      db.reviews.count(),
    ]);
    const done = new Set(lessons.filter((l) => l.completedAt).map((l) => l.id));
    const all = allLessons();
    const levelsCompleted = (["A1", "A2", "B1", "B2", "C1", "C2"] as Cefr[]).filter((lv) =>
      all.filter((l) => l.level === lv).every((l) => done.has(l.id)),
    );
    const voice = await db.reviews.where("wordId").equals("__pronunciation__").count();
    const stats = {
      discovered: words.filter((w) => !w.deleted).length,
      mastered: words.filter((w) => !w.deleted && w.status === "known").length,
      totalReviews: reviews,
      lessonsDone: done.size,
      scenes: days.reduce((a, d) => a + d.scenes, 0),
      streak: computeStreak(days).current,
      conversationMinutes: Math.floor(days.reduce((a, d) => a + d.conversationSeconds, 0) / 60),
      pronunciations: voice,
      levelsCompleted,
    };
    const have = new Set(owned.map((b) => b.id));
    for (const b of BADGES) {
      if (!have.has(b.id) && b.test(stats)) {
        await db.badges.put({ id: b.id, unlockedAt: Date.now(), updatedAt: Date.now() });
        emit({ type: "badge", badge: b });
      }
    }
  } finally {
    checking = false;
  }
}

export async function logPronunciation(score: number) {
  const now = Date.now();
  await db.reviews.put({
    id: uid(),
    wordId: "__pronunciation__",
    grade: score >= 80 ? "good" : score >= 50 ? "hard" : "again",
    at: now,
    exercise: "prononciation",
    prevInterval: 0,
    nextInterval: 0,
    durationMs: 0,
    updatedAt: now,
  });
  await awardXp(XP.pronunciation, { answers: 1, correct: score >= 60 ? 1 : 0 });
}

/** Mots les plus fragiles (taux de réussite faible, oublis fréquents). */
export function difficultyScore(w: VocabRecord): number {
  if (w.reviewCount === 0) return 0;
  return (1 - successRate(w)) * 2 + w.lapses * 0.5 + (2.5 - w.ease);
}

/** Export complet (sauvegarde manuelle JSON). */
export async function exportAll() {
  const [vocab, reviews, lessons, activity, settings, badges, chats] = await Promise.all([
    db.vocab.toArray(), db.reviews.toArray(), db.lessons.toArray(), db.activity.toArray(),
    db.settings.toArray(), db.badges.toArray(), db.chats.toArray(),
  ]);
  return { app: "parla", version: 1, exportedAt: new Date().toISOString(), vocab, reviews, lessons, activity, settings, badges, chats };
}

export async function importAll(data: Awaited<ReturnType<typeof exportAll>>) {
  if (data?.app !== "parla") throw new Error("Fichier de sauvegarde invalide.");
  await db.transaction("rw", [db.vocab, db.reviews, db.lessons, db.activity, db.settings, db.badges, db.chats], async () => {
    await db.vocab.bulkPut(data.vocab ?? []);
    await db.reviews.bulkPut(data.reviews ?? []);
    await db.lessons.bulkPut(data.lessons ?? []);
    await db.activity.bulkPut(data.activity ?? []);
    await db.settings.bulkPut(data.settings ?? []);
    await db.badges.bulkPut(data.badges ?? []);
    await db.chats.bulkPut(data.chats ?? []);
  });
}
