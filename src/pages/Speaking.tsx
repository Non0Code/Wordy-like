import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Mic, Square, Volume2, Play, Snail, RefreshCw } from "lucide-react";
import { builtInScenes } from "../db/scenes";
import { evaluatePronunciation, type PronunciationFeedback } from "../core/pronunciation";
import { recognizeOnce, recordingSupported, speechRecognitionSupported, VoiceRecorder, envelope } from "../speech/stt";
import { hasItalianVoice, speak } from "../speech/tts";
import { logPronunciation } from "../db/repo";
import { pronounce } from "../core/phonetics";
import { allLessons } from "../content";
import { Notice, PageHeader } from "../components/ui";
import { useVocab } from "../hooks";

interface Target {
  it: string;
  fr: string;
  from: string;
  sceneSrc?: { src: string; start: number; end: number };
}

export default function Speaking() {
  const [params] = useSearchParams();
  const vocab = useVocab();
  const targets = useMemo<Target[]>(() => {
    const out: Target[] = [];
    for (const s of builtInScenes())
      s.lines.forEach((l) => out.push({ it: l.it, fr: l.fr, from: `🎬 ${s.title}`, sceneSrc: s.src ? { src: s.src, start: l.start, end: l.end } : undefined }));
    for (const l of allLessons()) for (const [it, fr] of l.sentences) out.push({ it, fr, from: `📘 ${l.title}` });
    return out;
  }, []);
  const initial = useMemo(() => {
    const sceneId = params.get("scene");
    const line = Number(params.get("ligne") ?? 0);
    const s = sceneId ? builtInScenes().find((x) => x.id === sceneId) : null;
    if (s && s.lines[line]) return targets.findIndex((t) => t.it === s.lines[line].it);
    return 0;
  }, [params, targets]);
  const [mode, setMode] = useState<"phrases" | "mots">("phrases");
  const [i, setI] = useState(Math.max(0, initial));
  const wordTargets = useMemo<Target[]>(
    () =>
      (vocab ?? [])
        .filter((w) => w.status !== "known")
        .slice(0, 40)
        .map((w) => ({ it: w.lemma, fr: w.translation, from: "📖 Mon vocabulaire" })),
    [vocab],
  );
  const list = mode === "mots" && wordTargets.length ? wordTargets : targets;
  const target = list[i % list.length];

  return (
    <div className="page stack">
      <PageHeader title="Prononciation" subtitle="Écoutez le modèle, enregistrez-vous, comparez et corrigez." />
      {!speechRecognitionSupported() && (
        <Notice>
          La reconnaissance vocale n'est pas disponible dans ce navigateur : l'analyse automatique est désactivée. Vous pouvez tout de même vous
          enregistrer et comparer à l'oreille. Pour l'analyse, utilisez Chrome, Edge ou Safari.
        </Notice>
      )}
      {!hasItalianVoice() && (
        <Notice tone="info">Aucune voix italienne n'est installée sur cet appareil : les mots utilisent l'audio de secours intégré et les phrases de film l'audio de la scène.</Notice>
      )}
      <div className="segmented">
        <button className={mode === "phrases" ? "on" : ""} onClick={() => { setMode("phrases"); setI(0); }}>
          Phrases de films et leçons
        </button>
        <button className={mode === "mots" ? "on" : ""} onClick={() => { setMode("mots"); setI(0); }} disabled={!wordTargets.length}>
          Mes mots à travailler
        </button>
      </div>
      {target && <Trainer key={target.it} target={target} onNext={() => setI((x) => (x + 1) % list.length)} />}
    </div>
  );
}

function Trainer({ target, onNext }: { target: Target; onNext: () => void }) {
  const [fb, setFb] = useState<PronunciationFeedback | null>(null);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [recording, setRecording] = useState<string | null>(null);
  const [wave, setWave] = useState<number[] | null>(null);
  const recorder = useRef<VoiceRecorder | null>(null);
  const stopRef = useRef<() => void>(() => {});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const words = target.it.split(/\s+/);
  const syll = useMemo(() => words.map((w) => pronounce(w.replace(/[^\p{L}'’]/gu, ""))), [target.it]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { if (recording) URL.revokeObjectURL(recording); }, [recording]);

  const playModel = (rate = 0.95) => {
    if (target.sceneSrc && !hasItalianVoice()) {
      const a = audioRef.current ?? new Audio(target.sceneSrc.src);
      audioRef.current = a;
      a.currentTime = target.sceneSrc.start;
      a.playbackRate = rate;
      void a.play();
      const stop = () => {
        if (a.currentTime >= target.sceneSrc!.end + 0.1) {
          a.pause();
          a.removeEventListener("timeupdate", stop);
        }
      };
      a.addEventListener("timeupdate", stop);
      return;
    }
    speak(target.it, { rate }).catch((e) => setErr((e as Error).message));
  };

  const start = async () => {
    setErr(null);
    setFb(null);
    setListening(true);
    if (recordingSupported()) {
      try {
        recorder.current = new VoiceRecorder();
        await recorder.current.start();
      } catch {
        recorder.current = null;
      }
    }
    if (speechRecognitionSupported()) {
      const r = recognizeOnce(setInterim);
      stopRef.current = r.stop;
      try {
        const res = await r.promise;
        const f = evaluatePronunciation(target.it, res.alternatives);
        setFb(f);
        await logPronunciation(f.score);
      } catch (e) {
        setErr((e as Error).message);
      }
      await finishRecording();
    }
  };

  const finishRecording = async () => {
    setListening(false);
    setInterim("");
    if (recorder.current) {
      const blob = await recorder.current.stop();
      recorder.current = null;
      if (blob.size) {
        setRecording(URL.createObjectURL(blob));
        envelope(blob).then(setWave).catch(() => setWave(null));
      }
    }
  };

  const stop = async () => {
    if (speechRecognitionSupported()) stopRef.current();
    else await finishRecording();
  };

  return (
    <div className="stack">
      <div className="card stack">
        <span className="eyebrow">{target.from}</span>
        <div style={{ fontSize: "1.45rem", fontWeight: 700, lineHeight: 1.3 }} lang="it">
          {target.it}
        </div>
        <div className="muted">{target.fr}</div>
        <div className="row wrap" style={{ gap: 6 }}>
          {syll.map((p, k) =>
            p.syllables.length ? (
              <span key={k} className="syll" title={p.ipa}>
                {p.syllables.map((s, j) => (
                  <span key={j} className={j === p.stressIndex && p.syllables.length > 1 ? "stress" : ""}>
                    {s}
                  </span>
                ))}
              </span>
            ) : null,
          )}
        </div>
        <span className="subtle tiny">Syllabe accentuée en couleur · transcription : {syll.map((p) => p.ipa).join(" ")}</span>
        <div className="row wrap" style={{ gap: 8 }}>
          <button className="btn secondary" onClick={() => playModel()}>
            <Volume2 size={18} /> Modèle
          </button>
          <button className="btn secondary" onClick={() => playModel(0.65)}>
            <Snail size={18} /> Lent
          </button>
          {recording && (
            <button className="btn secondary" onClick={() => new Audio(recording).play()}>
              <Play size={18} /> Ma voix
            </button>
          )}
        </div>
      </div>

      <button className={`btn ${listening ? "accent" : "primary"} block`} style={{ minHeight: 58 }} onClick={listening ? stop : start} disabled={!speechRecognitionSupported() && !recordingSupported()}>
        {listening ? <Square size={20} /> : <Mic size={20} />} {listening ? "J'écoute… toucher pour arrêter" : "Parler"}
      </button>
      {interim && <p className="center muted">« {interim} »</p>}
      {err && <div className="notice error">{err}</div>}

      {wave && (
        <div className="card tight stack sm">
          <span className="subtle">Rythme de votre enregistrement</span>
          <div className="wave">
            {wave.map((v, k) => (
              <span key={k} style={{ height: `${Math.max(4, v * 100)}%` }} />
            ))}
          </div>
        </div>
      )}

      {fb && (
        <div className="card stack">
          <div className="row between">
            <h2>Score : {fb.score}/100</h2>
            <span className={`badge ${fb.score >= 80 ? "known" : fb.score >= 50 ? "learning" : "unknown"}`}>
              {fb.score >= 80 ? "Excellent" : fb.score >= 50 ? "Presque" : "À retravailler"}
            </span>
          </div>
          <div className="subtle">Compris par la reconnaissance vocale : « {fb.heard || "—"} »</div>
          <div className="row wrap" style={{ gap: 6 }}>
            {fb.words
              .filter((w) => w.verdict !== "ajouté")
              .map((w, k) => (
                <span
                  key={k}
                  className="badge"
                  title={w.heard ? `entendu : ${w.heard}` : "non entendu"}
                  style={{
                    fontSize: ".9rem",
                    padding: "4px 10px",
                    background: w.verdict === "ok" ? "var(--ok-soft)" : w.verdict === "proche" ? "var(--gold-soft)" : "var(--bad-soft)",
                    color: w.verdict === "ok" ? "var(--ok)" : w.verdict === "proche" ? "var(--warn)" : "var(--bad)",
                  }}
                >
                  {w.expected}
                </span>
              ))}
          </div>
          {fb.words
            .filter((w) => w.verdict !== "ok" && w.verdict !== "ajouté")
            .slice(0, 4)
            .map((w, k) => (
              <div key={k} className="stack sm">
                <b>
                  {w.expected} <span className="subtle">({w.syllables})</span>
                </b>
                {w.tips.map((t) => (
                  <span key={t} className="muted">
                    💡 {t}
                  </span>
                ))}
              </div>
            ))}
          {fb.tips.length === 0 && fb.score >= 80 && <p className="muted">Très bonne prononciation, rien à signaler !</p>}
        </div>
      )}
      <div className="row" style={{ gap: 8 }}>
        <button className="btn secondary" onClick={onNext} style={{ flex: 1 }}>
          <RefreshCw size={16} /> Phrase suivante
        </button>
        <Link to="/professeur?mode=conversation" className="btn ghost">
          Dialogue interactif
        </Link>
      </div>
    </div>
  );
}
