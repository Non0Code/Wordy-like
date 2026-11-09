import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getMeta } from "./db/db";
import { DEFAULT_SETTINGS, getSettings } from "./db/repo";
import { health, type Health } from "./ai/api";
import { dayKey, queueStats } from "./core/srs";
import { computeStreak, levelFromXp } from "./core/gamification";
import type { Settings, VocabRecord } from "./core/types";
import { allLessons } from "./content";

export function useSettings(): Settings {
  return useLiveQuery(() => getSettings(), [], DEFAULT_SETTINGS);
}

export function useVocab(): VocabRecord[] | undefined {
  return useLiveQuery(async () => (await db.vocab.toArray()).filter((w) => !w.deleted), []);
}

export function useVocabMap(): Map<string, VocabRecord> {
  const v = useVocab();
  return useMemo(() => new Map((v ?? []).map((w) => [w.id, w])), [v]);
}

export function useActivity() {
  return useLiveQuery(() => db.activity.toArray(), [], []);
}

export function useToday() {
  return useLiveQuery(() => db.activity.get(dayKey()), []);
}

export function useQueue() {
  const vocab = useVocab();
  const settings = useSettings();
  const today = useToday();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return useMemo(
    () => {
      const have = new Set((vocab ?? []).map((w) => w.id));
      const remaining = allLessons().reduce((a, l) => a + l.words.filter((w) => !have.has(w)).length, 0);
      return queueStats(vocab ?? [], settings.newWordsPerDay, today?.newWords ?? 0, now, remaining);
    },
    [vocab, settings.newWordsPerDay, today?.newWords, now],
  );
}

export function useProgress() {
  const days = useActivity();
  return useMemo(() => {
    const totalXp = days.reduce((a, d) => a + d.xp, 0);
    return { totalXp, ...levelFromXp(totalXp), streak: computeStreak(days) };
  }, [days]);
}

export function useHealth(): Health | null {
  const [h, setH] = useState<Health | null>(null);
  useEffect(() => {
    let alive = true;
    health().then((r) => alive && setH(r));
    return () => {
      alive = false;
    };
  }, []);
  return h;
}

export function useAuthUser() {
  return useLiveQuery(() => getMeta<{ id: string; email: string; name: string } | null>("authUser", null), [], null);
}

export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
