import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { Home, GraduationCap, Clapperboard, BookMarked, BarChart3, Settings as Cog, Flame, WifiOff } from "lucide-react";
import { onAppEvent } from "../db/repo";
import { useOnline, useProgress, useQueue, useSettings } from "../hooks";
import { dayKey } from "../core/srs";
import { getMeta, setMeta } from "../db/db";

const NAV = [
  { to: "/", label: "Accueil", icon: Home, end: true },
  { to: "/apprendre", label: "Apprendre", icon: GraduationCap },
  { to: "/films", label: "Films", icon: Clapperboard },
  { to: "/vocabulaire", label: "Vocabulaire", icon: BookMarked },
  { to: "/progres", label: "Progrès", icon: BarChart3 },
];

interface Toast {
  id: number;
  text: string;
  icon?: string;
}

export function Layout() {
  const progress = useProgress();
  const queue = useQueue();
  const settings = useSettings();
  const online = useOnline();
  const loc = useLocation();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);

  useEffect(() => {
    const off = onAppEvent((e) => {
        const id = Date.now() + Math.random();
        const t: Toast =
          e.type === "xp"
            ? { id, text: `+${e.amount} XP`, icon: "✨" }
            : e.type === "badge"
              ? { id, text: `Badge débloqué : ${e.badge.title}`, icon: e.badge.icon }
              : { id, text: e.text };
        if (e.type === "xp" && e.amount < 10) return; // reste discret
        setToasts((ts) => [...ts.slice(-2), t]);
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), e.type === "badge" ? 4000 : 1600);
    });
    return off;
  }, []);

  // Indicateur visuel + notification quand des révisions sont dues.
  const due = queue.dueToday;
  useEffect(() => {
    document.title = due > 0 ? `(${due}) Parla — Italien` : "Parla — Italien";
    const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (due > 0) nav.setAppBadge?.(due).catch(() => {});
    else nav.clearAppBadge?.().catch(() => {});
    if (!settings.notifications || due === 0 || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    (async () => {
      const key = dayKey();
      if ((await getMeta("lastNotified", "")) === key) return;
      await setMeta("lastNotified", key);
      const body = `${due} mot${due > 1 ? "s" : ""} à réviser aujourd'hui (≈ ${queue.estimatedMinutes} min).`;
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) reg.showNotification("Parla — c'est l'heure de réviser", { body, icon: "/icon.svg", tag: "reviews" });
      else new Notification("Parla — c'est l'heure de réviser", { body, icon: "/icon.svg" });
    })();
  }, [due, settings.notifications, queue.estimatedMinutes]);

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Parla, accueil">
          <span className="brand-mark">P</span>
          <span>Parla</span>
        </Link>
        <div className="spacer" />
        {!online && (
          <span className="chip" title="Hors ligne : vos données restent enregistrées sur l'appareil">
            <WifiOff size={14} /> <span className="hide-mobile">Hors ligne</span>
          </span>
        )}
        <Link to="/progres" className="chip flame" title="Série de jours consécutifs">
          <Flame size={15} /> {progress.streak.current}
        </Link>
        <Link to="/progres" className="chip gold" title={`${progress.totalXp} XP au total`}>
          Niv. {progress.level}
        </Link>
        <Link to="/reglages" className="icon-btn ghost" aria-label="Réglages et compte">
          <Cog size={20} />
        </Link>
      </header>

      <main>
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navigation principale">
        <ul>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>
                <Icon size={22} strokeWidth={2} />
                <span>{label}</span>
                {to === "/apprendre" && due > 0 && <span className="nav-badge">{due > 99 ? "99+" : due}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.icon && <span className="big">{t.icon}</span>}
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
