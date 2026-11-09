import { useEffect, useState, type ReactNode } from "react";
import { Volume2, Loader2, AlertTriangle, Info } from "lucide-react";
import { speak, wordAudioUrl } from "../speech/tts";
import type { WordStatus } from "../core/types";

export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label}>
        <div className="sheet-handle" />
        {children}
      </div>
    </>
  );
}

export function SpeakButton({
  text,
  wordId,
  rate,
  size = "md",
  label = "Écouter",
}: {
  text: string;
  wordId?: string;
  rate?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const play = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    setErr(null);
    try {
      await speak(text, { rate, fallbackUrl: wordId ? wordAudioUrl(wordId) : undefined });
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button className={`icon-btn ${size === "sm" ? "sm" : ""}`} onClick={play} aria-label={label} title={err ?? label}>
      {busy ? <Loader2 size={18} className="spin" /> : <Volume2 size={size === "sm" ? 16 : 19} color={err ? "var(--bad)" : undefined} />}
    </button>
  );
}

export function StatusBadge({ status }: { status: WordStatus }) {
  const label = { unknown: "Inconnu", learning: "En apprentissage", known: "Connu" }[status];
  return <span className={`badge ${status}`}>{label}</span>;
}

export const STATUS_COLOR: Record<WordStatus, string> = { unknown: "var(--unknown)", learning: "var(--learning)", known: "var(--known)" };

export function Progress({ value, tone }: { value: number; tone?: "accent" | "gold" }) {
  return (
    <div className={`progress ${tone ?? ""}`} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Ring({ value, size = 64, stroke = 7, color = "var(--brand)", children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontWeight: 700, fontSize: size / 4.2 }}>{children}</div>
    </div>
  );
}

export function Notice({ tone = "warn", children }: { tone?: "warn" | "info" | "error"; children: ReactNode }) {
  return (
    <div className={`notice ${tone === "warn" ? "" : tone}`} role={tone === "error" ? "alert" : "note"}>
      {tone === "info" ? <Info size={18} /> : <AlertTriangle size={18} />}
      <div>{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="row between top" style={{ margin: "6px 0 18px" }}>
      <div className="stack sm" style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
