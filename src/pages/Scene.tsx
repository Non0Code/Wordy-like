import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Pause, Play, Repeat1, SkipBack, SkipForward, Subtitles, Languages, Mic, PauseCircle, Plus, Gauge, Volume2,
} from "lucide-react";
import { loadScene, newWordsFor, type PlayableScene } from "../db/scenes";
import { useSettings, useVocabMap } from "../hooks";
import { InteractiveText } from "../components/InteractiveText";
import { WordSheet, type WordTarget } from "../components/WordSheet";
import { awardXp, ensureWord } from "../db/repo";
import { XP } from "../core/gamification";
import { cueAt } from "../core/subtitles";
import { entry, analyze } from "../content";
import { getMeta, setMeta } from "../db/db";
import { dayKey } from "../core/srs";
import { speak, stopSpeaking } from "../speech/tts";
import { Notice } from "../components/ui";

const RATES = [0.5, 0.75, 1, 1.25];

export default function ScenePage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const comprehension = params.get("mode") === "comprehension";
  const settings = useSettings();
  const vocab = useVocabMap();
  const nav = useNavigate();
  const [scene, setScene] = useState<PlayableScene | null | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(settings.playbackRate);
  const [showIt, setShowIt] = useState(true);
  const [showFr, setShowFr] = useState(!comprehension && settings.showTranslationByDefault && settings.explanationLang === "fr");
  const [autoPause, setAutoPause] = useState(false);
  const [loop, setLoop] = useState(false);
  const [stopAt, setStopAt] = useState<number | null>(null);
  const [sheet, setSheet] = useState<WordTarget | null>(null);
  const [videoError, setVideoError] = useState(false);
  const [ttsLine, setTtsLine] = useState<number | null>(null);
  const [quiz, setQuiz] = useState(false);
  const lastIdx = useRef(-1);
  const credited = useRef(false);

  useEffect(() => {
    let revoke: (() => void) | undefined;
    loadScene(decodeURIComponent(id)).then((r) => {
      setScene(r?.scene ?? null);
      revoke = r?.revoke;
    });
    return () => {
      revoke?.();
      stopSpeaking();
    };
  }, [id]);

  useEffect(() => {
    setRate(settings.playbackRate);
  }, [settings.playbackRate]);
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = rate;
  }, [rate, scene]);

  const idx = scene ? (ttsLine ?? cueAt(scene.lines, time)) : -1;
  const line = scene && idx >= 0 ? scene.lines[idx] : null;

  const credit = useCallback(async () => {
    if (credited.current || !scene) return;
    credited.current = true;
    const key = `scene:${scene.id}:${dayKey()}`;
    if (await getMeta(key, false)) return;
    await setMeta(key, true);
    await awardXp(XP.scene, { scenes: 1 });
  }, [scene]);

  // Boucle de lecture précise (répétition d'une réplique, pause automatique).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v && scene) {
        const t = v.currentTime;
        setTime(t);
        if (stopAt !== null && t >= stopAt) {
          if (loop && idx >= 0) {
            v.currentTime = scene.lines[idx].start;
          } else {
            v.pause();
            setStopAt(null);
          }
        }
        const cur = cueAt(scene.lines, t);
        if (autoPause && stopAt === null && lastIdx.current >= 0 && cur !== lastIdx.current && t >= scene.lines[lastIdx.current].end) {
          v.pause();
        }
        if (cur >= 0) lastIdx.current = cur;
        if (scene.duration && t / scene.duration > 0.85) void credit();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, stopAt, loop, autoPause, scene, idx, credit]);

  const playLine = (i: number) => {
    const v = videoRef.current;
    if (!scene) return;
    const l = scene.lines[i];
    if (videoError || !v) {
      setTtsLine(i);
      speak(l.it, { rate }).catch(() => {}).finally(() => setTtsLine((cur) => (cur === i ? null : cur)));
      return;
    }
    v.currentTime = l.start;
    setTime(l.start);
    setStopAt(l.end + 0.15);
    void v.play();
  };

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      setStopAt(null);
      void v.play();
    } else v.pause();
  };
  const jump = (delta: number) => {
    if (!scene) return;
    const base = idx >= 0 ? idx : scene.lines.findIndex((l) => l.start > time) - (delta > 0 ? 1 : 0);
    const target = Math.max(0, Math.min(scene.lines.length - 1, base + delta));
    playLine(target);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select") || sheet) return;
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowLeft") jump(-1);
      else if (e.key === "ArrowRight") jump(1);
      else if (e.key.toLowerCase() === "r" && idx >= 0) playLine(idx);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const openWord = (t: WordTarget) => {
    videoRef.current?.pause();
    setSheet(t);
  };

  const fresh = useMemo(() => (scene ? newWordsFor(scene, vocab) : []), [scene, vocab]);
  const source = scene ? { source: "scene" as const, sourceId: scene.id, sourceTitle: `${scene.work} — ${scene.title}` } : undefined;

  const addAll = async () => {
    if (!scene) return;
    for (const wid of fresh) {
      const l = scene.lines.find((ln) => analyze(ln.it).some((t) => (t.expressionId ?? t.entryIds[0]) === wid));
      await ensureWord(wid, { ...source!, sentence: l?.it, translation: l?.fr, at: Date.now() });
    }
  };

  if (scene === undefined) return <div className="page subtle">Chargement…</div>;
  if (scene === null)
    return (
      <div className="page empty">
        <div className="big">🎞️</div>Scène introuvable. <Link to="/films">Retour à la bibliothèque</Link>
      </div>
    );

  return (
    <div className="page wide stack">
      <div className="row between">
        <button className="btn ghost sm" style={{ padding: 0 }} onClick={() => nav("/films")}>
          <ChevronLeft size={18} /> Bibliothèque
        </button>
        <div className="row" style={{ gap: 6 }}>
          <span className="badge level">{scene.level}</span>
          {scene.demo && <span className="badge demo">Scène de démonstration</span>}
        </div>
      </div>
      <div className="stack sm">
        <span className="eyebrow">
          {scene.work}
          {scene.episode ? ` · ${scene.episode}` : ""} · {scene.kind}
        </span>
        <h1>{scene.title}</h1>
        <p className="muted">{scene.synopsis}</p>
      </div>
      {comprehension && (
        <Notice tone="info">
          <b>Mode compréhension</b> : la traduction est masquée. Regardez la scène (réécoutez autant que nécessaire), puis répondez aux questions.
        </Notice>
      )}

      <div className="player-layout">
        <div className="stack">
          <div className="video-wrap">
            {scene.src && !videoError ? (
              <video
                ref={videoRef}
                src={scene.src}
                playsInline
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => {
                  setPlaying(false);
                  if (videoRef.current) setTime(videoRef.current.currentTime);
                }}
                onEnded={() => {
                  setPlaying(false);
                  void credit();
                  if (comprehension) setQuiz(true);
                }}
                onSeeked={() => videoRef.current && setTime(videoRef.current.currentTime)}
                onLoadedMetadata={() => videoRef.current && (videoRef.current.playbackRate = rate)}
                onError={() => setVideoError(true)}
                onClick={toggle}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${scene.palette[0]}, ${scene.palette[1]})` }} />
            )}
            {line && (showIt || showFr) && (
              <div className="subs">
                {showIt && (
                  <div className="it">
                    <InteractiveText text={line.it} translation={line.fr} vocab={vocab} onWord={openWord} senses={line.senses} source={source} />
                  </div>
                )}
                {showFr && line.fr && <div className="fr">{line.fr}</div>}
              </div>
            )}
            {!playing && !line && scene.src && !videoError && (
              <button
                onClick={toggle}
                aria-label="Lecture"
                style={{ position: "absolute", inset: 0, margin: "auto", width: 64, height: 64, borderRadius: "50%", border: 0, background: "rgba(255,255,255,.9)", display: "grid", placeItems: "center", cursor: "pointer" }}
              >
                <Play size={28} fill="#111" color="#111" />
              </button>
            )}
          </div>
          {videoError && (
            <Notice>
              La vidéo n'a pas pu être chargée (fichier absent ou format non pris en charge). Vous pouvez écouter chaque réplique avec la voix
              italienne de votre appareil en touchant <Volume2 size={14} style={{ verticalAlign: -2 }} /> dans la transcription.
            </Notice>
          )}

          {!videoError && (
            <div className="card tight stack sm">
              <input
                className="seek"
                type="range"
                min={0}
                max={scene.duration}
                step={0.1}
                value={time}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (v) v.currentTime = Number(e.target.value);
                  setTime(Number(e.target.value));
                }}
                aria-label="Position"
              />
              <div className="controls">
                <button className="icon-btn" onClick={() => jump(-1)} aria-label="Réplique précédente">
                  <SkipBack size={18} />
                </button>
                <button className="icon-btn" style={{ background: "var(--brand)", color: "var(--bg)", borderColor: "transparent" }} onClick={toggle} aria-label={playing ? "Pause" : "Lecture"}>
                  {playing ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button className="icon-btn" onClick={() => jump(1)} aria-label="Réplique suivante">
                  <SkipForward size={18} />
                </button>
                <button className="icon-btn" onClick={() => idx >= 0 && playLine(idx)} disabled={idx < 0} aria-label="Répéter la réplique" title="Répéter la réplique (R)">
                  <Repeat1 size={18} />
                </button>
                <span className="spacer" />
                <button className={`icon-btn ${loop ? "" : "ghost"}`} style={loop ? { color: "var(--accent)" } : undefined} onClick={() => setLoop(!loop)} aria-pressed={loop} title="Boucler sur la réplique">
                  <Repeat1 size={16} />
                </button>
                <button className={`icon-btn ${autoPause ? "" : "ghost"}`} style={autoPause ? { color: "var(--accent)" } : undefined} onClick={() => setAutoPause(!autoPause)} aria-pressed={autoPause} title="Pause automatique après chaque réplique">
                  <PauseCircle size={18} />
                </button>
                <button className={`icon-btn ${showIt ? "" : "ghost"}`} onClick={() => setShowIt(!showIt)} aria-pressed={showIt} title="Sous-titres italiens">
                  <Subtitles size={18} />
                </button>
                <button className={`icon-btn ${showFr ? "" : "ghost"}`} onClick={() => setShowFr(!showFr)} aria-pressed={showFr} title="Traduction française">
                  <Languages size={18} />
                </button>
                <button className="btn secondary sm" onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1)} title="Vitesse de lecture">
                  <Gauge size={15} /> {rate}×
                </button>
              </div>
              <span className="subtle tiny hide-mobile">
                Raccourcis : <span className="kbd">Espace</span> lecture/pause · <span className="kbd">←</span>/<span className="kbd">→</span> réplique ·{" "}
                <span className="kbd">R</span> répéter
              </span>
            </div>
          )}

          {fresh.length > 0 && !comprehension && (
            <div className="card tight stack sm">
              <div className="row between">
                <b>Nouveaux mots dans cette scène</b>
                <button className="btn secondary sm" onClick={addAll}>
                  <Plus size={15} /> Tout ajouter ({fresh.length})
                </button>
              </div>
              <div className="row wrap" style={{ gap: 6 }}>
                {fresh.slice(0, 30).map((wid) => {
                  const e = entry(wid);
                  if (!e) return null;
                  return (
                    <button key={wid} className="pill" onClick={() => setSheet({ surface: e.lemma, entryIds: [wid], source })}>
                      {e.lemma}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="player-side card tight">
          <div className="row between" style={{ padding: "4px 6px 8px" }}>
            <b>Transcription</b>
            {comprehension && !quiz && (
              <button className="btn primary sm" onClick={() => setQuiz(true)}>
                Répondre aux questions
              </button>
            )}
          </div>
          {quiz ? (
            <ComprehensionQuiz scene={scene} onDone={() => setQuiz(false)} />
          ) : (
            <div className="stack" style={{ gap: 2 }}>
              {scene.lines.map((l, i) => (
                <div key={i} className={`line ${i === idx ? "current" : ""}`} onClick={() => playLine(i)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {l.speaker && (
                      <div className="speaker" style={{ color: scene.speakers[l.speaker]?.color ? "var(--brand)" : undefined }}>
                        {l.speaker}
                      </div>
                    )}
                    <div className="it-text">
                      <InteractiveText text={l.it} translation={l.fr} vocab={vocab} onWord={openWord} senses={l.senses} source={source} />
                    </div>
                    {showFr && <div className="fr-text">{l.fr}</div>}
                  </div>
                  <div className="stack" style={{ gap: 4 }}>
                    <button
                      className="icon-btn sm ghost"
                      aria-label="Écouter la réplique"
                      onClick={(e) => {
                        e.stopPropagation();
                        playLine(i);
                      }}
                    >
                      <Volume2 size={15} />
                    </button>
                    <Link
                      to={`/prononciation?scene=${encodeURIComponent(scene.id)}&ligne=${i}`}
                      className="icon-btn sm ghost"
                      aria-label="Répéter cette phrase (prononciation)"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mic size={15} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <WordSheet target={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}

function ComprehensionQuiz({ scene, onDone }: { scene: PlayableScene; onDone: () => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [self, setSelf] = useState<string | null>(null);
  if (!scene.questions.length) {
    return (
      <div className="stack" style={{ padding: 6 }}>
        <p className="muted">Pas de questions pour une vidéo importée. Évaluez votre compréhension :</p>
        {["Tout compris", "Compris en partie", "Peu compris"].map((s, i) => (
          <button
            key={s}
            className={`option ${self === s ? "right" : ""}`}
            onClick={async () => {
              setSelf(s);
              await awardXp(XP.exerciseCorrect * (3 - i), { answers: 1, correct: i === 0 ? 1 : 0 });
            }}
          >
            {s}
          </button>
        ))}
        {self && (
          <button className="btn secondary" onClick={onDone}>
            Revoir la transcription
          </button>
        )}
      </div>
    );
  }
  const score = scene.questions.filter((q, i) => answers[i] === q.answer).length;
  return (
    <div className="stack" style={{ padding: 6 }}>
      {scene.questions.map((q, i) => (
        <div key={i} className="stack sm">
          <b>
            {i + 1}. {q.q}
          </b>
          {q.options.map((o, k) => (
            <button
              key={k}
              disabled={submitted}
              className={`option ${answers[i] === k && !submitted ? "right" : ""} ${submitted && k === q.answer ? "right" : ""} ${submitted && answers[i] === k && k !== q.answer ? "wrong" : ""}`}
              onClick={() => setAnswers({ ...answers, [i]: k })}
            >
              {o}
            </button>
          ))}
        </div>
      ))}
      {!submitted ? (
        <button
          className="btn primary"
          disabled={Object.keys(answers).length < scene.questions.length}
          onClick={async () => {
            setSubmitted(true);
            await awardXp(score * XP.exerciseCorrect, { answers: scene.questions.length, correct: score });
          }}
        >
          Valider
        </button>
      ) : (
        <>
          <div className={`feedback ${score === scene.questions.length ? "ok" : "ko"}`}>
            <b>
              {score}/{scene.questions.length} bonnes réponses
            </b>
            <div className="muted">Activez la traduction française (bouton de traduction du lecteur) pour vérifier les passages difficiles.</div>
          </div>
          <button className="btn secondary" onClick={onDone}>
            Revoir la transcription
          </button>
        </>
      )}
    </div>
  );
}
