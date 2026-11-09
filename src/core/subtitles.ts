/** Lecture de sous-titres SRT et WebVTT (fichiers fournis par l'utilisateur). */
export interface Cue {
  start: number;
  end: number;
  text: string;
}

function toSeconds(t: string): number {
  const m = t.trim().replace(",", ".").match(/(?:(\d+):)?(\d{1,2}):(\d{1,2}(?:\.\d+)?)/);
  if (!m) return NaN;
  return Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export function parseSubtitles(src: string): Cue[] {
  const text = src.replace(/\r/g, "").replace(/^﻿/, "");
  const blocks = text.split(/\n{2,}/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "");
    const idx = lines.findIndex((l) => l.includes("-->"));
    if (idx < 0) continue;
    const [a, b] = lines[idx].split("-->");
    const start = toSeconds(a);
    const end = toSeconds(b.split(/\s+/).filter(Boolean)[0] ?? "");
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    const body = lines
      .slice(idx + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .replace(/\{\\[^}]+\}/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (body) cues.push({ start, end, text: body });
  }
  return cues.sort((x, y) => x.start - y.start);
}

/** Associe à chaque sous-titre italien la traduction française qui le chevauche le plus. */
export function alignTranslations(it: Cue[], fr: Cue[]): string[] {
  return it.map((c) => {
    let best = "";
    let bestOverlap = 0;
    for (const f of fr) {
      const overlap = Math.min(c.end, f.end) - Math.max(c.start, f.start);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        best = f.text;
      }
    }
    return best;
  });
}

/** Index du sous-titre actif à l'instant t (−1 si aucun). */
export function cueAt(cues: Array<{ start: number; end: number }>, t: number): number {
  for (let i = 0; i < cues.length; i++) {
    if (t >= cues[i].start && t < cues[i].end + 0.25) return i;
  }
  return -1;
}
