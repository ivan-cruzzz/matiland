import type { Task } from "../../lib/tasks";

function ClockArt({ h, m }: { h: number; m: number }) {
  const cx = 110, cy = 110, r = 92;
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = m * 6;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const hx = cx + 46 * Math.sin(rad(hourAngle));
  const hy = cy - 46 * Math.cos(rad(hourAngle));
  const mx = cx + 70 * Math.sin(rad(minAngle));
  const my = cy - 70 * Math.cos(rad(minAngle));
  return (
    <svg viewBox="0 0 220 220" width={120} height={120} aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="#FFFFFF" stroke="#3D3A37" strokeWidth={5} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = rad(i * 30);
        const x1 = cx + (r - 12) * Math.sin(a);
        const y1 = cy - (r - 12) * Math.cos(a);
        const x2 = cx + (r - 4) * Math.sin(a);
        const y2 = cy - (r - 4) * Math.cos(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3D3A37" strokeWidth={i % 3 === 0 ? 4 : 2} />;
      })}
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#3D3A37" strokeWidth={7} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke="#6D4FC2" strokeWidth={5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#3D3A37" />
    </svg>
  );
}

function FractionArt({ n, d }: { n: number; d: number }) {
  const cx = 110, cy = 110, r = 92;
  const slices: React.ReactElement[] = [];
  for (let i = 0; i < d; i++) {
    const a1 = (i / d) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    slices.push(
      <path
        key={i}
        d={`M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`}
        fill={i < n ? "#FFD45E" : "#FFF6D9"}
        stroke="#3D3A37"
        strokeWidth={2.5}
      />,
    );
  }
  return (
    <svg viewBox="0 0 220 220" width={120} height={120} aria-hidden="true">
      {slices}
      <circle cx={cx} cy={cy} r={14} fill="#FFB3AB" stroke="#3D3A37" strokeWidth={2} />
    </svg>
  );
}

interface TaskViewProps {
  task: Task;
  picked: string | null;
  reveal: boolean;
  onPick: (value: string) => void;
}

/** Карточка задачи: рисунок-подсказка (часы/доля), текст и крупные кнопки ответов. */
export default function TaskView({ task, picked, reveal, onPick }: TaskViewProps) {
  const isLong = task.prompt.length > 18;
  const fourCols = task.options.length > 3;
  const isPickedCorrect = picked !== null && picked === task.answer;

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
      <div className={task.art ? "flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8" : ""}>
        {task.art?.type === "clock" && <ClockArt h={task.art.h} m={task.art.m} />}
        {task.art?.type === "fraction" && <FractionArt n={task.art.n} d={task.art.d} />}
        <p
          aria-live="polite"
          className={
            isLong
              ? "max-w-md text-center text-xl font-bold leading-snug"
              : "text-center font-mono text-5xl font-black tracking-tight sm:text-6xl"
          }
        >
          {task.prompt}
        </p>
      </div>

      <div className={`mt-8 grid gap-3 ${fourCols ? "grid-cols-4" : "grid-cols-3"}`}>
        {task.options.map((option) => {
          const isPicked = picked === option;
          const showAsCorrect = reveal && option === task.answer;
          const showAsWrong = reveal && isPicked && !isPickedCorrect;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onPick(option)}
              disabled={reveal}
              aria-label={`Ответ ${option}`}
              className={`flex h-20 items-center justify-center rounded-2xl border-2 font-black transition-all duration-200 sm:h-24 ${
                fourCols ? "text-2xl sm:text-3xl" : "font-mono text-3xl sm:text-4xl"
              } ${
                showAsCorrect
                  ? "border-mint-deep bg-mint-soft text-mint-deep"
                  : showAsWrong
                    ? "border-coral-deep bg-coral-soft text-coral-deep"
                    : reveal
                      ? "border-line bg-surface text-ink-mute"
                      : "border-line-strong bg-surface text-ink hover:-translate-y-0.5 hover:border-lavender hover:bg-lavender-soft active:translate-y-0"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
