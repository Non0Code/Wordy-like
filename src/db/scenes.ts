/**
 * Catalogue unifié : scènes de démonstration intégrées + vidéos importées
 * par l'utilisateur (stockées localement dans IndexedDB, jamais redistribuées).
 */
import { lang, analyze } from "../content";
import type { Scene, SceneLine } from "../content/it/scenes";
import timings from "../content/it/scene-timings.json";
import { db } from "./db";
import { alignTranslations, parseSubtitles } from "../core/subtitles";
import type { UserVideo, VocabRecord } from "../core/types";

export interface PlayableScene extends Scene {
  lines: Array<SceneLine & { start: number; end: number }>;
  src: string | null;
  vtt?: { it: string; fr: string };
  userVideo?: boolean;
  duration: number;
}

const T = timings as unknown as Record<string, Array<[number, number]>>;

export function builtInScenes(): PlayableScene[] {
  return lang().scenes.map((s) => {
    const times = T[s.id];
    const lines = s.lines.map((l, i) => ({ ...l, start: times?.[i]?.[0] ?? i * 4, end: times?.[i]?.[1] ?? i * 4 + 3.5 }));
    return {
      ...s,
      lines,
      src: times ? `/media/scenes/${s.id}.mp4` : null,
      vtt: { it: `/media/scenes/${s.id}.it.vtt`, fr: `/media/scenes/${s.id}.fr.vtt` },
      duration: Math.ceil(lines[lines.length - 1]?.end ?? 0) + 1,
    };
  });
}

export function userVideoToScene(v: UserVideo, objectUrl: string | null): PlayableScene {
  const it = parseSubtitles(v.subtitlesIt);
  const fr = v.subtitlesFr ? alignTranslations(it, parseSubtitles(v.subtitlesFr)) : [];
  return {
    id: `user:${v.id}`,
    title: v.title,
    work: "Ma vidéo",
    kind: v.kind,
    level: v.level,
    themes: v.themes,
    synopsis: "Vidéo importée depuis votre appareil (stockée uniquement en local).",
    palette: ["#2b2d42", "#8d99ae"],
    speakers: {},
    lines: it.map((c, i) => ({ speaker: "", it: c.text, fr: fr[i] ?? "", start: c.start, end: c.end })),
    questions: [],
    demo: false,
    userVideo: true,
    src: objectUrl ?? v.url ?? null,
    duration: Math.ceil(it[it.length - 1]?.end ?? 0),
  };
}

export async function loadScene(id: string): Promise<{ scene: PlayableScene; revoke?: () => void } | null> {
  if (id.startsWith("user:")) {
    const v = await db.videos.get(id.slice(5));
    if (!v) return null;
    const url = v.blob ? URL.createObjectURL(v.blob) : null;
    return { scene: userVideoToScene(v, url), revoke: url ? () => URL.revokeObjectURL(url) : undefined };
  }
  const s = builtInScenes().find((x) => x.id === id);
  return s ? { scene: s } : null;
}

/** Mots du dictionnaire présents dans une scène (identifiants uniques). */
export function sceneWordIds(scene: Pick<Scene, "lines">): string[] {
  const ids = new Set<string>();
  for (const l of scene.lines) for (const t of analyze(l.it)) if (t.isWord && (t.expressionId ?? t.entryIds[0])) ids.add(t.expressionId ?? t.entryIds[0]);
  return [...ids];
}

/** Mots nouveaux pour l'utilisateur (absents de son vocabulaire ou encore inconnus). */
export function newWordsFor(scene: Pick<Scene, "lines">, vocab: Map<string, VocabRecord>): string[] {
  return sceneWordIds(scene).filter((id) => {
    const w = vocab.get(id);
    return !w || w.status === "unknown";
  });
}
