import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, ChevronLeft, BookOpen } from "lucide-react";
import { allLessons, entry, lang, pronunciationOf } from "../content";
import { completeLesson, ensureWord, recordAnswer, setWordStatus } from "../db/repo";
import { useVocabMap, useSettings } from "../hooks";
import { buildExercise, shuffle, tilesOf, type Exercise } from "../core/exercises";
import { ExerciseRunner, type RunnerResult } from "../components/ExerciseRunner";
import { InteractiveText } from "../components/InteractiveText";
import { WordSheet, type WordTarget } from "../components/WordSheet";
import { SpeakButton, StatusBadge, Progress } from "../components/ui";
import { speechRecognitionSupported } from "../speech/stt";

type Phase = "intro" | "discover" | "practice" | "read" | "done";

export default function LessonPage() {
  const { id } = useParams();
  const lesson = allLessons().find((l) => l.id === id);
  const nav = useNavigate();
  const vocab = useVocabMap();
  const settings = useSettings();
  const [phase, setPhase] = useState<Phase>("intro");
  const [card, setCard] = useState(0);
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [sheet, setSheet] = useState<WordTarget | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const source = useMemo(() => (lesson ? { source: "lesson" as const, sourceId: lesson.id, sourceTitle: lesson.title } : undefined), [lesson]);
  if (!lesson) return <div className="page empty">Leçon introuvable.</div>;

  // Parcours adaptatif : on n'enseigne pas les mots déjà maîtrisés.
  const toLearn = lesson.words.filter((w) => vocab.get(w)?.status !== "known");
  const known = lesson.words.filter((w) => vocab.get(w)?.status === "known");

  const startDiscover = async () => {
    for (const w of lesson.words) {
      const e = entry(w);
      const ex = lesson.sentences.find(([it]) => e && it.toLowerCase().includes(e.lemma.toLowerCase().slice(0, 4)));
      await ensureWord(w, { ...source!, sentence: ex?.[0], translation: ex?.[1], at: Date.now() });
    }
    setCard(0);
    setPhase(toLearn.length ? "discover" : "practice");
    if (!toLearn.length) prepareExercises();
  };

  const prepareExercises = () => {
    const pool = lang().dictionary;
    const words = toLearn.length ? toLearn : lesson.words;
    const exs: Exercise[] = [];
    words.forEach((w, i) => {
      const e = entry(w);
      if (!e) return;
      const rec = vocab.get(w);
      // 1er passage : reconnaissance ; 2e : production/écoute.
      exs.push(buildExercise(e, rec ? { ...rec, reviewCount: 0 } : undefined, pool, i, { difficulty: settings.exerciseDifficulty, allowSpeech: false }));
      exs.push(buildExercise(e, rec ? { ...rec, reviewCount: 1 } : undefined, pool, i + 1, { difficulty: settings.exerciseDifficulty, allowSpeech: speechRecognitionSupported() && i % 3 === 0 }));
    });
    // Construction de phrases à partir des phrases de la leçon.
    for (const [it, fr] of lesson.sentences.slice(0, 2)) {
      if (tilesOf(it).length >= 3 && tilesOf(it).length <= 10) {
        exs.push({ kind: "construction", wordId: "", lemma: "", sentence: it, translation: fr, tiles: shuffle(tilesOf(it)) });
      }
    }
    setExercises(exs.slice(0, 2).concat(shuffle(exs.slice(2))));
  };

  const onAnswer = async (ex: Exercise, grade: Parameters<typeof recordAnswer>[1], ms: number) => {
    if (ex.wordId) await recordAnswer(ex.wordId, grade, ex.kind, ms);
  };

  return (
    <div className="page" style={{ paddingTop: 4 }}>
      {phase === "intro" && (
        <div className="stack lg">
          <button className="btn ghost sm" style={{ alignSelf: "flex-start", padding: 0 }} onClick={() => nav("/apprendre")}>
            <ChevronLeft size={18} /> Parcours
          </button>
          <div className="stack sm">
            <span className="eyebrow">
              {lesson.level} · {lesson.chapterTitle}
            </span>
            <h1>{lesson.title}</h1>
            <p className="muted">{lesson.goal}</p>
          </div>
          <div className="card stack sm">
            <div className="row between">
              <h3>Mots de la leçon</h3>
              <span className="subtle">{toLearn.length} à apprendre</span>
            </div>
            {lesson.words.map((w) => {
              const e = entry(w)!;
              const rec = vocab.get(w);
              const isKnown = rec?.status === "known";
              return (
                <div key={w} className="row" style={{ gap: 10, opacity: isKnown ? 0.55 : 1 }}>
                  <SpeakButton text={e.lemma} wordId={e.id} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b lang="it">{e.lemma}</b> <span className="subtle">· {e.senses[0].fr}</span>
                  </div>
                  {rec && <StatusBadge status={rec.status} />}
                  <button
                    className="btn ghost sm"
                    onClick={async () => {
                      await ensureWord(w, { ...source!, at: Date.now() });
                      await setWordStatus(w, isKnown ? "learning" : "known");
                    }}
                    title={isKnown ? "Remettre en apprentissage" : "Je connais déjà ce mot : il ne sera pas enseigné"}
                  >
                    {isKnown ? "Réapprendre" : "Je connais"}
                  </button>
                </div>
              );
            })}
            {known.length > 0 && <p className="subtle">Les mots que vous maîtrisez déjà sont ignorés : le parcours s'adapte à vous.</p>}
          </div>
          <button className="btn primary block" onClick={startDiscover}>
            Commencer la leçon <ArrowRight size={18} />
          </button>
        </div>
      )}

      {phase === "discover" && toLearn[card] && (
        <DiscoverCard
          key={toLearn[card]}
          id={toLearn[card]}
          index={card}
          total={toLearn.length}
          example={lesson.sentences.find(([it]) => it.toLowerCase().includes(entry(toLearn[card])!.lemma.toLowerCase().slice(0, 4)))}
          onNext={() => {
            if (card + 1 < toLearn.length) setCard(card + 1);
            else {
              prepareExercises();
              setPhase("practice");
            }
          }}
          onQuit={() => nav("/apprendre")}
        />
      )}

      {phase === "practice" && exercises.length > 0 && (
        <ExerciseRunner
          title={`Leçon · ${lesson.title}`}
          exercises={exercises}
          onAnswer={onAnswer}
          onQuit={() => nav("/apprendre")}
          onFinish={(r) => {
            setResult(r);
            setPhase("read");
          }}
        />
      )}

      {phase === "read" && (
        <div className="stack lg">
          <div className="stack sm">
            <span className="eyebrow">En situation</span>
            <h1>Lire et écouter</h1>
            <p className="muted">Touchez un mot pour ouvrir sa fiche.</p>
          </div>
          <div className="card stack">
            {lesson.sentences.map(([it, fr], i) => (
              <div key={i} className="row top" style={{ gap: 10 }}>
                <SpeakButton text={it} size="sm" />
                <div>
                  <div style={{ fontSize: "1.08rem", fontWeight: 600 }}>
                    <InteractiveText text={it} translation={fr} vocab={vocab} onWord={setSheet} source={source} />
                  </div>
                  <div className="subtle">{fr}</div>
                </div>
              </div>
            ))}
          </div>
          {lesson.grammar && (
            <div className="card stack sm" style={{ borderLeft: "4px solid var(--accent)" }}>
              <div className="row" style={{ gap: 8 }}>
                <BookOpen size={18} color="var(--accent)" />
                <h3>{lesson.grammar.title}</h3>
              </div>
              <p className="muted">{lesson.grammar.body}</p>
            </div>
          )}
          <button
            className="btn primary block"
            onClick={async () => {
              await completeLesson(lesson.id, result ? Math.round((result.correct / Math.max(1, result.total)) * 100) : 100);
              setPhase("done");
            }}
          >
            Terminer la leçon <Check size={18} />
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="stack lg center" style={{ paddingTop: "8vh", alignItems: "center" }}>
          <div style={{ fontSize: "3.5rem" }}>🎉</div>
          <h1>Leçon terminée !</h1>
          {result && (
            <p className="muted">
              {result.correct}/{result.total} bonnes réponses · {Math.round(result.durationMs / 60000) || 1} min
            </p>
          )}
          <p className="muted">Les nouveaux mots reviendront demain dans vos révisions (jour 1), puis à J3, J7, J14…</p>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn secondary" onClick={() => nav("/apprendre")}>
              Parcours
            </button>
            {(() => {
              const all = allLessons();
              const next = all[all.findIndex((l) => l.id === lesson.id) + 1];
              return next ? (
                <button className="btn primary" onClick={() => { setPhase("intro"); setResult(null); nav(`/lecon/${next.id}`); }}>
                  Leçon suivante <ArrowRight size={18} />
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}
      <WordSheet target={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}

function DiscoverCard({
  id,
  index,
  total,
  example,
  onNext,
  onQuit,
}: {
  id: string;
  index: number;
  total: number;
  example?: [string, string];
  onNext: () => void;
  onQuit: () => void;
}) {
  const e = entry(id)!;
  const p = pronunciationOf(e);
  const ex = example ?? e.examples[0];
  return (
    <div className="ex-shell">
      <div className="ex-top">
        <button className="icon-btn ghost" onClick={onQuit} aria-label="Quitter">
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <Progress value={index / total} tone="accent" />
        </div>
        <span className="subtle">
          {index + 1}/{total}
        </span>
      </div>
      <span className="eyebrow">Nouveau mot</span>
      <div className="card stack" style={{ padding: 24 }}>
        <div className="row between top">
          <div className="stack sm">
            <div className="row wrap" style={{ gap: 6 }}>
              <span className="badge level">{e.level}</span>
              <span className="badge">{e.pos}</span>
              {e.gender && <span className="badge">{e.gender === "m" ? "masc." : e.gender === "f" ? "fém." : "m./f."}</span>}
            </div>
            <div className="big-word" lang="it">
              {e.lemma}
            </div>
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="ipa">{p.ipa}</span>
              <span className="subtle">{p.readable}</span>
            </div>
          </div>
          <SpeakButton text={e.lemma} wordId={e.id} />
        </div>
        <div style={{ fontSize: "1.3rem", fontWeight: 700 }}>{e.senses.map((s) => s.fr).join(" · ")}</div>
        {e.usage && <p className="muted">{e.usage}</p>}
        {ex && (
          <div className="row top" style={{ gap: 10 }}>
            <SpeakButton text={ex[0]} size="sm" />
            <div>
              <div style={{ fontWeight: 600 }} lang="it">
                {ex[0]}
              </div>
              <div className="subtle">{ex[1]}</div>
            </div>
          </div>
        )}
      </div>
      <button className="btn primary block" onClick={onNext} autoFocus>
        {index + 1 < total ? "Mot suivant" : "Passer aux exercices"} <ArrowRight size={18} />
      </button>
    </div>
  );
}
