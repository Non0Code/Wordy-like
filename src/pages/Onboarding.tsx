import { useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { saveSettings } from "../db/repo";
import { CEFR_LEVELS, type Cefr } from "../core/types";
import { lang } from "../content";
import { shuffle } from "../core/exercises";

const LEVEL_DESC: Record<Cefr, string> = {
  A1: "Je débute complètement",
  A2: "Je connais les bases",
  B1: "Je me débrouille au quotidien",
  B2: "Je converse avec aisance",
  C1: "Je comprends des films sans sous-titres",
  C2: "Je cherche les nuances",
};

/** Test de positionnement : 2 mots par niveau, du plus simple au plus difficile. */
function buildPlacement() {
  const L = lang();
  return CEFR_LEVELS.flatMap((lv) => {
    const words = shuffle(
      L.dictionary.filter(
        (e) => e.level === lv && ["nom", "verbe", "adjectif", "adverbe", "expression"].includes(e.pos) && e.lemma.length >= 4 && e.senses[0].fr.length < 28,
      ),
    ).slice(0, 2);
    return words.map((e) => {
      const distract = shuffle(L.dictionary.filter((d) => d.id !== e.id && d.pos === e.pos)).slice(0, 3).map((d) => d.senses[0].fr);
      const options = shuffle([e.senses[0].fr, ...distract]);
      return { level: lv, lemma: e.lemma, options, answer: options.indexOf(e.senses[0].fr) };
    });
  });
}

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<Cefr>("A1");
  const [perDay, setPerDay] = useState(8);
  const [test, setTest] = useState<ReturnType<typeof buildPlacement> | null>(null);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState<Record<string, number>>({});
  const questions = useMemo(() => test ?? [], [test]);

  const finishTest = (s: Record<string, number>) => {
    let lv: Cefr = "A1";
    for (const l of CEFR_LEVELS) {
      if ((s[l] ?? 0) >= 2) lv = l;
      else break;
    }
    setLevel(lv);
    setTest(null);
  };

  const answer = (i: number) => {
    const q = questions[qi];
    const s = { ...score, [q.level]: (score[q.level] ?? 0) + (i === q.answer ? 1 : 0) };
    setScore(s);
    // Arrêt anticipé dès qu'un niveau est clairement raté.
    const levelDone = qi % 2 === 1;
    if (levelDone && (s[q.level] ?? 0) < 2) return finishTest(s);
    if (qi + 1 >= questions.length) return finishTest(s);
    setQi(qi + 1);
  };

  const done = async () => {
    await saveSettings({ onboarded: true, level, newWordsPerDay: perDay, displayName: name.trim() });
  };

  return (
    <div className="page" style={{ maxWidth: 520, paddingTop: "8vh", paddingBottom: 40 }}>
      <div className="stack lg">
        <div className="brand" style={{ fontSize: "1.6rem" }}>
          <span className="brand-mark">P</span> Parla
        </div>
        {step === 0 && (
          <>
            <h1 style={{ fontSize: "2.3rem" }}>
              Apprenez l'italien
              <br />
              comme on le parle vraiment.
            </h1>
            <p className="muted">
              Des scènes de films et de séries, un dictionnaire personnel qui retient tout, et un système de révision fondé sur la courbe de
              l'oubli pour ne plus jamais perdre un mot.
            </p>
            <label className="field">
              <span>Votre prénom (facultatif)</span>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. : Noah" autoFocus />
            </label>
            <button className="btn primary block" onClick={() => setStep(1)}>
              Commencer <ArrowRight size={18} />
            </button>
          </>
        )}

        {step === 1 && !test && (
          <>
            <h1>Quel est votre niveau ?</h1>
            <div className="stack sm">
              {CEFR_LEVELS.map((l) => (
                <button key={l} className={`option row between ${level === l ? "right" : ""}`} onClick={() => setLevel(l)}>
                  <span>
                    <b>{l}</b> · {LEVEL_DESC[l]}
                  </span>
                  {level === l && <Check size={18} />}
                </button>
              ))}
            </div>
            <button
              className="btn secondary"
              onClick={() => {
                setTest(buildPlacement());
                setQi(0);
                setScore({});
              }}
            >
              Je ne sais pas : faire un test rapide
            </button>
            <button className="btn primary block" onClick={() => setStep(2)}>
              Continuer <ArrowRight size={18} />
            </button>
          </>
        )}

        {step === 1 && test && questions[qi] && (
          <>
            <div className="row between">
              <span className="eyebrow">Test de positionnement</span>
              <span className="subtle">
                {qi + 1}/{questions.length}
              </span>
            </div>
            <div className="big-word center" lang="it">
              {questions[qi].lemma}
            </div>
            <p className="center muted">Que signifie ce mot ?</p>
            <div className="stack sm">
              {questions[qi].options.map((o, i) => (
                <button key={i} className="option" onClick={() => answer(i)}>
                  {o}
                </button>
              ))}
              <button className="btn ghost" onClick={() => answer(-1)}>
                Je ne sais pas
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Votre rythme</h1>
            <p className="muted">
              Niveau retenu : <b>{level}</b>. Combien de nouveaux mots par jour ? (Les révisions s'ajoutent automatiquement.)
            </p>
            <div className="grid two">
              {[
                [5, "Tranquille", "≈ 5 min/jour"],
                [8, "Régulier", "≈ 10 min/jour"],
                [12, "Motivé", "≈ 15 min/jour"],
                [20, "Intensif", "≈ 25 min/jour"],
              ].map(([n, t, d]) => (
                <button key={n} className={`option ${perDay === n ? "right" : ""}`} onClick={() => setPerDay(n as number)}>
                  <div>{t}</div>
                  <div className="subtle">
                    {n} mots · {d}
                  </div>
                </button>
              ))}
            </div>
            <button className="btn primary block" onClick={done}>
              C'est parti ! <ArrowRight size={18} />
            </button>
            <p className="subtle center">Vos données restent sur cet appareil. Vous pourrez créer un compte pour les synchroniser.</p>
          </>
        )}
      </div>
    </div>
  );
}
