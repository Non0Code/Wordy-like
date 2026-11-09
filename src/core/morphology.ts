/**
 * Morphologie italienne : conjugaison, flexion des noms/adjectifs et
 * lemmatisation (forme rencontrée → fiche du dictionnaire).
 * C'est ce qui permet d'éviter les doublons : « vado », « andiamo » et
 * « andato » renvoient tous à la même fiche « andare ».
 */
import type { DictEntry } from "./types";

export const PERSONS = ["io", "tu", "lui/lei", "noi", "voi", "loro"] as const;

export type Tense =
  | "presente"
  | "passato prossimo"
  | "imperfetto"
  | "futuro"
  | "condizionale"
  | "congiuntivo"
  | "congiuntivo imperfetto";
export const TENSES: Tense[] = [
  "presente",
  "passato prossimo",
  "imperfetto",
  "futuro",
  "condizionale",
  "congiuntivo",
  "congiuntivo imperfetto",
];
export const TENSE_FR: Record<Tense, string> = {
  presente: "présent",
  "passato prossimo": "passé composé",
  imperfetto: "imparfait",
  futuro: "futur",
  condizionale: "conditionnel",
  congiuntivo: "subjonctif présent",
  "congiuntivo imperfetto": "subjonctif imparfait",
};

type Six = [string, string, string, string, string, string];

interface Irregular {
  pres?: Six;
  futStem?: string;
  impfStem?: string;
  cong?: Six;
  pp?: string;
  gerund?: string;
}

/** Verbes irréguliers les plus fréquents (clé = infinitif). */
const IRREGULAR: Record<string, Irregular> = {
  essere: {
    pres: ["sono", "sei", "è", "siamo", "siete", "sono"],
    futStem: "sar",
    cong: ["sia", "sia", "sia", "siamo", "siate", "siano"],
    pp: "stato",
  },
  avere: {
    pres: ["ho", "hai", "ha", "abbiamo", "avete", "hanno"],
    futStem: "avr",
    cong: ["abbia", "abbia", "abbia", "abbiamo", "abbiate", "abbiano"],
  },
  fare: {
    pres: ["faccio", "fai", "fa", "facciamo", "fate", "fanno"],
    futStem: "far",
    impfStem: "face",
    cong: ["faccia", "faccia", "faccia", "facciamo", "facciate", "facciano"],
    pp: "fatto",
    gerund: "facendo",
  },
  andare: {
    pres: ["vado", "vai", "va", "andiamo", "andate", "vanno"],
    futStem: "andr",
    cong: ["vada", "vada", "vada", "andiamo", "andiate", "vadano"],
  },
  venire: {
    pres: ["vengo", "vieni", "viene", "veniamo", "venite", "vengono"],
    futStem: "verr",
    cong: ["venga", "venga", "venga", "veniamo", "veniate", "vengano"],
    pp: "venuto",
  },
  stare: {
    pres: ["sto", "stai", "sta", "stiamo", "state", "stanno"],
    futStem: "star",
    cong: ["stia", "stia", "stia", "stiamo", "stiate", "stiano"],
  },
  dare: {
    pres: ["do", "dai", "dà", "diamo", "date", "danno"],
    futStem: "dar",
    cong: ["dia", "dia", "dia", "diamo", "diate", "diano"],
  },
  dire: {
    pres: ["dico", "dici", "dice", "diciamo", "dite", "dicono"],
    futStem: "dir",
    impfStem: "dice",
    cong: ["dica", "dica", "dica", "diciamo", "diciate", "dicano"],
    pp: "detto",
    gerund: "dicendo",
  },
  potere: {
    pres: ["posso", "puoi", "può", "possiamo", "potete", "possono"],
    futStem: "potr",
    cong: ["possa", "possa", "possa", "possiamo", "possiate", "possano"],
  },
  volere: {
    pres: ["voglio", "vuoi", "vuole", "vogliamo", "volete", "vogliono"],
    futStem: "vorr",
    cong: ["voglia", "voglia", "voglia", "vogliamo", "vogliate", "vogliano"],
  },
  dovere: {
    pres: ["devo", "devi", "deve", "dobbiamo", "dovete", "devono"],
    futStem: "dovr",
    cong: ["debba", "debba", "debba", "dobbiamo", "dobbiate", "debbano"],
  },
  sapere: {
    pres: ["so", "sai", "sa", "sappiamo", "sapete", "sanno"],
    futStem: "sapr",
    cong: ["sappia", "sappia", "sappia", "sappiamo", "sappiate", "sappiano"],
  },
  uscire: {
    pres: ["esco", "esci", "esce", "usciamo", "uscite", "escono"],
    cong: ["esca", "esca", "esca", "usciamo", "usciate", "escano"],
  },
  bere: {
    pres: ["bevo", "bevi", "beve", "beviamo", "bevete", "bevono"],
    futStem: "berr",
    impfStem: "beve",
    cong: ["beva", "beva", "beva", "beviamo", "beviate", "bevano"],
    pp: "bevuto",
    gerund: "bevendo",
  },
  tenere: {
    pres: ["tengo", "tieni", "tiene", "teniamo", "tenete", "tengono"],
    futStem: "terr",
    cong: ["tenga", "tenga", "tenga", "teniamo", "teniate", "tengano"],
  },
  rimanere: {
    pres: ["rimango", "rimani", "rimane", "rimaniamo", "rimanete", "rimangono"],
    futStem: "rimarr",
    cong: ["rimanga", "rimanga", "rimanga", "rimaniamo", "rimaniate", "rimangano"],
    pp: "rimasto",
  },
  piacere: {
    pres: ["piaccio", "piaci", "piace", "piacciamo", "piacete", "piacciono"],
    cong: ["piaccia", "piaccia", "piaccia", "piacciamo", "piacciate", "piacciano"],
    pp: "piaciuto",
  },
  vedere: { futStem: "vedr", pp: "visto" },
  vivere: { futStem: "vivr", pp: "vissuto" },
  scegliere: {
    pres: ["scelgo", "scegli", "sceglie", "scegliamo", "scegliete", "scelgono"],
    cong: ["scelga", "scelga", "scelga", "scegliamo", "scegliate", "scelgano"],
    pp: "scelto",
  },
  morire: {
    pres: ["muoio", "muori", "muore", "moriamo", "morite", "muoiono"],
    cong: ["muoia", "muoia", "muoia", "moriamo", "moriate", "muoiano"],
    pp: "morto",
  },
  sedere: {
    pres: ["siedo", "siedi", "siede", "sediamo", "sedete", "siedono"],
  },
  porre: {
    pres: ["pongo", "poni", "pone", "poniamo", "ponete", "pongono"],
    futStem: "porr",
    impfStem: "pone",
    pp: "posto",
    gerund: "ponendo",
  },
  tradurre: {
    pres: ["traduco", "traduci", "traduce", "traduciamo", "traducete", "traducono"],
    futStem: "tradurr",
    impfStem: "traduce",
    pp: "tradotto",
    gerund: "traducendo",
    cong: ["traduca", "traduca", "traduca", "traduciamo", "traduciate", "traducano"],
  },
};

/** Participes passés irréguliers fréquents (en plus de ceux des tables ci-dessus). */
const IRREGULAR_PP: Record<string, string> = {
  prendere: "preso", mettere: "messo", leggere: "letto", scrivere: "scritto", chiedere: "chiesto",
  rispondere: "risposto", chiudere: "chiuso", aprire: "aperto", offrire: "offerto", perdere: "perso",
  correre: "corso", decidere: "deciso", nascere: "nato", succedere: "successo", spendere: "speso",
  scendere: "sceso", ridere: "riso", piangere: "pianto", rompere: "rotto", vincere: "vinto",
  muovere: "mosso", conoscere: "conosciuto", accendere: "acceso", spegnere: "spento", sorridere: "sorriso",
  dipingere: "dipinto", raggiungere: "raggiunto", discutere: "discusso", esprimere: "espresso",
  promettere: "promesso", permettere: "permesso", succedersi: "successo", accorgersi: "accorto",
  rendersi: "reso", rendere: "reso", mettersi: "messo", nascondere: "nascosto", difendere: "difeso",
  attendere: "atteso", proporre: "proposto", comporre: "composto", trarre: "tratto", esistere: "esistito",
  essere: "stato", fare: "fatto", dire: "detto", venire: "venuto",
};

const VOWEL_RE = /[aeiou]$/;

function stemAndClass(inf: string): { base: string; stem: string; cls: "are" | "ere" | "ire" } {
  let base = inf;
  // Pronominaux : chiamarsi → chiamare, mettersi → mettere
  if (/rsi$/.test(base)) base = base.slice(0, -2) + "e";
  else if (/rsene$/.test(base)) base = base.slice(0, -4) + "e";
  if (base.endsWith("rre")) return { base, stem: base.slice(0, -3), cls: "ere" };
  const cls = base.slice(-3) as "are" | "ere" | "ire";
  return { base, stem: base.slice(0, -3), cls };
}

export interface Conjugation {
  infinitive: string;
  aux: "avere" | "essere";
  pp: string;
  gerund: string;
  reflexive: boolean;
  tenses: Record<Tense, Six>;
}

const REFLEXIVE_PRONOUNS: Six = ["mi", "ti", "si", "ci", "vi", "si"];

export function conjugate(entry: Pick<DictEntry, "lemma" | "verb">): Conjugation | null {
  if (!entry.verb) return null;
  const { base, stem, cls } = stemAndClass(entry.lemma);
  const irr = IRREGULAR[base] ?? {};
  const isc = entry.verb.group === "isc";
  const reflexive = !!entry.verb.reflexive || /rsi$/.test(entry.lemma);

  // Ajustements orthographiques : cercare → cerchi ; mangiare → mangi
  const hard = cls === "are" && /[cg]$/.test(stem);
  const softI = /[cg]i$/.test(stem) || (cls === "are" && /i$/.test(stem));
  const before = (ending: string) => {
    let s = stem;
    if (softI && /^i/.test(ending)) s = stem.slice(0, -1);
    if (hard && /^[ie]/.test(ending)) s = stem + "h";
    return s + ending;
  };

  const presEnd: Record<string, Six> = {
    are: ["o", "i", "a", "iamo", "ate", "ano"],
    ere: ["o", "i", "e", "iamo", "ete", "ono"],
    ire: ["o", "i", "e", "iamo", "ite", "ono"],
    isc: ["isco", "isci", "isce", "iamo", "ite", "iscono"],
  };
  const pres = irr.pres ?? (presEnd[isc ? "isc" : cls].map(before) as Six);

  const thematic = cls === "are" ? "a" : cls === "ere" ? "e" : "i";
  const impfStem = irr.impfStem ?? (base === "essere" ? "" : stem + thematic);
  const impf: Six =
    base === "essere"
      ? ["ero", "eri", "era", "eravamo", "eravate", "erano"]
      : (["vo", "vi", "va", "vamo", "vate", "vano"].map((e) => impfStem + e) as Six);

  let futStem = irr.futStem;
  if (!futStem) {
    if (cls === "are") {
      if (/[cg]i$/.test(stem)) futStem = stem.slice(0, -1) + "er"; // mangiare → mangerò
      else futStem = stem + (/[cg]$/.test(stem) ? "her" : "er"); // cercare → cercherò
    } else futStem = stem + (cls === "ere" ? "er" : "ir");
  }
  const fut = ["ò", "ai", "à", "emo", "ete", "anno"].map((e) => futStem + e) as Six;
  const cond = ["ei", "esti", "ebbe", "emmo", "este", "ebbero"].map((e) => futStem + e) as Six;

  const congEnd: Record<string, Six> = {
    are: ["i", "i", "i", "iamo", "iate", "ino"],
    ere: ["a", "a", "a", "iamo", "iate", "ano"],
    ire: ["a", "a", "a", "iamo", "iate", "ano"],
    isc: ["isca", "isca", "isca", "iamo", "iate", "iscano"],
  };
  const cong = irr.cong ?? (congEnd[isc ? "isc" : cls].map(before) as Six);

  const congImpfStem =
    base === "essere" ? "fo" : base === "dare" ? "de" : base === "stare" ? "ste" : impfStem;
  const congImpf = ["ssi", "ssi", "sse", "ssimo", "ste", "ssero"].map((e) => congImpfStem + e) as Six;

  const pp =
    entry.verb.pp ??
    irr.pp ??
    IRREGULAR_PP[entry.lemma] ??
    IRREGULAR_PP[base] ??
    stem + (cls === "are" ? "ato" : cls === "ere" ? "uto" : "ito");
  const gerund = irr.gerund ?? stem + (cls === "are" ? "ando" : "endo");
  const aux = reflexive ? "essere" : entry.verb.aux;

  const auxPres = aux === "essere" ? IRREGULAR.essere.pres! : IRREGULAR.avere.pres!;
  const ppAgree = (i: number) => (aux === "essere" ? (i < 3 ? pp : pp.replace(/o$/, "i")) : pp);
  const pass = auxPres.map((a, i) => `${a} ${ppAgree(i)}`) as Six;

  const withPron = (six: Six): Six =>
    reflexive ? (six.map((f, i) => `${REFLEXIVE_PRONOUNS[i]} ${f}`) as Six) : six;

  return {
    infinitive: entry.lemma,
    aux,
    pp,
    gerund,
    reflexive,
    tenses: {
      presente: withPron(pres),
      "passato prossimo": withPron(pass),
      imperfetto: withPron(impf),
      futuro: withPron(fut),
      condizionale: withPron(cond),
      congiuntivo: withPron(cong),
      "congiuntivo imperfetto": withPron(congImpf),
    },
  };
}

/** Pluriel d'un nom (règles générales ; les exceptions sont dans le dictionnaire). */
export function pluralOf(lemma: string, gender?: string): string {
  const w = lemma;
  if (/[àèéìòù]$/.test(w) || !VOWEL_RE.test(w) || w.length <= 2) return w; // città, bar, re
  if (/[cg]a$/.test(w)) return gender === "m" ? w.slice(0, -1) + "i" : w.slice(0, -1) + "he";
  if (/[cg]ia$/.test(w)) return /[aeiou][cg]ia$/.test(w) ? w.slice(0, -1) + "e" : w.slice(0, -2) + "e";
  if (/go$/.test(w)) return w.slice(0, -1) + "hi";
  if (/co$/.test(w)) return w.slice(0, -1) + "hi";
  if (/io$/.test(w)) return w.slice(0, -1);
  if (w.endsWith("a")) return gender === "m" ? w.slice(0, -1) + "i" : w.slice(0, -1) + "e";
  if (w.endsWith("o") || w.endsWith("e")) return w.slice(0, -1) + "i";
  return w;
}

/** Formes d'un adjectif : [m.sg, f.sg, m.pl, f.pl]. */
export function adjectiveForms(lemma: string): [string, string, string, string] {
  const w = lemma;
  if (/[àèéìòù]$/.test(w) || !VOWEL_RE.test(w)) return [w, w, w, w];
  if (w.endsWith("o")) {
    const stem = w.slice(0, -1);
    if (/co$/.test(w)) return [w, stem + "a", /ico$/.test(w) ? stem.slice(0, -1) + "ci" : stem + "hi", stem + "he"];
    if (/go$/.test(w)) return [w, stem + "a", stem + "hi", stem + "he"];
    if (/io$/.test(w)) return [w, stem + "a", stem, stem + "e"];
    return [w, stem + "a", stem + "i", stem + "e"];
  }
  if (w.endsWith("e")) return [w, w, w.slice(0, -1) + "i", w.slice(0, -1) + "i"];
  if (w.endsWith("a")) return [w, w, w.slice(0, -1) + "i", w.slice(0, -1) + "e"]; // ottimista
  return [w, w, w, w];
}

/** Toutes les formes de surface rattachées à une entrée. */
export function surfaceForms(entry: DictEntry): string[] {
  const forms = new Set<string>();
  const add = (f: string) => {
    for (const part of [f, ...f.split(" ")]) if (part) forms.add(part.toLowerCase());
  };
  add(entry.lemma);
  entry.forms?.forEach(add);
  if (entry.pos === "nom") {
    add(entry.plural ?? pluralOf(entry.lemma, entry.gender));
    if (entry.gender === "mf" && entry.lemma.endsWith("e") === false) {
      adjectiveForms(entry.lemma).forEach(add);
    }
  }
  if (entry.pos === "adjectif" && !entry.lemma.includes(" ")) adjectiveForms(entry.lemma).forEach(add);
  if (entry.pos === "verbe") {
    const c = conjugate(entry);
    if (c) {
      const { base } = stemAndClass(entry.lemma);
      add(base);
      add(base.replace(/e$/, "")); // apocope : andar(e), parlar(e) + clitique
      add(c.gerund);
      const pp = c.pp;
      [pp, pp.replace(/o$/, "a"), pp.replace(/o$/, "i"), pp.replace(/o$/, "e")].forEach(add);
      for (const t of TENSES) {
        if (t === "passato prossimo") continue;
        for (const f of c.tenses[t]) {
          const last = f.split(" ").pop()!;
          forms.add(last);
        }
      }
    }
  }
  return [...forms];
}

/** Élisions et contractions fréquentes → lemme de référence. */
export const ELISIONS: Record<string, string> = {
  "l'": "il", "un'": "un", "c'": "ci", "dov'": "dove", "com'": "come", "cos'": "cosa",
  "dell'": "di", "all'": "a", "nell'": "in", "sull'": "su", "dall'": "da", "quest'": "questo",
  "quell'": "quello", "po'": "poco", "d'": "di", "m'": "mi", "t'": "ti", "s'": "si", "v'": "vi",
  "anch'": "anche", "nient'": "niente", "senz'": "senza", "buon'": "buono", "bell'": "bello",
  "sant'": "santo", "tutt'": "tutto", "mezz'": "mezzo", "n'": "ne", "qual'": "quale",
};

const IMPERATIVE_SHORT: Record<string, string> = { di: "dire", fa: "fare", va: "andare", da: "dare", sta: "stare" };

const CLITICS = ["glielo", "gliela", "glieli", "gliele", "gliene", "melo", "mela", "telo", "tela", "cela", "celo", "sene", "mi", "ti", "si", "ci", "vi", "lo", "la", "li", "le", "ne", "gli"];

export type FormIndex = Map<string, string[]>;

export function buildFormIndex(entries: DictEntry[]): FormIndex {
  const idx: FormIndex = new Map();
  for (const e of entries) {
    for (const f of surfaceForms(e)) {
      const arr = idx.get(f);
      if (arr) {
        if (!arr.includes(e.id)) arr.push(e.id);
      } else idx.set(f, [e.id]);
    }
  }
  return idx;
}

export function normalizeToken(t: string): string {
  return t
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/^[^\p{L}']+|[^\p{L}']+$/gu, "");
}

/**
 * Retrouve le(s) lemme(s) d'une forme rencontrée.
 * Gère : formes fléchies, élisions (l', dell'), pronoms enclitiques
 * (dimmi, chiamarti, andiamoci).
 */
export function lemmatize(surface: string, idx: FormIndex): string[] {
  const t = normalizeToken(surface);
  if (!t) return [];
  if (ELISIONS[t]) {
    const target = idx.get(ELISIONS[t]);
    if (target) return target;
  }
  const direct = idx.get(t) ?? idx.get(t.replace(/'$/, ""));
  if (direct) return direct;
  // Enclitiques (une ou deux couches : « dimmelo », « andiamocene »)
  for (const cl of CLITICS) {
    if (t.length > cl.length + 2 && t.endsWith(cl)) {
      let rest = t.slice(0, -cl.length);
      // Impératifs monosyllabiques + consonne doublée : dimmi, fammi, vattene, dallo, stammi
      const dbl = rest.match(/^(di|fa|va|da|sta)([mtlcgnv])$/);
      if (dbl && cl.startsWith(dbl[2])) {
        const hit = idx.get(IMPERATIVE_SHORT[dbl[1]]);
        if (hit) return hit;
      }
      const candidates = [rest, rest + "e", rest.replace(/r$/, "re")];
      for (const c of candidates) {
        const hit = idx.get(c);
        if (hit) return hit;
      }
      const deeper = lemmatize(rest, idx);
      if (deeper.length) return deeper;
    }
  }
  // Superlatif absolu : buonissima → buono, benissimo → bene
  const sup = t.match(/^(.+?)issim[oaie]$/);
  if (sup) {
    for (const c of [sup[1] + "o", sup[1] + "e", sup[1].replace(/h$/, "") + "o"]) {
      const hit = idx.get(c);
      if (hit) return hit;
    }
  }
  // Accent graphique manquant (perche → perché)
  const accentless = idx.get(t.replace(/e$/, "é")) ?? idx.get(t.replace(/a$/, "à"));
  return accentless ?? [];
}
