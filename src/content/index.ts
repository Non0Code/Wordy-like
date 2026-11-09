/**
 * Point d'entrée des contenus par langue.
 * Pour ajouter une langue : créer src/content/<code>/ avec un dictionnaire,
 * un parcours et des scènes, puis l'enregistrer dans PACKS.
 */
import type { DictEntry } from "../core/types";
import { buildFormIndex, lemmatize, type FormIndex } from "../core/morphology";
import { pronounce, type Pronunciation } from "../core/phonetics";
import { markExpressions, tokenize, type Token } from "../core/analysis";
import { parseDictionary } from "./it/dsl";
import { CORE } from "./it/dictionary-core";
import { THEMES } from "./it/dictionary-themes";
import { EXTRA } from "./it/dictionary-extra";
import { CURRICULUM, allLessons, type LevelDef } from "./it/curriculum";
import { SCENES, type Scene } from "./it/scenes";

export interface LanguagePack {
  code: string;
  name: string;
  flag: string;
  ttsLang: string;
  dictionary: DictEntry[];
  byId: Map<string, DictEntry>;
  formIndex: FormIndex;
  expressions: DictEntry[];
  curriculum: LevelDef[];
  scenes: Scene[];
}

function buildItalian(): LanguagePack {
  const all = [...parseDictionary(CORE), ...parseDictionary(THEMES), ...parseDictionary(EXTRA)];
  const byId = new Map<string, DictEntry>();
  for (const e of all) {
    if (byId.has(e.id)) throw new Error(`Doublon dans le dictionnaire : ${e.id}`);
    byId.set(e.id, e);
  }
  const dictionary = [...byId.values()];
  return {
    code: "it",
    name: "Italien",
    flag: "🇮🇹",
    ttsLang: "it-IT",
    dictionary,
    byId,
    formIndex: buildFormIndex(dictionary),
    expressions: dictionary.filter((e) => e.lemma.includes(" ")).sort((a, b) => b.lemma.length - a.lemma.length),
    curriculum: CURRICULUM,
    scenes: SCENES,
  };
}

export const PACKS: Record<string, () => LanguagePack> = { it: buildItalian };

let current: LanguagePack | null = null;
export function lang(): LanguagePack {
  if (!current) current = PACKS.it();
  return current;
}

export function entry(id: string): DictEntry | undefined {
  return lang().byId.get(id);
}

export function pronunciationOf(e: DictEntry): Pronunciation {
  const p = pronounce(e.lemma, e.stress ?? 2);
  return e.pron ? { ...p, ipa: e.pron } : p;
}

export function lookup(surface: string): DictEntry[] {
  const L = lang();
  const norm = surface.toLowerCase();
  return lemmatize(surface, L.formIndex)
    .map((id) => L.byId.get(id)!)
    .filter(Boolean)
    .sort((a, b) => Number(b.lemma === norm) - Number(a.lemma === norm) || levelRank(a.level) - levelRank(b.level));
}

export function analyze(text: string): Token[] {
  const L = lang();
  const toks = tokenize(text, L.formIndex);
  // Ordre des candidats : lemme identique à la forme, puis niveau le plus simple
  for (const t of toks)
    t.entryIds.sort((a, b) => {
      const ea = L.byId.get(a)!;
      const eb = L.byId.get(b)!;
      const exact = Number(eb.lemma === t.norm) - Number(ea.lemma === t.norm);
      return exact || levelRank(ea.level) - levelRank(eb.level);
    });
  return markExpressions(toks, L.expressions, L.formIndex);
}

const RANK = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 } as const;
export function levelRank(l: keyof typeof RANK): number {
  return RANK[l];
}

export { allLessons };
export type { Scene, LevelDef };
