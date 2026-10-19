import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Gift, Lock, Trash2 } from "lucide-react";
import { CharacterView } from "../components/character/CharacterView";
import { CoinIcon, GemIcon } from "../components/ui/coin-badge";
import { usePlayer } from "../store/PlayerContext";
import { TOPIC_NAMES, type Topic } from "../lib/tasks";
import { levelOf, localDate } from "../lib/types";

function last7Accuracy(history: { date: string; solved: number; correct: number }[]) {
  const last7 = history.slice(-7);
  const solved = last7.reduce((s, h) => s + h.solved, 0);
  const correct = last7.reduce((s, h) => s + h.correct, 0);
  return solved > 0 ? Math.round((correct / solved) * 100) : null;
}

function weakTopic(stats: Record<string, { solved: number; correct: number }>): string | null {
  let worst: { kind: string; acc: number } | null = null;
  for (const [kind, st] of Object.entries(stats)) {
    if (st.solved >= 5) {
      const acc = st.correct / st.solved;
      if (!worst || acc < worst.acc) worst = { kind, acc };
    }
  }
  return worst && worst.acc < 0.8
    ? `${TOPIC_NAMES[worst.kind as Topic] ?? worst.kind} (${Math.round(worst.acc * 100)}%)`
    : null;
}

export default function Parent() {
  const { meta, profiles, player, setParentPin, switchProfile, setTimeLimit, giftCoins, deleteProfile } =
    usePlayer();
  const [unlocked, setUnlocked] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [giftTo, setGiftTo] = useState<string>("");
  const [giftAmount, setGiftAmount] = useState(50);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const today = localDate();

  const leaderboard = useMemo(
    () =>
      [...profiles]
        .map((p) => ({
          p,
          level: levelOf(p.xp),
          total: Object.values(p.stats).reduce((s, st) => s + st.correct, 0),
        }))
        .sort((a, b) => b.level - a.level || b.total - a.total),
    [profiles],
  );

  if (!unlocked) {
    if (!meta.parentPin) {
      return (
        <div className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-8 shadow-card">
          <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:underline">
            <ArrowLeft size={16} aria-hidden="true" /> На главную
          </Link>
          <h1 className="mb-1 flex items-center gap-2 text-2xl font-black tracking-tight">
            <Lock size={22} aria-hidden="true" /> Родительская зона
          </h1>
          <p className="mb-5 text-sm text-ink-soft">
            Придумайте PIN-код для входа. Он хранится только в этом браузере.
          </p>
          <label className="mb-1 block text-sm font-bold" htmlFor="pin1">
            PIN (4–6 цифр)
          </label>
          <input
            id="pin1"
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mb-3 w-full rounded-2xl border-2 border-line-strong bg-cream px-4 py-2.5 font-mono text-lg outline-none focus:border-lavender"
          />
          <label className="mb-1 block text-sm font-bold" htmlFor="pin2">
            Повторите PIN
          </label>
          <input
            id="pin2"
            type="password"
            inputMode="numeric"
            value={newPin2}
            onChange={(e) => setNewPin2(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mb-4 w-full rounded-2xl border-2 border-line-strong bg-cream px-4 py-2.5 font-mono text-lg outline-none focus:border-lavender"
          />
          {error && (
            <p role="alert" className="mb-3 text-sm font-bold text-coral-deep">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              if (newPin.length < 4) {
                setError("Минимум 4 цифры");
                return;
              }
              if (newPin !== newPin2) {
                setError("PIN-коды не совпадают");
                return;
              }
              setParentPin(newPin);
              setUnlocked(true);
              setError("");
            }}
            className="min-h-12 w-full rounded-2xl bg-ink px-6 py-3 font-bold text-cream hover:bg-ink/85"
          >
            Сохранить и войти
          </button>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-surface p-8 shadow-card">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> На главную
        </Link>
        <h1 className="mb-1 flex items-center gap-2 text-2xl font-black tracking-tight">
          <Lock size={22} aria-hidden="true" /> Родительская зона
        </h1>
        <p className="mb-5 text-sm text-ink-soft">Введите PIN-код</p>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (pin === meta.parentPin) setUnlocked(true);
              else setError("Неверный PIN");
            }
          }}
          aria-label="PIN-код"
          className="mb-3 w-full rounded-2xl border-2 border-line-strong bg-cream px-4 py-2.5 font-mono text-lg outline-none focus:border-lavender"
        />
        {error && (
          <p role="alert" className="mb-3 text-sm font-bold text-coral-deep">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            if (pin === meta.parentPin) {
              setUnlocked(true);
              setError("");
            } else {
              setError("Неверный PIN");
            }
          }}
          className="min-h-12 w-full rounded-2xl bg-ink px-6 py-3 font-bold text-cream hover:bg-ink/85"
        >
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-soft hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> На главную
      </Link>
      <h1 className="mb-1 text-3xl font-black tracking-tight">Родительская зона</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Статистика детей, лимит времени, переводы монет. Все данные — только в этом браузере.
      </p>

      {/* Профили */}
      <section className="mb-6 space-y-3" aria-label="Дети">
        {profiles.map((p) => {
          const lvl = levelOf(p.xp);
          const acc = last7Accuracy(p.history);
          const weak = weakTopic(p.stats);
          const minutes = Math.round((p.play[today] ?? 0) / 60);
          const isActive = p.id === player?.id;
          return (
            <div
              key={p.id}
              className={`rounded-3xl border-2 bg-surface p-4 shadow-card ${
                isActive ? "border-lavender-deep" : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <CharacterView base={p.base} color={p.color} equipped={p.equipped} size={56} head />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 font-black tracking-tight">
                    {p.name}
                    {isActive && (
                      <span className="flex items-center gap-1 rounded-full bg-lavender-soft px-2 py-0.5 text-[10px] font-bold text-lavender-deep">
                        <Crown size={10} aria-hidden="true" /> активный
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-semibold text-ink-soft">
                    Уровень {lvl} · точность за неделю: {acc === null ? "нет данных" : `${acc}%`}
                    {weak && ` · слабая тема: ${weak}`}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs font-semibold text-ink-mute">
                    <span className="flex items-center gap-1">
                      <CoinIcon size={12} /> {p.coins}
                    </span>
                    <span className="flex items-center gap-1">
                      <GemIcon size={12} /> {p.gems}
                    </span>
                    <span>
                      Сегодня играл: {minutes} мин
                      {p.limitMin ? ` / лимит ${p.limitMin} мин` : ""}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => switchProfile(p.id)}
                      className="min-h-11 rounded-xl border-2 border-line-strong px-3 py-2 text-xs font-bold hover:border-lavender-deep"
                    >
                      Активировать
                    </button>
                  )}
                  {profiles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(p.id)}
                      aria-label={`Удалить профиль ${p.name}`}
                      className="grid h-11 w-11 place-items-center rounded-xl border-2 border-coral text-coral-deep hover:bg-coral-soft"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {isActive && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-cream p-3">
                  <span className="text-xs font-bold text-ink-soft">Лимит игры в день:</span>
                  {[15, 30, 45, 60, null].map((min) => (
                    <button
                      key={String(min)}
                      type="button"
                      onClick={() => setTimeLimit(min)}
                      aria-pressed={p.limitMin === min}
                      className={`min-h-9 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                        p.limitMin === min
                          ? "border-lavender-deep bg-lavender-soft text-lavender-deep"
                          : "border-line-strong bg-surface"
                      }`}
                    >
                      {min === null ? "Без лимита" : `${min} мин`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Перевод монет */}
      {profiles.length > 1 && (
        <section
          className="mb-6 rounded-3xl border border-line bg-surface p-5 shadow-card"
          aria-label="Перевод монет"
        >
          <h2 className="mb-2 flex items-center gap-2 font-black tracking-tight">
            <Gift size={18} aria-hidden="true" /> Подарить монеты
          </h2>
          <p className="mb-3 text-xs font-semibold text-ink-soft">
            Со счёта активного профиля ({player?.name}: {player?.coins} монет) — выбранному ребёнку.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={giftTo}
              onChange={(e) => setGiftTo(e.target.value)}
              aria-label="Кому подарить"
              className="min-h-11 rounded-xl border-2 border-line-strong bg-cream px-3 py-2 text-sm font-semibold"
            >
              <option value="">Выберите ребёнка</option>
              {profiles
                .filter((p) => p.id !== player?.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <select
              value={giftAmount}
              onChange={(e) => setGiftAmount(Number(e.target.value))}
              aria-label="Сколько монет"
              className="min-h-11 rounded-xl border-2 border-line-strong bg-cream px-3 py-2 font-mono text-sm font-semibold"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (giftTo) giftCoins(giftTo, giftAmount);
              }}
              disabled={!giftTo || (player?.coins ?? 0) < giftAmount}
              className="min-h-11 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-cream hover:bg-ink/85 disabled:opacity-40"
            >
              Подарить
            </button>
          </div>
        </section>
      )}

      {/* Лидерборд */}
      <section
        className="mb-6 rounded-3xl border border-line bg-surface p-5 shadow-card"
        aria-label="Доска почёта"
      >
        <h2 className="mb-3 font-black tracking-tight">Доска почёта</h2>
        <ol className="space-y-2">
          {leaderboard.map(({ p, level, total }, i) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lavender-deep font-mono text-xs font-black text-cream">
                {i + 1}
              </span>
              <span className="flex-1 font-bold">{p.name}</span>
              <span className="font-mono text-xs font-bold text-ink-soft">
                ур. {level} · {total} задач
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Выход и сброс PIN */}
      <div className="flex flex-wrap justify-center gap-3 pb-10">
        <button
          type="button"
          onClick={() => setUnlocked(false)}
          className="min-h-11 rounded-full border border-line-strong px-4 py-2 text-sm font-bold hover:bg-cream"
        >
          Выйти из зоны
        </button>
        <button
          type="button"
          onClick={() => {
            setParentPin(null);
            setUnlocked(false);
          }}
          className="min-h-11 rounded-full px-4 py-2 text-sm font-bold text-coral-deep hover:bg-coral-soft"
        >
          Сбросить PIN
        </button>
      </div>

      {/* Подтверждение удаления */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-label="Удаление профиля"
        >
          <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-pop">
            <h2 className="text-xl font-black tracking-tight">Удалить профиль?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Прогресс «{profiles.find((p) => p.id === confirmDelete)?.name}» будет удалён навсегда.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="min-h-11 rounded-full border border-line-strong px-4 py-2 text-sm font-bold hover:bg-cream"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProfile(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="min-h-11 rounded-full bg-coral-deep px-4 py-2 text-sm font-bold text-cream hover:opacity-90"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
