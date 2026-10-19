import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import TaskView from "../components/game/TaskView";
import FlowButton from "../components/ui/flow-button";
import { usePlayer } from "../store/PlayerContext";
import { playSound } from "../lib/sound";
import { buildRound, DIFFICULTY_NAMES, type Difficulty, type Task } from "../lib/tasks";

const STAGES: Difficulty[] = ["easy", "easy", "medium", "medium", "hard"];
const TASKS_PER_STAGE = 5;
const PASS_THRESHOLD = 4;

export default function Olympiad() {
  const { player, meta, finishGame, finishOlympiad } = usePlayer();
  const [stage, setStage] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(() =>
    buildRound("mixed", STAGES[0], { length: TASKS_PER_STAGE }),
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [phase, setPhase] = useState<"answer" | "feedback" | "stageDone" | "champion">("answer");
  const awardedRef = useRef(false);

  const task = tasks[Math.min(idx, tasks.length - 1)];

  // Награда чемпиона — один раз
  useEffect(() => {
    if (phase !== "champion" || awardedRef.current) return;
    awardedRef.current = true;
    finishOlympiad(5, 120, 2);
    finishGame({
      kindStats: {},
      solved: 5 * TASKS_PER_STAGE,
      correct: 5 * PASS_THRESHOLD,
      streak: 0,
      perfect: false,
      coins: 0,
      gems: 0,
      xp: 30,
      seconds: 0,
      wrongTasks: [],
      chest: "big",
      seasonXp: 40,
    });
    playSound("fanfare", meta.sound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startStage = (s: number) => {
    setStage(s);
    setTasks(buildRound("mixed", STAGES[s], { length: TASKS_PER_STAGE }));
    setIdx(0);
    setPicked(null);
    setCorrect(0);
    setPhase("answer");
  };

  const pick = (option: string) => {
    if (phase !== "answer") return;
    const ok = option === task.answer;
    setPicked(option);
    setPhase("feedback");
    if (ok) {
      setCorrect((c) => c + 1);
      playSound("correct", meta.sound);
    } else {
      playSound("wrong", meta.sound);
    }
    setTimeout(() => {
      if (idx + 1 >= tasks.length) {
        setPhase("stageDone");
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
        setPhase("answer");
      }
    }, 1100);
  };

  if (!player) return null;

  if (phase === "champion") {
    return (
      <div className="relative mx-auto max-w-xl rounded-3xl border border-line bg-surface p-10 text-center shadow-pop">
        <Trophy size={64} className="mx-auto mb-4 text-sunny-deep" aria-hidden="true" />
        <h1 className="mb-2 text-3xl font-black">Ты чемпион олимпиады!</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Все 5 этапов пройдены. Награда: 120 монет, 2 самоцвета и большой сундук!
        </p>
        <FlowButton
          text="Сыграть снова"
          onClick={() => {
            awardedRef.current = false;
            startStage(0);
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

  if (phase === "stageDone") {
    const passed = correct >= PASS_THRESHOLD;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8 text-center shadow-pop"
      >
        <p className="text-3xl font-black">{passed ? "Этап пройден!" : "Не хватило!"}</p>
        <p className="mt-2 text-sm font-semibold text-ink-soft">
          Этап {stage + 1} из 5 ({DIFFICULTY_NAMES[STAGES[stage]]}): {correct}/{TASKS_PER_STAGE}. Нужно
          минимум {PASS_THRESHOLD}.
        </p>
        {passed ? (
          <div className="mt-6">
            <FlowButton
              text={stage === 4 ? "За кубком!" : `Этап ${stage + 2}`}
              onClick={() => (stage === 4 ? setPhase("champion") : startStage(stage + 1))}
            />
          </div>
        ) : (
          <div className="mt-6">
            <FlowButton text="Попробовать ещё" onClick={() => startStage(stage)} />
          </div>
        )}
        <div className="mt-3">
          <Link to="/" className="text-sm font-bold text-ink-soft hover:underline">
            На главную
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">Олимпиада</h1>
        <p className="text-sm font-bold text-ink-soft">
          Этап {stage + 1}/5 · {DIFFICULTY_NAMES[STAGES[stage]]}
        </p>
      </div>
      <div className="mb-4 flex gap-1.5" aria-label={`Прогресс: этап ${stage + 1} из 5`}>
        {STAGES.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${
              i < stage ? "bg-mint" : i === stage ? "bg-lavender" : "bg-line"
            }`}
          />
        ))}
      </div>
      <TaskView task={task} picked={picked} reveal={phase === "feedback"} onPick={pick} />
      <p className="mt-3 text-center text-xs font-semibold text-ink-mute">
        Для перехода на следующий этап нужно {PASS_THRESHOLD} верных ответов из {TASKS_PER_STAGE}
      </p>
    </div>
  );
}
