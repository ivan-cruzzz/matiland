import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Heart, Lightbulb, RefreshCw, ShoppingBag, Timer, X } from "lucide-react";
import TaskView from "../components/game/TaskView";
import FlowButton from "../components/ui/flow-button";
import { CoinIcon } from "../components/ui/coin-badge";
import { CharacterView } from "../components/character/CharacterView";
import { usePlayer } from "../store/PlayerContext";
import { playSound } from "../lib/sound";
import { playedTodaySeconds } from "../lib/achievements";
import {
  buildRound,
  easier,
  generateTask,
  hintFor,
  isDifficulty,
  isTopicId,
  TOPIC_NAMES,
  type Difficulty,
  type Task,
  type TopicId,
} from "../lib/tasks";

const COINS_PER_CORRECT = 5;
const STREAK_STEP = 5;
const STREAK_BONUS = 5;
const PERFECT_BONUS = 50;
const XP_PER_CORRECT = 2;
const XP_PER_ROUND = 5;
const FEEDBACK_MS = 1150;
const TIME_MODE_SECONDS = 60;

type GameMode = "classic" | "time" | "survival" | "flawless";

const MODE_NAMES: Record<GameMode, string> = {
  classic: "Классика",
  time: "На время",
  survival: "Выживание",
  flawless: "Без ошибок",
};

interface KindStat {
  solved: number;
  correct: number;
}

export default function Game() {
  const params = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { player, meta, finishGame, completeDaily, addPlaySeconds } = usePlayer();

  const topicParam = params.topic ?? "mixed";
  const difficultyParam = params.difficulty ?? "easy";
  const valid = isTopicId(topicParam) && isDifficulty(difficultyParam);
  const topic: TopicId = valid ? topicParam : "mixed";
  const baseDifficulty: Difficulty = valid ? difficultyParam : "easy";
  const modeParam = search.get("mode") ?? "classic";
  const mode: GameMode = (["classic", "time", "survival", "flawless"] as const).includes(
    modeParam as GameMode,
  )
    ? (modeParam as GameMode)
    : "classic";
  const isDaily = search.get("daily") === "1";
  const endless = mode === "time" || mode === "survival";

  const [tasks, setTasks] = useState<Task[]>(() =>
    endless
      ? [generateTask(topic, baseDifficulty)]
      : buildRound(topic, baseDifficulty, {
          repeatWrong: mode === "classic" ? (player?.wrongTasks ?? []) : [],
        }),
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bonusCoins, setBonusCoins] = useState(0);
  const [bestStreakInRound, setBestStreakInRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(TIME_MODE_SECONDS);
  const [phase, setPhase] = useState<"answer" | "feedback" | "done">("answer");
  const [mood, setMood] = useState<"happy" | "sad" | "wow">("happy");
  const [hintShown, setHintShown] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [difficultyNow, setDifficultyNow] = useState<Difficulty>(baseDifficulty);

  const kindStats = useRef<Record<string, KindStat>>({});
  const wrongCollected = useRef<Task[]>([]);
  const startedAt = useRef(Date.now());
  const awardedRef = useRef(false);
  const wrongRow = useRef(0);

  const task = tasks[Math.min(idx, tasks.length - 1)];
  const isCorrectPick = picked !== null && picked === task.answer;

  // Родительский лимит времени
  const limitHit = player?.limitMin != null && playedTodaySeconds(player) >= player.limitMin * 60;

  useEffect(() => {
    if (limitHit && phase !== "done") {
      const id = setTimeout(() => setPhase("done"), 400);
      return () => clearTimeout(id);
    }
  }, [limitHit, phase]);

  // Учёт времени игры
  useEffect(() => {
    const id = setInterval(() => addPlaySeconds(10), 10000);
    return () => {
      clearInterval(id);
      addPlaySeconds(Math.round((Date.now() - startedAt.current) / 1000) % 10);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Таймер режима «На время»
  useEffect(() => {
    if (mode !== "time" || phase !== "answer") return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPhase("done");
          return 0;
        }
        if (s <= 5) playSound("tick", meta.sound);
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, phase]);

  const resetRound = () => {
    awardedRef.current = false;
    kindStats.current = {};
    wrongCollected.current = [];
    startedAt.current = Date.now();
    wrongRow.current = 0;
    setTasks(
      endless
        ? [generateTask(topic, baseDifficulty)]
        : buildRound(topic, baseDifficulty, {
            repeatWrong: mode === "classic" ? (player?.wrongTasks ?? []) : [],
          }),
    );
    setIdx(0);
    setPicked(null);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setBonusCoins(0);
    setBestStreakInRound(0);
    setLives(3);
    setSecondsLeft(TIME_MODE_SECONDS);
    setDifficultyNow(baseDifficulty);
    setPhase("answer");
    setMood("happy");
    setHintShown(false);
  };

  const pick = (option: string) => {
    if (phase !== "answer") return;
    const correct = option === task.answer;
    setPicked(option);
    setPhase("feedback");
    const st = kindStats.current[task.kind] ?? { solved: 0, correct: 0 };
    kindStats.current[task.kind] = { solved: st.solved + 1, correct: st.correct + (correct ? 1 : 0) };
    if (correct) {
      const nextStreak = streak + 1;
      setCorrectCount((c) => c + 1);
      setStreak(nextStreak);
      setBestStreakInRound((b) => Math.max(b, nextStreak));
      setMood("wow");
      if (nextStreak % STREAK_STEP === 0) {
        setBonusCoins((bc) => bc + STREAK_BONUS);
        playSound("coin", meta.sound);
      } else {
        playSound("correct", meta.sound);
      }
      wrongRow.current = 0;
      if (mode === "survival" && nextStreak % 4 === 0 && difficultyNow !== "hard") {
        setDifficultyNow((d) => (d === "easy" ? "medium" : "hard"));
      }
    } else {
      setStreak(0);
      setMood("sad");
      setShakeKey((k) => k + 1);
      playSound("wrong", meta.sound);
      wrongRow.current += 1;
      setWrongCount((w) => w + 1);
      wrongCollected.current = [...wrongCollected.current, task].slice(-5);
      if (mode === "survival") {
        setLives((l) => {
          const nl = l - 1;
          if (nl <= 0) setTimeout(() => setPhase("done"), FEEDBACK_MS);
          return nl;
        });
      }
      if (mode === "flawless") {
        setTimeout(() => setPhase("done"), FEEDBACK_MS + 150);
      }
    }
  };

  // Переход к следующей задаче (адаптивная сложность, конец раунда)
  useEffect(() => {
    if (phase !== "feedback") return;
    const feedbackMs = mode === "time" ? 550 : mode === "survival" ? 900 : FEEDBACK_MS;
    const id = setTimeout(() => {
      if (mode === "survival" && lives <= 0) return;
      if (mode === "flawless" && picked !== null && picked !== task.answer) {
        setPhase("done");
        return;
      }
      const nextIdx = idx + 1;
      if (!endless && nextIdx >= tasks.length) {
        setPhase("done");
        return;
      }
      if (endless) {
        setTasks((prev) => [...prev, generateTask(topic, difficultyNow)]);
      } else if (mode === "classic" && wrongRow.current >= 2) {
        setTasks((prev) =>
          prev.map((t, i) => (i === nextIdx ? generateTask(topic, easier(difficultyNow)) : t)),
        );
        setDifficultyNow((d) => easier(d));
        wrongRow.current = 0;
      }
      setIdx(nextIdx);
      setPicked(null);
      setPhase("answer");
      setHintShown(false);
      setMood("happy");
    }, feedbackMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx]);

  // Награда — один раз за раунд
  useEffect(() => {
    if (phase !== "done" || awardedRef.current) return;
    awardedRef.current = true;
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    const answered = correctCount + wrongCount;
    const perfect =
      (mode === "classic" || mode === "flawless") && wrongCount === 0 && correctCount === tasks.length;

    let coins = correctCount * COINS_PER_CORRECT + bonusCoins;
    if (mode === "time") coins = correctCount * 4;
    if (perfect) coins += PERFECT_BONUS;
    const xp = correctCount * XP_PER_CORRECT + (mode === "classic" ? XP_PER_ROUND : 2);
    const chest: "small" | "big" | null =
      perfect ? "big" : Math.random() < 0.18 ? "small" : null;

    if (isDaily && correctCount >= 6) completeDaily();

    finishGame({
      kindStats: kindStats.current,
      solved: endless ? Math.max(1, answered) : tasks.length,
      correct: correctCount,
      streak: bestStreakInRound,
      perfect,
      coins,
      gems: 0,
      xp,
      seconds,
      wrongTasks: wrongCollected.current,
      chest,
      seasonXp: correctCount * 2 + (perfect ? 20 : 0),
      label: isDaily ? "daily" : undefined,
    });
    playSound("fanfare", meta.sound);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!player) return null;

  if (!valid) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <p className="mb-4 text-lg font-bold">Такой игры не существует.</p>
        <Link to="/" className="rounded-full bg-ink px-5 py-2.5 font-bold text-cream">
          На главную
        </Link>
      </div>
    );
  }

  if (limitHit && phase !== "done") {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-10 text-center shadow-card">
        <Timer size={44} className="mx-auto mb-4 text-peach-deep" aria-hidden="true" />
        <h1 className="mb-2 text-2xl font-black">Время на сегодня вышло</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Родители установили лимит игры на сегодня. Приходи завтра!
        </p>
        <Link to="/" className="rounded-full bg-ink px-5 py-2.5 font-bold text-cream">
          На главную
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    const total = endless ? Math.max(1, correctCount + wrongCount) : tasks.length;
    const accuracy = Math.round((correctCount / total) * 100);
    const perfect = (mode === "classic" || mode === "flawless") && wrongCount === 0 && correctCount === tasks.length;
    let coins = correctCount * COINS_PER_CORRECT + bonusCoins;
    if (mode === "time") coins = correctCount * 4;
    if (perfect) coins += PERFECT_BONUS;

    const report = Object.entries(kindStats.current)
      .filter(([, st]) => st.solved >= 2)
      .map(([kind, st]) => ({ kind, acc: st.correct / st.solved }))
      .sort((a, b) => a.acc - b.acc);

    return (
      <div className="relative mx-auto max-w-xl">
        {perfect && <Confetti />}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
          className="rounded-3xl border border-line bg-surface p-8 text-center shadow-pop"
        >
          <p className="text-4xl font-black tracking-tight">
            {perfect ? "Идеально!" : accuracy >= 70 ? "Здорово!" : "Раунд завершён!"}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            {isDaily ? "Ежедневный вызов" : `${TOPIC_NAMES[topic]} · ${MODE_NAMES[mode]}`}
          </p>

          <dl className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-cream p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">Верно</dt>
              <dd className="font-mono text-xl font-black">
                {correctCount}/{endless ? total : tasks.length}
              </dd>
            </div>
            <div className="rounded-2xl bg-sunny-soft p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-sunny-deep">Монеты</dt>
              <dd className="flex items-center justify-center gap-1 font-mono text-xl font-black text-sunny-deep">
                <CoinIcon size={16} />+{coins}
              </dd>
            </div>
            <div className="rounded-2xl bg-lavender-soft p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-lavender-deep">Серия</dt>
              <dd className="font-mono text-xl font-black text-lavender-deep">{bestStreakInRound}</dd>
            </div>
          </dl>

          {report.length > 0 && (
            <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-cream p-4 text-left">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-ink-soft">Твой отчёт</p>
              {report.slice(0, 2).map((r) => (
                <p key={r.kind} className="text-sm font-semibold">
                  {TOPIC_NAMES[r.kind as TopicId] ?? r.kind}: {Math.round(r.acc * 100)}% верно
                  {r.acc < 0.7 ? " — стоит потренировать!" : " — отлично!"}
                </p>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-3">
            <FlowButton
              text={mode === "time" || mode === "survival" ? "Ещё раз" : "Ещё раунд"}
              onClick={resetRound}
            />
            <div className="flex gap-4 text-sm font-bold">
              <Link to="/shop" className="flex items-center gap-1.5 text-lavender-deep hover:underline">
                <ShoppingBag size={16} aria-hidden="true" /> В магазин
              </Link>
              <Link to="/" className="flex items-center gap-1.5 text-ink-soft hover:underline">
                <RefreshCw size={16} aria-hidden="true" /> Другая тема
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const progress = endless ? 0 : ((idx + (phase === "feedback" ? 1 : 0)) / tasks.length) * 100;
  const coinsSoFar =
    (mode === "time" ? correctCount * 4 : correctCount * COINS_PER_CORRECT) + bonusCoins;

  return (
    <div className="mx-auto max-w-2xl">
      {/* Верхняя панель раунда */}
      <div className="mb-4 flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="Выйти из игры"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:bg-cream hover:text-ink"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <CharacterView
          base={player.base}
          color={player.color}
          equipped={player.equipped}
          mood={mood}
          size={44}
          head
          className="shrink-0"
        />
        {!endless && (
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Прогресс раунда"
          >
            <div
              className="h-full rounded-full bg-lavender transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {endless && <div className="flex-1" />}
        {mode === "time" && (
          <span
            className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 font-mono text-xs font-bold ${
              secondsLeft <= 5
                ? "border-coral bg-coral-soft text-coral-deep"
                : "border-line bg-surface text-ink-soft"
            }`}
            aria-label={`Осталось секунд: ${secondsLeft}`}
          >
            <Timer size={14} aria-hidden="true" />
            {secondsLeft}
          </span>
        )}
        {mode === "survival" && (
          <span
            className="flex shrink-0 items-center gap-0.5 rounded-full border border-coral bg-coral-soft px-3 py-1.5"
            aria-label={`Жизни: ${lives}`}
          >
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                size={14}
                className={i < lives ? "text-coral-deep" : "text-coral opacity-30"}
                fill="currentColor"
                aria-hidden="true"
              />
            ))}
          </span>
        )}
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
            streak >= STREAK_STEP
              ? "border-coral bg-coral-soft text-coral-deep"
              : "border-line bg-surface text-ink-soft"
          }`}
          aria-label={`Серия верных ответов: ${streak}`}
        >
          <Flame size={14} aria-hidden="true" />
          <span className="font-mono">{streak}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-sunny bg-sunny-soft px-3 py-1.5 font-mono text-xs font-bold text-sunny-deep">
          <CoinIcon size={14} />+{coinsSoFar}
        </span>
      </div>

      <motion.div
        key={shakeKey}
        animate={
          shakeKey > 0 && phase === "feedback" && picked !== task.answer
            ? { x: [0, -10, 10, -6, 6, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.4 }}
      >
        <TaskView task={task} picked={picked} reveal={phase === "feedback"} onPick={pick} />
      </motion.div>

      <div aria-live="polite" className="mt-4 min-h-20 text-center">
        {phase === "feedback" &&
          (isCorrectPick ? (
            <p className="font-bold text-mint-deep">
              Верно! +{mode === "time" ? 4 : COINS_PER_CORRECT} монет
              {streak > 0 && streak % STREAK_STEP === 0
                ? `, бонус за серию ${streak}: +${STREAK_BONUS}!`
                : "!"}
            </p>
          ) : (
            <div className="space-y-1">
              <p className="font-bold text-coral-deep">
                Ничего! Правильный ответ: <span className="font-mono">{task.answer}</span>
              </p>
              {hintShown && <p className="text-sm font-semibold text-ink-soft">{hintFor(task)}</p>}
            </div>
          ))}
        {phase === "answer" && !hintShown && (
          <button
            type="button"
            onClick={() => {
              setHintShown(true);
              playSound("click", meta.sound);
            }}
            className="mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-sunny bg-sunny-soft px-4 py-2 text-sm font-bold text-sunny-deep transition-transform hover:scale-105"
          >
            <Lightbulb size={16} aria-hidden="true" />
            Подсказка
          </button>
        )}
        {phase === "answer" && hintShown && (
          <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-ink-soft">{hintFor(task)}</p>
        )}
      </div>
    </div>
  );
}

/** Лёгкий конфетти-всплеск для идеального раунда. */
function Confetti() {
  const colors = ["#A8E6CF", "#C9B8F0", "#FFD3B6", "#FFE38A", "#FFB3AB", "#A6D8F0"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 90 + ((i * 37) % 120);
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist + 60,
              opacity: 0,
              scale: 0.5,
              rotate: (i % 2 ? 1 : -1) * 180,
            }}
            transition={{ duration: 1.4 + (i % 5) * 0.12, ease: "easeOut" }}
            className="absolute left-1/2 top-1/4 h-3 w-2 rounded-sm"
            style={{ background: colors[i % colors.length] }}
          />
        );
      })}
    </div>
  );
}
