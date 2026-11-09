import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Dumbbell } from "lucide-react";
import { useVocab } from "../hooks";
import { CEFR_LEVELS, type Cefr, type Pos, type WordStatus } from "../core/types";
import { PageHeader, Sheet, StatusBadge, SpeakButton } from "../components/ui";
import { addCustomWord, difficultyScore } from "../db/repo";
import { lookup } from "../content";
import { normalize } from "../core/pronunciation";
import { successRate, formatInterval, startOfDay } from "../core/srs";
import { vocabCounts } from "../core/gamification";

type Sort = "recent" | "alpha" | "difficile" | "prochaine";
type Added = "toutes" | "7j" | "30j" | "plus";
const POS_LIST: Pos[] = ["nom", "verbe", "adjectif", "adverbe", "expression", "pronom", "préposition", "conjonction", "interjection", "article", "déterminant", "numéral"];

export default function Vocabulary() {
  const vocab = useVocab();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<WordStatus | "all">("all");
  const [level, setLevel] = useState<Cefr | "all">("all");
  const [pos, setPos] = useState<Pos | "all">("all");
  const [added, setAdded] = useState<Added>("toutes");
  const [sort, setSort] = useState<Sort>("recent");
  const [adding, setAdding] = useState(false);

  const counts = vocabCounts(vocab ?? []);
  const list = useMemo(() => {
    const nq = normalize(q);
    const now = Date.now();
    const out = (vocab ?? []).filter((w) => {
      if (status !== "all" && w.status !== status) return false;
      if (level !== "all" && w.level !== level) return false;
      if (pos !== "all" && w.pos !== pos) return false;
      const age = (now - w.firstSeenAt) / 86_400_000;
      if (added === "7j" && age > 7) return false;
      if (added === "30j" && age > 30) return false;
      if (added === "plus" && age <= 30) return false;
      if (nq && !normalize(w.lemma).includes(nq) && !normalize(w.translation).includes(nq)) return false;
      return true;
    });
    const by: Record<Sort, (a: (typeof out)[0], b: (typeof out)[0]) => number> = {
      recent: (a, b) => b.firstSeenAt - a.firstSeenAt,
      alpha: (a, b) => a.lemma.localeCompare(b.lemma, "it"),
      difficile: (a, b) => difficultyScore(b) - difficultyScore(a),
      prochaine: (a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity),
    };
    return out.sort(by[sort]);
  }, [vocab, q, status, level, pos, added, sort]);

  const sod = startOfDay();
  return (
    <div className="page stack">
      <PageHeader
        title="Mon vocabulaire"
        subtitle={`${counts.total} mots dans votre dictionnaire personnel`}
        action={
          <button className="btn primary sm" onClick={() => setAdding(true)}>
            <Plus size={16} /> Ajouter
          </button>
        }
      />
      <div className="segmented" role="tablist">
        {(
          [
            ["all", `Tous · ${counts.total}`],
            ["unknown", `Inconnus · ${counts.unknown}`],
            ["learning", `En cours · ${counts.learning}`],
            ["known", `Connus · ${counts.known}`],
          ] as Array<[WordStatus | "all", string]>
        ).map(([k, label]) => (
          <button key={k} className={status === k ? "on" : ""} onClick={() => setStatus(k)}>
            {label}
          </button>
        ))}
      </div>
      <div className="row" style={{ gap: 8, position: "relative" }}>
        <Search size={18} style={{ position: "absolute", left: 14, color: "var(--ink-3)" }} />
        <input className="input" style={{ paddingLeft: 40 }} placeholder="Rechercher un mot (italien ou français)" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
        <select className="select" value={level} onChange={(e) => setLevel(e.target.value as Cefr | "all")} aria-label="Niveau">
          <option value="all">Tous niveaux</option>
          {CEFR_LEVELS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select className="select" value={pos} onChange={(e) => setPos(e.target.value as Pos | "all")} aria-label="Catégorie grammaticale">
          <option value="all">Toutes catégories</option>
          {POS_LIST.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select className="select" value={added} onChange={(e) => setAdded(e.target.value as Added)} aria-label="Date d'ajout">
          <option value="toutes">Ajoutés : toujours</option>
          <option value="7j">7 derniers jours</option>
          <option value="30j">30 derniers jours</option>
          <option value="plus">Il y a plus de 30 j</option>
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Tri">
          <option value="recent">Plus récents</option>
          <option value="alpha">Ordre alphabétique</option>
          <option value="difficile">Plus difficiles</option>
          <option value="prochaine">Prochaine révision</option>
        </select>
      </div>
      {list.length > 0 && sort === "difficile" && (
        <button className="btn secondary sm" style={{ alignSelf: "flex-start" }} onClick={() => nav(`/exercices?mots=${list.slice(0, 12).map((w) => encodeURIComponent(w.id)).join(",")}`)}>
          <Dumbbell size={15} /> S'entraîner sur ces mots difficiles
        </button>
      )}

      {vocab && list.length === 0 ? (
        <div className="empty">
          <div className="big">📖</div>
          {counts.total === 0 ? "Votre dictionnaire est vide. Commencez une leçon ou regardez une scène !" : "Aucun mot ne correspond à ces critères."}
        </div>
      ) : (
        <div className="card tight list">
          {list.map((w) => (
            <div key={w.id} className="list-item" onClick={() => nav(`/vocabulaire/${encodeURIComponent(w.id)}`)}>
              <SpeakButton text={w.lemma} wordId={w.id.startsWith("custom:") ? undefined : w.id} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row" style={{ gap: 6 }}>
                  <b lang="it" className="truncate">
                    {w.lemma}
                  </b>
                  <span className="subtle tiny">{w.pos}</span>
                </div>
                <div className="subtle truncate">{w.translation}</div>
              </div>
              <div className="stack" style={{ gap: 4, alignItems: "flex-end" }}>
                <StatusBadge status={w.status} />
                <span className="subtle tiny">
                  {w.reviewCount ? `${Math.round(successRate(w) * 100)} % · ` : ""}
                  {w.dueAt === null ? "non étudié" : w.dueAt < sod ? "en retard" : w.dueAt <= Date.now() + 86_400_000 ? "à réviser" : `dans ${formatInterval(Math.ceil((w.dueAt - Date.now()) / 86_400_000))}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddWordSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function AddWordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [lemma, setLemma] = useState("");
  const [translation, setTranslation] = useState("");
  const [pos, setPos] = useState<Pos>("nom");
  const [level, setLevel] = useState<Cefr>("A2");
  const [example, setExample] = useState("");
  const matches = lemma.trim() ? lookup(lemma.trim()) : [];
  const save = async () => {
    await addCustomWord({
      lemma,
      translation: translation || matches[0]?.senses[0].fr || "",
      pos: matches[0]?.pos ?? pos,
      level: matches[0]?.level ?? level,
      example: example || undefined,
      ctx: example ? { source: "manual", sentence: example, at: Date.now() } : { source: "manual", at: Date.now() },
    });
    setLemma("");
    setTranslation("");
    setExample("");
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} label="Ajouter un mot">
      <div className="stack">
        <h2>Ajouter un mot</h2>
        <label className="field">
          <span>Mot italien</span>
          <input className="input" value={lemma} onChange={(e) => setLemma(e.target.value)} autoFocus lang="it" />
        </label>
        {matches.length > 0 && (
          <div className="notice info">
            Trouvé dans le dictionnaire : <b>{matches[0].lemma}</b> — {matches[0].senses.map((s) => s.fr).join(" ; ")}. La fiche existante sera utilisée
            (pas de doublon).
          </div>
        )}
        {matches.length === 0 && (
          <>
            <label className="field">
              <span>Traduction française</span>
              <input className="input" value={translation} onChange={(e) => setTranslation(e.target.value)} />
            </label>
            <div className="grid two">
              <label className="field">
                <span>Catégorie</span>
                <select className="select" value={pos} onChange={(e) => setPos(e.target.value as Pos)}>
                  {POS_LIST.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Niveau</span>
                <select className="select" value={level} onChange={(e) => setLevel(e.target.value as Cefr)}>
                  {CEFR_LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}
        <label className="field">
          <span>Exemple (facultatif)</span>
          <input className="input" value={example} onChange={(e) => setExample(e.target.value)} lang="it" />
        </label>
        <button className="btn primary block" disabled={!lemma.trim() || (!matches.length && !translation.trim())} onClick={save}>
          Enregistrer
        </button>
      </div>
    </Sheet>
  );
}
