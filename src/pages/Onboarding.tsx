import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import FlowButton from "../components/ui/flow-button";
import { CoinIcon } from "../components/ui/coin-badge";
import {
  CharacterView,
  BASE_NAMES,
  CHAR_COLOR_LIST,
  CHAR_COLOR_NAMES,
} from "../components/character/CharacterView";
import { usePlayer } from "../store/PlayerContext";
import type { BaseColor, BaseId } from "../lib/types";

const BASES: BaseId[] = ["cat", "bunny", "robot", "dragon", "alien"];

const STEP_TITLES = ["Знакомство", "Герой", "Готово!"];

const stepVariants = {
  initial: { opacity: 0, x: 48 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -48 },
  transition: { type: "spring" as const, stiffness: 260, damping: 28 },
};

export default function Onboarding() {
  const { player, createProfile } = usePlayer();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const addMode = search.get("add") === "1";
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [base, setBase] = useState<BaseId>("cat");
  const [color, setColor] = useState<BaseColor>("mint");

  if (player && !addMode) return <Navigate to="/" replace />;

  const trimmed = name.trim();
  const nameOk = trimmed.length >= 1 && trimmed.length <= 16;

  const start = () => {
    if (!nameOk) return;
    createProfile({ name: trimmed, base, color });
    navigate("/", { replace: true });
  };

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      {/* Декоративные пастельные пятна */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-mint opacity-50 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-lavender opacity-40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-52 w-52 rounded-full bg-peach opacity-40 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-xl">
        <p className="mb-2 text-center text-4xl font-black tracking-tight">Матилэнд</p>
        <p className="mb-6 text-center text-sm font-semibold text-ink-soft">
          Страна весёлой математики
        </p>

        {/* Индикатор шагов */}
        <ol
          className="mx-auto mb-6 flex w-fit items-center gap-2"
          aria-label={`Шаг ${step + 1} из 3: ${STEP_TITLES[step]}`}
        >
          {STEP_TITLES.map((title, i) => (
            <li key={title} className="flex items-center gap-2">
              <span
                aria-current={i === step ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                  i === step
                    ? "border-lavender-deep bg-lavender-soft text-lavender-deep"
                    : i < step
                      ? "border-mint-deep/30 bg-mint-soft text-mint-deep"
                      : "border-line text-ink-mute"
                }`}
              >
                <span className="font-mono">{i + 1}</span>
                <span className="hidden sm:inline">{title}</span>
              </span>
              {i < STEP_TITLES.length - 1 && (
                <span className="h-px w-4 bg-line-strong" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>

        <div className="rounded-3xl border border-line bg-surface p-6 shadow-pop sm:p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step-name" {...stepVariants}>
                <h1 className="mb-2 text-2xl font-black tracking-tight">Привет! Как тебя зовут?</h1>
                <p className="mb-5 text-sm text-ink-soft">
                  Так тебя будут называть в игре. От 1 до 16 букв.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (nameOk) setStep(1);
                  }}
                >
                  <label htmlFor="player-name" className="mb-1.5 block text-sm font-bold">
                    Твоё имя
                  </label>
                  <input
                    id="player-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={16}
                    autoComplete="given-name"
                    placeholder="Например, Аня"
                    className="w-full rounded-2xl border-2 border-line-strong bg-cream px-4 py-3 text-lg font-semibold outline-none transition-colors focus:border-lavender"
                  />
                  <div className="mt-6 flex justify-end">
                    <FlowButton text="Дальше" type="submit" disabled={!nameOk} />
                  </div>
                </form>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step-char" {...stepVariants}>
                <h1 className="mb-1 text-2xl font-black tracking-tight">Выбери своего героя</h1>
                <p className="mb-4 text-sm text-ink-soft">
                  Он будет учиться и путешествовать вместе с тобой.
                </p>

                <div className="mb-5 grid place-items-center rounded-3xl bg-cream p-3">
                  <CharacterView base={base} color={color} size={150} />
                </div>

                <fieldset className="mb-5">
                  <legend className="mb-2 text-sm font-bold">Кто он?</legend>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {BASES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBase(b)}
                        aria-pressed={base === b}
                        className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 transition-all ${
                          base === b
                            ? "border-lavender-deep bg-lavender-soft"
                            : "border-line bg-surface hover:border-line-strong"
                        }`}
                      >
                        <CharacterView base={b} color={color} size={64} />
                        <span className="text-xs font-bold">{BASE_NAMES[b]}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2 text-sm font-bold">Какого цвета?</legend>
                  <div className="flex flex-wrap gap-2.5">
                    {CHAR_COLOR_LIST.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setColor(col)}
                        aria-pressed={color === col}
                        aria-label={CHAR_COLOR_NAMES[col]}
                        title={CHAR_COLOR_NAMES[col]}
                        className={`h-10 w-10 rounded-full border-[3px] transition-transform ${
                          color === col ? "scale-110 border-ink" : "border-transparent hover:scale-105"
                        }`}
                        style={{ background: `var(--color-${col})` }}
                      />
                    ))}
                  </div>
                </fieldset>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-cream hover:text-ink"
                  >
                    Назад
                  </button>
                  <FlowButton text="Дальше" onClick={() => setStep(2)} />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-done" {...stepVariants} className="text-center">
                <h1 className="mb-1 text-2xl font-black tracking-tight">Всё готово!</h1>
                <p className="mb-4 text-sm text-ink-soft">
                  {trimmed}, твой герой — {BASE_NAMES[base].toLowerCase()} цвета{" "}
                  {CHAR_COLOR_NAMES[color].toLowerCase()}.
                </p>
                <div className="mx-auto mb-4 grid w-fit place-items-center rounded-3xl bg-cream p-4">
                  <CharacterView base={base} color={color} size={170} />
                </div>
                <p className="mx-auto mb-6 flex w-fit items-center gap-1.5 rounded-full border border-sunny bg-sunny-soft px-4 py-1.5 text-sm font-bold text-sunny-deep">
                  <CoinIcon size={18} />
                  Подарок новичку: 100 монет на первые покупки!
                </p>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-cream hover:text-ink"
                  >
                    Назад
                  </button>
                  <FlowButton text="Начать приключение" onClick={start} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
