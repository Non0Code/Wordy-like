/**
 * Phonétique de l'italien : syllabation, accent tonique et transcription API (IPA).
 *
 * L'italien est très régulier à l'écrit ; les seules vraies inconnues sont la
 * position de l'accent (fournie par le dictionnaire quand elle n'est pas
 * pénultième) et l'ouverture des e/o (non notée ici, simplification assumée).
 */

const VOWELS = "aeiouàèéìíòóùú";
const ACCENTED = "àèéìíòóùú";
const STRONG = "aeoàèéòó";
const isVowel = (c: string | undefined) => !!c && c.length === 1 && VOWELS.includes(c);
const FRONT = "eièéìí";

export interface Syllabified {
  syllables: string[];
  stressIndex: number; // index de la syllabe accentuée
}

type Seg = { type: "V" | "C"; text: string };

/** Découpe un mot en segments voyelles / consonnes en gérant ci/gi/sci/gli/qu/gu. */
function segment(word: string): Seg[] {
  const w = word.toLowerCase();
  const segs: Seg[] = [];
  let i = 0;
  while (i < w.length) {
    const c = w[i];
    if (isVowel(c)) {
      // « i » muet de ci/gi/sci/gli devant voyelle, « u » de qu/gu devant voyelle
      const prev = w.slice(Math.max(0, i - 2), i);
      const next = w[i + 1];
      const lastSeg = segs[segs.length - 1];
      const iDiacritic =
        c === "i" &&
        next !== undefined &&
        isVowel(next) &&
        lastSeg?.type === "C" &&
        (/[cg]$/.test(prev) || /gl$/.test(prev));
      const uGlide = c === "u" && next !== undefined && isVowel(next) && lastSeg?.type === "C" && /[qg]$/.test(prev);
      if (iDiacritic || uGlide) {
        lastSeg.text += c;
        i++;
        continue;
      }
      if (lastSeg?.type === "V") lastSeg.text += c;
      else segs.push({ type: "V", text: c });
    } else if (/[a-z]/.test(c)) {
      const lastSeg = segs[segs.length - 1];
      if (lastSeg?.type === "C") lastSeg.text += c;
      else segs.push({ type: "C", text: c });
    }
    i++;
  }
  return segs;
}

/** Sépare un groupe vocalique en hiatus (deux voyelles fortes adjacentes). */
function splitVowels(v: string): string[] {
  const parts: string[] = [];
  let cur = "";
  for (let i = 0; i < v.length; i++) {
    const c = v[i];
    // « i »/« u » entre deux voyelles = consonne de liaison (a-iu-to, gio-ia)
    if (cur && (c === "i" || c === "u") && STRONG.includes(cur[cur.length - 1]) && isVowel(v[i + 1])) {
      parts.push(cur);
      cur = c;
    } else if (cur && STRONG.includes(c) && STRONG.includes(cur[cur.length - 1])) {
      parts.push(cur);
      cur = c;
    } else if (cur && ACCENTED.includes(c) && !"iu".includes(cur[cur.length - 1]) ) {
      parts.push(cur);
      cur = c;
    } else if (cur && "ìíùú".includes(cur[cur.length - 1])) {
      // i/u accentué = noyau à part entière (farmacìa, paùra)
      parts.push(cur);
      cur = c;
    } else {
      cur += c;
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

/** Unités consonantiques insécables. */
function consonantUnits(c: string): string[] {
  const units: string[] = [];
  let i = 0;
  while (i < c.length) {
    const rest = c.slice(i);
    const m = rest.match(/^(sch|sci|sc(?=[ei])|gli|gl(?=i)|gn|ch|gh|ci|gi|qu|gu(?=.)|[a-z])/);
    const u = m ? m[0] : rest[0];
    units.push(u);
    i += u.length;
  }
  return units;
}

const LIQUID_PAIR = /^[pbtdcgfv]$/;

/** Répartit un groupe de consonnes intervocalique entre deux syllabes. */
function splitCluster(cluster: string): [string, string] {
  const u = consonantUnits(cluster);
  if (u.length <= 1) return ["", cluster];
  const first = u[0];
  const second = u[1];
  // Consonne double (pal-la, boc-ca, mag-gio)
  if (first[0] === second[0] && first.length === 1) return [first, u.slice(1).join("")];
  if (first === "s") return ["", cluster];
  if (u.length === 2 && LIQUID_PAIR.test(first) && /^[lr]$/.test(second)) return ["", cluster];
  return [first, u.slice(1).join("")];
}

export function syllabify(word: string, stressFromEnd = 2): Syllabified {
  const segs = segment(word);
  const syl: string[] = [];
  let onset = "";
  for (let k = 0; k < segs.length; k++) {
    const s = segs[k];
    if (s.type === "C") {
      if (k === 0) onset = s.text;
      continue;
    }
    const nuclei = splitVowels(s.text);
    for (let n = 0; n < nuclei.length; n++) {
      syl.push((n === 0 ? onset : "") + nuclei[n]);
    }
    onset = "";
    const next = segs[k + 1];
    if (next && next.type === "C") {
      const isLast = k + 2 >= segs.length;
      if (isLast) {
        syl[syl.length - 1] += next.text; // consonne finale (per, con, bar)
      } else {
        const [coda, nextOnset] = splitCluster(next.text);
        syl[syl.length - 1] += coda;
        onset = nextOnset;
      }
    }
  }
  if (syl.length === 0) syl.push(word.toLowerCase());
  let stressIndex = syl.findIndex((s) => [...s].some((c) => ACCENTED.includes(c)));
  if (stressIndex < 0) stressIndex = Math.max(0, syl.length - Math.min(stressFromEnd, syl.length));
  return { syllables: syl, stressIndex };
}

/** Conversion graphème → phonème d'une syllabe (contexte = lettre suivante). */
function syllableToIpa(s: string, nextSyl: string, isFirst: boolean, prevSyl: string): string {
  const out: string[] = [];
  const src = s + "\u0000" + nextSyl; // le contexte droit traverse la frontière
  let i = 0;
  const L = s.length;
  const at = (k: number) => (k < L ? src[k] : src[k + 1] ?? "");
  while (i < L) {
    const c = s[i];
    const n1 = at(i + 1);
    const n2 = at(i + 2);
    const tri = s.slice(i, i + 3);
    if (tri === "sch") { out.push("sk"); i += 3; continue; }
    if (c === "s" && n1 === "c" && FRONT.includes(n2)) {
      out.push("ʃ"); i += 2;
      if (s[i] === "i" && isVowel(at(i + 1))) i++;
      continue;
    }
    if (c === "g" && n1 === "l" && n2 === "i") {
      out.push("ʎ"); i += 2;
      if (isVowel(at(i + 1))) i++; // gli + voyelle : i muet
      else { out.push("i"); i++; }
      continue;
    }
    if (c === "g" && n1 === "n") { out.push("ɲ"); i += 2; continue; }
    if ((c === "c" || c === "g") && n1 === "h") { out.push(c === "c" ? "k" : "g"); i += 2; continue; }
    if (c === "c" || c === "g") {
      if (FRONT.includes(n1)) {
        out.push(c === "c" ? "tʃ" : "dʒ"); i++;
        if (s[i] === "i" && isVowel(at(i + 1)) && i + 1 < L) i++;
        continue;
      }
      out.push(c === "c" ? "k" : "g"); i++; continue;
    }
    if (c === "q") { out.push("k"); i++; if (s[i] === "u") { out.push("w"); i++; } continue; }
    if (c === "h") { i++; continue; }
    if (c === "z") { out.push(isFirst && i === 0 ? "dz" : "ts"); i++; continue; }
    if (c === "s") {
      const voicedNext = /[bdglmnrv]/.test(n1);
      const intervocalic = i === 0 && isVowel(prevSyl.slice(-1)) && isVowel(n1);
      out.push(voicedNext || intervocalic ? "z" : "s"); i++; continue;
    }
    if (c === "j") { out.push("j"); i++; continue; }
    if (c === "y") { out.push("i"); i++; continue; }
    if (c === "x") { out.push("ks"); i++; continue; }
    if (isVowel(c)) {
      const base = c.normalize("NFD")[0];
      // i/u non accentués devant une autre voyelle = semi-voyelles
      if ((base === "i" || base === "u") && !ACCENTED.includes(c) && isVowel(n1) && i + 1 < L) {
        out.push(base === "i" ? "j" : "w"); i++; continue;
      }
      if (c === "è") out.push("ɛ");
      else if (c === "ò") out.push("ɔ");
      else out.push(base);
      i++; continue;
    }
    out.push(c); i++;
  }
  return out.join("");
}

export interface Pronunciation {
  ipa: string;
  syllables: string[];
  stressIndex: number;
  /** Lecture syllabique pour francophones : « ma-GA-ri ». */
  readable: string;
}

export function pronounce(word: string, stressFromEnd = 2): Pronunciation {
  const parts = word.trim().split(/\s+/);
  if (parts.length > 1) {
    const each = parts.map((p) => pronounce(p, p === parts[parts.length - 1] ? stressFromEnd : 2));
    return {
      ipa: each.map((e) => e.ipa).join(" "),
      syllables: each.flatMap((e) => e.syllables),
      stressIndex: -1,
      readable: each.map((e) => e.readable).join(" "),
    };
  }
  const clean = word.replace(/[’']/g, "").toLowerCase();
  const { syllables, stressIndex } = syllabify(clean, stressFromEnd);
  const ipaSyl = syllables.map((s, k) => syllableToIpa(s, syllables[k + 1] ?? "", k === 0, syllables[k - 1] ?? ""));
  const ipa = ipaSyl
    .map((s, k) => (k === stressIndex && syllables.length > 1 ? "ˈ" + s : s))
    .join(".")
    .replace(/\.ˈ/g, "ˈ");
  const readable = syllables
    .map((s, k) => (k === stressIndex && syllables.length > 1 ? s.toUpperCase() : s))
    .join("-");
  return { ipa: `/${ipa}/`, syllables, stressIndex, readable };
}
