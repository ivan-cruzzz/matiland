import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
  dashed?: boolean;
}

export interface ChartDatum {
  label: string;
  axisLabel?: string;
  values: Record<string, number>;
}

interface LineChartProps {
  data: ChartDatum[];
  series: ChartSeries[];
  label: string;
  unit?: string;
  height?: number;
}

const PALETTE = ["var(--color-lavender-deep)", "var(--color-mint-deep)"];
const PAD_X = 10;
const PAD_TOP = 16;

const compact = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K` : String(v);

/** Чистая сетка: минимальный шаг из ряда 1/2/2.5/5, не более 4 линий. */
function niceScale(min: number, max: number) {
  const lo = Math.min(0, min);
  const hi = Math.max(max, lo + 1);
  const span = hi - lo;
  const magnitude = 10 ** Math.floor(Math.log10(span / 4));
  for (const factor of [1, 2, 2.5, 5, 10]) {
    const step = factor * magnitude;
    const bottom = Math.floor(lo / step) * step;
    const top = Math.ceil(hi / step) * step;
    if ((top - bottom) / step <= 4 + 1e-9) {
      const ticks: number[] = [];
      for (let v = bottom; v <= top + step / 2; v += step) {
        ticks.push(Number(v.toPrecision(12)));
      }
      return { min: bottom, max: top, ticks };
    }
  }
  return { min: lo, max: hi, ticks: [lo, hi] };
}

/** Монотонная кубическая кривая — линия не выпрыгивает за данные. */
function monotonePath(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    slopes.push(dx === 0 ? 0 : (pts[i + 1][1] - pts[i][1]) / dx);
  }
  const tangents: number[] = pts.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    if (slopes[i - 1] * slopes[i] <= 0) return 0;
    return (slopes[i - 1] + slopes[i]) / 2;
  });
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const half = (pts[i + 1][0] - pts[i][0]) / 3;
    const c1x = pts[i][0] + half;
    const c1y = pts[i][1] + tangents[i] * half;
    const c2x = pts[i + 1][0] - half;
    const c2y = pts[i + 1][1] - tangents[i + 1] * half;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

/**
 * Минималистичный график из miniDESIGN (упрощённый порт LineChart):
 * сетка ≤4 линий, draw-in, перекрестие с тултипом, легенда-переключатели,
 * скрытая таблица для скринридеров.
 */
export default function LineChart({
  data,
  series,
  label,
  unit = "",
  height = 200,
}: LineChartProps) {
  const wrapRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { once: true, amount: 0.3 });
  const [width, setWidth] = useState(0);
  const [hidden, setHidden] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const read = () => setWidth(el.clientWidth);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visible = series.filter((s) => !hidden.includes(s.key));
  const n = data.length;
  const last = n - 1;
  const plotW = Math.max(0, width);

  const scale = (() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of visible) {
      for (const d of data) {
        const v = d.values[s.key] ?? 0;
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    return Number.isFinite(lo) ? niceScale(lo, hi) : niceScale(0, 1);
  })();

  const xAt = (i: number) =>
    last <= 0 ? plotW / 2 : PAD_X + (i * (plotW - 2 * PAD_X)) / last;
  const yAt = (v: number) => {
    const span = scale.max - scale.min || 1;
    return PAD_TOP + (1 - (v - scale.min) / span) * (height - PAD_TOP - 4);
  };

  const pathFor = (key: string) => {
    const pts = data.map((d, i) => [xAt(i), yAt(d.values[key] ?? 0)] as [number, number]);
    const line = monotonePath(pts);
    const area = line
      ? `${line} L${xAt(last).toFixed(1)},${height - 1} L${xAt(0).toFixed(1)},${height - 1} Z`
      : "";
    return { line, area };
  };

  const activeIdx = active === null ? null : Math.min(active, last);
  const reading = activeIdx === null ? null : (data[activeIdx] ?? null);

  const idxFromEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || last < 1) return last;
    return Math.min(
      last,
      Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * last)),
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      setActive(null);
      return;
    }
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      Home: -Infinity,
      End: Infinity,
    };
    const step = steps[e.key];
    if (step === undefined || n === 0) return;
    e.preventDefault();
    setActive((cur) => {
      if (step === -Infinity) return 0;
      if (step === Infinity) return last;
      return Math.min(last, Math.max(0, (cur ?? last) + step));
    });
  };

  const valueText = reading
    ? `${reading.label}: ${visible
        .map((s) => `${s.label} ${reading.values[s.key] ?? 0}${unit}`)
        .join(", ")}`
    : n === 0
      ? "Пока нет данных"
      : `${visible.length} из ${series.length} серий показано`;
  const summary =
    n === 0
      ? `${label}. Пока нет данных.`
      : `${label}. ${data[0].label} — ${data[last].label}. Последнее значение: ${visible
          .map((s) => `${s.label} ${data[last].values[s.key] ?? 0}${unit}`)
          .join(", ")}.`;

  const tipLeft =
    activeIdx === null
      ? 0
      : Math.min(Math.max(xAt(activeIdx), 76), Math.max(76, plotW - 76));

  return (
    <figure
      ref={wrapRef}
      aria-label={label}
      className="rounded-3xl border border-line bg-surface p-5 shadow-card"
    >
      {series.length > 1 && (
        <div role="group" aria-label={`Серии графика «${label}»`} className="mb-3 flex flex-wrap gap-2">
          {series.map((s, i) => {
            const off = hidden.includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={!off}
                onClick={() =>
                  setHidden((h) => (off ? h.filter((k) => k !== s.key) : [...h, s.key]))
                }
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                  off ? "border-line text-ink-mute" : "border-line-strong text-ink"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: off ? "var(--color-line-strong)" : (s.color ?? PALETTE[i % PALETTE.length]) }}
                  aria-hidden="true"
                />
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      <div
        ref={plotRef}
        className="relative select-none"
        style={{ height: height + 22 }}
        role="slider"
        tabIndex={n === 0 ? -1 : 0}
        aria-label={`${label}. Стрелки — перемещение по дням, Esc — сброс.`}
        aria-orientation="horizontal"
        aria-valuemin={1}
        aria-valuemax={Math.max(1, n)}
        aria-valuenow={(activeIdx ?? Math.max(0, last)) + 1}
        aria-valuetext={valueText}
        onPointerDown={(e) => setActive(idxFromEvent(e))}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons) setActive(idxFromEvent(e));
        }}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <svg width="100%" height={height} aria-hidden="true" className="overflow-visible">
          {scale.ticks.slice(1).map((t) => (
            <line
              key={t}
              x1={0}
              x2="100%"
              y1={yAt(t)}
              y2={yAt(t)}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
          ))}
          <line
            x1={0}
            x2="100%"
            y1={height - 0.5}
            y2={height - 0.5}
            stroke="var(--color-line-strong)"
            strokeWidth={1}
          />
          {scale.ticks.map((t) => (
            <text
              key={t}
              x={2}
              y={yAt(t) - 4}
              fontSize={10}
              fill="var(--color-ink-mute)"
              fontFamily="var(--font-mono)"
            >
              {compact(t)}
            </text>
          ))}

          {visible.map((s, i) => {
            const color = s.color ?? PALETTE[i % PALETTE.length];
            const { line, area } = pathFor(s.key);
            const canDraw = !s.dashed && line !== "";
            return (
              <g key={s.key}>
                {i === 0 && area && <path d={area} fill={color} opacity={0.12} />}
                <motion.path
                  d={line}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={s.dashed ? "6 5" : undefined}
                  initial={canDraw && inView ? { pathLength: 0 } : false}
                  animate={canDraw && inView ? { pathLength: 1 } : undefined}
                  transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
                />
              </g>
            );
          })}

          {activeIdx !== null && (
            <line
              x1={xAt(activeIdx)}
              x2={xAt(activeIdx)}
              y1={PAD_TOP - 6}
              y2={height}
              stroke="var(--color-line-strong)"
              strokeWidth={1}
            />
          )}
          {visible.map((s, i) => (
            <circle
              key={s.key}
              cx={xAt(activeIdx ?? last)}
              cy={yAt((reading ?? data[last])?.values[s.key] ?? 0)}
              r={4}
              fill={s.color ?? PALETTE[i % PALETTE.length]}
              stroke="#FFFFFF"
              strokeWidth={2}
              opacity={activeIdx !== null ? 1 : 0}
            />
          ))}

          {data.map((d, i) =>
            d.axisLabel ? (
              <text
                key={d.label}
                x={xAt(i)}
                y={height + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-ink-mute)"
                fontFamily="var(--font-mono)"
              >
                {d.axisLabel}
              </text>
            ) : null,
          )}
        </svg>

        {reading && visible.length > 0 && (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-xl border border-[#333333] bg-[#1F2023] px-3 py-2 text-xs shadow-pop"
            style={{ left: tipLeft }}
            aria-hidden="true"
          >
            <p className="mb-1 font-bold text-white">{reading.label}</p>
            {visible.map((s, i) => (
              <p key={s.key} className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: s.color ?? PALETTE[i % PALETTE.length] }}
                />
                <span className="text-gray-400">{s.label}</span>
                <span className="ml-auto font-mono font-bold text-white">
                  {reading.values[s.key] ?? 0}
                  {unit}
                </span>
              </p>
            ))}
          </div>
        )}

        {(n === 0 || visible.length === 0) && (
          <p className="absolute inset-0 grid place-items-center text-sm text-ink-mute">
            {n === 0 ? "Пока нет данных — сыграйте раунд!" : "Выберите хотя бы одну серию"}
          </p>
        )}
      </div>

      <p className="sr-only">{summary}</p>
      {n > 0 && (
        <table className="sr-only">
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">День</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <th scope="row">{d.label}</th>
                {series.map((s) => (
                  <td key={s.key}>
                    {d.values[s.key] ?? 0}
                    {unit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}
