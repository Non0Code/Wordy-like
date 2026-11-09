import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, Check, Clock, Play, Sparkles, Mic, MessagesSquare, Repeat } from "lucide-react";
import { useProgress, useQueue, useSettings, useToday, useActivity } from "../hooks";
import { dailyGoals, levelTitle, weeklyChallenges } from "../core/gamification";
import { db } from "../db/db";
import { allLessons, lang } from "../content";
import { Progress, Ring } from "../components/ui";

export function HomePage() {
  const settings = useSettings();
  const queue = useQueue();
  const today = useToday();
  const days = useActivity();
  const progress = useProgress();
  const nav = useNavigate();
  const lessons = useLiveQuery(() => db.lessons.toArray(), [], []);
  const done = new Set(lessons.filter((l) => l.completedAt).map((l) => l.id));
  const all = allLessons();
  const nextLesson = all.find((l) => !done.has(l.id) && rank(l.level) >= rank(settings.level)) ?? all.find((l) => !done.has(l.id));
  const goals = dailyGoals(today, settings, queue.dueToday);
  const weekly = weeklyChallenges(days);
  const goalsDone = goals.filter((g) => g.done).length;
  const scene = lang().scenes.find((s) => s.level === settings.level) ?? lang().scenes[0];
  const hour = new Date().getHours();
  const hello = hour < 18 ? "Buongiorno" : "Buonasera";

  return (
    <div className="page stack lg" style={{ paddingTop: 8 }}>
      <div className="stack sm">
        <span className="eyebrow">
          {levelTitle(progress.level)} · {settings.level}
        </span>
        <h1>
          {hello}
          {settings.displayName ? `, ${settings.displayName}` : ""} !
        </h1>
      </div>

      {/* Révisions : l'élément le plus important de la journée */}
      <div className="card hero stack">
        <div className="row between top">
          <div className="stack sm">
            <span className="eyebrow" style={{ color: "rgba(255,255,255,.75)" }}>
              Révisions du jour
            </span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2.6rem", fontWeight: 600, lineHeight: 1 }}>{queue.dueToday}</div>
            <span className="muted">
              {queue.dueToday === 0
                ? "Tout est à jour. Vos mots sont bien ancrés."
                : `mot${queue.dueToday > 1 ? "s" : ""} à réviser${queue.overdue ? ` dont ${queue.overdue} en retard` : ""}`}
            </span>
          </div>
          <Ring value={goalsDone / goals.length} size={70} color="#fff">
            <span style={{ color: "#fff", fontSize: 15 }}>
              {goalsDone}/{goals.length}
            </span>
          </Ring>
        </div>
        <div className="row wrap" style={{ gap: 14, fontSize: ".88rem" }}>
          <span className="row" style={{ gap: 5 }}>
            <Clock size={15} /> ≈ {Math.max(1, queue.estimatedMinutes)} min
          </span>
          <span>{queue.newAvailable} nouveaux mots disponibles</span>
          <span>{queue.mastered} maîtrisés</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {queue.dueToday > 0 ? (
            <button className="btn on-hero" onClick={() => nav("/revision")}>
              <Repeat size={18} /> Réviser maintenant
            </button>
          ) : (
            <button className="btn on-hero" onClick={() => nav(nextLesson ? `/lecon/${nextLesson.id}` : "/apprendre")}>
              <Sparkles size={18} /> Apprendre de nouveaux mots
            </button>
          )}
          <button className="btn" style={{ background: "rgba(255,255,255,.15)", color: "#fff" }} onClick={() => nav("/exercices")}>
            Exercices
          </button>
        </div>
      </div>

      {nextLesson && (
        <Link to={`/lecon/${nextLesson.id}`} className="card row" style={{ gap: 14 }}>
          <div className="brand-mark" style={{ width: 48, height: 48, borderRadius: 14, fontSize: "1.3rem", flexShrink: 0 }}>
            {nextLesson.level}
          </div>
          <div className="stack sm" style={{ flex: 1, minWidth: 0 }}>
            <span className="eyebrow">Continuer le parcours · {nextLesson.chapterTitle}</span>
            <b className="truncate">{nextLesson.title}</b>
            <span className="subtle truncate">{nextLesson.goal}</span>
          </div>
          <ArrowRight size={20} color="var(--brand)" />
        </Link>
      )}

      <div>
        <div className="section-title">
          <h2>Objectifs du jour</h2>
          <span className="subtle">{today?.xp ?? 0} XP aujourd'hui</span>
        </div>
        <div className="card stack">
          {goals.map((g) => (
            <Link key={g.id} to={g.to} className="row" style={{ gap: 12 }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: g.done ? "var(--ok)" : "var(--surface-2)",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {g.done && <Check size={16} />}
              </span>
              <div className="stack" style={{ gap: 5, flex: 1 }}>
                <div className="row between">
                  <span style={{ fontWeight: 600, textDecoration: g.done ? "line-through" : "none", opacity: g.done ? 0.6 : 1 }}>{g.label}</span>
                  <span className="subtle">
                    {Math.min(g.value, g.target)}/{g.target}
                  </span>
                </div>
                <Progress value={g.value / g.target} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="section-title">
          <h2>Scène du jour</h2>
          <Link to="/films">Bibliothèque</Link>
        </div>
        <Link to={`/scene/${scene.id}`} className="card scene-card" style={{ display: "block" }}>
          <div className="scene-cover" style={{ background: `linear-gradient(135deg, ${scene.palette[0]}, ${scene.palette[1]})` }}>
            <span className="play">
              <Play size={18} fill="#fff" />
            </span>
            <span className="work">
              {scene.work} · {scene.kind}
            </span>
            <span className="title">{scene.title}</span>
          </div>
          <div className="row between" style={{ padding: "12px 16px" }}>
            <span className="subtle truncate">{scene.synopsis}</span>
            <span className="badge level">{scene.level}</span>
          </div>
        </Link>
      </div>

      <div className="grid two">
        <Link to="/professeur" className="card stack sm">
          <MessagesSquare size={22} color="var(--brand)" />
          <b>Professeur</b>
          <span className="subtle">Corriger une phrase, poser une question, converser</span>
        </Link>
        <Link to="/prononciation" className="card stack sm">
          <Mic size={22} color="var(--accent)" />
          <b>Prononciation</b>
          <span className="subtle">Écouter, s'enregistrer, recevoir un retour</span>
        </Link>
      </div>

      <div>
        <div className="section-title">
          <h2>Défis de la semaine</h2>
        </div>
        <div className="grid two">
          {weekly.map((c) => (
            <div key={c.id} className="card tight stack sm">
              <div className="row between">
                <span style={{ fontWeight: 600, fontSize: ".9rem" }}>{c.label}</span>
                {c.done && <Check size={16} color="var(--ok)" />}
              </div>
              <Progress value={c.value / c.target} tone="gold" />
              <span className="subtle tiny">
                {Math.min(c.value, c.target)} / {c.target}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const rank = (l: string) => ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(l);
