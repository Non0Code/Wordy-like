import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, ChevronDown, Plus, Sparkles, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { entry, lang, pronunciationOf } from "../content";
import { chooseSense, type Token } from "../core/analysis";
import { conjugate, PERSONS, TENSES, TENSE_FR, pluralOf } from "../core/morphology";
import { db } from "../db/db";
import { addCustomWord, ensureWord, setWordStatus } from "../db/repo";
import type { Cefr, Pos, WordContext, WordStatus } from "../core/types";
import { Sheet, SpeakButton, StatusBadge } from "./ui";
import { aiTranslate } from "../ai/api";
import { useHealth } from "../hooks";
import { pronounce } from "../core/phonetics";

export interface WordTarget {
  surface: string;
  entryIds: string[];
  sentence?: string;
  translation?: string;
  tokens?: Token[];
  wordIndex?: number;
  annotatedSense?: number;
  expressionId?: string;
  source?: Omit<WordContext, "at" | "sentence" | "translation">;
}

const GENDER = { m: "masculin", f: "féminin", mf: "masculin / féminin" } as const;

export function WordSheet({ target, onClose }: { target: WordTarget | null; onClose: () => void }) {
  return (
    <Sheet open={!!target} onClose={onClose} label="Fiche du mot">
      {target && <WordSheetBody key={target.surface + (target.sentence ?? "")} target={target} />}
    </Sheet>
  );
}

function WordSheetBody({ target }: { target: WordTarget }) {
  const candidates = useMemo(() => {
    const ids = [...(target.expressionId ? [target.expressionId] : []), ...target.entryIds];
    return [...new Set(ids)].map((id) => entry(id)).filter((e): e is NonNullable<typeof e> => !!e);
  }, [target]);
  const [pick, setPick] = useState(0);
  const e = candidates[pick];
  if (!e) return <UnknownWord target={target} />;
  return <EntryView key={e.id} target={target} entryId={e.id} candidates={candidates.map((c) => ({ id: c.id, lemma: c.lemma, pos: c.pos }))} pick={pick} setPick={setPick} />;
}

function EntryView({
  target,
  entryId,
  candidates,
  pick,
  setPick,
}: {
  target: WordTarget;
  entryId: string;
  candidates: Array<{ id: string; lemma: string; pos: string }>;
  pick: number;
  setPick: (i: number) => void;
}) {
  const e = entry(entryId)!;
  const record = useLiveQuery(() => db.vocab.get(e.id), [e.id]);
  const health = useHealth();
  const [showConj, setShowConj] = useState(false);
  const [ai, setAi] = useState<{ translation: string; explanation: string } | null>(null);
  const [aiErr, setAiErr] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const p = pronunciationOf(e);
  const isExpressionView = target.expressionId === e.id;
  const choice =
    target.tokens && target.wordIndex !== undefined && !isExpressionView
      ? chooseSense(e, target.tokens, target.wordIndex, lang().formIndex, target.annotatedSense)
      : { index: 0, by: "défaut" as const, matchedCues: [] };
  const conj = e.pos === "verbe" ? conjugate(e) : null;
  const status: WordStatus = record && !record.deleted ? record.status : "unknown";
  const inVocab = !!record && !record.deleted;
  const ctx: WordContext | undefined = target.sentence
    ? { ...(target.source ?? { source: "manual" }), sentence: target.sentence, translation: target.translation, at: Date.now() }
    : undefined;

  const add = async () => {
    await ensureWord(e.id, ctx);
  };
  const askAi = async () => {
    setAiBusy(true);
    setAiErr(null);
    try {
      setAi(await aiTranslate(target.surface, target.sentence ?? target.surface));
    } catch (x) {
      setAiErr((x as Error).message);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="stack">
      {candidates.length > 1 && (
        <div className="pills" aria-label="Autres lectures possibles">
          {candidates.map((c, i) => (
            <button key={c.id} className={`pill ${i === pick ? "on" : ""}`} onClick={() => setPick(i)}>
              {c.lemma} <span className="subtle">· {c.pos}</span>
            </button>
          ))}
        </div>
      )}
      <div className="row between top">
        <div className="stack sm" style={{ minWidth: 0 }}>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="badge level">{e.level}</span>
            <span className="badge">{e.pos}</span>
            {e.gender && <span className="badge">{GENDER[e.gender]}</span>}
            <StatusBadge status={status} />
          </div>
          <div className="big-word">{e.lemma}</div>
          {target.surface.toLowerCase() !== e.lemma.toLowerCase() && !isExpressionView && (
            <div className="subtle">
              forme rencontrée : <b>{target.surface}</b>
            </div>
          )}
          <div className="row wrap" style={{ gap: 8 }}>
            <span className="ipa">{p.ipa}</span>
            <span className="syll" aria-label="Syllabes">
              {p.syllables.length > 1 &&
                p.stressIndex >= 0 &&
                p.syllables.map((s, i) => (
                  <span key={i} className={i === p.stressIndex ? "stress" : ""}>
                    {s}
                  </span>
                ))}
            </span>
          </div>
        </div>
        <SpeakButton text={e.lemma} wordId={e.id} />
      </div>

      {target.sentence && (
        <div className="card flat tight" style={{ background: "var(--brand-soft)", borderColor: "transparent" }}>
          <div className="eyebrow" style={{ color: "var(--brand)" }}>
            Dans cette phrase
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, marginTop: 4 }}>{e.senses[choice.index].fr}</div>
          {e.senses[choice.index].note && <div className="subtle">{e.senses[choice.index].note}</div>}
          <div className="subtle" style={{ marginTop: 4 }}>
            {choice.by === "annotation" && "Sens vérifié pour cette scène."}
            {choice.by === "contexte" && `Sens déduit du contexte (indices : ${choice.matchedCues.map((c) => c.replace("@seul", "réplique isolée").replace("@debut", "début de phrase").replace("@fin", "fin de phrase")).join(", ")}).`}
            {choice.by === "défaut" && e.senses.length > 1 && "Sens le plus courant (aucun indice de contexte détecté)."}
          </div>
        </div>
      )}

      {e.senses.length > 1 && (
        <div className="stack sm">
          <div className="eyebrow">Traductions possibles</div>
          <ol style={{ margin: 0, paddingLeft: 20 }} className="stack sm">
            {e.senses.map((s, i) => (
              <li key={i} style={{ fontWeight: i === choice.index && target.sentence ? 700 : 500 }}>
                {s.fr}
              </li>
            ))}
          </ol>
        </div>
      )}
      {e.senses.length === 1 && !target.sentence && <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{e.senses[0].fr}</div>}

      {health?.ai && target.sentence && (
        <div className="stack sm">
          {!ai && (
            <button className="btn secondary sm" onClick={askAi} disabled={aiBusy}>
              <Sparkles size={16} /> {aiBusy ? "Analyse…" : "Analyse IA du contexte"}
            </button>
          )}
          {ai && (
            <div className="notice info">
              <div>
                <b>IA : {ai.translation}</b>
                <div className="subtle">{ai.explanation}</div>
              </div>
            </div>
          )}
          {aiErr && <div className="subtle" style={{ color: "var(--bad)" }}>{aiErr}</div>}
        </div>
      )}

      {e.usage && (
        <div className="stack sm">
          <div className="eyebrow">Utilisation</div>
          <p className="muted">{e.usage}</p>
        </div>
      )}

      {e.pos === "nom" && e.gender && (
        <p className="subtle">
          Pluriel : <b>{e.plural ?? pluralOf(e.lemma, e.gender)}</b>
        </p>
      )}

      {conj && (
        <div className="stack sm">
          <button className="btn ghost sm" style={{ alignSelf: "flex-start", padding: 0 }} onClick={() => setShowConj(!showConj)}>
            <ChevronDown size={16} style={{ transform: showConj ? "rotate(180deg)" : "none", transition: "transform .2s" }} /> Conjugaison
            {conj.reflexive ? " (pronominal)" : ""} · auxiliaire {conj.aux}
          </button>
          {showConj && (
            <div className="grid two">
              {TENSES.map((t) => (
                <div key={t} className="card flat tight">
                  <div className="eyebrow">
                    {t} <span style={{ textTransform: "none", letterSpacing: 0 }}>· {TENSE_FR[t]}</span>
                  </div>
                  <table className="conj-table">
                    <tbody>
                      {conj.tenses[t].map((f, i) => (
                        <tr key={i}>
                          <td>{PERSONS[i]}</td>
                          <td>
                            <b>{f}</b>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <div className="subtle">
                Participe passé : <b>{conj.pp}</b> · Gérondif : <b>{conj.gerund}</b>
              </div>
            </div>
          )}
        </div>
      )}

      {e.examples.length > 0 && (
        <div className="stack sm">
          <div className="eyebrow">Exemples</div>
          {e.examples.map(([it, fr], i) => (
            <div key={i} className="row top" style={{ gap: 8 }}>
              <SpeakButton text={it} size="sm" />
              <div>
                <div style={{ fontWeight: 600 }}>{it}</div>
                <div className="subtle">{fr}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="stack sm" style={{ marginTop: 6 }}>
        {!inVocab ? (
          <button className="btn primary block" onClick={add}>
            <Plus size={18} /> Ajouter à mon vocabulaire
          </button>
        ) : (
          <>
            <div className="row between">
              <span className="subtle">
                <Check size={14} style={{ verticalAlign: -2 }} /> Dans votre vocabulaire
                {ctx && " — contexte enregistré"}
              </span>
              <Link to={`/vocabulaire/${encodeURIComponent(e.id)}`} className="btn ghost sm">
                <BookOpen size={16} /> Fiche
              </Link>
            </div>
            {ctx && !record!.contexts.some((c) => c.sentence === ctx.sentence) && (
              <button className="btn secondary sm" onClick={add}>
                Enregistrer ce contexte
              </button>
            )}
            <div className="segmented" role="group" aria-label="Modifier le statut">
              {(["unknown", "learning", "known"] as WordStatus[]).map((s) => (
                <button key={s} className={status === s ? "on" : ""} onClick={() => setWordStatus(e.id, s)}>
                  {{ unknown: "Inconnu", learning: "J'apprends", known: "Je connais" }[s]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function UnknownWord({ target }: { target: WordTarget }) {
  const health = useHealth();
  const [translation, setTranslation] = useState("");
  const [pos, setPos] = useState<Pos>("nom");
  const [level, setLevel] = useState<Cefr>("B1");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const word = target.surface.replace(/[’']$/, "");
  const p = pronounce(word);
  const suggest = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await aiTranslate(word, target.sentence ?? word);
      setTranslation(r.translation);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    await addCustomWord({
      lemma: word,
      translation,
      pos,
      level,
      example: target.sentence,
      ctx: target.sentence ? { ...(target.source ?? { source: "manual" }), sentence: target.sentence, translation: target.translation, at: Date.now() } : undefined,
    });
    setSaved(true);
  };
  return (
    <div className="stack">
      <div className="row between">
        <div>
          <div className="big-word">{word}</div>
          <span className="ipa">{p.ipa}</span>
        </div>
        <SpeakButton text={word} />
      </div>
      <p className="muted">
        {target.entryIds.length === 0 && /^\p{Lu}/u.test(word)
          ? "Probablement un nom propre : il n'est pas dans le dictionnaire."
          : "Ce mot n'est pas encore dans le dictionnaire intégré. Vous pouvez l'ajouter à votre vocabulaire avec votre propre traduction."}
      </p>
      {target.sentence && target.translation && (
        <div className="card flat tight">
          <div style={{ fontWeight: 600 }}>{target.sentence}</div>
          <div className="subtle">{target.translation}</div>
        </div>
      )}
      {saved ? (
        <div className="notice info">Ajouté à votre vocabulaire ✔</div>
      ) : (
        <>
          <label className="field">
            <span>Traduction française</span>
            <input className="input" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="ex. : quai, voie" />
          </label>
          {health?.ai && (
            <button className="btn secondary sm" onClick={suggest} disabled={busy}>
              <Sparkles size={16} /> {busy ? "…" : "Suggérer avec l'IA"}
            </button>
          )}
          {err && <div className="subtle" style={{ color: "var(--bad)" }}>{err}</div>}
          <div className="grid two">
            <label className="field">
              <span>Catégorie</span>
              <select className="select" value={pos} onChange={(e) => setPos(e.target.value as Pos)}>
                {["nom", "verbe", "adjectif", "adverbe", "expression", "pronom", "préposition", "conjonction", "interjection"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Niveau</span>
              <select className="select" value={level} onChange={(e) => setLevel(e.target.value as Cefr)}>
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
          <button className="btn primary block" disabled={!translation.trim()} onClick={save}>
            <Plus size={18} /> Ajouter à mon vocabulaire
          </button>
        </>
      )}
    </div>
  );
}
