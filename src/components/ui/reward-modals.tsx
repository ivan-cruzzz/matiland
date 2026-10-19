import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePlayer } from "../../store/PlayerContext";
import { playSound } from "../../lib/sound";
import { dailyReward, spinWheel, WHEEL_SEGMENTS } from "../../lib/economy";

/* ---------- Сундук ---------- */

export function ChestModal() {
  const { player, openChest, meta } = usePlayer();
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    setOpened(false);
  }, [player?.pendingChest]);

  if (!player?.pendingChest) return null;
  const big = player.pendingChest === "big";

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-label="Сундук с наградой"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 text-center shadow-pop"
      >
        <p className="mb-4 text-2xl font-black tracking-tight">{big ? "Большой сундук!" : "Сундук!"}</p>
        <motion.svg
          viewBox="0 0 120 100"
          className="mx-auto h-32 w-40"
          animate={opened ? { rotate: [0, -2, 2, 0] } : { y: [0, -4, 0] }}
          transition={opened ? { duration: 0.4 } : { repeat: Infinity, duration: 1.6 }}
          aria-hidden="true"
        >
          <rect x={16} y={44} width={88} height={48} rx={8} fill="#C98A4B" stroke="#3D3A37" strokeWidth={3.5} />
          {opened ? (
            <g>
              <rect x={16} y={12} width={88} height={34} rx={8} fill="#B0763B" stroke="#3D3A37" strokeWidth={3.5} />
              {[36, 52, 68, 84].map((x, i) => (
                <g key={x}>
                  <circle
                    cx={x}
                    cy={26}
                    r={7}
                    fill={["#FFD45E", "#C9B8F0", "#A8E6CF", "#FFB3AB"][i]}
                    stroke="#3D3A37"
                    strokeWidth={2}
                  />
                  <path d={`M${x} 12 L${x - 3} 20 L${x} 18 L${x + 3} 20 Z`} fill="#FFF6D9" stroke="#3D3A37" strokeWidth={1.5} />
                </g>
              ))}
            </g>
          ) : (
            <rect x={16} y={24} width={88} height={30} rx={8} fill="#B0763B" stroke="#3D3A37" strokeWidth={3.5} />
          )}
          <rect x={52} y={40} width={16} height={20} rx={4} fill="#FFD45E" stroke="#3D3A37" strokeWidth={3} />
        </motion.svg>
        <button
          type="button"
          onClick={() => {
            if (opened) return;
            setOpened(true);
            playSound("chest", meta.sound);
            setTimeout(() => openChest(), 650);
          }}
          disabled={opened}
          className="mt-6 min-h-12 w-full rounded-2xl bg-ink px-6 py-3 font-bold text-cream transition-colors hover:bg-ink/85 disabled:opacity-60"
        >
          {opened ? "Открываем..." : "Открыть"}
        </button>
      </motion.div>
    </div>
  );
}

/* ---------- Колесо удачи ---------- */

export function WheelModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { player, applyWheel, meta } = usePlayer();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!open || !player) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const used = player.wheelLast === today;

  const segCount = WHEEL_SEGMENTS.length;
  const segArc = 360 / segCount;

  const spin = () => {
    if (spinning || used) return;
    const index = spinWheel();
    const target = 360 * 5 + (360 - index * segArc - segArc / 2);
    setSpinning(true);
    setResult(null);
    const tickInterval = setInterval(() => playSound("tick", meta.sound), 220);
    setAngle(target);
    setTimeout(() => {
      clearInterval(tickInterval);
      applyWheel(index);
      const seg = WHEEL_SEGMENTS[index];
      setResult(
        seg.type === "chest"
          ? "Выпал сундук — он ждёт тебя!"
          : seg.type === "gems"
            ? `Самоцвет ×${seg.value}!`
            : `Монеты ×${seg.value}!`,
      );
      setSpinning(false);
      playSound("coin", meta.sound);
    }, 3400);
  };

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-label="Колесо удачи"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 text-center shadow-pop"
      >
        <p className="mb-1 text-2xl font-black tracking-tight">Колесо удачи</p>
        <p className="mb-4 text-sm text-ink-soft">Один спин каждый день</p>

        <div className="relative mx-auto h-56 w-56">
          <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
            <g
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: "100px 100px",
                transition: "transform 3.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              {WHEEL_SEGMENTS.map((seg, i) => {
                const a0 = (i * segArc * Math.PI) / 180;
                const a1 = ((i + 1) * segArc * Math.PI) / 180;
                const x0 = 100 + 92 * Math.cos(a0);
                const y0 = 100 + 92 * Math.sin(a0);
                const x1 = 100 + 92 * Math.cos(a1);
                const y1 = 100 + 92 * Math.sin(a1);
                const mid = ((i + 0.5) * segArc * Math.PI) / 180;
                return (
                  <g key={i}>
                    <path
                      d={`M100 100 L${x0.toFixed(1)} ${y0.toFixed(1)} A92 92 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`}
                      fill={seg.color}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                    <text
                      x={100 + 60 * Math.cos(mid)}
                      y={100 + 60 * Math.sin(mid) + 5}
                      textAnchor="middle"
                      fontSize={15}
                      fontWeight="bold"
                      fill="#3D3A37"
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
            </g>
            <circle cx={100} cy={100} r={16} fill="#FFFFFF" stroke="#3D3A37" strokeWidth={3} />
          </svg>
          <div className="absolute -top-1 left-1/2 h-5 w-5 -translate-x-1/2" aria-hidden="true">
            <svg viewBox="0 0 20 20" className="h-full w-full">
              <path d="M10 20 L3 4 L17 4 Z" fill="#FF948A" stroke="#3D3A37" strokeWidth={1.5} />
            </svg>
          </div>
        </div>

        {result && <p className="mt-3 text-lg font-black text-lavender-deep">{result}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-2xl border-2 border-line-strong px-4 py-3 font-bold transition-colors hover:bg-cream"
          >
            Закрыть
          </button>
          <button
            type="button"
            onClick={spin}
            disabled={spinning || used}
            className="min-h-12 flex-1 rounded-2xl bg-ink px-4 py-3 font-bold text-cream transition-colors hover:bg-ink/85 disabled:opacity-50"
          >
            {used ? "Завтра" : spinning ? "Крутится..." : "Крутить!"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Ежедневный вход ---------- */

export function DailyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { player, markDailySeen, meta } = usePlayer();
  if (!open || !player) return null;
  const day = ((player.streakDays - 1) % 7) + 1;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-label="Ежедневный вход"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-pop"
      >
        <p className="text-center text-2xl font-black tracking-tight">
          Ты здесь день {player.streakDays} подряд!
        </p>
        <p className="mb-4 text-center text-sm text-ink-soft">Забирай подарок</p>
        <div className="grid grid-cols-7 gap-1.5" role="list">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => {
            const r = dailyReward(d);
            const active = d === day;
            const passed = d < day;
            return (
              <div
                key={d}
                role="listitem"
                aria-label={`День ${d}: ${r.coins ? `${r.coins} монет` : `${r.gems} самоцвет`}`}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-1 py-2 text-center ${
                  active
                    ? "border-lavender-deep bg-lavender-soft"
                    : passed
                      ? "border-mint bg-mint-soft opacity-70"
                      : "border-line bg-cream"
                }`}
              >
                <span className="text-[10px] font-bold text-ink-soft">День {d}</span>
                <span className="font-mono text-xs font-black">+{r.coins ?? r.gems}</span>
                <span className="text-[10px] font-semibold text-ink-mute">
                  {r.gems ? "самоцв." : "монет"}
                </span>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            playSound("coin", meta.sound);
            markDailySeen();
            onClose();
          }}
          className="mt-5 min-h-12 w-full rounded-2xl bg-ink px-6 py-3 font-bold text-cream transition-colors hover:bg-ink/85"
        >
          Ура, забираю!
        </button>
      </motion.div>
    </div>
  );
}
