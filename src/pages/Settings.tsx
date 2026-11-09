import { useEffect, useRef, useState } from "react";
import { Bell, Cloud, Download, Upload, LogOut, RefreshCw, Moon, Sun, Monitor, Trash2 } from "lucide-react";
import { getMeta, setMeta, db } from "../db/db";
import { exportAll, importAll, saveSettings } from "../db/repo";
import { api, health as getHealth, type Health } from "../ai/api";
import { logout, syncNow } from "../db/sync";
import { useAuthUser, useSettings } from "../hooks";
import { CEFR_LEVELS, type Cefr } from "../core/types";
import { Notice, PageHeader } from "../components/ui";
import { italianVoices } from "../speech/tts";
import { speechRecognitionSupported } from "../speech/stt";

export default function SettingsPage() {
  const s = useSettings();
  const [h, setH] = useState<Health | null>(null);
  useEffect(() => {
    getHealth(true).then(setH);
  }, []);
  return (
    <div className="page stack lg">
      <PageHeader title="Réglages" subtitle="Personnalisation, compte et sauvegarde." />

      <section className="card stack">
        <h2>Apprentissage</h2>
        <Field label="Niveau actuel">
          <select className="select" value={s.level} onChange={(e) => saveSettings({ level: e.target.value as Cefr })}>
            {CEFR_LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label={`Nouveaux mots par jour : ${s.newWordsPerDay}`}>
          <input type="range" min={3} max={30} value={s.newWordsPerDay} onChange={(e) => saveSettings({ newWordsPerDay: Number(e.target.value) })} />
        </Field>
        <Field label={`Objectif de révisions quotidiennes : ${s.reviewsPerDay}`}>
          <input type="range" min={10} max={200} step={5} value={s.reviewsPerDay} onChange={(e) => saveSettings({ reviewsPerDay: Number(e.target.value) })} />
        </Field>
        <Field label={`Objectif d'XP quotidien : ${s.dailyXpGoal}`}>
          <input type="range" min={20} max={500} step={10} value={s.dailyXpGoal} onChange={(e) => saveSettings({ dailyXpGoal: Number(e.target.value) })} />
        </Field>
        <Field label="Difficulté des exercices">
          <div className="segmented">
            {(["facile", "normal", "exigeant"] as const).map((d) => (
              <button key={d} className={s.exerciseDifficulty === d ? "on" : ""} onClick={() => saveSettings({ exerciseDifficulty: d })}>
                {d}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Langue des explications">
          <div className="segmented">
            <button className={s.explanationLang === "fr" ? "on" : ""} onClick={() => saveSettings({ explanationLang: "fr" })}>
              Français
            </button>
            <button className={s.explanationLang === "it" ? "on" : ""} onClick={() => saveSettings({ explanationLang: "it" })}>
              Italien (immersion)
            </button>
          </div>
          <span className="subtle">
            {s.explanationLang === "it"
              ? "Les traductions françaises des scènes sont masquées par défaut ; les fiches restent bilingues."
              : "Explications et traductions en français."}
          </span>
        </Field>
      </section>

      <section className="card stack">
        <h2>Vidéos</h2>
        <Field label="Vitesse de lecture par défaut">
          <div className="segmented">
            {[0.5, 0.75, 1, 1.25].map((r) => (
              <button key={r} className={s.playbackRate === r ? "on" : ""} onClick={() => saveSettings({ playbackRate: r })}>
                {r}×
              </button>
            ))}
          </div>
        </Field>
        <label className="row between">
          <span>Afficher la traduction française par défaut</span>
          <input
            type="checkbox"
            checked={s.showTranslationByDefault && s.explanationLang === "fr"}
            disabled={s.explanationLang === "it"}
            onChange={(e) => saveSettings({ showTranslationByDefault: e.target.checked })}
          />
        </label>
      </section>

      <Notifications enabled={s.notifications} />
      <Appearance />
      <Account health={h} />
      <Backup />

      <section className="card stack sm">
        <h2>État des services</h2>
        <ServiceRow ok={!!h?.ok} label="Serveur Parla" detail={h?.ok ? "connecté" : "injoignable — l'application fonctionne hors ligne"} />
        <ServiceRow ok={!!h?.ai} label="Professeur IA" detail={h?.ai ? `actif (${h.model})` : "non configuré — mode démo (ANTHROPIC_API_KEY absent)"} />
        <ServiceRow ok={italianVoices().length > 0} label="Voix italienne de l'appareil" detail={italianVoices().length ? italianVoices().map((v) => v.name).slice(0, 2).join(", ") : "absente — audio de secours utilisé"} />
        <ServiceRow ok={speechRecognitionSupported()} label="Reconnaissance vocale" detail={speechRecognitionSupported() ? "disponible" : "non prise en charge par ce navigateur"} />
      </section>
    </div>
  );
}

function ServiceRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="row" style={{ gap: 10 }}>
      <span className="dot" style={{ background: ok ? "var(--ok)" : "var(--warn)" }} />
      <b style={{ minWidth: 0 }}>{label}</b>
      <span className="subtle truncate" style={{ flex: 1, textAlign: "right" }}>
        {detail}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field">
      <span>{label}</span>
      {children}
    </div>
  );
}

function Notifications({ enabled }: { enabled: boolean }) {
  const supported = typeof Notification !== "undefined";
  const [perm, setPerm] = useState(supported ? Notification.permission : "denied");
  const toggle = async () => {
    if (enabled) return saveSettings({ notifications: false });
    if (!supported) return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      await setMeta("lastNotified", "");
      await saveSettings({ notifications: true });
    }
  };
  return (
    <section className="card stack sm">
      <div className="row between">
        <h2>
          <Bell size={18} style={{ verticalAlign: -3 }} /> Rappels de révision
        </h2>
        <button className={`btn sm ${enabled ? "secondary" : "primary"}`} onClick={toggle} disabled={!supported}>
          {enabled ? "Désactiver" : "Activer"}
        </button>
      </div>
      <p className="subtle">
        Une notification par jour quand des mots sont à réviser (à l'ouverture de l'application), et un badge sur l'icône de l'application installée.
        {perm === "denied" && " Les notifications sont bloquées dans votre navigateur."}
      </p>
      <p className="subtle tiny">Limite : sans serveur de notifications push, le rappel s'affiche quand l'application est ouverte ou en arrière-plan.</p>
    </section>
  );
}

function Appearance() {
  const [theme, setTheme] = useState<string>(() => {
    try {
      return localStorage.getItem("parla-theme") ?? "system";
    } catch {
      return "system";
    }
  });
  const apply = (t: string) => {
    setTheme(t);
    try {
      if (t === "system") {
        localStorage.removeItem("parla-theme");
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem("parla-theme", t);
        document.documentElement.dataset.theme = t;
      }
    } catch {
      document.documentElement.dataset.theme = t === "system" ? "" : t;
    }
  };
  return (
    <section className="card stack sm">
      <h2>Apparence</h2>
      <div className="segmented">
        {[
          ["system", "Système", Monitor],
          ["light", "Clair", Sun],
          ["dark", "Sombre", Moon],
        ].map(([k, l, Icon]) => {
          const I = Icon as typeof Sun;
          return (
            <button key={k as string} className={theme === k ? "on" : ""} onClick={() => apply(k as string)}>
              <I size={14} style={{ verticalAlign: -2 }} /> {l as string}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Account({ health }: { health: Health | null }) {
  const user = useAuthUser();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  useEffect(() => {
    getMeta<number | null>("lastSyncAt", null).then(setLastSync);
  }, [user]);

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ token: string; user: { id: string; email: string; name: string } }>(`/auth/${mode}`, { email, password, name });
      await setMeta("authToken", r.token);
      await setMeta("authUser", r.user);
      await setMeta("syncCursor", 0);
      await setMeta("lastPushAt", 0);
      const s = await syncNow();
      setLastSync(s.at);
      setMsg({ tone: "info", text: `Connecté. Synchronisation : ${s.pushed} envoyés, ${s.pulled} reçus.` });
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };
  const sync = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const s = await syncNow();
      setLastSync(s.at);
      setMsg({ tone: "info", text: `Synchronisé : ${s.pushed} envoyés, ${s.pulled} reçus.` });
    } catch (e) {
      setMsg({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card stack">
      <h2>
        <Cloud size={18} style={{ verticalAlign: -3 }} /> Compte et synchronisation
      </h2>
      {health && !health.ok && <Notice>Serveur injoignable : la synchronisation est indisponible pour le moment. Vos données restent sur l'appareil.</Notice>}
      {user ? (
        <>
          <p>
            Connecté en tant que <b>{user.name}</b> <span className="subtle">({user.email})</span>
          </p>
          <p className="subtle">Dernière synchronisation : {lastSync ? new Date(lastSync).toLocaleString("fr-FR") : "jamais"}</p>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn primary sm" onClick={sync} disabled={busy}>
              <RefreshCw size={15} /> Synchroniser
            </button>
            <button className="btn secondary sm" onClick={() => logout()}>
              <LogOut size={15} /> Se déconnecter
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="subtle">Créez un compte pour sauvegarder votre progression sur le serveur et la retrouver sur tous vos appareils.</p>
          <div className="segmented">
            <button className={mode === "register" ? "on" : ""} onClick={() => setMode("register")}>
              Créer un compte
            </button>
            <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
              Se connecter
            </button>
          </div>
          <form
            className="stack sm"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            {mode === "register" && <input className="input" placeholder="Prénom" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />}
            <input className="input" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <input
              className="input"
              type="password"
              placeholder="Mot de passe (8 caractères min.)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={8}
              required
            />
            <button className="btn primary" disabled={busy || !health?.ok}>
              {mode === "register" ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>
        </>
      )}
      {msg && <div className={`notice ${msg.tone === "error" ? "error" : "info"}`}>{msg.text}</div>}
      <p className="subtle tiny">
        Confidentialité : mots de passe chiffrés (scrypt), jetons de session hachés côté serveur. Les vidéos importées ne quittent jamais votre appareil.
      </p>
    </section>
  );
}

function Backup() {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const download = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `parla-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const restore = async (f: File) => {
    try {
      await importAll(JSON.parse(await f.text()));
      setMsg("Sauvegarde restaurée ✔");
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  return (
    <section className="card stack sm">
      <h2>Sauvegarde</h2>
      <p className="subtle">Exportez toutes vos données (vocabulaire, historique, progression) dans un fichier, ou restaurez une sauvegarde.</p>
      <div className="row wrap" style={{ gap: 8 }}>
        <button className="btn secondary sm" onClick={download}>
          <Download size={15} /> Exporter
        </button>
        <button className="btn secondary sm" onClick={() => file.current?.click()}>
          <Upload size={15} /> Restaurer
        </button>
        <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
        <button
          className="btn danger sm"
          onClick={async () => {
            if (confirm("Effacer toutes les données de cet appareil ? (Exportez d'abord une sauvegarde.)")) {
              await db.delete();
              location.reload();
            }
          }}
        >
          <Trash2 size={15} /> Tout effacer
        </button>
      </div>
      {msg && <span className="subtle">{msg}</span>}
    </section>
  );
}
