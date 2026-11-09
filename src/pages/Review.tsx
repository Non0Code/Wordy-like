import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Dumbbell } from "lucide-react";
import { db } from "../db/db";
import { recordAnswer } from "../db/repo";
import { entryFor } from "../db/session";
import { endOfDay, formatInterval, GRADE_LABELS, previewIntervals, sortForReview } from "../core/srs";
import type { ReviewGrade, VocabRecord } from "../core/types";
import { Progress, SpeakButton } from "../components/ui";
import { speak, wordAudioUrl } from "../speech/tts";
import { pronunciationOf, entry } from "../content";
import { useQueue } from "../hooks";

export default function ReviewPage() {
  const nav = useNavigate();
  const [queue, setQueue] = useState<VocabRecord[] | null>(null);
  const [done, setDone] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<Record<ReviewGrade, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const shownAt = useRef(Date.now());
  const q = useQueue();

  useEffect(() => {
    (async () => {
      const eod = endOfDay();
      const all = await db.vocab.toArray();
      setQueue(sortForReview(all.filter((w) => !w.deleted && w.step >= 0 && w.dueAt !== null && w.dueAt <= eod)));
    })();
  }, []);

  const current = queue?.[0];
  const total = (queue?.length ?? 0) + done;
  const preview = useMemo(() => (current ? previewIntervals(current) : null), [current]);

  useEffect(() => {
    setFlipped(false);
    shownAt.current = Date.now();
    if (current) speak(current.lemma, { fallbackUrl: wordAudioUrl(current.id) }).catch(() => {});
  }, [current]);

  const grade = async (g: ReviewGrade) => {
    if (!current) return;
    const updated = await recordAnswer(current.id, g, "révision", Date.now() - shownAt.current);
    setStats((s) => ({ ...s, [g]: s[g] + 1 }));
    setQueue((qq) => {
      const rest = (qq ?? []).slice(1);
      // « Oublié » : le mot revient en fin de séance (réapprentissage).
      return g === "again" && updated ? [...rest, updated] : rest;
    });
    if (g !== "again") setDone((d) => d + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped(true);
      }
      if (!flipped) return;
      const map: Record<string, ReviewGrade> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
      if (map[e.key]) void grade(map[e.key]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!queue) return <div className="page subtle">Chargement…</div>;

  if (!current) {
    const reviewed = Object.values(stats).reduce((a, b) => a + b, 0);
    return (
      <div className="page stack lg center" style={{ paddingTop: "8vh", alignItems: "center" }}>
        <div style={{ fontSize: "3.2rem" }}>{reviewed ? "✅" : "🌿"}</div>
        <h1>{reviewed ? "Révisions terminées !" : "Aucune révision pour le moment"}</h1>
        {reviewed > 0 ? (
          <p className="muted">
            {reviewed} réponses · {stats.easy + stats.good} faciles/correctes · {stats.hard} difficiles · {stats.again} oubliées
          </p>
        ) : (
          <p className="muted">Vos mots sont programmés pour plus tard. {q.newAvailable > 0 && `${q.newAvailable} nouveaux mots vous attendent.`}</p>
        )}
        <div className="row" style={{ gap: 10 }}>
          <button className="btn secondary" onClick={() => nav("/")}>
            Accueil
          </button>
          <button className="btn primary" onClick={() => nav("/exercices")}>
            <Dumbbell size={18} /> Exercices
          </button>
        </div>
      </div>
    );
  }

  const e = entryFor(current);
  const dictEntry = entry(current.id);
  const ctx = [...current.contexts].reverse().find((c) => c.sentence);
  return (
    <div className="page">
      <div className="ex-shell">
        <div className="ex-top">
          <button className="icon-btn ghost" onClick={() => nav(-1)} aria-label="Quitter">
            <X size={22} />
          </button>
          <div style={{ flex: 1 }}>
            <Progress value={done / Math.max(1, total)} />
          </div>
          <span className="subtle">
            {done}/{total}
          </span>
        </div>
        <div className="row between">
          <span className="eyebrow">Révision · répétition espacée</span>
          <span className="subtle tiny">
            {current.reviewCount} révisions · intervalle actuel {current.intervalDays ? formatInterval(current.intervalDays) : "—"}
          </span>
        </div>

        <div className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(true)} role="button" aria-label="Retourner la carte">
          <div className="flashcard-inner">
            <div className="card flashcard-face">
              <span className="badge">{current.pos}</span>
              <div className="big-word" lang="it">
                {current.lemma}
              </div>
              <span className="ipa">{dictEntry ? pronunciationOf(dictEntry).ipa : current.pronunciation}</span>
              <span className="subtle" style={{ marginTop: 12 }}>
                Touchez pour voir la réponse <span className="kbd hide-mobile">Espace</span>
              </span>
            </div>
            <div className="card flashcard-face back">
              <div className="row" style={{ gap: 8 }}>
                <span className="big-word" lang="it" style={{ fontSize: "1.5rem" }}>
                  {current.lemma}
                </span>
                <SpeakButton text={current.lemma} wordId={current.id} size="sm" />
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 700 }}>{e.senses.map((s) => s.fr).slice(0, 3).join(" · ")}</div>
              {ctx ? (
                <div className="subtle">
                  <i lang="it">« {ctx.sentence} »</i>
                  {ctx.sourceTitle && <> — {ctx.sourceTitle}</>}
                </div>
              ) : (
                e.examples[0] && (
                  <div className="subtle">
                    <i lang="it">« {e.examples[0][0]} »</i> — {e.examples[0][1]}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {flipped ? (
          <div className="grades">
            {(["again", "hard", "good", "easy"] as ReviewGrade[]).map((g, k) => (
              <button key={g} className={`grade ${g}`} onClick={() => grade(g)}>
                {GRADE_LABELS[g]}
                <small>
                  {preview?.[g]} <span className="hide-mobile">· {k + 1}</span>
                </small>
              </button>
            ))}
          </div>
        ) : (
          <button className="btn primary block" onClick={() => setFlipped(true)}>
            Afficher la réponse
          </button>
        )}
      </div>
    </div>
  );
}
