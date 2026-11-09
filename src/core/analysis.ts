/**
 * Analyse d'une phrase : découpage en tokens cliquables, repérage des
 * expressions figées, rattachement au dictionnaire et choix du sens en contexte.
 */
import type { DictEntry } from "./types";
import { ELISIONS, lemmatize, normalizeToken, type FormIndex } from "./morphology";

export interface Token {
  text: string;
  /** false pour les espaces et la ponctuation. */
  isWord: boolean;
  norm: string;
  /** Index du mot parmi les mots de la phrase (−1 si non-mot). */
  wordIndex: number;
  /** Fiches possibles (la première est retenue). */
  entryIds: string[];
  /** Nom propre probable (majuscule hors début de phrase, absent du dictionnaire). */
  proper?: boolean;
  /** Si le token appartient à une expression figée : id de l'expression. */
  expressionId?: string;
}

const WORD_RE = /(\p{L}+['’]|\p{L}+|\d+(?:[.,]\d+)?)/gu;

/** Découpe en conservant espaces et ponctuation (pour un rendu fidèle). */
export function tokenize(text: string, idx: FormIndex): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let wordIndex = 0;
  for (const m of text.matchAll(WORD_RE)) {
    const start = m.index ?? 0;
    if (start > last) tokens.push({ text: text.slice(last, start), isWord: false, norm: "", wordIndex: -1, entryIds: [] });
    const raw = m[0];
    const norm = normalizeToken(raw);
    const isNumber = /^\d/.test(raw);
    const entryIds = isNumber ? [] : lemmatize(raw, idx);
    tokens.push({
      text: raw,
      isWord: !isNumber,
      norm,
      wordIndex: isNumber ? -1 : wordIndex++,
      entryIds,
      proper: !isNumber && entryIds.length === 0 && /^\p{Lu}/u.test(raw),
    });
    last = start + raw.length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), isWord: false, norm: "", wordIndex: -1, entryIds: [] });
  return tokens;
}

/** Repère les expressions figées (« in bocca al lupo », « prendere in giro »...). */
export function markExpressions(tokens: Token[], expressions: DictEntry[], idx: FormIndex): Token[] {
  const words = tokens.filter((t) => t.isWord);
  for (const expr of expressions) {
    const parts = expr.lemma
      .toLowerCase()
      .replace(/’/g, "'")
      .split(/\s+|(?<=')/)
      .filter(Boolean);
    if (parts.length < 2) continue;
    const partLemmas = parts.map((p) => lemmatize(p, idx));
    for (let i = 0; i + parts.length <= words.length; i++) {
      let ok = true;
      for (let k = 0; k < parts.length && ok; k++) {
        const w = words[i + k];
        const same = w.norm === parts[k] || (ELISIONS[w.norm] && ELISIONS[w.norm] === ELISIONS[parts[k]]);
        const sameLemma =
          partLemmas[k].length > 0 && w.entryIds.some((id) => partLemmas[k].includes(id)) &&
          // ne pas confondre des mots grammaticaux différents
          (k === 0 || w.norm.length > 3);
        ok = !!same || (k === 0 && sameLemma);
      }
      if (ok) {
        for (let k = 0; k < parts.length; k++) {
          const w = words[i + k];
          w.expressionId = expr.id;
        }
      }
    }
  }
  return tokens;
}

export interface SenseChoice {
  index: number;
  /** Comment le sens a été choisi. */
  by: "annotation" | "contexte" | "défaut";
  matchedCues: string[];
}

/**
 * Choisit le sens d'un mot en fonction de la phrase.
 * Chaque sens peut déclarer des « indices » (mots qui, présents dans la phrase,
 * orientent vers ce sens) ; une annotation explicite de la scène est prioritaire.
 */
export function chooseSense(
  entry: DictEntry,
  sentenceTokens: Token[],
  tokenWordIndex: number,
  idx: FormIndex,
  annotated?: number,
): SenseChoice {
  if (annotated !== undefined && entry.senses[annotated]) return { index: annotated, by: "annotation", matchedCues: [] };
  if (entry.senses.length === 1) return { index: 0, by: "défaut", matchedCues: [] };
  // Limite l'analyse à la proposition qui contient le mot (« Al mare? Magari! ... »)
  const pos = sentenceTokens.findIndex((t) => t.wordIndex === tokenWordIndex);
  let from = pos;
  while (from > 0 && !/[.!?;]/.test(sentenceTokens[from - 1].isWord ? "" : sentenceTokens[from - 1].text)) from--;
  let to = pos;
  while (to < sentenceTokens.length - 1 && !/[.!?;]/.test(sentenceTokens[to].isWord ? "" : sentenceTokens[to].text)) to++;
  const clause = pos >= 0 ? sentenceTokens.slice(from, to + 1) : sentenceTokens;
  const words = clause.filter((t) => t.isWord);
  const firstIdx = words[0]?.wordIndex ?? 0;
  const lastIdx = words[words.length - 1]?.wordIndex ?? 0;
  const others = words.filter((w) => w.wordIndex !== tokenWordIndex);
  const meaningful = others.filter((w) => !["e", "eh", "oh", "ah", "ma", "sì", "no"].includes(w.norm));
  const text = clause.map((t) => t.text).join("");
  const isQuestion = /\?\s*$/.test(text);
  let best = { index: 0, score: 0, cues: [] as string[] };
  entry.senses.forEach((s, i) => {
    let score = 0;
    const cues: string[] = [];
    for (const cue of s.cues ?? []) {
      let hit = false;
      if (cue === "@seul") hit = meaningful.length <= 1 && !(isQuestion && words.length > 2);
      else if (cue === "@debut") hit = tokenWordIndex === firstIdx;
      else if (cue === "@fin") hit = tokenWordIndex === lastIdx;
      else if (cue === "?") hit = isQuestion;
      else {
        const c = cue.toLowerCase();
        const cueLemmas = lemmatize(c, idx);
        hit = others.some(
          (w) => w.norm === c || (cueLemmas.length > 0 && w.entryIds[0] !== undefined && cueLemmas.includes(w.entryIds[0]) && c.length > 3),
        );
      }
      if (hit) {
        score += cue.startsWith("@") ? 2 : 1;
        cues.push(cue);
      }
    }
    if (score > best.score) best = { index: i, score, cues };
  });
  return best.score > 0 ? { index: best.index, by: "contexte", matchedCues: best.cues } : { index: 0, by: "défaut", matchedCues: [] };
}
