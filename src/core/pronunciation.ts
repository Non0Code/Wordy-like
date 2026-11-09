/**
 * Retour de prononciation.
 * On ne compare pas deux fichiers audio : on compare ce que la reconnaissance
 * vocale italienne a compris avec la phrase attendue, mot par mot puis lettre
 * par lettre, pour diagnostiquer les difficultés typiques des francophones
 * (consonnes doubles, gli, gn, ch/ci, sc, voyelles finales, accent tonique).
 */
import { pronounce } from "./phonetics";

export type WordVerdict = "ok" | "proche" | "manqué" | "ajouté";

export interface WordFeedback {
  expected: string;
  heard: string;
  verdict: WordVerdict;
  similarity: number;
  syllables: string;
  tips: string[];
}

export interface PronunciationFeedback {
  score: number;
  heard: string;
  words: WordFeedback[];
  tips: string[];
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

export const similarity = (a: string, b: string) => (a || b ? 1 - levenshtein(a, b) / Math.max(a.length, b.length) : 1);

/** Alignement mot à mot (programmation dynamique). */
function align(exp: string[], got: string[]): Array<[string | null, string | null]> {
  const n = exp.length;
  const m = got.length;
  const cost = (i: number, j: number) => 1 - similarity(exp[i], got[j]);
  const D: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) D[i][0] = i;
  for (let j = 1; j <= m; j++) D[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + cost(i - 1, j - 1) * 1.2);
  const out: Array<[string | null, string | null]> = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && Math.abs(D[i][j] - (D[i - 1][j - 1] + cost(i - 1, j - 1) * 1.2)) < 1e-9) {
      out.unshift([exp[i - 1], got[j - 1]]);
      i--;
      j--;
    } else if (i > 0 && Math.abs(D[i][j] - (D[i - 1][j] + 1)) < 1e-9) {
      out.unshift([exp[i - 1], null]);
      i--;
    } else {
      out.unshift([null, got[j - 1]]);
      j--;
    }
  }
  return out;
}

const dedouble = (s: string) => s.replace(/([bcdfglmnprstvz])\1/g, "$1");

/** Diagnostique les erreurs typiques entre la forme attendue et la forme entendue. */
export function diagnose(expected: string, heard: string): string[] {
  const tips: string[] = [];
  const e = normalize(expected);
  const h = normalize(heard);
  if (!h || e === h) return tips;
  if (dedouble(e) === dedouble(h)) {
    const doubled = e.match(/([bcdfglmnprstvz])\1/);
    tips.push(
      doubled
        ? `Consonne double « ${doubled[0]} » : marquez une petite pause et tenez la consonne plus longtemps (${pronounce(expected).readable}).`
        : `Attention aux consonnes doubles : « ${expected} » n'en a pas, prononcez la consonne brièvement.`,
    );
  }
  if (/gli/.test(e) && !/gli/.test(h)) tips.push("« gli » se prononce [ʎ], comme « lli » dans « million », la langue collée au palais.");
  if (/gn/.test(e) && !/gn/.test(h)) tips.push("« gn » se prononce [ɲ], exactement comme en français (« agneau »).");
  if (/ch[ei]/.test(e) && /c[ei]/.test(h.replace(/ch/g, ""))) tips.push("« che / chi » se prononcent [ke] / [ki] : le « h » rend le c dur.");
  if (/c[ei]/.test(e.replace(/ch/g, "").replace(/sc[ei]/g, "")) && /ch[ei]/.test(h)) tips.push("« ce / ci » se prononcent [tʃe] / [tʃi], comme « tch ».");
  if (/sc[ei]/.test(e) && !/sc[ei]/.test(h)) tips.push("« sce / sci » se prononcent [ʃe] / [ʃi], comme « ch » en français.");
  if (/gh[ei]/.test(e) && /g[ei]/.test(h.replace(/gh/g, ""))) tips.push("« ghe / ghi » se prononcent [ge] / [gi] : le « h » rend le g dur.");
  if (/z/.test(e) && !/z/.test(h)) tips.push("« z » se prononce [ts] ou [dz], jamais comme un simple « z » français.");
  if (/[aeiou]$/.test(e) && h.length < e.length && e.startsWith(h)) tips.push("Prononcez bien la voyelle finale : en italien elle ne s'avale jamais.");
  if (/u/.test(e) && /ou/.test(heard.toLowerCase())) tips.push("Le « u » italien se prononce « ou ».");
  if (/[àèéìòù]$/.test(expected)) tips.push(`Accent tonique sur la dernière syllabe : ${pronounce(expected).readable}.`);
  return tips;
}

export function evaluatePronunciation(target: string, alternatives: Array<{ transcript: string; confidence: number }>): PronunciationFeedback {
  const expWords = normalize(target).split(" ").filter(Boolean);
  const originals = target.replace(/[’']/g, " ").split(/\s+/).map((w) => w.replace(/[^\p{L}]/gu, "")).filter(Boolean);
  let best: PronunciationFeedback | null = null;
  for (const alt of alternatives.length ? alternatives : [{ transcript: "", confidence: 0 }]) {
    const gotWords = normalize(alt.transcript).split(" ").filter(Boolean);
    const pairs = align(expWords, gotWords);
    let k = 0;
    const words: WordFeedback[] = pairs.map(([e, g]) => {
      if (e === null) return { expected: "", heard: g!, verdict: "ajouté", similarity: 0, syllables: "", tips: [] };
      const original = originals[k++] ?? e;
      const sim = g ? similarity(e, g) : 0;
      const verdict: WordVerdict = !g ? "manqué" : sim === 1 ? "ok" : sim >= 0.6 ? "proche" : "manqué";
      return {
        expected: original,
        heard: g ?? "",
        verdict,
        similarity: sim,
        syllables: pronounce(original).readable,
        tips: verdict === "ok" ? [] : g ? diagnose(original, g) : ["Mot non entendu : articulez-le plus distinctement."],
      };
    });
    const scored = words.filter((w) => w.verdict !== "ajouté");
    const extra = words.length - scored.length;
    const raw = scored.reduce((a, w) => a + w.similarity, 0) / Math.max(1, scored.length);
    const score = Math.max(0, Math.round(raw * 100 - extra * 5));
    const tips = [...new Set(words.flatMap((w) => w.tips))];
    const fb = { score, heard: alt.transcript, words, tips };
    if (!best || fb.score > best.score) best = fb;
  }
  return best!;
}
