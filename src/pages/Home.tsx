import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Divide,
  Flame,
  Gift,
  Heart,
  Minus,
  Play,
  Plus,
  Shuffle,
  Sparkles,
  Star,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { CharacterView } from "../components/character/CharacterView";
import { WheelModal } from "../components/ui/reward-modals";
import { usePlayer } from "../store/PlayerContext";
import { questById } from "../lib/quests";
import { SEASON_TIERS, SEASON_TIER_XP, seasonKey, seasonTierReached } from "../lib/economy";
import {
  DIFFICULTY_NAMES,
  TOPIC_NAMES,
  TOPIC_GROUPS,
  type Difficulty,
  type Topic,
} from "../lib/tasks";
import { levelOf, localDate } from "../lib/types";

const MODES: { m: string; label: string; Icon: typeof Play }[] = [
  { m: "classic", label: "Классика", Icon: Play },
  { m: "time", label: "На время", Icon: Timer },
  { m: "survival", label: "Выживание", Icon: Heart },
  { m: "flawless", label: "Без ошибок", Icon: Sparkles },
];

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];

/** Узлы карты: тема + позиция на маршруте (1000×520). */
const MAP_NODES: { key: string; x: number; y: number }[] = [
  { key: "add", x: 70, y: 430 },
  { key: "sub", x: 195, y: 350 },
  { key: "mul", x: 320, y: 430 },
  { key: "div", x: 445, y: 350 },
  { key: "missing", x: 570, y: 430 },
  { key: "compare", x: 695, y: 350 },
  { key: "sign", x: 820, y: 430 },
  { key: "fraction", x: 935, y: 350 },
  { key: "geometry", x: 140, y: 205 },
  { key: "clock", x: 300, y: 140 },
  { key: "money", x: 460, y: 205 },
  { key: "word", x: 620, y: 140 },
];

const SPECIAL_NODES: { key: string; x: number; y: number; label: string; to: string }[] = [
  { key: "mini", x: 780, y: 200, label: "Мини-игры", to: "/minigames" },
  { key: "olymp", x: 900, y: 130, label: "Олимпиада", to: "/olympiad" },
  { key: "duel", x: 890, y: 260, label: "Дуэль", to: "/duel" },
];

const TOPIC_ICONS: Record<Topic, typeof Plus> = {
  add: Plus,
  sub: Minus,
  mul: X,
  div: Divide,
  missing: Sparkles,
  compare: Trophy,
  sign: Shuffle,
  fraction: Star,
  geometry: Star,
  clock: Timer,
  money: Gift,
  word: Sparkles,
};

function starsFor(
  stats: Record<string, { solved: number; correct: number }> | undefined,
  topic: Topic,
): number {
  const st = stats?.[topic];
  if (!st || st.solved === 0) return 0;
  const acc = st.correct / st.solved;
  if (st.solved >= 30 && acc >= 0.9) return 3;
  if (st.solved >= 10 && acc >= 0.75) return 2;
  return 1;
}

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

export default function Home() {
  const { player, claimSeason } = usePlayer();
  const [view, setView] = useState<"map" | "list">("map");
  const [selected, setSelected] = useState<Topic | null>(null);
  const [wheelOpen, setWheelOpen] = useState(false);

  if (!player) return null;

  const today = localDate();
  const dailyDone = player.daily?.date === today && player.daily.done;
  const wheelAvailable = player.wheelLast !== today;
  const level = levelOf(player.xp);
  const seasonOk = player.season.key === seasonKey();
  const seasonXp = seasonOk ? player.season.xp : 0;
  const tier = seasonTierReached(seasonXp);
  const xpInTier = seasonXp % SEASON_TIER_XP;
  const claimable: number[] = [];
  if (seasonOk) {
    for (let t = 1; t <= Math.min(tier, SEASON_TIERS); t++) {
      if (!player.season.claimed.includes(t)) claimable.push(t);
    }
  }
  const monthName = MONTHS[new Date().getMonth()];

  return (
    <div>
      {/* Приветствие */}
      <section className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Привет, {player.name}!</h1>
          <p className="mt-1 text-sm text-ink-soft">Уровень {level} · выбери остров на карте</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5">
              <Trophy size={14} className="text-sunny-deep" aria-hidden="true" />
              Раундов: <span className="font-mono">{player.rounds}</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5">
              <Flame size={14} className="text-coral-deep" aria-hidden="true" />
              Рекорд серии: <span className="font-mono">{player.bestStreak}</span>
            </span>
          </div>
        </div>
        <Link
          to="/profile"
          aria-label="Профиль персонажа"
          className="shrink-0 rounded-3xl p-1 transition-transform hover:scale-105"
        >
          <CharacterView
            base={player.base}
            color={player.color}
            equipped={player.equipped}
            level={level}
            companionBase={player.companion}
            customPet={player.customPet}
            size={120}
          />
        </Link>
      </section>

      {/* Виджеты: ежедневный вызов + колесо */}
      <section className="mb-5 grid gap-3 sm:grid-cols-2">
        <Link
          to="/game/mixed/medium?daily=1"
          className={`flex items-center gap-3 rounded-3xl border-2 p-4 transition-transform hover:-translate-y-0.5 ${
            dailyDone ? "border-mint bg-mint-soft" : "border-lavender bg-lavender-soft"
          }`}
        >
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface text-lavender-deep"
            aria-hidden="true"
          >
            <Sparkles size={22} strokeWidth={2.5} />
          </span>
          <span>
            <span className="block font-black tracking-tight">
              Ежедневный вызов {dailyDone ? "· выполнен" : ""}
            </span>
            <span className="block text-xs font-semibold text-ink-soft">
              {dailyDone
                ? "Молодец! Загляни завтра за новым"
                : "10 особых задач · сундук за 6+ верных"}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setWheelOpen(true)}
          disabled={!wheelAvailable}
          className="flex items-center gap-3 rounded-3xl border-2 border-sunny bg-sunny-soft p-4 text-left transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-60"
        >
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface text-sunny-deep"
            aria-hidden="true"
          >
            <Gift size={22} strokeWidth={2.5} />
          </span>
          <span>
            <span className="block font-black tracking-tight">Колесо удачи</span>
            <span className="block text-xs font-semibold text-ink-soft">
              {wheelAvailable ? "Бесплатный спин доступен!" : "Уже крутил — приходи завтра"}
            </span>
          </span>
        </button>
      </section>

      {/* Квесты */}
      {player.quests.length > 0 && (
        <section
          className="mb-5 rounded-3xl border border-line bg-surface p-4 shadow-card"
          aria-label="Активные квесты"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {player.quests.map((q) => {
              const def = questById(q.id);
              if (!def) return null;
              const pct = Math.min(100, Math.round((q.progress / def.goal) * 100));
              return (
                <div key={q.id}>
                  <p className="mb-1 text-xs font-bold">{def.text}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-mint-deep transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] font-bold text-ink-mute">
                    {Math.min(q.progress, def.goal)}/{def.goal} · +{def.reward.coins ?? 0}
                    {def.reward.gems ? " и самоцвет" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Сезонный пропуск */}
      <section
        className="mb-5 rounded-3xl border border-line bg-surface p-4 shadow-card"
        aria-label={`Сезон ${monthName}`}
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-black tracking-tight">
            Сезон «{monthName}» · уровень {tier}/{SEASON_TIERS}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {claimable.slice(0, 6).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => claimSeason(t)}
                className="min-h-9 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-cream hover:bg-ink/85"
              >
                Забрать ур. {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-lavender-deep transition-all"
            style={{ width: `${(xpInTier / SEASON_TIER_XP) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] font-semibold text-ink-mute">
          До следующей награды: {SEASON_TIER_XP - xpInTier} очков · награды за задачи и раунды
        </p>
      </section>

      {/* Переключатель вида */}
      <div className="mb-3 flex gap-2" role="group" aria-label="Вид карты">
        {(["map", "list"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              view === v
                ? "border-lavender-deep bg-lavender-soft text-lavender-deep"
                : "border-line bg-surface text-ink-soft hover:text-ink"
            }`}
          >
            {v === "map" ? "Карта" : "Список"}
          </button>
        ))}
      </div>

      {view === "map" ? (
        <section aria-label="Карта мира" className="mb-4">
          <div
            className="relative w-full overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
            style={{ aspectRatio: "1000 / 520" }}
          >
            <svg viewBox="0 0 1000 520" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <path
                d="M70 430 C130 350 160 400 195 350 C240 300 270 400 320 430 C370 460 400 320 445 350 C490 380 520 460 570 430 C620 400 640 320 695 350 C740 380 770 460 820 430 C860 410 900 380 935 350 M140 205 C170 150 240 110 300 140 C350 160 410 230 460 205 C510 180 560 110 620 140 C680 170 720 230 780 200 C820 180 850 150 900 130 M780 200 C820 220 850 240 890 260"
                fill="none"
                stroke="var(--color-line-strong)"
                strokeWidth={4}
                strokeDasharray="2 14"
                strokeLinecap="round"
              />
            </svg>
            {MAP_NODES.map(({ key, x, y }) => {
              const topic = key as Topic;
              const Icon = TOPIC_ICONS[topic];
              const stars = starsFor(player.stats, topic);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(topic)}
                  aria-label={`${TOPIC_NAMES[topic]}, звёзд: ${stars}`}
                  className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 rounded-2xl border-2 border-line bg-surface px-2.5 py-1.5 shadow-card transition-all hover:border-lavender-deep"
                  style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 520) * 100}%` }}
                >
                  <span className="flex items-center gap-1">
                    <Icon size={15} className="text-lavender-deep" aria-hidden="true" />
                    <span className="text-[10px] font-black leading-none sm:text-xs">
                      {TOPIC_NAMES[topic]}
                    </span>
                  </span>
                  <span className="flex gap-0.5" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <Star
                        key={i}
                        size={9}
                        className={i < stars ? "text-sunny-deep" : "text-line-strong"}
                        fill={i < stars ? "currentColor" : "none"}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
            {SPECIAL_NODES.map(({ key, x, y, label, to }) => (
              <Link
                key={key}
                to={to}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border-2 border-dashed border-lavender-deep bg-lavender-soft px-3 py-1.5 text-[10px] font-black text-lavender-deep shadow-card transition-transform hover:scale-105 sm:text-xs"
                style={{ left: `${(x / 1000) * 100}%`, top: `${(y / 520) * 100}%` }}
              >
                <Sparkles size={12} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>

          {selected && (
            <div className="mt-3 rounded-3xl border border-line bg-surface p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight">{TOPIC_NAMES[selected]}</h2>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="min-h-9 rounded-full px-3 text-sm font-bold text-ink-soft hover:bg-cream"
                >
                  Закрыть
                </button>
              </div>
              <div className="space-y-2">
                {DIFFS.map((d) => (
                  <div key={d} className="flex flex-wrap items-center gap-2">
                    <span className="w-20 shrink-0 text-sm font-bold text-ink-soft">
                      {DIFFICULTY_NAMES[d]}
                    </span>
                    {MODES.map(({ m, label, Icon }) => (
                      <Link
                        key={m}
                        to={`/game/${selected}/${d}?mode=${m}`}
                        className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-surface px-2 py-2 text-xs font-bold transition-all hover:border-lavender-deep hover:text-lavender-deep"
                      >
                        <Icon size={14} aria-hidden="true" />
                        {label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section aria-label="Темы математики" className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPIC_GROUPS.map((group) => (
            <article key={group.name} className="rounded-3xl border border-line bg-surface p-5 shadow-card">
              <h2 className="mb-3 text-lg font-black tracking-tight">{group.name}</h2>
              <div className="space-y-3">
                {group.topics.map((topic) => (
                  <div key={topic}>
                    <p className="mb-1 text-sm font-bold">{TOPIC_NAMES[topic]}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DIFFS.map((d) => (
                        <Link
                          key={d}
                          to={`/game/${topic}/${d}`}
                          className="flex min-h-11 items-center rounded-xl border border-line-strong bg-cream px-3 py-1.5 text-xs font-bold transition-colors hover:border-lavender-deep hover:text-lavender-deep"
                        >
                          {DIFFICULTY_NAMES[d]}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
          <article className="flex flex-col justify-between rounded-3xl border border-dashed border-line-strong bg-surface/60 p-5">
            <div>
              <span
                className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-lavender-soft text-lavender-deep"
                aria-hidden="true"
              >
                <Sparkles size={22} strokeWidth={2.5} />
              </span>
              <h2 className="text-lg font-black tracking-tight">Ещё игры</h2>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                Мини-игры, олимпиада и дуэль ждут тебя.
              </p>
            </div>
            <Link
              to="/minigames"
              className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-ink px-4 py-2 text-sm font-bold text-cream transition-colors hover:bg-ink/85"
            >
              К мини-играм
            </Link>
          </article>
        </section>
      )}

      <WheelModal open={wheelOpen} onClose={() => setWheelOpen(false)} />
    </div>
  );
}
