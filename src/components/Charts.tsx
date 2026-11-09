/** Petits graphiques SVG sans dépendance, adaptés au thème clair/sombre. */
import { useState } from "react";

export function BarChart({
  data,
  height = 140,
  color = "var(--brand)",
  format = (v: number) => String(v),
}: {
  data: Array<{ label: string; value: number; highlight?: boolean }>;
  height?: number;
  color?: string;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 320;
  const H = height;
  const pad = 18;
  const bw = (W - 8) / data.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Histogramme">
      {[0.5, 1].map((f) => (
        <line key={f} className="grid-line" x1={0} x2={W} y1={H - pad - (H - pad - 14) * f} y2={H - pad - (H - pad - 14) * f} />
      ))}
      {data.map((d, i) => {
        const h = ((H - pad - 14) * d.value) / max;
        const x = 4 + i * bw + bw * 0.15;
        return (
          <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
            <rect x={4 + i * bw} y={0} width={bw} height={H} fill="transparent" />
            <rect x={x} y={H - pad - h} width={bw * 0.7} height={Math.max(h, d.value ? 2 : 0)} rx={4} fill={color} opacity={d.highlight || hover === i ? 1 : 0.55} />
            {(i % Math.ceil(data.length / 7) === 0 || i === data.length - 1) && (
              <text x={x + bw * 0.35} y={H - 4} textAnchor="middle">
                {d.label}
              </text>
            )}
            {hover === i && (
              <text x={Math.min(W - 20, Math.max(20, x + bw * 0.35))} y={Math.max(10, H - pad - h - 4)} textAnchor="middle" style={{ fill: "var(--ink)", fontWeight: 700 }}>
                {format(d.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({
  series,
  labels,
  height = 160,
}: {
  series: Array<{ name: string; color: string; values: number[] }>;
  labels: string[];
  height?: number;
}) {
  const W = 320;
  const H = height;
  const padB = 18;
  const padT = 10;
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const x = (i: number) => (n <= 1 ? W / 2 : 6 + (i * (W - 12)) / (n - 1));
  const y = (v: number) => H - padB - ((H - padB - padT) * v) / max;
  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Courbe d'évolution">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line className="grid-line" x1={0} x2={W} y1={y(max * f)} y2={y(max * f)} />
            <text x={2} y={y(max * f) - 3}>
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        {series.map((s) => {
          const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
          const area = `${d} L${x(n - 1)},${H - padB} L${x(0)},${H - padB} Z`;
          return (
            <g key={s.name}>
              <path d={area} fill={s.color} opacity={0.1} />
              <path d={d} fill="none" stroke={s.color} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {labels.map((l, i) =>
          i % Math.ceil(n / 6) === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - 4} textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
      </svg>
      <div className="row wrap" style={{ gap: 14, marginTop: 4 }}>
        {series.map((s) => (
          <span key={s.name} className="subtle row" style={{ gap: 6 }}>
            <span className="dot" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StackedBars({
  rows,
}: {
  rows: Array<{ label: string; parts: Array<{ value: number; color: string; name: string }>; total: number }>;
}) {
  return (
    <div className="stack sm">
      {rows.map((r) => (
        <div key={r.label} className="row" style={{ gap: 10 }}>
          <span className="badge level" style={{ width: 34, justifyContent: "center" }}>
            {r.label}
          </span>
          <div style={{ flex: 1, height: 12, borderRadius: 6, background: "var(--surface-2)", display: "flex", overflow: "hidden" }}>
            {r.parts.map((p) => (
              <span key={p.name} title={`${p.name} : ${p.value}`} style={{ width: `${r.total ? (p.value / r.total) * 100 : 0}%`, background: p.color, transition: "width .6s" }} />
            ))}
          </div>
          <span className="subtle" style={{ width: 70, textAlign: "right" }}>
            {r.parts[0].value}/{r.total}
          </span>
        </div>
      ))}
    </div>
  );
}
