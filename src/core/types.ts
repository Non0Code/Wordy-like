/**
 * Types partagés de l'application.
 * Conçus pour être indépendants de la langue cible : un "LanguagePack"
 * (voir src/content/index.ts) fournit dictionnaire, parcours et scènes.
 */

export type Cefr = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const CEFR_LEVELS: Cefr[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type Pos =
  | "nom"
  | "verbe"
  | "adjectif"
  | "adverbe"
  | "pronom"
  | "préposition"
  | "conjonction"
  | "article"
  | "déterminant"
  | "interjection"
  | "expression"
  | "numéral";

export type Gender = "m" | "f" | "mf";

/** Un sens d'un mot. `cues` = mots du contexte qui orientent vers ce sens. */
export interface Sense {
  fr: string;
  note?: string;
  cues?: string[];
}

export interface VerbInfo {
  /** Conjugaison régulière, ou "irr" (table fournie par la morphologie). */
  group: "are" | "ere" | "ire" | "isc" | "irr";
  aux: "avere" | "essere";
  /** Participe passé irrégulier éventuel. */
  pp?: string;
  /** Verbe pronominal (ex : chiamarsi). */
  reflexive?: boolean;
}

export interface DictEntry {
  id: string;
  lemma: string;
  pos: Pos;
  level: Cefr;
  senses: Sense[];
  gender?: Gender;
  /** Pluriel irrégulier (sinon calculé). */
  plural?: string;
  /** Position de l'accent tonique en partant de la fin (1 = dernière syllabe). Défaut : 2. */
  stress?: number;
  usage?: string;
  /** Transcription API imposée quand la règle automatique ne suffit pas. */
  pron?: string;
  examples: Array<[string, string]>;
  verb?: VerbInfo;
  /** Formes fléchies supplémentaires (irrégulières) rattachées à ce lemme. */
  forms?: string[];
  themes?: string[];
}

export type WordStatus = "unknown" | "learning" | "known";

export type ReviewGrade = "easy" | "good" | "hard" | "again";

/** Contexte dans lequel un mot a été rencontré (scène, leçon, ajout manuel...). */
export interface WordContext {
  source: "scene" | "lesson" | "manual" | "tutor" | "import";
  sourceId?: string;
  sourceTitle?: string;
  sentence?: string;
  translation?: string;
  at: number;
}

/** Fiche du vocabulaire personnel (une par lemme : pas de doublon). */
export interface VocabRecord {
  id: string; // = DictEntry.id ou "custom:<lemma>"
  lang: string;
  lemma: string;
  translation: string;
  pronunciation: string;
  pos: Pos;
  level: Cefr;
  example?: string;
  status: WordStatus;
  /** Statut forcé manuellement par l'utilisateur. */
  manualStatus?: boolean;
  firstSeenAt: number;
  discoveredIn?: string;
  contexts: WordContext[];
  // ——— Répétition espacée ———
  step: number; // index dans la table des intervalles, -1 = jamais étudié
  ease: number; // facteur de facilité (1.3 → 3.0)
  intervalDays: number;
  dueAt: number | null; // timestamp ms de la prochaine révision
  lastReviewedAt: number | null;
  reviewCount: number;
  successCount: number;
  lapses: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface ReviewLog {
  id: string;
  wordId: string;
  grade: ReviewGrade;
  at: number;
  /** Type d'exercice ayant produit la réponse. */
  exercise: string;
  prevInterval: number;
  nextInterval: number;
  durationMs: number;
  updatedAt: number;
}

export interface LessonProgress {
  id: string; // lessonId
  completedAt: number | null;
  bestScore: number;
  attempts: number;
  updatedAt: number;
}

export interface ActivityDay {
  id: string; // "YYYY-MM-DD" (jour local)
  xp: number;
  newWords: number;
  reviews: number;
  correct: number;
  answers: number;
  scenes: number;
  conversationSeconds: number;
  studySeconds: number;
  updatedAt: number;
}

export interface Settings {
  id: "settings";
  level: Cefr;
  dailyXpGoal: number;
  newWordsPerDay: number;
  reviewsPerDay: number;
  explanationLang: "fr" | "it";
  playbackRate: number;
  notifications: boolean;
  exerciseDifficulty: "facile" | "normal" | "exigeant";
  showTranslationByDefault: boolean;
  onboarded: boolean;
  displayName: string;
  updatedAt: number;
}

export interface Badge {
  id: string;
  unlockedAt: number;
  updatedAt: number;
}

export interface UserVideo {
  id: string;
  title: string;
  kind: "film" | "série";
  level: Cefr;
  themes: string[];
  blob?: Blob;
  url?: string;
  subtitlesIt: string; // WebVTT ou SRT brut
  subtitlesFr?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
