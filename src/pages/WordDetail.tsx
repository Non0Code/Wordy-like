import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, Trash2, Dumbbell, Save } from "lucide-react";
import { db } from "../db/db";
import { deleteWord, setWordStatus, updateWord } from "../db/repo";
import { entry, pronunciationOf } from "../content";
import { formatInterval, GRADE_LABELS, successRate } from "../core/srs";
import { CEFR_LEVELS, type Cefr, type WordStatus } from "../core/types";
import { SpeakButton, StatusBadge } from "../components/ui";
import { WordSheet, type WordTarget } from "../components/WordSheet";

const fmt = (ts: number | null) => (ts ? new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function WordPage() {
  const { id = "" } = useParams();
  const wid = decodeURIComponent(id);
  const nav = useNavigate();
  const w = useLiveQuery(() => db.vocab.get(wid), [wid]);
  const history = useLiveQuery(() => db.reviews.where("wordId").equals(wid).reverse().sortBy("at"), [wid], []);
  const [sheet, setSheet] = useState<WordTarget | null>(null);
  const [editing, setEditing] = useState(false);
  const [tr, setTr] = useState("");
  const [lv, setLv] = useState<Cefr>("A1");
  const e = entry(wid);

  if (w === undefined) return <div className="page subtle">Chargement…</div>;
  if (!w || w.deleted)
    return (
      <div className="page empty">
        Ce mot n'est pas (ou plus) dans votre vocabulaire.
        <div className="mt">
          <button className="btn secondary" onClick={() => nav("/vocabulaire")}>
            Retour
          </button>
        </div>
      </div>
    );

  const p = e ? pronunciationOf(e) : null;
  return (
    <div className="page stack lg">
      <button className="btn ghost sm" style={{ alignSelf: "flex-start", padding: 0 }} onClick={() => nav(-1)}>
        <ChevronLeft size={18} /> Vocabulaire
      </button>
      <div className="row between top">
        <div className="stack sm">
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="badge level">{w.level}</span>
            <span className="badge">{w.pos}</span>
            <StatusBadge status={w.status} />
            {w.manualStatus && <span className="badge">statut manuel</span>}
          </div>
          <div className="big-word" lang="it">
            {w.lemma}
          </div>
          <span className="ipa">{p?.ipa ?? w.pronunciation}</span>
          {!editing ? (
            <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{w.translation}</div>
          ) : (
            <div className="stack sm">
              <input className="input" value={tr} onChange={(ev) => setTr(ev.target.value)} />
              <select className="select" value={lv} onChange={(ev) => setLv(ev.target.value as Cefr)}>
                {CEFR_LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              <button
                className="btn primary sm"
                onClick={async () => {
                  await updateWord(w.id, { translation: tr, level: lv });
                  setEditing(false);
                }}
              >
                <Save size={15} /> Enregistrer
              </button>
            </div>
          )}
        </div>
        <SpeakButton text={w.lemma} wordId={e ? w.id : undefined} />
      </div>

      <div className="stack sm">
        <span className="eyebrow">Statut (modifiable)</span>
        <div className="segmented">
          {(["unknown", "learning", "known"] as WordStatus[]).map((s) => (
            <button key={s} className={w.status === s ? "on" : ""} onClick={() => setWordStatus(w.id, s)}>
              {{ unknown: "Inconnu", learning: "En apprentissage", known: "Connu" }[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid three">
        <div className="card tight stat">
          <b>{w.reviewCount}</b>
          <span>révisions</span>
        </div>
        <div className="card tight stat">
          <b>{w.reviewCount ? `${Math.round(successRate(w) * 100)} %` : "—"}</b>
          <span>réussite</span>
        </div>
        <div className="card tight stat">
          <b>{w.intervalDays ? formatInterval(w.intervalDays) : "—"}</b>
          <span>intervalle</span>
        </div>
      </div>

      <div className="card stack sm">
        <Row k="Découvert le" v={fmt(w.firstSeenAt)} />
        {w.discoveredIn && <Row k="Découvert dans" v={w.discoveredIn} />}
        <Row k="Dernière révision" v={fmt(w.lastReviewedAt)} />
        <Row k="Prochaine révision" v={w.dueAt ? new Date(w.dueAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "à programmer (mot non étudié)"} />
        <Row k="Facilité" v={`${w.ease.toFixed(2)} (étape ${Math.max(0, w.step)})`} />
        <Row k="Oublis" v={String(w.lapses)} />
        <Row k="Identifiant" v={w.id} />
      </div>

      <div className="row wrap" style={{ gap: 8 }}>
        <button className="btn secondary sm" onClick={() => nav(`/exercices?mots=${encodeURIComponent(w.id)}`)}>
          <Dumbbell size={15} /> M'entraîner sur ce mot
        </button>
        {e && (
          <button className="btn secondary sm" onClick={() => setSheet({ surface: w.lemma, entryIds: [w.id] })}>
            Fiche complète (conjugaison, sens)
          </button>
        )}
        <button
          className="btn secondary sm"
          onClick={() => {
            setTr(w.translation);
            setLv(w.level);
            setEditing(true);
          }}
        >
          Modifier
        </button>
      </div>

      <div>
        <div className="section-title">
          <h2>Contextes rencontrés ({w.contexts.filter((c) => c.sentence).length})</h2>
        </div>
        <div className="stack sm">
          {w.contexts.filter((c) => c.sentence).length === 0 && <p className="subtle">Aucun contexte enregistré pour l'instant.</p>}
          {[...w.contexts]
            .reverse()
            .filter((c) => c.sentence)
            .map((c, i) => (
              <div key={i} className="card tight row top" style={{ gap: 10 }}>
                <SpeakButton text={c.sentence!} size="sm" />
                <div>
                  <div style={{ fontWeight: 600 }} lang="it">
                    {c.sentence}
                  </div>
                  {c.translation && <div className="subtle">{c.translation}</div>}
                  <div className="subtle tiny">
                    {{ scene: "🎬 Scène", lesson: "📘 Leçon", manual: "✍️ Ajout manuel", tutor: "💬 Professeur", import: "📥 Import" }[c.source]}
                    {c.sourceTitle ? ` · ${c.sourceTitle}` : ""} · {fmt(c.at)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <div className="section-title">
          <h2>Historique des révisions</h2>
        </div>
        {history.length === 0 ? (
          <p className="subtle">Pas encore de révision.</p>
        ) : (
          <div className="card tight list">
            {history.slice(0, 30).map((h) => (
              <div key={h.id} className="list-item" style={{ cursor: "default" }}>
                <span className={`grade ${h.grade}`} style={{ padding: "2px 8px", border: 0, background: "transparent" }}>
                  {GRADE_LABELS[h.grade]}
                </span>
                <span className="subtle" style={{ flex: 1 }}>
                  {h.exercise}
                </span>
                <span className="subtle tiny">
                  {formatInterval(h.prevInterval, h.prevInterval === 0)} → {formatInterval(h.nextInterval, h.nextInterval === 0)}
                </span>
                <span className="subtle tiny">{new Date(h.at).toLocaleDateString("fr-FR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="btn danger"
        onClick={async () => {
          if (confirm(`Retirer « ${w.lemma} » de votre vocabulaire ?`)) {
            await deleteWord(w.id);
            nav("/vocabulaire");
          }
        }}
      >
        <Trash2 size={16} /> Retirer de mon vocabulaire
      </button>
      <WordSheet target={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row between" style={{ gap: 12 }}>
      <span className="subtle">{k}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }} className="truncate">
        {v}
      </span>
    </div>
  );
}
