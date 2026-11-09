/**
 * Génération et correction des exercices.
 * Les sessions utilisent en priorité les mots à réviser, puis les mots inconnus.
 */
import type { DictEntry, VocabRecord } from "./types";
import { normalize, similarity } from "./pronunciation";

export type ExerciseKind = "traduction" | "qcm" | "ecriture" | "construction" | "ecoute" | "prononciation";

export const EXERCISE_LABELS: Record<ExerciseKind, string> = {
  traduction: "Traduction",
  qcm: "QCM",
  ecriture: "Écriture",
  construction: "Construction de phrase",
  ecoute: "Compréhension orale",
  prononciation: "Prononciation",
};

export interface BaseEx {
  kind: ExerciseKind;
  wordId: string;
  lemma: string;
}
export type Exercise =
  | (BaseEx & { kind: "traduction"; prompt: string; answers: string[]; direction: "it-fr" })
  | (BaseEx & { kind: "qcm"; prompt: string; options: string[]; answer: number; direction: "it-fr" | "fr-it" })
  | (BaseEx & { kind: "ecriture"; prompt: string; answers: string[] })
  | (BaseEx & { kind: "construction"; sentence: string; translation: string; tiles: string[] })
  | (BaseEx & { kind: "ecoute"; audioText: string; options: string[]; answer: number; translation: string })
  | (BaseEx & { kind: "prononciation"; text: string; translation: string });

export interface Rng {
  (): number;
}
export function seededRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}
export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const firstSense = (e: DictEntry) => e.senses[0].fr;

/** Toutes les réponses françaises acceptables pour un mot. */
export function acceptableFrench(e: DictEntry | VocabRecord): string[] {
  const raw = "senses" in e ? e.senses.map((s) => s.fr) : e.translation.split(";");
  const out = new Set<string>();
  for (const r of raw) {
    for (const part of r.split(/[,;/]/)) {
      const clean = part.replace(/\(.*?\)/g, "").replace(/[!?…]/g, "").trim();
      if (clean) out.add(clean);
    }
  }
  return [...out];
}

const ARTICLES = /^(le|la|les|l|un|une|des|du|de|d|il|lo|gli|i|uno|una|un)\s+/;
function canon(s: string): string {
  return normalize(s).replace(ARTICLES, "").replace(/^(se|s)\s+/, "").trim();
}

export interface CheckResult {
  ok: boolean;
  /** Réponse juste à une faute de frappe près. */
  typo: boolean;
  expected: string;
}

export function checkTyped(input: string, answers: string[]): CheckResult {
  const got = canon(input);
  if (!got) return { ok: false, typo: false, expected: answers[0] };
  let bestSim = 0;
  for (const a of answers) {
    const exp = canon(a);
    if (exp === got) return { ok: true, typo: false, expected: a };
    bestSim = Math.max(bestSim, similarity(exp, got));
    if (exp.length >= 5 && similarity(exp, got) >= 0.8) return { ok: true, typo: true, expected: a };
  }
  return { ok: false, typo: false, expected: answers[0] };
}

/** Phrase d'exemple contenant le mot (dictionnaire ou contexte rencontré). */
export function exampleFor(e: DictEntry, w?: VocabRecord): [string, string] | null {
  const ctx = w?.contexts.find((c) => c.sentence && c.translation);
  if (ctx) return [ctx.sentence!, ctx.translation!];
  return e.examples[0] ?? null;
}

export function tilesOf(sentence: string): string[] {
  return sentence
    .replace(/[«»"“”]/g, "")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export interface BuildOptions {
  difficulty: "facile" | "normal" | "exigeant";
  allowSpeech: boolean;
  rng?: Rng;
}

/**
 * Construit un exercice pour un mot, en variant les types.
 * `distractors` : autres entrées du dictionnaire (même catégorie de préférence).
 */
export function buildExercise(
  e: DictEntry,
  w: VocabRecord | undefined,
  pool: DictEntry[],
  kindHint: number,
  opts: BuildOptions,
): Exercise {
  const rng = opts.rng ?? Math.random;
  const ex = exampleFor(e, w);
  const kinds: ExerciseKind[] =
    opts.difficulty === "facile"
      ? ["qcm", "qcm", "ecoute", "construction", "traduction"]
      : opts.difficulty === "exigeant"
        ? ["ecriture", "traduction", "construction", "ecoute", "ecriture", "qcm"]
        : ["qcm", "traduction", "ecriture", "construction", "ecoute", "qcm"];
  if (opts.allowSpeech) kinds.push("prononciation");
  // Pour un mot jamais vu : d'abord la reconnaissance (QCM), pas la production.
  let kind = w && w.reviewCount === 0 ? "qcm" : kinds[kindHint % kinds.length];
  if ((kind === "construction" || kind === "ecoute") && (!ex || tilesOf(ex[0]).length < 3 || tilesOf(ex[0]).length > 12)) kind = "qcm";

  // Distracteurs plausibles : même catégorie et niveau proche.
  const LV = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const near = (p: DictEntry) => Math.abs(LV.indexOf(p.level) - LV.indexOf(e.level)) <= 1;
  const samePos = pool.filter((p) => p.id !== e.id && p.pos === e.pos && near(p));
  const others = shuffle(samePos.length >= 3 ? samePos : pool.filter((p) => p.id !== e.id && near(p)), rng);
  const base = { wordId: w?.id ?? e.id, lemma: e.lemma };

  switch (kind) {
    case "traduction":
      return { ...base, kind, direction: "it-fr", prompt: e.lemma, answers: acceptableFrench(e) };
    case "ecriture":
      return { ...base, kind, prompt: firstSense(e), answers: [e.lemma, ...(e.forms ?? []).slice(0, 2)] };
    case "construction":
      return { ...base, kind, sentence: ex![0], translation: ex![1], tiles: shuffleUntilDifferent(tilesOf(ex![0]), rng) };
    case "ecoute": {
      const distract = others
        .map((o) => o.examples[0]?.[0])
        .filter((s): s is string => !!s && s !== ex![0])
        .slice(0, 2);
      const options = shuffle([ex![0], ...distract], rng);
      return { ...base, kind, audioText: ex![0], options, answer: options.indexOf(ex![0]), translation: ex![1] };
    }
    case "prononciation":
      return { ...base, kind, text: ex && tilesOf(ex[0]).length <= 8 ? ex[0] : e.lemma, translation: ex && tilesOf(ex[0]).length <= 8 ? ex[1] : firstSense(e) };
    case "qcm":
    default: {
      const direction: "it-fr" | "fr-it" = kindHint % 2 === 0 ? "it-fr" : "fr-it";
      const correct = direction === "it-fr" ? firstSense(e) : e.lemma;
      const distract = others
        .map((o) => (direction === "it-fr" ? firstSense(o) : o.lemma))
        .filter((d) => d !== correct)
        .slice(0, 3);
      const options = shuffle([correct, ...distract], rng);
      return { ...base, kind: "qcm", direction, prompt: direction === "it-fr" ? e.lemma : firstSense(e), options, answer: options.indexOf(correct) };
    }
  }
}

function shuffleUntilDifferent(tiles: string[], rng: Rng): string[] {
  for (let i = 0; i < 5; i++) {
    const s = shuffle(tiles, rng);
    if (s.join(" ") !== tiles.join(" ")) return s;
  }
  return [...tiles].reverse();
}

/** Compare une phrase reconstruite (insensible à la casse et à la ponctuation). */
export function checkSentence(built: string[], sentence: string): boolean {
  return normalize(built.join(" ")) === normalize(sentence);
}
