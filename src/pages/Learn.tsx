import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Repeat, Dumbbell, Mic, MessagesSquare, Clapperboard, PenLine, Headphones, ListChecks, Shuffle } from "lucide-react";
import { lang } from "../content";
import { db } from "../db/db";
import { useQueue, useSettings, useVocabMap } from "../hooks";
import { CEFR_LEVELS, type Cefr } from "../core/types";
import { PageHeader, Progress } from "../components/ui";

export default function Learn() {
  const settings = useSettings();
  const [level, setLevel] = useState<Cefr>(settings.level);
  const queue = useQueue();
  const nav = useNavigate();
  const vocab = useVocabMap();
  const progress = useLiveQuery(() => db.lessons.toArray(), [], []);
  const done = new Set(progress.filter((p) => p.completedAt).map((p) => p.id));
  const def = lang().curriculum.find((l) => l.level === level)!;
  const levelLessons = def.chapters.flatMap((c) => c.lessons);
  const firstTodo = levelLessons.find((l) => !done.has(l.id));

  return (
    <div className="page stack lg">
      <PageHeader title="Apprendre" subtitle="Parcours progressif, révisions et exercices." />

      <div className="grid two">
        <button className="card stack sm" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => nav("/revision")}>
          <div className="row between">
            <Repeat size={22} color="var(--brand)" />
            {queue.dueToday > 0 && <span className="badge" style={{ background: "var(--accent)", color: "#fff" }}>{queue.dueToday}</span>}
          </div>
          <b>Révisions</b>
          <span className="subtle">{queue.dueToday ? `${queue.dueToday} mots · ≈ ${queue.estimatedMinutes} min` : "À jour"}</span>
        </button>
        <button className="card stack sm" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => nav("/exercices")}>
          <Dumbbell size={22} color="var(--accent)" />
          <b>Séance mixte</b>
          <span className="subtle">Mots à revoir et nouveaux mots</span>
        </button>
      </div>

      <div>
        <div className="section-title">
          <h2>Exercices ciblés</h2>
        </div>
        <div className="grid three">
          {[
            { to: "/exercices?type=traduction", icon: Shuffle, label: "Traduction" },
            { to: "/exercices?type=qcm", icon: ListChecks, label: "QCM" },
            { to: "/exercices?type=ecriture", icon: PenLine, label: "Écriture" },
            { to: "/exercices?type=construction", icon: Dumbbell, label: "Phrases" },
            { to: "/exercices?type=ecoute", icon: Headphones, label: "Écoute" },
            { to: "/prononciation", icon: Mic, label: "Prononciation" },
            { to: "/films?mode=comprehension", icon: Clapperboard, label: "Ciné-quiz" },
            { to: "/professeur?mode=conversation", icon: MessagesSquare, label: "Conversation" },
            { to: "/professeur", icon: MessagesSquare, label: "Professeur" },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={label} to={to} className="card tight stack sm center" style={{ alignItems: "center" }}>
              <Icon size={20} color="var(--brand)" />
              <span style={{ fontWeight: 600, fontSize: ".85rem" }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="section-title">
          <h2>Parcours</h2>
          <span className="subtle">
            {levelLessons.filter((l) => done.has(l.id)).length}/{levelLessons.length} leçons
          </span>
        </div>
        <div className="segmented" role="tablist">
          {CEFR_LEVELS.map((l) => (
            <button key={l} className={l === level ? "on" : ""} onClick={() => setLevel(l)} role="tab" aria-selected={l === level}>
              {l}
            </button>
          ))}
        </div>
        <p className="muted mt">
          <b>{def.name}.</b> {def.description}
        </p>
        <div className="stack lg mt">
          {def.chapters.map((ch) => {
            const words = ch.lessons.flatMap((l) => l.words);
            const known = words.filter((w) => vocab.get(w)?.status === "known").length;
            return (
              <div key={ch.id} className="stack sm">
                <div className="row between">
                  <h3>
                    {ch.icon} {ch.title}
                  </h3>
                  <span className="subtle">
                    {known}/{words.length} mots maîtrisés
                  </span>
                </div>
                <Progress value={known / words.length} />
                <div className="stack sm" style={{ marginTop: 6 }}>
                  {ch.lessons.map((l) => {
                    const isDone = done.has(l.id);
                    const isNext = firstTodo?.id === l.id;
                    const n = levelLessons.indexOf(l) + 1;
                    return (
                      <Link key={l.id} to={`/lecon/${l.id}`} className={`lesson-node ${isDone ? "done" : ""} ${isNext ? "next" : ""}`}>
                        <span className="num">{isDone ? <Check size={20} /> : n}</span>
                        <div className="stack" style={{ gap: 2, minWidth: 0, flex: 1 }}>
                          <b>{l.title}</b>
                          <span className="subtle truncate">{l.goal}</span>
                        </div>
                        <span className="subtle">{l.words.length} mots</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
