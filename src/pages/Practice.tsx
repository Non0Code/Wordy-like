import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildSession } from "../db/session";
import { recordAnswer } from "../db/repo";
import { EXERCISE_LABELS, type Exercise, type ExerciseKind } from "../core/exercises";
import { ExerciseRunner, type RunnerResult } from "../components/ExerciseRunner";

export default function PracticePage() {
  const [params] = useSearchParams();
  const type = params.get("type") as ExerciseKind | null;
  const ids = params.get("mots")?.split(",").filter(Boolean);
  const nav = useNavigate();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [result, setResult] = useState<RunnerResult | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    setExercises(null);
    setResult(null);
    buildSession({ count: 12, kinds: type ? [type] : undefined, wordIds: ids }).then(setExercises);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, round, params.get("mots")]);

  if (!exercises) return <div className="page subtle">Préparation de la séance…</div>;
  if (!exercises.length)
    return (
      <div className="page empty">
        <div className="big">🧩</div>
        <p>Aucun mot disponible pour cet exercice. Commencez une leçon pour enrichir votre vocabulaire.</p>
        <button className="btn primary mt" onClick={() => nav("/apprendre")}>
          Parcours
        </button>
      </div>
    );
  if (result)
    return (
      <div className="page stack lg center" style={{ paddingTop: "8vh", alignItems: "center" }}>
        <div style={{ fontSize: "3.2rem" }}>{result.correct / result.total >= 0.8 ? "🏆" : "💪"}</div>
        <h1>Séance terminée</h1>
        <p className="muted">
          {result.correct}/{result.total} bonnes réponses · {Math.max(1, Math.round(result.durationMs / 60000))} min
        </p>
        <p className="muted">Chaque réponse a mis à jour la date de prochaine révision de ses mots.</p>
        <div className="row" style={{ gap: 10 }}>
          <button className="btn secondary" onClick={() => nav("/apprendre")}>
            Terminer
          </button>
          <button className="btn primary" onClick={() => setRound((r) => r + 1)}>
            Nouvelle séance
          </button>
        </div>
      </div>
    );
  return (
    <div className="page">
      <ExerciseRunner
        title={type ? EXERCISE_LABELS[type] : "Séance mixte"}
        exercises={exercises}
        onQuit={() => nav(-1)}
        onAnswer={(ex, grade, ms) => recordAnswer(ex.wordId, grade, ex.kind, ms).then(() => {})}
        onFinish={setResult}
      />
    </div>
  );
}
