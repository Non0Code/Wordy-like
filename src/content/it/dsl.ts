/**
 * Mini-format texte pour écrire le dictionnaire de façon compacte et lisible.
 *
 * Une entrée par ligne, champs séparés par " | " :
 *   lemme | catégorie | niveau | sens1 {indice,indice} ; sens2 | options | ex. it = ex. fr // ... | usage
 *
 * Catégories : n v adj adv pron prep conj art det int expr num
 * Options (séparées par des espaces) :
 *   g=m|f|mf  pl=pluriel  s=3 (accent, n° syllabe depuis la fin)  v=are/avere
 *   pp=participe  f=forme1,forme2  t=theme1,theme2  r (pronominal)  id=identifiant
 * Indices spéciaux de contexte : @seul (mot seul dans la réplique), @debut, @fin.
 */
import type { Cefr, DictEntry, Pos, Sense, VerbInfo } from "../../core/types";

const POS: Record<string, Pos> = {
  n: "nom", v: "verbe", adj: "adjectif", adv: "adverbe", pron: "pronom", prep: "préposition",
  conj: "conjonction", art: "article", det: "déterminant", int: "interjection", expr: "expression", num: "numéral",
};

export function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseSenses(raw: string): Sense[] {
  return raw.split(" ; ").map((s) => {
    const m = s.match(/^(.*?)\s*(?:\{([^}]*)\})?\s*(?:\(\(([^)]*)\)\))?$/);
    const fr = (m?.[1] ?? s).trim();
    const cues = m?.[2]?.split(",").map((c) => c.trim()).filter(Boolean);
    const note = m?.[3]?.trim();
    return { fr, ...(cues?.length ? { cues } : {}), ...(note ? { note } : {}) };
  });
}

export function parseDictionary(src: string): DictEntry[] {
  const out: DictEntry[] = [];
  for (const rawLine of src.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const [lemma, posCode, level, senses, opts = "", examples = "", usage = ""] = line.split("|").map((x) => x.trim());
    const pos = POS[posCode];
    if (!pos) throw new Error(`Catégorie inconnue « ${posCode} » pour ${lemma}`);
    const entry: DictEntry = {
      id: slug(lemma),
      lemma,
      pos,
      level: level as Cefr,
      senses: parseSenses(senses),
      examples: examples
        ? examples.split(" // ").map((e) => {
            const [it, fr] = e.split(" = ");
            return [it.trim(), (fr ?? "").trim()] as [string, string];
          })
        : [],
    };
    if (usage) entry.usage = usage;
    for (const opt of opts.split(/\s+/).filter(Boolean)) {
      const [k, v = ""] = opt.split("=");
      switch (k) {
        case "g": entry.gender = v as DictEntry["gender"]; break;
        case "pl": entry.plural = v; break;
        case "s": entry.stress = Number(v); break;
        case "pp": entry.verb = { ...(entry.verb as VerbInfo), pp: v }; break;
        case "f": entry.forms = v.split(",").map((x) => x.replace(/_/g, " ")); break;
        case "t": entry.themes = v.split(","); break;
        case "id": entry.id = v; break;
        case "pr": entry.pron = v; break;
        case "r": entry.verb = { ...(entry.verb as VerbInfo), reflexive: true }; break;
        case "v": {
          const [group, aux] = v.split("/");
          entry.verb = { ...(entry.verb ?? {}), group: group as VerbInfo["group"], aux: (aux || "avere") as VerbInfo["aux"] };
          break;
        }
        default: throw new Error(`Option inconnue « ${k} » pour ${lemma}`);
      }
    }
    if (pos === "verbe" && !entry.verb?.group) {
      const base = lemma.replace(/rsi$/, "re");
      const group = base.endsWith("are") ? "are" : base.endsWith("ire") ? "ire" : "ere";
      entry.verb = { aux: "avere", ...(entry.verb ?? {}), group } as VerbInfo;
    }
    out.push(entry);
  }
  return out;
}
