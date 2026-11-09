import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Send, Sparkles, RotateCcw, Mic, Square } from "lucide-react";
import { db } from "../db/db";
import { aiChat, aiCorrect } from "../ai/api";
import { demoCorrect, demoTutorReply, SCENARIOS, scriptedReply, type Scenario } from "../ai/demoTutor";
import { bumpActivity, difficultyScore, awardXp } from "../db/repo";
import { useHealth, useSettings, useVocab, useVocabMap } from "../hooks";
import { Notice, PageHeader, SpeakButton } from "../components/ui";
import { InteractiveText } from "../components/InteractiveText";
import { WordSheet, type WordTarget } from "../components/WordSheet";
import { XP } from "../core/gamification";
import { recognizeOnce, speechRecognitionSupported } from "../speech/stt";

type Mode = "tutor" | "conversation" | "correction";
interface Msg {
  role: "user" | "assistant";
  content: string;
  demo?: boolean;
}

const AI_SCENARIOS = [
  "Conversation libre sur ma journée",
  "Au restaurant à Naples : je commande un repas",
  "Entretien d'embauche dans une entreprise à Milan",
  "Je rencontre un voisin italien pour la première fois",
  "Je discute d'un film italien avec un ami",
];

export default function Tutor() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<Mode>((params.get("mode") as Mode) ?? "tutor");
  const health = useHealth();
  const ai = !!health?.ai;
  return (
    <div className="page stack">
      <PageHeader
        title="Professeur"
        subtitle="Explications, corrections et conversation en italien."
        action={ai ? <span className="badge level"><Sparkles size={12} /> IA connectée</span> : health ? <span className="badge demo">Mode démo</span> : null}
      />
      {health && !ai && (
        <Notice>
          <b>Mode démo — sans IA.</b> Correcteur à règles (erreurs fréquentes des francophones), fiches de grammaire et conversations
          scénarisées.{" "}
          <details style={{ display: "inline" }}>
            <summary style={{ display: "inline", cursor: "pointer", textDecoration: "underline" }}>Activer l'IA</summary> définissez{" "}
            <code>ANTHROPIC_API_KEY</code> sur le serveur puis redémarrez-le (voir README).
          </details>
        </Notice>
      )}
      <div className="segmented">
        {(
          [
            ["tutor", "Questions"],
            ["correction", "Correction"],
            ["conversation", "Conversation"],
          ] as Array<[Mode, string]>
        ).map(([m, l]) => (
          <button key={m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>
            {l}
          </button>
        ))}
      </div>
      {mode === "correction" ? <Correction ai={ai} /> : <Chat key={mode} mode={mode} ai={ai} />}
    </div>
  );
}

function Correction({ ai }: { ai: boolean }) {
  const settings = useSettings();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<{
    corrected: string;
    correct: boolean;
    explanation?: string;
    errors: Array<{ wrong: string; right: string; rule: string }>;
    exercises: Array<{ prompt: string; answer: string }>;
    demo: boolean;
    unknownWords?: string[];
  } | null>(null);
  const [reveal, setReveal] = useState(false);
  const run = async () => {
    setBusy(true);
    setErr(null);
    setReveal(false);
    try {
      if (ai) setRes({ ...(await aiCorrect(text, settings.level)), demo: false });
      else setRes({ ...demoCorrect(text), demo: true });
      await awardXp(XP.exerciseCorrect);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack">
      <label className="field">
        <span>Écrivez une phrase en italien</span>
        <textarea className="textarea" lang="it" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex. : Io sono 19 anni e ho andato a Roma ieri." />
      </label>
      <button className="btn primary" disabled={!text.trim() || busy} onClick={run}>
        {busy ? "Analyse…" : "Corriger"}
      </button>
      {err && <div className="notice error">{err}</div>}
      {res && (
        <div className="card stack">
          {res.demo && <span className="badge demo" style={{ alignSelf: "flex-start" }}>Correction démo (règles)</span>}
          <div className={`feedback ${res.correct ? "ok" : "ko"}`}>
            <b>{res.correct ? "Aucune erreur détectée" : "Forme correcte :"}</b>
            {!res.correct && (
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 4 }} lang="it">
                {res.corrected}
              </div>
            )}
          </div>
          {res.explanation && <p className="muted">{res.explanation}</p>}
          {res.errors.map((e, i) => (
            <div key={i} className="stack sm">
              <div>
                <s style={{ color: "var(--bad)" }}>{e.wrong}</s> → <b style={{ color: "var(--ok)" }}>{e.right}</b>
              </div>
              <p className="muted">{e.rule}</p>
            </div>
          ))}
          {res.demo && res.correct && (
            <p className="subtle">
              {res.unknownWords?.length ? `Mots absents du dictionnaire (faute de frappe ?) : ${res.unknownWords.join(", ")}. ` : ""}
              En mode démo, seules les erreurs les plus fréquentes sont détectées.
            </p>
          )}
          {res.exercises.length > 0 && (
            <div className="stack sm">
              <b>Exercices pour progresser</b>
              {res.exercises.map((x, i) => (
                <div key={i}>
                  {i + 1}. {x.prompt}
                  {reveal && (
                    <div className="subtle" lang="it">
                      → {x.answer}
                    </div>
                  )}
                </div>
              ))}
              <button className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setReveal(!reveal)}>
                {reveal ? "Masquer" : "Voir"} les réponses
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chat({ mode, ai }: { mode: "tutor" | "conversation"; ai: boolean }) {
  const settings = useSettings();
  const vocab = useVocab();
  const vmap = useVocabMap();
  const chatId = `current-${mode}`;
  const stored = useLiveQuery(() => db.chats.get(chatId), [chatId]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scenario, setScenario] = useState<string>(AI_SCENARIOS[0]);
  const [demoScenario, setDemoScenario] = useState<Scenario>(SCENARIOS[0]);
  const [step, setStep] = useState(0);
  const [sheet, setSheet] = useState<WordTarget | null>(null);
  const [listening, setListening] = useState(false);
  const lastAt = useRef(Date.now());
  const endRef = useRef<HTMLDivElement>(null);
  const messages: Msg[] = stored?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy]);

  const save = (msgs: Msg[]) => db.chats.put({ id: chatId, mode, title: mode, messages: msgs, updatedAt: Date.now() });

  const reset = async () => {
    setStep(0);
    const intro: Msg[] =
      mode === "conversation" && !ai ? [{ role: "assistant", content: demoScenario.steps[0].bot, demo: true }] : [];
    await save(intro);
  };

  useEffect(() => {
    if (stored === undefined) return;
    if (!stored && mode === "conversation" && !ai) void reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored, ai]);

  const send = async (text = input) => {
    const content = text.trim();
    if (!content || busy) return;
    setInput("");
    setErr(null);
    const next: Msg[] = [...messages, { role: "user", content }];
    await save(next);
    if (mode === "conversation") {
      const secs = Math.min(120, Math.round((Date.now() - lastAt.current) / 1000));
      await bumpActivity({ conversationSeconds: secs, xp: Math.round((secs / 60) * XP.conversationMinute) });
    }
    lastAt.current = Date.now();
    setBusy(true);
    try {
      let reply: string;
      if (ai) {
        const weakWords = (vocab ?? [])
          .filter((w) => w.reviewCount > 0)
          .sort((a, b) => difficultyScore(b) - difficultyScore(a))
          .slice(0, 20)
          .map((w) => ({ lemma: w.lemma, translation: w.translation }));
        reply = (
          await aiChat({
            mode,
            level: settings.level,
            messages: next.map(({ role, content: c }) => ({ role, content: c })),
            weakWords,
            scenario: mode === "conversation" ? scenario : undefined,
          })
        ).reply;
      } else if (mode === "conversation") {
        const r = scriptedReply(demoScenario, step, content);
        if (r.advance) setStep(step + 1);
        reply = r.reply;
      } else {
        reply = demoTutorReply(content);
      }
      await save([...next, { role: "assistant", content: reply, demo: !ai }]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const dictate = async () => {
    setListening(true);
    try {
      const r = await recognizeOnce(setInput).promise;
      setInput(r.alternatives[0]?.transcript ?? "");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setListening(false);
    }
  };

  return (
    <div className="stack">
      {mode === "conversation" && (
        <div className="card tight stack sm">
          {ai ? (
            <label className="field">
              <span>Scénario</span>
              <select className="select" value={scenario} onChange={(e) => setScenario(e.target.value)}>
                {AI_SCENARIOS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="field">
                <span>Conversation scénarisée (démo)</span>
                <select
                  className="select"
                  value={demoScenario.id}
                  onChange={(e) => {
                    setDemoScenario(SCENARIOS.find((s) => s.id === e.target.value)!);
                    setStep(0);
                    void db.chats.delete(chatId);
                  }}
                >
                  {SCENARIOS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.level} · {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <span className="subtle">{demoScenario.description}</span>
              {demoScenario.steps[step] && <span className="subtle">💡 Indice : {demoScenario.steps[step].hint}</span>}
            </>
          )}
        </div>
      )}
      <div className="chat" aria-live="polite">
        {messages.length === 0 && (
          <div className="empty">
            {mode === "tutor" ? (
              <>
                <div className="big">🧑‍🏫</div>
                Posez une question de grammaire ou écrivez une phrase en italien : <i>« Io sono 19 anni »</i>, <i>« Quand utiliser essere au passé ? »</i>
              </>
            ) : (
              <>
                <div className="big">💬</div>Dites bonjour pour commencer : <i>« Ciao! »</i>
              </>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.role === "assistant" && mode === "conversation" ? (
              <>
                {m.content.split("\n").map((ln, k) =>
                  ln.startsWith("💡") ? (
                    <div key={k} className="subtle" style={{ marginTop: 6 }}>
                      {ln}
                    </div>
                  ) : (
                    <div key={k}>
                      <InteractiveText text={ln} vocab={vmap} onWord={setSheet} source={{ source: "tutor", sourceTitle: "Conversation" }} />
                    </div>
                  ),
                )}
                <div className="row" style={{ marginTop: 6, gap: 6 }}>
                  <SpeakButton text={m.content.split("\n").filter((l) => !l.startsWith("💡")).join(" ")} size="sm" />
                  {m.demo && <span className="badge demo">démo</span>}
                </div>
              </>
            ) : (
              <>
                {m.content}
                {m.role === "assistant" && m.demo && (
                  <div style={{ marginTop: 6 }}>
                    <span className="badge demo">réponse démo (sans IA)</span>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {busy && (
          <div className="bubble assistant typing" aria-label="Le professeur écrit">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={endRef} />
      </div>
      {err && <div className="notice error">{err}</div>}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <button type="button" className="icon-btn ghost" onClick={reset} aria-label="Nouvelle conversation" title="Nouvelle conversation">
          <RotateCcw size={18} />
        </button>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "conversation" ? "Rispondi in italiano…" : "Votre question ou phrase…"}
          lang={mode === "conversation" ? "it" : undefined}
        />
        {speechRecognitionSupported() && mode === "conversation" && (
          <button type="button" className="icon-btn ghost" onClick={dictate} aria-label="Dicter en italien" disabled={listening}>
            {listening ? <Square size={18} /> : <Mic size={18} />}
          </button>
        )}
        <button className="icon-btn" style={{ background: "var(--brand)", color: "var(--bg)", borderColor: "transparent" }} disabled={!input.trim() || busy} aria-label="Envoyer">
          <Send size={18} />
        </button>
      </form>
      <WordSheet target={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}
