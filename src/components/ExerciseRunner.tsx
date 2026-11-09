import { useEffect, useMemo, useRef, useState } from "react";
import { X, Volume2, Mic, Square, RotateCcw, Snail } from "lucide-react";
import { checkSentence, checkTyped, EXERCISE_LABELS, type Exercise } from "../core/exercises";
import { GRADE_LABELS } from "../core/srs";
import type { ReviewGrade } from "../core/types";
import { speak, wordAudioUrl } from "../speech/tts";
import { recognizeOnce, speechRecognitionSupported } from "../speech/stt";
import { evaluatePronunciation, type PronunciationFeedback } from "../core/pronunciation";
import { Progress } from "./ui";

export interface RunnerResult {
  total: number;
  correct: number;
  durationMs: number;
}

/**
 * Enchaîne une liste d'exercices. Après une bonne réponse, l'apprenant précise
 * la difficulté (Facile / Correct / Difficile) ; une erreur compte « Oublié ».
 */
export function ExerciseRunner({
  exercises,
  onAnswer,
  onFinish,
  onQuit,
  title,
}: {
  exercises: Exercise[];
  onAnswer: (ex: Exercise, grade: ReviewGrade, ms: number) => void | Promise<void>;
  onFinish: (r: RunnerResult) => void;
  onQuit?: () => void;
  title?: string;
}) {
  const [i, setI] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; typo?: boolean; expected?: string; heard?: PronunciationFeedback } | null>(null);
  const [correct, setCorrect] = useState(0);
  const start = useRef(Date.now());
  const exStart = useRef(Date.now());
  const ex = exercises[i];

  useEffect(() => {
    exStart.current = Date.now();
  }, [i]);

  const answered = (ok: boolean, extra: { typo?: boolean; expected?: string; heard?: PronunciationFeedback } = {}) => {
    setResult({ ok, ...extra });
    if (ok) setCorrect((c) => c + 1);
  };

  const next = async (grade: ReviewGrade | "skip") => {
    if (grade !== "skip") await onAnswer(ex, grade, Date.now() - exStart.current);
    setResult(null);
    if (i + 1 >= exercises.length) {
      onFinish({ total: exercises.length, correct: correct, durationMs: Date.now() - start.current });
    } else setI(i + 1);
  };

  if (!ex) return null;
  return (
    <div className="ex-shell">
      <div className="ex-top">
        {onQuit && (
          <button className="icon-btn ghost" onClick={onQuit} aria-label="Quitter">
            <X size={22} />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <Progress value={i / exercises.length} />
        </div>
        <span className="subtle">
          {i + 1}/{exercises.length}
        </span>
      </div>
      <div className="row between">
        <span className="eyebrow">{title ?? EXERCISE_LABELS[ex.kind]}</span>
        {title && <span className="badge">{EXERCISE_LABELS[ex.kind]}</span>}
      </div>
      <div className="ex-body" key={i}>
        <ExerciseView ex={ex} locked={!!result} onResult={answered} onSkip={() => next("skip")} />
      </div>
      {result && <Feedback ex={ex} result={result} onGrade={next} />}
    </div>
  );
}

function Feedback({
  ex,
  result,
  onGrade,
}: {
  ex: Exercise;
  result: { ok: boolean; typo?: boolean; expected?: string; heard?: PronunciationFeedback };
  onGrade: (g: ReviewGrade) => void;
}) {
  const answerText =
    ex.kind === "construction" ? ex.sentence : ex.kind === "ecoute" ? `${ex.audioText} — ${ex.translation}` : (result.expected ?? "");
  return (
    <div className="stack" style={{ position: "sticky", bottom: "calc(var(--nav-h) + 12px)" }}>
      <div className={`feedback ${result.ok ? "ok" : "ko"}`}>
        <b>{result.ok ? (result.typo ? "Correct (attention à l'orthographe)" : "Bravo !") : "Pas tout à fait…"}</b>
        {answerText && (
          <div className="muted" style={{ marginTop: 2 }}>
            {result.ok ? "Réponse : " : "Bonne réponse : "}
            <b lang="it">{answerText}</b>
          </div>
        )}
      </div>
      {result.ok ? (
        <div className="grades">
          {(["hard", "good", "easy"] as ReviewGrade[]).map((g) => (
            <button key={g} className={`grade ${g}`} onClick={() => onGrade(g)}>
              {GRADE_LABELS[g]}
              <small>{g === "hard" ? "j'ai hésité" : g === "good" ? "sans hésiter" : "trop simple"}</small>
            </button>
          ))}
          <button className="grade again" onClick={() => onGrade("again")}>
            {GRADE_LABELS.again}
            <small>coup de chance</small>
          </button>
        </div>
      ) : (
        <button className="btn primary block" onClick={() => onGrade("again")} autoFocus>
          Continuer
        </button>
      )}
    </div>
  );
}

function ExerciseView({ ex, locked, onResult, onSkip }: { ex: Exercise; locked: boolean; onSkip: () => void; onResult: (ok: boolean, extra?: { typo?: boolean; expected?: string; heard?: PronunciationFeedback }) => void }) {
  switch (ex.kind) {
    case "qcm":
      return <Mcq ex={ex} locked={locked} onResult={onResult} />;
    case "traduction":
    case "ecriture":
      return <Typed ex={ex} locked={locked} onResult={onResult} />;
    case "construction":
      return <Build ex={ex} locked={locked} onResult={onResult} />;
    case "ecoute":
      return <Listen ex={ex} locked={locked} onResult={onResult} />;
    case "prononciation":
      return <Speak ex={ex} locked={locked} onResult={onResult} onSkip={onSkip} />;
  }
}

type Props<K extends Exercise["kind"]> = { ex: Extract<Exercise, { kind: K }>; locked: boolean; onResult: (ok: boolean, extra?: { typo?: boolean; expected?: string; heard?: PronunciationFeedback }) => void };

function Mcq({ ex, locked, onResult }: Props<"qcm">) {
  const [picked, setPicked] = useState<number | null>(null);
  const isIt = ex.direction === "it-fr";
  useEffect(() => {
    if (isIt) speak(ex.prompt, { fallbackUrl: wordAudioUrl(ex.wordId) }).catch(() => {});
  }, [ex, isIt]);
  return (
    <>
      <p className="muted">{isIt ? "Que signifie ce mot ?" : "Comment dit-on en italien ?"}</p>
      <div className="row" style={{ gap: 10 }}>
        <div className="big-word" lang={isIt ? "it" : "fr"}>
          {ex.prompt}
        </div>
        {isIt && (
          <button className="icon-btn sm" onClick={() => speak(ex.prompt, { fallbackUrl: wordAudioUrl(ex.wordId) }).catch(() => {})} aria-label="Écouter">
            <Volume2 size={16} />
          </button>
        )}
      </div>
      <div className="stack sm">
        {ex.options.map((o, k) => (
          <button
            key={k}
            disabled={locked}
            lang={isIt ? "fr" : "it"}
            className={`option ${picked !== null && k === ex.answer ? "right" : ""} ${picked === k && k !== ex.answer ? "wrong" : ""}`}
            onClick={() => {
              setPicked(k);
              onResult(k === ex.answer, { expected: ex.options[ex.answer] });
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </>
  );
}

function Typed({ ex, locked, onResult }: Props<"traduction" | "ecriture">) {
  const [value, setValue] = useState("");
  const toFrench = ex.kind === "traduction";
  const submit = () => {
    const r = checkTyped(value, ex.answers);
    onResult(r.ok, { typo: r.typo, expected: ex.answers[0] });
  };
  const accents = ["à", "è", "é", "ì", "ò", "ù"];
  return (
    <>
      <p className="muted">{toFrench ? "Traduisez en français" : "Écrivez le mot italien"}</p>
      <div className="row" style={{ gap: 10 }}>
        <div className="big-word" lang={toFrench ? "it" : "fr"}>
          {ex.prompt}
        </div>
        {toFrench && (
          <button className="icon-btn sm" onClick={() => speak(ex.prompt, { fallbackUrl: wordAudioUrl(ex.wordId) }).catch(() => {})} aria-label="Écouter">
            <Volume2 size={16} />
          </button>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!locked && value.trim()) submit();
        }}
        className="stack sm"
      >
        <input
          className="input big"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={locked}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          lang={toFrench ? "fr" : "it"}
          placeholder={toFrench ? "Votre traduction" : "In italiano…"}
        />
        {!toFrench && (
          <div className="row wrap" style={{ gap: 6, justifyContent: "center" }}>
            {accents.map((a) => (
              <button type="button" key={a} className="btn secondary sm" disabled={locked} onClick={() => setValue((v) => v + a)}>
                {a}
              </button>
            ))}
          </div>
        )}
        {!locked && (
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn ghost" onClick={() => onResult(false, { expected: ex.answers[0] })}>
              Je ne sais pas
            </button>
            <button className="btn primary" style={{ flex: 1 }} disabled={!value.trim()}>
              Vérifier
            </button>
          </div>
        )}
      </form>
    </>
  );
}

function Build({ ex, locked, onResult }: Props<"construction">) {
  const [placed, setPlaced] = useState<number[]>([]);
  const remaining = ex.tiles.map((t, k) => ({ t, k })).filter(({ k }) => !placed.includes(k));
  return (
    <>
      <p className="muted">Remettez les mots dans l'ordre</p>
      <div style={{ fontWeight: 600 }}>« {ex.translation} »</div>
      <div className="tiles" aria-label="Votre phrase">
        {placed.map((k) => (
          <button key={k} className="tile" disabled={locked} onClick={() => setPlaced(placed.filter((x) => x !== k))} lang="it">
            {ex.tiles[k]}
          </button>
        ))}
      </div>
      <div className="row wrap" style={{ gap: 8 }}>
        {remaining.map(({ t, k }) => (
          <button key={k} className="tile" disabled={locked} onClick={() => setPlaced([...placed, k])} lang="it">
            {t}
          </button>
        ))}
      </div>
      {!locked && (
        <button
          className="btn primary block"
          disabled={placed.length !== ex.tiles.length}
          onClick={() => onResult(checkSentence(placed.map((k) => ex.tiles[k]), ex.sentence), { expected: ex.sentence })}
        >
          Vérifier
        </button>
      )}
    </>
  );
}

function Listen({ ex, locked, onResult }: Props<"ecoute">) {
  const [picked, setPicked] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const play = (rate = 0.95) => speak(ex.audioText, { rate }).then(() => setErr(null), (e) => setErr((e as Error).message));
  useEffect(() => {
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex]);
  return (
    <>
      <p className="muted">Écoutez et choisissez la phrase entendue</p>
      <div className="row" style={{ gap: 10, justifyContent: "center" }}>
        <button className="btn primary" onClick={() => play()}>
          <Volume2 size={18} /> Écouter
        </button>
        <button className="btn secondary" onClick={() => play(0.6)} aria-label="Écouter lentement">
          <Snail size={18} /> Lentement
        </button>
      </div>
      {err && <p className="subtle center" style={{ color: "var(--bad)" }}>{err}</p>}
      <div className="stack sm">
        {ex.options.map((o, k) => (
          <button
            key={k}
            disabled={locked}
            lang="it"
            className={`option ${picked !== null && k === ex.answer ? "right" : ""} ${picked === k && k !== ex.answer ? "wrong" : ""}`}
            onClick={() => {
              setPicked(k);
              onResult(k === ex.answer);
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </>
  );
}

function Speak({ ex, locked, onResult, onSkip }: Props<"prononciation"> & { onSkip: () => void }) {
  const supported = useMemo(() => speechRecognitionSupported(), []);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [fb, setFb] = useState<PronunciationFeedback | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const listen = async () => {
    setErr(null);
    setFb(null);
    setListening(true);
    const r = recognizeOnce(setInterim);
    stopRef.current = r.stop;
    try {
      const res = await r.promise;
      const f = evaluatePronunciation(ex.text, res.alternatives);
      setFb(f);
      if (f.score >= 60) onResult(true, { heard: f, expected: ex.text });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setListening(false);
      setInterim("");
    }
  };
  return (
    <>
      <p className="muted">Prononcez à voix haute</p>
      <div className="row" style={{ gap: 10 }}>
        <div className="big-word" lang="it" style={{ fontSize: ex.text.length > 18 ? "1.5rem" : undefined }}>
          {ex.text}
        </div>
        <button className="icon-btn sm" onClick={() => speak(ex.text, { fallbackUrl: wordAudioUrl(ex.wordId) }).catch(() => {})} aria-label="Écouter le modèle">
          <Volume2 size={16} />
        </button>
      </div>
      <div className="subtle">{ex.translation}</div>
      {!supported && (
        <div className="notice">
          La reconnaissance vocale n'est pas disponible dans ce navigateur (essayez Chrome, Edge ou Safari). Vous pouvez passer cet exercice.
        </div>
      )}
      {supported && !locked && (
        <button className={`btn ${listening ? "accent" : "primary"} block`} onClick={listening ? () => stopRef.current() : listen}>
          {listening ? <Square size={18} /> : <Mic size={18} />} {listening ? "J'écoute… (toucher pour arrêter)" : "Parler"}
        </button>
      )}
      {interim && <p className="center muted">« {interim} »</p>}
      {err && <p className="subtle" style={{ color: "var(--bad)" }}>{err}</p>}
      {fb && (
        <div className="card flat tight stack sm">
          <div className="row between">
            <b>Score : {fb.score}/100</b>
            <span className="subtle">Entendu : « {fb.heard} »</span>
          </div>
          {fb.tips.slice(0, 3).map((t) => (
            <div key={t} className="subtle">
              💡 {t}
            </div>
          ))}
          {fb.score < 60 && !locked && (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn secondary sm" onClick={listen}>
                <RotateCcw size={15} /> Réessayer
              </button>
              <button className="btn ghost sm" onClick={onSkip}>
                Passer
              </button>
            </div>
          )}
        </div>
      )}
      {!supported && !locked && (
        <button className="btn secondary block" onClick={onSkip}>
          Passer l'exercice
        </button>
      )}
    </>
  );
}
