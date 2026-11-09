/**
 * Motivation : XP, niveaux personnels, séries, objectifs du jour, défis
 * hebdomadaires et badges. Volontairement sobre : tout est dérivé de
 * l'activité réelle d'apprentissage.
 */
import type { ActivityDay, Settings, VocabRecord } from "./types";
import { addDaysKey, dayKey } from "./srs";

export const XP = {
  review: { again: 2, hard: 6, good: 10, easy: 12 },
  newWord: 5,
  lessonDone: 50,
  scene: 30,
  conversationMinute: 10,
  pronunciation: 8,
  exerciseCorrect: 8,
} as const;

export function levelFromXp(totalXp: number) {
  // Niveau n atteint à 50·(n−1)² XP : progression douce puis plus exigeante.
  const level = Math.floor(Math.sqrt(totalXp / 50)) + 1;
  const floor = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return { level, floor, next, progress: (totalXp - floor) / (next - floor) };
}

export const LEVEL_TITLES = [
  "Turista", "Viaggiatore", "Curioso", "Apprendista", "Studente", "Conversatore",
  "Cinefilo", "Esperto", "Quasi italiano", "Madrelingua",
];
export const levelTitle = (lv: number) => LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((lv - 1) / 2))];

/** Série de jours consécutifs avec au moins une activité (aujourd'hui ou hier compris). */
export function computeStreak(days: ActivityDay[], today = dayKey()): { current: number; best: number } {
  const active = new Set(days.filter((d) => d.xp > 0).map((d) => d.id));
  let current = 0;
  let cursor = active.has(today) ? today : addDaysKey(today, -1);
  while (active.has(cursor)) {
    current++;
    cursor = addDaysKey(cursor, -1);
  }
  const sorted = [...active].sort();
  let best = 0;
  let run = 0;
  let prev = "";
  for (const k of sorted) {
    run = prev && addDaysKey(prev, 1) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { current, best: Math.max(best, current) };
}

export interface Goal {
  id: string;
  label: string;
  value: number;
  target: number;
  done: boolean;
  to: string;
}

export function dailyGoals(today: ActivityDay | undefined, settings: Settings, dueToday: number): Goal[] {
  const t = today ?? emptyDay(dayKey());
  const reviewTarget = Math.max(1, Math.min(settings.reviewsPerDay, Math.max(dueToday + t.reviews, 5)));
  const goals: Goal[] = [
    { id: "new", label: `Apprendre ${settings.newWordsPerDay} nouveaux mots`, value: t.newWords, target: settings.newWordsPerDay, done: false, to: "/apprendre" },
    { id: "rev", label: `Réviser ${reviewTarget} mots`, value: t.reviews, target: reviewTarget, done: false, to: "/revision" },
    { id: "scene", label: "Regarder une scène", value: t.scenes, target: 1, done: false, to: "/films" },
    { id: "talk", label: "5 minutes de conversation", value: Math.floor(t.conversationSeconds / 60), target: 5, done: false, to: "/professeur" },
  ];
  return goals.map((g) => ({ ...g, done: g.value >= g.target }));
}

export function weekKeys(today = dayKey()): string[] {
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const monday = (date.getDay() + 6) % 7; // 0 = lundi
  return Array.from({ length: 7 }, (_, i) => addDaysKey(today, i - monday));
}

export function weeklyChallenges(days: ActivityDay[], today = dayKey()): Goal[] {
  const keys = new Set(weekKeys(today));
  const week = days.filter((d) => keys.has(d.id));
  const sum = (f: (d: ActivityDay) => number) => week.reduce((a, d) => a + f(d), 0);
  const challenges: Goal[] = [
    { id: "w-rev", label: "Réviser 100 mots", value: sum((d) => d.reviews), target: 100, done: false, to: "/revision" },
    { id: "w-new", label: "Découvrir 25 nouveaux mots", value: sum((d) => d.newWords), target: 25, done: false, to: "/apprendre" },
    { id: "w-scenes", label: "Regarder 3 scènes", value: sum((d) => d.scenes), target: 3, done: false, to: "/films" },
    { id: "w-days", label: "Étudier 5 jours", value: week.filter((d) => d.xp > 0).length, target: 5, done: false, to: "/" },
  ];
  return challenges.map((g) => ({ ...g, done: g.value >= g.target }));
}

export function emptyDay(id: string): ActivityDay {
  return { id, xp: 0, newWords: 0, reviews: 0, correct: 0, answers: 0, scenes: 0, conversationSeconds: 0, studySeconds: 0, updatedAt: 0 };
}

export interface BadgeDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  test: (s: BadgeStats) => boolean;
}
export interface BadgeStats {
  discovered: number;
  mastered: number;
  totalReviews: number;
  lessonsDone: number;
  scenes: number;
  streak: number;
  conversationMinutes: number;
  pronunciations: number;
  levelsCompleted: string[];
}

export const BADGES: BadgeDef[] = [
  { id: "first-word", icon: "🌱", title: "Primo passo", description: "Ajouter votre premier mot", test: (s) => s.discovered >= 1 },
  { id: "words-50", icon: "📚", title: "Collezionista", description: "50 mots découverts", test: (s) => s.discovered >= 50 },
  { id: "words-200", icon: "🏛️", title: "Biblioteca", description: "200 mots découverts", test: (s) => s.discovered >= 200 },
  { id: "mastered-10", icon: "🧠", title: "Memoria", description: "10 mots maîtrisés", test: (s) => s.mastered >= 10 },
  { id: "mastered-100", icon: "💎", title: "Memoria di ferro", description: "100 mots maîtrisés", test: (s) => s.mastered >= 100 },
  { id: "reviews-100", icon: "🔁", title: "Costanza", description: "100 révisions", test: (s) => s.totalReviews >= 100 },
  { id: "lesson-1", icon: "🎓", title: "Prima lezione", description: "Terminer une leçon", test: (s) => s.lessonsDone >= 1 },
  { id: "lesson-10", icon: "🗺️", title: "Esploratore", description: "Terminer 10 leçons", test: (s) => s.lessonsDone >= 10 },
  { id: "scene-1", icon: "🎬", title: "Ciak!", description: "Regarder une scène", test: (s) => s.scenes >= 1 },
  { id: "scene-5", icon: "🍿", title: "Cinefilo", description: "Regarder 5 scènes", test: (s) => s.scenes >= 5 },
  { id: "streak-3", icon: "🔥", title: "Tre di fila", description: "Série de 3 jours", test: (s) => s.streak >= 3 },
  { id: "streak-7", icon: "🌋", title: "Settimana perfetta", description: "Série de 7 jours", test: (s) => s.streak >= 7 },
  { id: "streak-30", icon: "☀️", title: "Un mese", description: "Série de 30 jours", test: (s) => s.streak >= 30 },
  { id: "talk-10", icon: "💬", title: "Chiacchierone", description: "10 minutes de conversation", test: (s) => s.conversationMinutes >= 10 },
  { id: "voice-1", icon: "🎙️", title: "Prima voce", description: "Premier exercice de prononciation", test: (s) => s.pronunciations >= 1 },
  { id: "a1-done", icon: "🥉", title: "A1 completato", description: "Terminer toutes les leçons A1", test: (s) => s.levelsCompleted.includes("A1") },
  { id: "a2-done", icon: "🥈", title: "A2 completato", description: "Terminer toutes les leçons A2", test: (s) => s.levelsCompleted.includes("A2") },
  { id: "b1-done", icon: "🥇", title: "B1 completato", description: "Terminer toutes les leçons B1", test: (s) => s.levelsCompleted.includes("B1") },
];

export function vocabCounts(words: VocabRecord[]) {
  let unknown = 0;
  let learning = 0;
  let known = 0;
  for (const w of words) {
    if (w.deleted) continue;
    if (w.status === "known") known++;
    else if (w.status === "learning") learning++;
    else unknown++;
  }
  return { unknown, learning, known, total: unknown + learning + known };
}
