/**
 * Répétition espacée inspirée de la courbe de l'oubli d'Ebbinghaus.
 *
 * Table de base (étape → intervalle en jours) :
 *   0 apprentissage initial (J0), 1 → J1, 2 → J3, 3 → J7, 4 → J14,
 *   5 → J30, 6 → J60, 7 → J90, puis intervalle × facilité.
 *
 * Adaptation aux résultats :
 *  - « Facile »    : saute une étape, facilité +0.15, intervalle ×1.15
 *  - « Correct »   : étape suivante
 *  - « Difficile » : reste à la même étape, intervalle réduit, facilité −0.15
 *  - « Oublié »    : retour à l'étape 0, revient dans 10 minutes, facilité −0.2
 * L'intervalle de la table est modulé par la facilité propre au mot (ease / 2.5).
 */
import type { ReviewGrade, VocabRecord, WordStatus } from "./types";

export const BASE_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 90] as const;
export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
export const MAX_EASE = 3.0;
export const RELEARN_MINUTES = 10;
export const DAY_MS = 86_400_000;
/** Intervalle à partir duquel un mot est considéré comme maîtrisé. */
export const KNOWN_INTERVAL_DAYS = 30;

export const GRADE_LABELS: Record<ReviewGrade, string> = {
  again: "Oublié",
  hard: "Difficile",
  good: "Correct",
  easy: "Facile",
};

export type SrsCard = Pick<
  VocabRecord,
  "step" | "ease" | "intervalDays" | "dueAt" | "lastReviewedAt" | "reviewCount" | "successCount" | "lapses"
>;

export function newCardState(): SrsCard {
  return {
    step: -1,
    ease: DEFAULT_EASE,
    intervalDays: 0,
    dueAt: null,
    lastReviewedAt: null,
    reviewCount: 0,
    successCount: 0,
    lapses: 0,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 100) / 100;

/** Intervalle (jours) de l'étape `step`, modulé par la facilité du mot. */
export function intervalForStep(step: number, ease: number, prevInterval: number): number {
  const mod = ease / DEFAULT_EASE;
  if (step <= 0) return 0;
  if (step < BASE_INTERVALS.length) {
    return Math.max(1, Math.round(BASE_INTERVALS[step] * mod));
  }
  // Au-delà de J90 : croissance multiplicative.
  return Math.max(prevInterval + 1, Math.round(Math.max(prevInterval, 90) * ease));
}

/**
 * Calcule le nouvel état d'une carte après une réponse.
 * Fonction pure : facile à tester et identique côté client et serveur.
 */
export function schedule(card: SrsCard, grade: ReviewGrade, now: number = Date.now()): SrsCard {
  const prev = card.intervalDays;
  let step = Math.max(card.step, 0);
  let ease = card.ease || DEFAULT_EASE;
  let interval: number;
  let dueAt: number;
  let lapses = card.lapses;
  const success = grade !== "again";

  switch (grade) {
    case "again": {
      if (card.step > 0) lapses += 1;
      ease = clamp(ease - 0.2, MIN_EASE, MAX_EASE);
      step = 0;
      interval = 0;
      dueAt = now + RELEARN_MINUTES * 60_000;
      break;
    }
    case "hard": {
      ease = clamp(ease - 0.15, MIN_EASE, MAX_EASE);
      step = Math.max(step, 1);
      const target = intervalForStep(step, ease, prev);
      interval = Math.max(1, Math.min(target, Math.round(Math.max(prev, 1) * 1.2)));
      dueAt = now + interval * DAY_MS;
      break;
    }
    case "good": {
      step = step + 1;
      interval = intervalForStep(step, ease, prev);
      dueAt = now + interval * DAY_MS;
      break;
    }
    case "easy": {
      ease = clamp(ease + 0.15, MIN_EASE, MAX_EASE);
      step = step + 2;
      interval = Math.round(intervalForStep(step, ease, prev) * 1.15);
      dueAt = now + interval * DAY_MS;
      break;
    }
  }

  return {
    step,
    ease: round1(ease),
    intervalDays: interval,
    dueAt,
    lastReviewedAt: now,
    reviewCount: card.reviewCount + 1,
    successCount: card.successCount + (success ? 1 : 0),
    lapses,
  };
}

/** Aperçu des intervalles proposés pour chaque bouton (affiché sous les boutons). */
export function previewIntervals(card: SrsCard, now = Date.now()): Record<ReviewGrade, string> {
  const out = {} as Record<ReviewGrade, string>;
  for (const g of ["again", "hard", "good", "easy"] as ReviewGrade[]) {
    const next = schedule(card, g, now);
    out[g] = formatInterval(next.intervalDays, g === "again");
  }
  return out;
}

export function formatInterval(days: number, relearn = false): string {
  if (relearn || days === 0) return `${RELEARN_MINUTES} min`;
  if (days === 1) return "1 j";
  if (days < 30) return `${days} j`;
  if (days < 365) return `${Math.round(days / 30)} mois`;
  return `${(days / 365).toFixed(1).replace(".0", "")} an${days >= 730 ? "s" : ""}`;
}

export function successRate(card: Pick<SrsCard, "reviewCount" | "successCount">): number {
  return card.reviewCount === 0 ? 0 : card.successCount / card.reviewCount;
}

/** Statut dérivé de l'état de mémorisation. */
export function deriveStatus(card: SrsCard): WordStatus {
  if (card.step < 0 || card.reviewCount === 0) return "unknown";
  if (card.intervalDays >= KNOWN_INTERVAL_DAYS && successRate(card) >= 0.7) return "known";
  return "learning";
}

/** Applique un statut choisi manuellement par l'utilisateur. */
export function forceStatus(card: SrsCard, status: WordStatus, now = Date.now()): SrsCard {
  if (status === "unknown") return newCardState();
  if (status === "learning") {
    return {
      ...card,
      step: Math.max(0, Math.min(card.step, 3)),
      intervalDays: Math.min(card.intervalDays, 7),
      dueAt: now,
      reviewCount: Math.max(card.reviewCount, 1),
      successCount: Math.max(card.successCount, 0),
    };
  }
  // known
  return {
    ...card,
    step: Math.max(card.step, 5),
    intervalDays: Math.max(card.intervalDays, KNOWN_INTERVAL_DAYS),
    dueAt: now + Math.max(card.intervalDays, KNOWN_INTERVAL_DAYS) * DAY_MS,
    reviewCount: Math.max(card.reviewCount, 1),
    successCount: Math.max(card.successCount, card.reviewCount, 1),
    lastReviewedAt: card.lastReviewedAt ?? now,
  };
}

// ——— Dates locales ———

export function startOfDay(ts = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
export function endOfDay(ts = Date.now()): number {
  return startOfDay(ts) + DAY_MS - 1;
}
export function dayKey(ts = Date.now()): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
export function addDaysKey(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  return dayKey(date.getTime());
}

export interface ReviewQueueStats {
  dueToday: number;
  overdue: number;
  mastered: number;
  newAvailable: number;
  estimatedMinutes: number;
}

/** Statistiques du tableau de bord des révisions. */
export function queueStats(
  cards: Array<SrsCard & { status: WordStatus }>,
  newWordsPerDay: number,
  newIntroducedToday: number,
  now = Date.now(),
  /** Mots du parcours pas encore ajoutés au vocabulaire (eux aussi « nouveaux »). */
  notYetInVocab = 0,
): ReviewQueueStats {
  const sod = startOfDay(now);
  const eod = endOfDay(now);
  let dueToday = 0;
  let overdue = 0;
  let mastered = 0;
  let unknown = 0;
  for (const c of cards) {
    if (c.status === "known") mastered++;
    if (c.step < 0) {
      unknown++;
      continue;
    }
    if (c.dueAt !== null && c.dueAt <= eod) {
      dueToday++;
      if (c.dueAt < sod) overdue++;
    }
  }
  const newAvailable = Math.max(0, Math.min(unknown + notYetInVocab, newWordsPerDay - newIntroducedToday));
  // ~10 s par révision, ~25 s par nouveau mot (présentation + premier exercice).
  const estimatedMinutes = Math.ceil((dueToday * 10 + newAvailable * 25) / 60);
  return { dueToday, overdue, mastered, newAvailable, estimatedMinutes };
}

/** Ordre de révision : retards d'abord, puis mots les plus fragiles. */
export function sortForReview<T extends SrsCard>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    const da = a.dueAt ?? 0;
    const db = b.dueAt ?? 0;
    if (da !== db) return da - db;
    return a.ease - b.ease;
  });
}
