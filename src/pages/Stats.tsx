import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import { useActivity, useProgress, useVocab, useQueue } from "../hooks";
import { BADGES, levelTitle, vocabCounts, weekKeys } from "../core/gamification";
import { addDaysKey, dayKey } from "../core/srs";
import { lang } from "../content";
import { CEFR_LEVELS } from "../core/types";
import { BarChart, LineChart, StackedBars } from "../components/Charts";
import { PageHeader, Progress, Ring } from "../components/ui";

export default function Stats() {
  const vocab = useVocab() ?? [];
  const days = useActivity();
  const progress = useProgress();
  const queue = useQueue();
  const badges = useLiveQuery(() => db.badges.toArray(), [], []);
  const reviews = useLiveQuery(() => db.reviews.toArray(), [], []);
  const counts = vocabCounts(vocab);
  const today = dayKey();
  const byDay = new Map(days.map((d) => [d.id, d]));
  const week = new Set(weekKeys(today));
  const weekNew = days.filter((d) => week.has(d.id)).reduce((a, d) => a + d.newWords, 0);
  const answers = days.reduce((a, d) => a + d.answers, 0);
  const correct = days.reduce((a, d) => a + d.correct, 0);
  const seconds = days.reduce((a, d) => a + d.studySeconds + d.conversationSeconds, 0) + days.reduce((a, d) => a + d.scenes, 0) * 60;

  const last14 = Array.from({ length: 14 }, (_, i) => addDaysKey(today, i - 13));
  const last30 = Array.from({ length: 30 }, (_, i) => addDaysKey(today, i - 29));
  const short = (k: string) => `${Number(k.slice(8))}/${Number(k.slice(5, 7))}`;

  // Évolution du vocabulaire : mots découverts et mots « ancrés » (au moins une révision réussie).
  const growth = useMemo(() => {
    const firstSuccess = new Map<string, number>();
    for (const r of [...reviews].sort((a, b) => a.at - b.at)) {
      if (r.grade !== "again" && !firstSuccess.has(r.wordId) && r.wordId !== "__pronunciation__") firstSuccess.set(r.wordId, r.at);
    }
    const disc = vocab.map((w) => dayKey(w.firstSeenAt)).sort();
    const anch = [...firstSuccess.values()].map((t) => dayKey(t)).sort();
    const cum = (arr: string[], k: string) => arr.filter((d) => d <= k).length;
    return {
      discovered: last30.map((k) => cum(disc, k)),
      anchored: last30.map((k) => cum(anch, k)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocab, reviews, today]);

  const perLevel = CEFR_LEVELS.map((lv) => {
    const total = lang().dictionary.filter((e) => e.level === lv).length;
    const mine = vocab.filter((w) => w.level === lv);
    return {
      label: lv,
      total,
      parts: [
        { name: "Maîtrisés", value: mine.filter((w) => w.status === "known").length, color: "var(--known)" },
        { name: "En apprentissage", value: mine.filter((w) => w.status === "learning").length, color: "var(--learning)" },
      ],
    };
  });
  const owned = new Set(badges.map((b) => b.id));

  return (
    <div className="page stack lg">
      <PageHeader title="Progression" subtitle="Votre italien, en chiffres." />

      <div className="card row" style={{ gap: 16 }}>
        <Ring value={progress.progress} size={78} color="var(--gold)">
          {progress.level}
        </Ring>
        <div className="stack sm" style={{ flex: 1 }}>
          <span className="eyebrow">Niveau personnel</span>
          <b style={{ fontSize: "1.2rem" }}>{levelTitle(progress.level)}</b>
          <Progress value={progress.progress} tone="gold" />
          <span className="subtle">
            {progress.totalXp} XP · encore {progress.next - progress.totalXp} XP pour le niveau {progress.level + 1}
          </span>
        </div>
      </div>

      <div className="grid three">
        <Stat v={counts.total} l="mots découverts" />
        <Stat v={counts.unknown} l="inconnus" color="var(--unknown)" />
        <Stat v={counts.learning} l="en apprentissage" color="var(--learning)" />
        <Stat v={counts.known} l="maîtrisés" color="var(--known)" />
        <Stat v={weekNew} l="appris cette semaine" />
        <Stat v={answers ? `${Math.round((correct / answers) * 100)} %` : "—"} l="réussite aux exercices" />
        <Stat v={formatDuration(seconds)} l="temps d'apprentissage" />
        <Stat v={`${progress.streak.current} j`} l="série actuelle" color="var(--accent)" />
        <Stat v={`${progress.streak.best} j`} l="meilleure série" />
      </div>

      <div className="card stack">
        <div className="row between">
          <h2>Révisions</h2>
          <span className="subtle">{queue.dueToday} aujourd'hui · {queue.overdue} en retard</span>
        </div>
        <BarChart data={last14.map((k) => ({ label: short(k), value: byDay.get(k)?.reviews ?? 0, highlight: k === today }))} />
      </div>

      <div className="card stack">
        <h2>Évolution du vocabulaire (30 jours)</h2>
        <LineChart
          labels={last30.map(short)}
          series={[
            { name: "Mots découverts", color: "var(--accent)", values: growth.discovered },
            { name: "Mots ancrés (≥ 1 révision réussie)", color: "var(--brand)", values: growth.anchored },
          ]}
        />
      </div>

      <div className="card stack">
        <h2>Progression par niveau CECRL</h2>
        <p className="subtle">Mots maîtrisés / en apprentissage par rapport au vocabulaire de référence de chaque niveau.</p>
        <StackedBars rows={perLevel} />
      </div>

      <div className="card stack">
        <h2>XP par jour</h2>
        <BarChart color="var(--gold)" data={last14.map((k) => ({ label: short(k), value: byDay.get(k)?.xp ?? 0, highlight: k === today }))} format={(v) => `${v} XP`} />
      </div>

      <div>
        <div className="section-title">
          <h2>Badges</h2>
          <span className="subtle">
            {owned.size}/{BADGES.length}
          </span>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 10 }}>
          {BADGES.map((b) => (
            <div key={b.id} className="card tight stack sm center" style={{ alignItems: "center", opacity: owned.has(b.id) ? 1 : 0.4, filter: owned.has(b.id) ? "none" : "grayscale(1)" }} title={b.description}>
              <span style={{ fontSize: "1.8rem" }}>{b.icon}</span>
              <b style={{ fontSize: ".8rem" }}>{b.title}</b>
              <span className="subtle tiny">{b.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ v, l, color }: { v: number | string; l: string; color?: string }) {
  return (
    <div className="card tight stat">
      <b style={{ color }}>{v}</b>
      <span>{l}</span>
    </div>
  );
}

function formatDuration(s: number) {
  if (s < 60) return `${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}
