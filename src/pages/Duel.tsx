import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TaskView from "../components/game/TaskView";
import FlowButton from "../components/ui/flow-button";
import { usePlayer } from "../store/PlayerContext";
import { playSound } from "../lib/sound";
import {
  buildRound,
  DIFFICULTY_NAMES,
  type Difficulty,
  type Task,
} from "../lib/tasks";

const TASKS_PER_PLAYER = 5;
const REWARD = 40;

/** Дуэль на одном устройстве: двое отвечают по очереди на свои наборы задач. */
export default function Duel() {
  const { player, meta, finishGame } = usePlayer();
  const [phase, setPhase] = useState<"setup" | "play" | "done">("setup");
  const [names, setNames] = useState(["Игрок 1", "Игрок 2"]);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [sets, setSets] = useState<{ p1: Task[]; p2: Task[] } | null>(null);
  const [turn, setTurn] = useState<0 | 1>(0);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [scores, setScores] = useState([0, 0]);
  const [awarded, setAwarded] = useState(false);

  const currentSets = useMemo(() => sets, [sets]);
  const tasks = currentSets ? (turn === 0 ? currentSets.p1 : currentSets.p2) : [];
  const task = tasks[Math.min(idx, tasks.length - 1)];

  // Награда активному профилю — один раз за дуэль
  useEffect(() => {
    if (phase !== "done" || awarded || !player) return;
    setAwarded(true);
    finishGame({
      kindStats: {},
      solved: TASKS_PER_PLAYER * 2,
      correct: scores[0] + scores[1],
      streak: 0,
      perfect: false,
      coins: REWARD,
      gems: 0,
      xp: 6,
      seconds: 0,
      wrongTasks: [],
      chest: null,
      seasonXp: 6,
    });
    playSound("fanfare", meta.sound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const start = () => {
    setSets({
      p1: buildRound("mixed", difficulty, { length: TASKS_PER_PLAYER }),
      p2: buildRound("mixed", difficulty, { length: TASKS_PER_PLAYER }),
    });
    setTurn(0);
    setIdx(0);
    setScores([0, 0]);
    setPicked(null);
    setPhase("play");
  };

  const pick = (option: string) => {
    if (phase !== "play" || picked !== null) return;
    const ok = option === task.answer;
    setPicked(option);
    playSound(ok ? "correct" : "wrong", meta.sound);
    if (ok) setScores((s) => (turn === 0 ? [s[0] + 1, s[1]] : [s[0], s[1] + 1]));
    setTimeout(() => {
      if (idx + 1 >= TASKS_PER_PLAYER) {
        if (turn === 0) {
          setTurn(1);
          setIdx(0);
          setPicked(null);
        } else {
          setPhase("done");
        }
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
      }
    }, 1100);
  };

  if (!player) return null;

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-8 shadow-card">
        <h1 className="mb-1 text-2xl font-black tracking-tight">Дуэль</h1>
        <p className="mb-5 text-sm text-ink-soft">
          Двое играют по очереди на одном устройстве. У каждого — {TASKS_PER_PLAYER} задач. Победителю —{" "}
          {REWARD} монет!
        </p>
        <label className="mb-1 block text-sm font-bold" htmlFor="p1">
          Имя первого игрока
        </label>
        <input
          id="p1"
          value={names[0]}
          onChange={(e) => setNames([e.target.value, names[1]])}
          maxLength={14}
          className="mb-3 w-full rounded-2xl border-2 border-line-strong bg-cream px-4 py-2.5 font-semibold outline-none focus:border-lavender"
        />
        <label className="mb-1 block text-sm font-bold" htmlFor="p2">
          Имя второго игрока
        </label>
        <input
          id="p2"
          value={names[1]}
          onChange={(e) => setNames([names[0], e.target.value])}
          maxLength={14}
          className="mb-4 w-full rounded-2xl border-2 border-line-strong bg-cream px-4 py-2.5 font-semibold outline-none focus:border-lavender"
        />
        <p className="mb-1.5 text-sm font-bold">Сложность</p>
        <div className="mb-5 flex gap-2">
          {(["easy", "medium", "hard"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
              className={`min-h-11 flex-1 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
                difficulty === d
                  ? "border-lavender-deep bg-lavender-soft text-lavender-deep"
                  : "border-line bg-surface"
              }`}
            >
              {DIFFICULTY_NAMES[d]}
            </button>
          ))}
        </div>
        <FlowButton text="Начать дуэль" onClick={start} className="w-full justify-center" />
        <div className="mt-3 text-center">
          <Link to="/" className="text-sm font-bold text-ink-soft hover:underline">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    const winner = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1;
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-pop">
        <h1 className="mb-2 text-3xl font-black">
          {winner === null ? "Ничья!" : `Победил ${names[winner]}!`}
        </h1>
        <p className="mb-6 font-mono text-2xl font-black">
          {scores[0]} : {scores[1]}
        </p>
        <p className="mb-6 text-sm text-ink-soft">
          Награда {REWARD} монет отправлена профилю {player.name}.
        </p>
        <FlowButton
          text="Ещё дуэль"
          onClick={() => {
            setAwarded(false);
            setPhase("setup");
          }}
        />
        <div className="mt-3">
          <Link to="/" className="text-sm font-bold text-ink-soft hover:underline">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div
          className={`rounded-2xl border-2 px-4 py-2 font-bold transition-colors ${
            turn === 0
              ? "border-mint-deep bg-mint-soft text-mint-deep"
              : "border-line bg-surface text-ink-soft"
          }`}
        >
          {names[0]}: <span className="font-mono">{scores[0]}</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">
          Задача {idx + 1}/{TASKS_PER_PLAYER}
        </p>
        <div
          className={`rounded-2xl border-2 px-4 py-2 font-bold transition-colors ${
            turn === 1
              ? "border-lavender-deep bg-lavender-soft text-lavender-deep"
              : "border-line bg-surface text-ink-soft"
          }`}
        >
          {names[1]}: <span className="font-mono">{scores[1]}</span>
        </div>
      </div>
      <p className="mb-3 text-center text-lg font-black" aria-live="polite">
        Отвечает {names[turn]}
      </p>
      <TaskView task={task} picked={picked} reveal={picked !== null} onPick={pick} />
    </div>
  );
}
