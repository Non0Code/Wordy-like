import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Play, Upload, Trash2, ShieldCheck } from "lucide-react";
import { builtInScenes, newWordsFor, userVideoToScene, type PlayableScene } from "../db/scenes";
import { db, uid } from "../db/db";
import { useVocabMap } from "../hooks";
import { CEFR_LEVELS, type Cefr } from "../core/types";
import { PageHeader, Sheet, Notice } from "../components/ui";
import { parseSubtitles } from "../core/subtitles";

type Kind = "tout" | "film" | "série" | "mes";
type Dur = "toutes" | "courte" | "moyenne" | "longue";
type Diff = "toutes" | "facile" | "moyen" | "difficile";

export default function Library() {
  const [params] = useSearchParams();
  const comprehension = params.get("mode") === "comprehension";
  const vocab = useVocabMap();
  const userVideos = useLiveQuery(() => db.videos.orderBy("createdAt").reverse().toArray(), [], []);
  const [kind, setKind] = useState<Kind>("tout");
  const [level, setLevel] = useState<Cefr | "tous">("tous");
  const [theme, setTheme] = useState("toutes");
  const [dur, setDur] = useState<Dur>("toutes");
  const [diff, setDiff] = useState<Diff>("toutes");
  const [importing, setImporting] = useState(false);

  const all = useMemo(() => {
    const builtIn = builtInScenes();
    const mine = userVideos.map((v) => userVideoToScene(v, null));
    return [...builtIn, ...mine];
  }, [userVideos]);

  const themes = useMemo(() => [...new Set(all.flatMap((s) => s.themes))].sort(), [all]);

  const enriched = useMemo(
    () =>
      all.map((s) => {
        const fresh = newWordsFor(s, vocab).length;
        const ratio = fresh / Math.max(1, s.lines.reduce((a, l) => a + l.it.split(/\s+/).length, 0));
        return { s, fresh, difficulty: (ratio < 0.12 ? "facile" : ratio < 0.3 ? "moyen" : "difficile") as Diff };
      }),
    [all, vocab],
  );

  const filtered = enriched.filter(({ s, difficulty }) => {
    if (kind === "mes" && !s.userVideo) return false;
    if ((kind === "film" || kind === "série") && s.kind !== kind) return false;
    if (level !== "tous" && s.level !== level) return false;
    if (theme !== "toutes" && !s.themes.includes(theme)) return false;
    if (dur === "courte" && s.duration > 40) return false;
    if (dur === "moyenne" && (s.duration <= 40 || s.duration > 120)) return false;
    if (dur === "longue" && s.duration <= 120) return false;
    if (diff !== "toutes" && difficulty !== diff) return false;
    if (comprehension && s.questions.length === 0 && !s.userVideo) return false;
    return true;
  });

  return (
    <div className="page wide stack lg">
      <PageHeader
        title={comprehension ? "Ciné-quiz" : "Films et séries"}
        subtitle={
          comprehension
            ? "Regardez une scène sans traduction, puis répondez aux questions."
            : "Apprenez avec des dialogues de scènes. Touchez n'importe quel mot des sous-titres."
        }
        action={
          <button className="btn secondary sm" onClick={() => setImporting(true)}>
            <Upload size={16} /> <span className="hide-mobile">Importer</span>
          </button>
        }
      />
      <Notice tone="info">
        <b>Contenus légaux uniquement.</b> Le catalogue intégré contient des scènes de démonstration originales (dialogues écrits pour Parla,
        voix de synthèse). Vous pouvez importer vos propres vidéos avec leurs sous-titres : elles restent stockées sur votre appareil.
      </Notice>

      <div className="stack sm">
        <div className="pills">
          {(["tout", "film", "série", "mes"] as Kind[]).map((k) => (
            <button key={k} className={`pill ${kind === k ? "on" : ""}`} onClick={() => setKind(k)}>
              {{ tout: "Tout", film: "Films", série: "Séries", mes: "Mes vidéos" }[k]}
            </button>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          <select className="select" value={level} onChange={(e) => setLevel(e.target.value as Cefr | "tous")} aria-label="Niveau">
            <option value="tous">Tous niveaux</option>
            {CEFR_LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select className="select" value={theme} onChange={(e) => setTheme(e.target.value)} aria-label="Thématique">
            <option value="toutes">Toutes thématiques</option>
            {themes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select className="select" value={dur} onChange={(e) => setDur(e.target.value as Dur)} aria-label="Durée">
            <option value="toutes">Toutes durées</option>
            <option value="courte">Courte (≤ 40 s)</option>
            <option value="moyenne">Moyenne (40 s – 2 min)</option>
            <option value="longue">Longue (&gt; 2 min)</option>
          </select>
          <select className="select" value={diff} onChange={(e) => setDiff(e.target.value as Diff)} aria-label="Difficulté du vocabulaire">
            <option value="toutes">Vocabulaire : tout</option>
            <option value="facile">Peu de mots nouveaux</option>
            <option value="moyen">Quelques mots nouveaux</option>
            <option value="difficile">Beaucoup de mots nouveaux</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="big">🎬</div>Aucune scène ne correspond à ces filtres.
        </div>
      ) : (
        <div className="grid auto">
          {filtered.map(({ s, fresh }) => (
            <SceneCard key={s.id} s={s} fresh={fresh} comprehension={comprehension} />
          ))}
        </div>
      )}
      <ImportSheet open={importing} onClose={() => setImporting(false)} />
    </div>
  );
}

function SceneCard({ s, fresh, comprehension }: { s: PlayableScene; fresh: number; comprehension: boolean }) {
  return (
    <div className="card scene-card">
      <Link to={`/scene/${encodeURIComponent(s.id)}${comprehension ? "?mode=comprehension" : ""}`} style={{ display: "block" }}>
        <div className="scene-cover" style={{ background: `linear-gradient(135deg, ${s.palette[0]}, ${s.palette[1]})` }}>
          <span className="play">
            <Play size={18} fill="#fff" />
          </span>
          <span className="work">
            {s.work}
            {s.episode ? ` · ${s.episode}` : ""}
          </span>
          <span className="title">{s.title}</span>
        </div>
        <div className="stack sm" style={{ padding: "12px 14px" }}>
          <div className="row wrap" style={{ gap: 6 }}>
            <span className="badge level">{s.level}</span>
            <span className="badge">{s.kind}</span>
            <span className="badge">{s.duration} s</span>
            {s.demo && <span className="badge demo">démo</span>}
          </div>
          <span className="subtle">
            {fresh > 0 ? `${fresh} mot${fresh > 1 ? "s" : ""} nouveau${fresh > 1 ? "x" : ""} pour vous` : "Aucun mot nouveau : idéal pour consolider"}
          </span>
        </div>
      </Link>
      {s.userVideo && (
        <div style={{ padding: "0 14px 12px" }}>
          <button
            className="btn danger sm"
            onClick={async () => {
              if (confirm(`Supprimer « ${s.title} » de cet appareil ?`)) await db.videos.delete(s.id.slice(5));
            }}
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      )}
    </div>
  );
}

function ImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"film" | "série">("film");
  const [level, setLevel] = useState<Cefr>("B1");
  const [theme, setTheme] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [subIt, setSubIt] = useState("");
  const [subFr, setSubFr] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [rights, setRights] = useState(false);

  const readFile = (f: File | undefined, set: (s: string) => void) => f && f.text().then(set);
  const save = async () => {
    setErr(null);
    const cues = parseSubtitles(subIt);
    if (!cues.length) return setErr("Sous-titres italiens illisibles : fournissez un fichier .srt ou .vtt valide.");
    if (!video && !/^https:\/\//.test(url)) return setErr("Choisissez un fichier vidéo ou une adresse https.");
    const now = Date.now();
    await db.videos.put({
      id: uid(),
      title: title.trim() || video?.name || "Ma vidéo",
      kind,
      level,
      themes: theme ? [theme.trim()] : ["Personnel"],
      blob: video ?? undefined,
      url: video ? undefined : url,
      subtitlesIt: subIt,
      subtitlesFr: subFr || undefined,
      createdAt: now,
      updatedAt: now,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} label="Importer une vidéo">
      <div className="stack">
        <h2>Importer une vidéo</h2>
        <p className="subtle">
          Vidéo personnelle, extrait sous licence libre ou contenu dont vous détenez les droits. Le fichier reste dans le stockage local de votre
          navigateur.
        </p>
        <label className="field">
          <span>Titre</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. : Mon court-métrage" />
        </label>
        <div className="grid two">
          <label className="field">
            <span>Type</span>
            <select className="select" value={kind} onChange={(e) => setKind(e.target.value as "film" | "série")}>
              <option value="film">Film</option>
              <option value="série">Série</option>
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
        <label className="field">
          <span>Thématique</span>
          <input className="input" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex. : Famille" />
        </label>
        <label className="field">
          <span>Fichier vidéo (mp4, webm)</span>
          <input className="input" type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
        </label>
        {!video && (
          <label className="field">
            <span>… ou adresse https d'une vidéo autorisée</span>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/video.mp4" />
          </label>
        )}
        <label className="field">
          <span>Sous-titres italiens (.srt / .vtt) — obligatoire</span>
          <input className="input" type="file" accept=".srt,.vtt,text/vtt" onChange={(e) => readFile(e.target.files?.[0], setSubIt)} />
        </label>
        <label className="field">
          <span>Sous-titres français (facultatif)</span>
          <input className="input" type="file" accept=".srt,.vtt,text/vtt" onChange={(e) => readFile(e.target.files?.[0], setSubFr)} />
        </label>
        {subIt && <span className="subtle">{parseSubtitles(subIt).length} répliques italiennes détectées.</span>}
        <label className="row" style={{ gap: 8, alignItems: "flex-start" }}>
          <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} style={{ marginTop: 4 }} />
          <span className="subtle">
            <ShieldCheck size={14} style={{ verticalAlign: -2 }} /> Je confirme disposer des droits d'utilisation de cette vidéo pour un usage personnel.
          </span>
        </label>
        {err && <div className="notice error">{err}</div>}
        <button className="btn primary block" disabled={!rights || !subIt} onClick={save}>
          Ajouter à ma bibliothèque
        </button>
      </div>
    </Sheet>
  );
}
