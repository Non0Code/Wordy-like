/**
 * Constitution des séances d'exercices : priorité aux mots à réviser,
 * puis aux mots inconnus, puis aux mots les plus fragiles.
 */
import { db } from "./db";
import { entry, lang, allLessons } from "../content";
import { buildExercise, shuffle, type Exercise, type ExerciseKind } from "../core/exercises";
import { endOfDay, sortForReview } from "../core/srs";
import type { DictEntry, VocabRecord } from "../core/types";
import { difficultyScore, ensureWord, getSettings } from "./repo";
import { speechRecognitionSupported } from "../speech/stt";

/** Entrée de dictionnaire pour un mot (y compris les mots ajoutés manuellement). */
export function entryFor(w: VocabRecord): DictEntry {
  const e = entry(w.id);
  if (e) return e;
  return {
    id: w.id,
    lemma: w.lemma,
    pos: w.pos,
    level: w.level,
    senses: w.translation.split(";").map((fr) => ({ fr: fr.trim() })).filter((s) => s.fr),
    examples: w.contexts.filter((c) => c.sentence && c.translation).map((c) => [c.sentence!, c.translation!] as [string, string]).slice(0, 2),
  };
}

export async function pickWords(count: number, onlyIds?: string[]): Promise<VocabRecord[]> {
  const settings = await getSettings();
  let words = (await db.vocab.toArray()).filter((w) => !w.deleted);
  if (onlyIds) return words.filter((w) => onlyIds.includes(w.id));
  const eod = endOfDay();
  const due = sortForReview(words.filter((w) => w.step >= 0 && w.dueAt !== null && w.dueAt <= eod));
  const unknown = words.filter((w) => w.step < 0).sort((a, b) => b.firstSeenAt - a.firstSeenAt);
  // Pas assez de mots ? On puise dans le parcours au niveau de l'apprenant.
  if (due.length + unknown.length < count) {
    const have = new Set(words.map((w) => w.id));
    const fresh = allLessons()
      .filter((l) => levelIdx(l.level) >= levelIdx(settings.level))
      .flatMap((l) => l.words.map((id) => ({ id, lesson: l })))
      .filter(({ id }) => !have.has(id))
      .slice(0, count - due.length - unknown.length);
    for (const { id, lesson } of fresh) {
      const rec = await ensureWord(id, { source: "lesson", sourceId: lesson.id, sourceTitle: lesson.title, at: Date.now() });
      if (rec) unknown.push(rec);
    }
    words = (await db.vocab.toArray()).filter((w) => !w.deleted);
  }
  const fragile = words
    .filter((w) => w.step >= 0 && !due.includes(w))
    .sort((a, b) => difficultyScore(b) - difficultyScore(a));
  const picked: VocabRecord[] = [];
  for (const list of [due, unknown.slice(0, Math.max(3, settings.newWordsPerDay)), fragile]) {
    for (const w of list) {
      if (picked.length >= count) break;
      if (!picked.includes(w)) picked.push(w);
    }
  }
  return picked;
}

export async function buildSession(opts: { count?: number; kinds?: ExerciseKind[]; wordIds?: string[] } = {}): Promise<Exercise[]> {
  const settings = await getSettings();
  const words = await pickWords(opts.count ?? 12, opts.wordIds);
  const pool = lang().dictionary;
  const allowSpeech = speechRecognitionSupported();
  const out: Exercise[] = [];
  words.forEach((w, i) => {
    const e = entryFor(w);
    if (!e.senses.length) return;
    let ex = buildExercise(e, w, pool, i + Math.floor(Math.random() * 5), { difficulty: settings.exerciseDifficulty, allowSpeech });
    if (opts.kinds?.length) {
      for (let k = 0; k < 12 && !opts.kinds.includes(ex.kind); k++) {
        ex = buildExercise(e, { ...w, reviewCount: Math.max(1, w.reviewCount) }, pool, i + k, { difficulty: settings.exerciseDifficulty, allowSpeech });
      }
      if (!opts.kinds.includes(ex.kind)) return;
    }
    out.push(ex);
  });
  return shuffle(out);
}

const levelIdx = (l: string) => ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(l);
