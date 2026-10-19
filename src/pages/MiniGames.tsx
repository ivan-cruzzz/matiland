import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Cloud, Gamepad2, Grid3X3, LayoutGrid } from "lucide-react";
import { usePlayer } from "../store/PlayerContext";
import { playSound } from "../lib/sound";
import { CoinIcon } from "../components/ui/coin-badge";
import { FlowButton } from "../components/ui/flow-button";
import { generateTask, type Task, type Topic } from "../lib/tasks";

type GameId = "falling" | "pairs" | "lotto";

const ARITHMETIC: Topic[] = ["add", "sub", "mul", "div"];

function taskFor(): Task {
  return generateTask(ARITHMETIC[Math.floor(Math.random() * ARITHMETIC.length)], "easy");
}

function distractorFor(task: Task): string {
  const wrong = task.options.filter((o) => o !== task.answer);
  return wrong.length > 0 ? wrong[Math.floor(Math.random() * wrong.length)] : String(Number(task.answer) + 1);
}

export default function MiniGames() {
  const [active, setActive] = useState<GameId | null>(null);
  const [runId, setRunId] = useState(0);
  const again = () => setRunId((r) => r + 1);
  const exit = () => setActive(null);

  const games: { id: GameId; name: string; desc: string; Icon: typeof Cloud }[] = [
    { id: "falling", name: "Ловим ответы", desc: "Кликай облачка с верными ответами. Три промаха — конец!", Icon: Cloud },
    { id: "pairs", name: "Парочки", desc: "Найди пары «пример — ответ». Меньше ходов — больше монет!", Icon: LayoutGrid },
    { id: "lotto", name: "Математическое лото", desc: "Закрывай клетки карточки верными ответами. Линии — банго!", Icon: Grid3X3 },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-3xl font-black tracking-tight">Мини-игры</h1>
      <p className="mb-5 text-sm text-ink-soft">Отдохни от раундов и заработай монеты по-другому.</p>

      {active === null ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {games.map(({ id, name, desc, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className="flex min-h-44 flex-col items-start rounded-3xl border border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-pop"
            >
              <span
                className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-lavender-soft text-lavender-deep"
                aria-hidden="true"
              >
                <Icon size={22} strokeWidth={2.5} />
              </span>
              <span className="text-lg font-black tracking-tight">{name}</span>
              <span className="mt-1 text-xs font-semibold text-ink-soft">{desc}</span>
              <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-bold text-lavender-deep">
                <Gamepad2 size={16} aria-hidden="true" /> Играть
              </span>
            </button>
          ))}
        </div>
      ) : active === "falling" ? (
        <FallingGame key={runId} onExit={exit} onAgain={again} />
      ) : active === "pairs" ? (
        <PairsGame key={runId} onExit={exit} onAgain={again} />
      ) : (
        <LottoGame key={runId} onExit={exit} onAgain={again} />
      )}
    </div>
  );
}

/* ---------- Общий экран результата ---------- */

function GameOver({
  title,
  coins,
  onAgain,
  onExit,
}: {
  title: string;
  coins: number;
  onAgain: () => void;
  onExit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-pop"
    >
      <h2 className="mb-2 text-2xl font-black">{title}</h2>
      <p className="mb-6 flex items-center justify-center gap-1.5 text-lg font-black text-sunny-deep">
        Награда: <CoinIcon size={20} /> +{coins}
      </p>
      <div className="flex flex-col items-center gap-2">
        <FlowButton text="Ещё раз" onClick={onAgain} />
        <button type="button" onClick={onExit} className="text-sm font-bold text-ink-soft hover:underline">
          К мини-играм
        </button>
      </div>
    </motion.div>
  );
}

function useFinish() {
  const { finishGame, meta } = usePlayer();
  return (payload: {
    correct: number;
    solved: number;
    coins: number;
    seconds: number;
    kinds: Record<string, { solved: number; correct: number }>;
  }) => {
    finishGame({
      kindStats: payload.kinds,
      solved: payload.solved,
      correct: payload.correct,
      streak: 0,
      perfect: false,
      coins: payload.coins,
      gems: 0,
      xp: payload.correct * 2,
      seconds: payload.seconds,
      wrongTasks: [],
      chest: payload.coins >= 40 && Math.random() < 0.3 ? "small" : null,
      seasonXp: payload.correct * 2,
    });
    playSound("fanfare", meta.sound);
  };
}

/* ---------- 1. Ловим ответы ---------- */

interface CloudItem {
  id: number;
  x: number;
  text: string;
  correct: boolean;
}

function FallingGame({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const { meta } = usePlayer();
  const finish = useFinish();
  const [task, setTask] = useState<Task>(() => taskFor());
  const [clouds, setClouds] = useState<CloudItem[]>([]);
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(Date.now());
  const cloudId = useRef(0);
  const kinds = useRef<Record<string, { solved: number; correct: number }>>({});
  const scoreRef = useRef(0);
  const missesRef = useRef(0);
  const doneRef = useRef(false);

  const countKind = (t: Task, ok: boolean) => {
    const st = kinds.current[t.kind] ?? { solved: 0, correct: 0 };
    kinds.current[t.kind] = { solved: st.solved + 1, correct: st.correct + (ok ? 1 : 0) };
  };

  useEffect(() => {
    if (done) return;
    const spawn = setInterval(() => {
      cloudId.current += 1;
      const correct = Math.random() < 0.45;
      setClouds((cs) => [
        ...cs.slice(-5),
        {
          id: cloudId.current,
          x: 12 + Math.random() * 72,
          text: correct ? task.answer : distractorFor(task),
          correct,
        },
      ]);
    }, 1350);
    return () => clearInterval(spawn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, task]);

  useEffect(() => {
    if (misses >= 3 && !doneRef.current) {
      doneRef.current = true;
      const coins = scoreRef.current > 0 ? Math.max(10, scoreRef.current * 3) : 0;
      finish({
        correct: scoreRef.current,
        solved: scoreRef.current + missesRef.current,
        coins,
        seconds: Math.round((Date.now() - started.current) / 1000),
        kinds: kinds.current,
      });
      setDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [misses]);

  if (done) {
    return (
      <GameOver
        title={`Поймано: ${score}`}
        coins={scoreRef.current > 0 ? Math.max(10, scoreRef.current * 3) : 0}
        onAgain={onAgain}
        onExit={onExit}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={onExit} className="text-sm font-bold text-ink-soft hover:underline">
          ← К мини-играм
        </button>
        <div className="flex items-center gap-3 text-sm font-bold">
          <span className="rounded-full border border-sunny bg-sunny-soft px-3 py-1.5 font-mono text-sunny-deep">
            {score}
          </span>
          <span className="flex gap-1" aria-label={`Промахи: ${misses} из 3`}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full ${i < 3 - misses ? "bg-coral-deep" : "bg-coral opacity-30"}`}
              />
            ))}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
        <p className="mb-1 text-center text-xs font-bold uppercase tracking-widest text-ink-mute">
          Лови облачко с ответом
        </p>
        <p className="mb-4 text-center font-mono text-3xl font-black">{task.prompt}</p>

        <div className="relative h-80 overflow-hidden rounded-2xl bg-sky-soft">
          {clouds.map((c) => (
            <motion.button
              key={c.id}
              type="button"
              initial={{ y: -50, x: `${c.x}%` }}
              animate={{ y: 340 }}
              transition={{ duration: 4.2, ease: "linear" }}
              onAnimationComplete={() => {
                setClouds((cs) => cs.filter((x) => x.id !== c.id));
                if (c.correct && !doneRef.current) {
                  missesRef.current += 1;
                  setMisses((m) => m + 1);
                  countKind(task, false);
                  playSound("wrong", meta.sound);
                }
              }}
              onClick={() => {
                if (doneRef.current) return;
                if (c.correct) {
                  scoreRef.current += 1;
                  setScore((s) => s + 1);
                  countKind(task, true);
                  playSound("correct", meta.sound);
                  setClouds([]);
                  setTask(taskFor());
                } else {
                  missesRef.current += 1;
                  setMisses((m) => m + 1);
                  countKind(task, false);
                  playSound("wrong", meta.sound);
                  setClouds((cs) => cs.filter((x) => x.id !== c.id));
                }
              }}
              className="absolute top-0 grid h-14 w-20 -translate-x-1/2 cursor-pointer place-items-center rounded-full bg-white font-mono text-xl font-black text-ink shadow-pop"
              aria-label={`Облачко ${c.text}`}
            >
              {c.text}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. Парочки ---------- */

interface PairCard {
  id: number;
  pairId: number;
  kind: "q" | "a";
  label: string;
}

function PairsGame({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const { meta } = usePlayer();
  const finish = useFinish();
  const started = useRef(Date.now());
  const [cards] = useState<PairCard[]>(() => {
    const tasks = Array.from({ length: 6 }, () => taskFor());
    const deck: PairCard[] = [];
    tasks.forEach((t, i) => {
      deck.push({ id: i * 2, pairId: i, kind: "q", label: t.prompt.replace(" = ?", "") });
      deck.push({ id: i * 2 + 1, pairId: i, kind: "a", label: t.answer });
    });
    return [...deck].sort(() => Math.random() - 0.5);
  });
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const awarded = useRef(false);
  const kinds = useRef<Record<string, { solved: number; correct: number }>>({});
  const movesRef = useRef(0);

  useEffect(() => {
    if (matched.length === 12 && !awarded.current) {
      awarded.current = true;
      const coins = Math.max(20, 80 - movesRef.current * 2);
      for (let i = 0; i < 6; i++) {
        const key = ARITHMETIC[i % 4];
        kinds.current[key] = {
          solved: (kinds.current[key]?.solved ?? 0) + 1,
          correct: (kinds.current[key]?.correct ?? 0) + 1,
        };
      }
      finish({
        correct: 6,
        solved: 6,
        coins,
        seconds: Math.round((Date.now() - started.current) / 1000),
        kinds: kinds.current,
      });
      setDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched]);

  const flip = (card: PairCard) => {
    if (flipped.includes(card.id) || matched.includes(card.pairId) || flipped.length === 2) return;
    playSound("click", meta.sound);
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      movesRef.current += 1;
      setMoves((m) => m + 1);
      const a = cards.find((c) => c.id === next[0])!;
      const b = cards.find((c) => c.id === next[1])!;
      if (a.pairId === b.pairId && a.kind !== b.kind) {
        playSound("correct", meta.sound);
        setTimeout(() => {
          setMatched((m) => [...m, a.pairId]);
          setFlipped([]);
        }, 500);
      } else {
        setTimeout(() => setFlipped([]), 850);
      }
    }
  };

  if (done) {
    return (
      <GameOver
        title="Все пары найдены!"
        coins={Math.max(20, 80 - moves * 2)}
        onAgain={onAgain}
        onExit={onExit}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={onExit} className="text-sm font-bold text-ink-soft hover:underline">
          ← К мини-играм
        </button>
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-bold">
          Ходов: <span className="font-mono">{moves}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {cards.map((card) => {
          const isOpen = flipped.includes(card.id) || matched.includes(card.pairId);
          const isMatched = matched.includes(card.pairId);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card)}
              aria-label={isOpen ? card.label : "Закрытая карточка"}
              className={`grid h-20 place-items-center rounded-2xl border-2 px-1 text-center font-mono text-lg font-black transition-all ${
                isMatched
                  ? "border-mint-deep bg-mint-soft text-mint-deep opacity-60"
                  : isOpen
                    ? "border-lavender bg-lavender-soft text-ink"
                    : "border-line-strong bg-surface text-ink hover:border-lavender"
              }`}
            >
              {isOpen ? card.label : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 3. Математическое лото ---------- */

function LottoGame({ onExit, onAgain }: { onExit: () => void; onAgain: () => void }) {
  const { meta } = usePlayer();
  const finish = useFinish();
  const started = useRef(Date.now());

  const board = useMemo(() => {
    const cells: { id: number; text: string }[] = [];
    const answers = new Set<string>();
    let guard = 0;
    while (cells.length < 9 && guard++ < 300) {
      const t = taskFor();
      if (!answers.has(t.answer)) {
        answers.add(t.answer);
        cells.push({ id: cells.length, text: t.answer });
      }
    }
    return cells;
  }, []);

  const [queue] = useState<Task[]>(() => Array.from({ length: 12 }, () => taskFor()));
  const [qIdx, setQIdx] = useState(0);
  const [stamped, setStamped] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const awarded = useRef(false);

  const lines = useMemo(() => {
    const has = (i: number) => stamped.includes(i);
    const L = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    return L.filter((line) => line.every(has)).length;
  }, [stamped]);

  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => {
      setMisses((m) => m + 1);
      setQIdx((i) => i + 1);
    }, 8000);
    return () => clearTimeout(id);
  }, [qIdx, done]);

  useEffect(() => {
    if (done || awarded.current) return;
    if (qIdx >= queue.length || stamped.length === 9) {
      awarded.current = true;
      const coins = Math.max(10, lines * 25 + stamped.length * 2);
      finish({
        correct: stamped.length,
        solved: queue.length,
        coins,
        seconds: Math.round((Date.now() - started.current) / 1000),
        kinds: { add: { solved: queue.length, correct: stamped.length } },
      });
      setDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, stamped]);

  if (done) {
    return (
      <GameOver
        title={`Банго! Линий: ${lines}`}
        coins={Math.max(10, lines * 25 + stamped.length * 2)}
        onAgain={onAgain}
        onExit={onExit}
      />
    );
  }

  const task = queue[Math.min(qIdx, queue.length - 1)];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={onExit} className="text-sm font-bold text-ink-soft hover:underline">
          ← К мини-играм
        </button>
        <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-bold">
          Задача <span className="font-mono">{Math.min(qIdx + 1, queue.length)}</span>/{queue.length}
        </span>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
        <p className="mb-4 text-center font-mono text-3xl font-black">{task.prompt}</p>
        <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
          {board.map((cell) => {
            const isStamped = stamped.includes(cell.id);
            const isAnswer = cell.text === task.answer;
            return (
              <button
                key={cell.id}
                type="button"
                disabled={isStamped}
                onClick={() => {
                  if (isAnswer) {
                    playSound("correct", meta.sound);
                    setStamped((s) => [...s, cell.id]);
                  } else {
                    playSound("wrong", meta.sound);
                  }
                  setQIdx((i) => i + 1);
                }}
                aria-label={`Клетка ${cell.text}`}
                className={`grid h-16 place-items-center rounded-xl border-2 font-mono text-xl font-black transition-all ${
                  isStamped
                    ? "border-mint-deep bg-mint-soft text-mint-deep"
                    : "border-line-strong bg-surface hover:border-lavender"
                }`}
              >
                {isStamped ? "★" : cell.text}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs font-semibold text-ink-mute">
          Если ответа нет на карточке — просто жди следующую задачу. Пропущено: {misses}
        </p>
      </div>
    </div>
  );
}
