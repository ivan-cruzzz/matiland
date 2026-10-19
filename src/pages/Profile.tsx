import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, Flame, Palette, Pencil, PiggyBank, ShoppingBag, Sparkles, Trash2, Trophy } from "lucide-react";
import { CharacterView, CHAR_COLOR_LIST, CHAR_COLOR_NAMES } from "../components/character/CharacterView";
import LineChart, { type ChartDatum } from "../components/ui/line-chart";
import { CoinIcon, GemIcon } from "../components/ui/coin-badge";
import {
  usePlayer,
} from "../store/PlayerContext";
import { levelOf, rankOf, xpIntoLevel, XP_PER_LEVEL, type Player } from "../lib/types";
import { ACHIEVEMENTS } from "../lib/achievements";
import { itemById, type ShopItem } from "../lib/shopItems";
import type { CharColor, PetDesign, SlotId } from "../lib/types";

const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const dateKey = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function last7Days(player: Player): ChartDatum[] {
  const out: ChartDatum[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const rec = player.history.find((h) => h.date === key);
    out.push({
      label: `${WEEKDAYS[d.getDay()]}, ${key.slice(8)}.${key.slice(5, 7)}`,
      axisLabel: i === 0 ? "Сегодня" : WEEKDAYS[d.getDay()],
      values: { solved: rec?.solved ?? 0, correct: rec?.correct ?? 0 },
    });
  }
  return out;
}

/** Тепловая карта активности за последний год. */
function Heatmap({ player }: { player: Player }) {
  const cells: { key: string; solved: number }[] = [];
  const today = new Date();
  for (let i = 363; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const rec = player.history.find((h) => h.date === key);
    cells.push({ key, solved: rec?.solved ?? 0 });
  }
  const color = (solved: number) => {
    if (solved === 0) return "var(--color-line)";
    if (solved < 5) return "var(--color-mint)";
    if (solved < 15) return "#5FCBA4";
    if (solved < 30) return "#2FA97E";
    return "var(--color-mint-deep)";
  };
  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-surface p-4 shadow-card">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-ink-soft">
        Активность за год
      </p>
      <div
        className="grid grid-flow-col grid-rows-7 gap-[3px]"
        style={{ width: "max-content" }}
        role="img"
        aria-label="Тепловая карта решённых задач за год"
      >
        {cells.map((c) => (
          <span
            key={c.key}
            title={`${c.key}: ${c.solved} задач`}
            className="h-[11px] w-[11px] rounded-[3px]"
            style={{ background: color(c.solved) }}
          />
        ))}
      </div>
      <p className="mt-2 text-[11px] font-semibold text-ink-mute">
        Сегодня: {player.history.find((h) => h.date === dateKey(today))?.solved ?? 0} задач
      </p>
    </div>
  );
}

export default function Profile() {
  const {
    player,
    toggleEquip,
    resetActive,
    renamePet,
    repaint,
    setCustomPet,
    exchange,
  } = usePlayer();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [petNameDraft, setPetNameDraft] = useState<string | null>(null);
  const certRef = useRef<SVGSVGElement>(null);

  if (!player) return null;

  const level = levelOf(player.xp);
  const xpProgress = (xpIntoLevel(player.xp) / XP_PER_LEVEL) * 100;
  const ownedItems = player.owned.map(itemById).filter((i): i is ShopItem => Boolean(i));
  const characterOwned = ownedItems.filter(
    (i) => !["wallpaper", "floor", "poster", "toy", "lamp", "color"].includes(i.slot),
  );
  const days = last7Days(player);
  const petEquipped = player.equipped.pet === "pet-custom";

  const downloadCertificate = () => {
    const svg = certRef.current;
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gramota-${player.name}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Сцена персонажа */}
      <section className="flex flex-col items-center rounded-3xl border border-line bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <CharacterView
          base={player.base}
          color={player.color}
          equipped={player.equipped}
          level={level}
          size={230}
          stage
          companionBase={player.companion}
          customPet={player.customPet}
          className="shrink-0"
        />
        <div className="w-full text-center sm:text-left">
          <h1 className="text-3xl font-black tracking-tight">{player.name}</h1>
          <p className="mb-3 flex flex-wrap items-center justify-center gap-2 text-sm font-bold text-lavender-deep sm:justify-start">
            <span className="rounded-full bg-lavender-soft px-2.5 py-0.5">Уровень {level}</span>
            <span className="rounded-full bg-mint-soft px-2.5 py-0.5 text-mint-deep">{rankOf(level)}</span>
            <span className="text-ink-soft">
              Опыт: {xpIntoLevel(player.xp)}/{XP_PER_LEVEL}
            </span>
          </p>
          <div
            className="h-3 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={Math.round(xpProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Прогресс до следующего уровня"
          >
            <div
              className="h-full rounded-full bg-lavender-deep transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>

          <dl className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
            <div className="flex items-center gap-1.5 rounded-full border border-sunny bg-sunny-soft px-3.5 py-2 text-sm font-bold text-sunny-deep">
              <dt className="sr-only">Монеты</dt>
              <CoinIcon size={16} />
              <dd className="font-mono">{player.coins}</dd>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-line bg-cream px-3.5 py-2 text-sm font-bold">
              <dt className="sr-only">Самоцветы</dt>
              <GemIcon size={16} />
              <dd className="font-mono">{player.gems}</dd>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-line bg-cream px-3.5 py-2 text-sm font-bold">
              <dt className="sr-only">Раундов сыграно</dt>
              <Trophy size={16} className="text-ink-soft" aria-hidden="true" />
              <dd className="font-mono">{player.rounds}</dd>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-coral bg-coral-soft px-3.5 py-2 text-sm font-bold text-coral-deep">
              <dt className="sr-only">Лучшая серия</dt>
              <Flame size={16} aria-hidden="true" />
              <dd className="font-mono">{player.bestStreak}</dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            <Link
              to="/room"
              className="flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-bold transition-colors hover:border-lavender-deep hover:text-lavender-deep"
            >
              <Sparkles size={16} aria-hidden="true" />
              Моя комната
            </Link>
            <button
              type="button"
              onClick={downloadCertificate}
              className="flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream transition-colors hover:bg-ink/85"
            >
              <Download size={16} aria-hidden="true" />
              Грамота
            </button>
          </div>
        </div>
      </section>

      {/* Прогресс за неделю */}
      <section aria-label="Прогресс за неделю">
        <h2 className="mb-3 text-xl font-black tracking-tight">Прогресс за неделю</h2>
        <LineChart
          data={days}
          series={[
            { key: "solved", label: "Решено задач" },
            { key: "correct", label: "Верных ответов", dashed: true },
          ]}
          label="Решённые задачи по дням"
          height={190}
        />
      </section>

      {/* Тепловая карта */}
      <Heatmap player={player} />

      {/* Достижения */}
      <section aria-label="Достижения">
        <h2 className="mb-3 text-xl font-black tracking-tight">
          Достижения ({player.achievements.length}/{ACHIEVEMENTS.length})
        </h2>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const got = player.achievements.includes(a.id);
            return (
              <li
                key={a.id}
                className={`rounded-2xl border-2 p-3 text-center ${
                  got ? "border-sunny bg-sunny-soft" : "border-line bg-surface opacity-60"
                }`}
              >
                <Trophy
                  size={20}
                  className={`mx-auto mb-1 ${got ? "text-sunny-deep" : "text-ink-mute"}`}
                  aria-hidden="true"
                />
                <p className="text-xs font-black leading-tight">{a.name}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-ink-mute">{a.desc}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Гардероб */}
      <section aria-label="Гардероб">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black tracking-tight">Гардероб</h2>
          <Link
            to="/shop"
            className="flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream transition-colors hover:bg-ink/85"
          >
            <ShoppingBag size={16} aria-hidden="true" />
            В магазин
          </Link>
        </div>

        {characterOwned.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line-strong bg-surface/60 p-8 text-center">
            <p className="mb-1 font-bold">Пока пусто</p>
            <p className="text-sm text-ink-soft">Решай задачки, копи монеты и покупай вещи для героя!</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {characterOwned.map((item) => {
              const equipped = player.equipped[item.slot as SlotId] === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggleEquip(item.slot as SlotId, item.id)}
                    aria-pressed={equipped}
                    className={`w-full rounded-2xl border-2 p-2 text-left transition-all ${
                      equipped ? "border-mint-deep bg-mint-soft" : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <div className="grid h-24 place-items-center overflow-hidden rounded-xl bg-cream">
                      <CharacterView
                        base={player.base}
                        color={player.color}
                        equipped={{ ...player.equipped, [item.slot]: item.id }}
                        size={86}
                        stage={item.slot === "background" || item.slot === "frame"}
                      />
                    </div>
                    <p className="mt-1.5 px-1 text-xs font-bold">{item.name}</p>
                    <p className="px-1 pb-0.5 text-[11px] font-semibold text-ink-mute">
                      {equipped ? "Надето" : "Нажми, чтобы надеть"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Кличка питомца */}
        {player.equipped.pet && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-3">
            <Pencil size={16} className="text-ink-soft" aria-hidden="true" />
            <label htmlFor="pet-name" className="text-sm font-bold">
              Кличка питомца:
            </label>
            <input
              id="pet-name"
              value={petNameDraft ?? player.petName}
              onChange={(e) => setPetNameDraft(e.target.value)}
              maxLength={16}
              placeholder="Например, Пушок"
              className="min-h-11 flex-1 rounded-xl border-2 border-line-strong bg-cream px-3 py-1.5 text-sm font-semibold outline-none focus:border-lavender"
            />
            <button
              type="button"
              onClick={() => {
                renamePet((petNameDraft ?? player.petName).trim());
                setPetNameDraft(null);
              }}
              className="min-h-11 rounded-xl bg-ink px-4 py-1.5 text-sm font-bold text-cream hover:bg-ink/85"
            >
              Сохранить
            </button>
          </div>
        )}
      </section>

      {/* Перекраска */}
      <section aria-label="Окрас героя">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-black tracking-tight">
          <Palette size={20} aria-hidden="true" /> Окрас героя
        </h2>
        <div className="flex flex-wrap gap-2.5 rounded-3xl border border-line bg-surface p-4 shadow-card">
          {CHAR_COLOR_LIST.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => repaint(col)}
              aria-pressed={player.color === col}
              aria-label={CHAR_COLOR_NAMES[col]}
              title={CHAR_COLOR_NAMES[col]}
              className={`h-10 w-10 rounded-full border-[3px] transition-transform ${
                player.color === col ? "scale-110 border-ink" : "border-transparent hover:scale-105"
              }`}
              style={{ background: `var(--color-${col})` }}
            />
          ))}
          {player.rareColors.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => repaint(col)}
              aria-pressed={player.color === col}
              aria-label={CHAR_COLOR_NAMES[col as CharColor]}
              title={CHAR_COLOR_NAMES[col as CharColor]}
              className={`h-10 w-10 rounded-full border-[3px] transition-transform ${
                player.color === col ? "scale-110 border-ink" : "border-transparent hover:scale-105"
              }`}
              style={{
                background:
                  col === "golden"
                    ? "linear-gradient(135deg,#F9C440,#FFEFB8)"
                    : "linear-gradient(135deg,#FF948A,#FFD45E,#7ED4B4,#7FC2E6,#AB93E6)",
              }}
            />
          ))}
          {player.rareColors.length < 2 && (
            <Link
              to="/shop"
              className="flex min-h-10 items-center rounded-full border border-dashed border-line-strong px-3 text-xs font-bold text-ink-mute hover:text-ink"
            >
              Ещё цвета — в «Легендарных»
            </Link>
          )}
        </div>
      </section>

      {/* Свой питомец + банк */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <h2 className="mb-2 font-black tracking-tight">Свой питомец</h2>
          {player.customPet ? (
            <div className="flex items-center gap-3">
              <svg viewBox="150 150 70 70" width={64} height={64} aria-hidden="true">
                <PetGlyph design={player.customPet} />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Уже живёт у героя{petEquipped ? " и надет" : ""}.
                </p>
                <button
                  type="button"
                  onClick={() => setBuilderOpen(true)}
                  className="mt-1 min-h-9 rounded-full border border-line-strong px-3 py-1 text-xs font-bold hover:border-lavender-deep hover:text-lavender-deep"
                >
                  Изменить
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-ink-soft">
                Собери питомца мечты — он появится рядом с героем.
              </p>
              <button
                type="button"
                onClick={() => setBuilderOpen(true)}
                className="min-h-11 w-full rounded-xl bg-lavender-deep px-4 py-2 text-sm font-bold text-cream transition-opacity hover:opacity-90"
              >
                Создать питомца
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-line bg-surface p-5 shadow-card">
          <h2 className="mb-2 flex items-center gap-2 font-black tracking-tight">
            <PiggyBank size={20} aria-hidden="true" /> Банк
          </h2>
          <p className="mb-3 text-sm text-ink-soft">Обменяй монеты на опыт или опыт на монеты.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exchange("coinsToXp")}
              disabled={player.coins < 100}
              className="min-h-11 flex-1 rounded-xl border-2 border-line-strong px-3 py-2 text-xs font-bold transition-colors hover:border-lavender-deep disabled:opacity-40"
            >
              100 монет → 20 опыта
            </button>
            <button
              type="button"
              onClick={() => exchange("xpToCoins")}
              disabled={player.xp < XP_PER_LEVEL}
              className="min-h-11 flex-1 rounded-xl border-2 border-line-strong px-3 py-2 text-xs font-bold transition-colors hover:border-lavender-deep disabled:opacity-40"
            >
              100 опыта → 40 монет
            </button>
          </div>
        </div>
      </section>

      {/* Сброс прогресса */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-coral-deep transition-colors hover:bg-coral-soft"
        >
          <Trash2 size={15} aria-hidden="true" />
          Начать заново
        </button>
      </div>

      {/* Скрытая грамота */}
      <svg ref={certRef} className="sr-only" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" rx="24" fill="#FDF8F2" stroke="#C9B8F0" strokeWidth="6" />
        <rect
          x="14"
          y="14"
          width="372"
          height="272"
          rx="16"
          fill="none"
          stroke="#FFE38A"
          strokeWidth="2"
          strokeDasharray="8 6"
        />
        <text x="200" y="56" textAnchor="middle" fontSize="24" fontWeight="900" fill="#3D3A37" fontFamily="Nunito, sans-serif">
          ГРАМОТА
        </text>
        <text x="200" y="86" textAnchor="middle" fontSize="13" fill="#6F6862" fontFamily="Nunito, sans-serif">
          Матилэнд — страна весёлой математики
        </text>
        <text x="200" y="126" textAnchor="middle" fontSize="20" fontWeight="700" fill="#6D4FC2" fontFamily="Nunito, sans-serif">
          {player.name}
        </text>
        <text x="200" y="152" textAnchor="middle" fontSize="12" fill="#3D3A37" fontFamily="Nunito, sans-serif">
          уровень {level} · {player.rounds} раундов · серия {player.bestStreak}
        </text>
        <text x="200" y="172" textAnchor="middle" fontSize="12" fill="#3D3A37" fontFamily="Nunito, sans-serif">
          звание: {rankOf(level)}
        </text>
        <foreignObject x="150" y="180" width="100" height="100">
          <CharacterView base={player.base} color={player.color} equipped={player.equipped} size={100} />
        </foreignObject>
        <text x="200" y="284" textAnchor="middle" fontSize="10" fill="#A39A90" fontFamily="Nunito, sans-serif">
          {new Date().toLocaleDateString("ru-RU")}
        </text>
      </svg>

      {/* Конструктор питомца */}
      <PetBuilder
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        initial={player.customPet}
        onSave={(design) => {
          setCustomPet(design);
          setBuilderOpen(false);
        }}
      />

      {/* Сброс */}
      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-surface p-6 shadow-pop">
            <Dialog.Title className="text-xl font-black tracking-tight">Начать заново?</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-ink-soft">
              Монеты, покупки и прогресс героя «{player.name}» исчезнут навсегда.
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="min-h-11 rounded-full border border-line-strong px-5 py-2 text-sm font-bold transition-colors hover:bg-cream"
                >
                  Отмена
                </button>
              </Dialog.Close>
              <Dialog.Close asChild>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false);
                    resetActive();
                  }}
                  className="min-h-11 rounded-full bg-coral-deep px-5 py-2 text-sm font-bold text-white transition-colors hover:opacity-90"
                >
                  Стереть всё
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function PetGlyph({ design }: { design: PetDesign }) {
  const colors: Record<string, string> = {
    mint: "#A8E6CF",
    lavender: "#C9B8F0",
    peach: "#FFD3B6",
    sunny: "#FFE38A",
    coral: "#FFB3AB",
    sky: "#A6D8F0",
  };
  const main = colors[design.color] ?? "#A8E6CF";
  return (
    <g>
      {design.body === "blob" ? (
        <rect x={165} y={165} width={40} height={36} rx={17} fill={main} stroke="#3D3A37" strokeWidth={2.5} />
      ) : (
        <g>
          <circle cx={176} cy={182} r={10} fill={main} stroke="#3D3A37" strokeWidth={2.5} />
          <circle cx={192} cy={182} r={10} fill={main} stroke="#3D3A37" strokeWidth={2.5} />
          <circle cx={184} cy={175} r={12} fill={main} stroke="#3D3A37" strokeWidth={2.5} />
        </g>
      )}
      {design.eyes === "happy" ? (
        <g fill="none" stroke="#3D3A37" strokeWidth={2} strokeLinecap="round">
          <path d="M176 180 Q179 177 182 180" />
          <path d="M187 180 Q190 177 193 180" />
        </g>
      ) : design.eyes === "star" ? (
        <g fill="#FFE38A" stroke="#3D3A37" strokeWidth={0.8}>
          <rect x={177} y={178} width={4} height={4} transform="rotate(15 179 180)" />
          <rect x={188} y={178} width={4} height={4} transform="rotate(15 190 180)" />
        </g>
      ) : (
        <g>
          <circle cx={179} cy={180} r={2.4} fill="#3D3A37" />
          <circle cx={190} cy={180} r={2.4} fill="#3D3A37" />
        </g>
      )}
      <path d="M181 186 Q185 189 189 186" fill="none" stroke="#3D3A37" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

/** Конструктор собственного питомца. */
function PetBuilder({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: PetDesign | null;
  onSave: (design: PetDesign) => void;
}) {
  const [body, setBody] = useState<PetDesign["body"]>(initial?.body ?? "blob");
  const [color, setColor] = useState<PetDesign["color"]>(initial?.color ?? "mint");
  const [eyes, setEyes] = useState<PetDesign["eyes"]>(initial?.eyes ?? "dot");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-label="Конструктор питомца"
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-pop">
        <h2 className="mb-1 text-2xl font-black tracking-tight">Собери питомца</h2>
        <p className="mb-4 text-sm text-ink-soft">Тело, цвет и глазки — на твой вкус.</p>

        <div className="mb-4 grid place-items-center rounded-3xl bg-cream p-4">
          <svg viewBox="150 150 70 70" width={130} height={130} aria-hidden="true">
            <PetGlyph design={{ body, color, eyes }} />
          </svg>
        </div>

        <fieldset className="mb-3">
          <legend className="mb-1.5 text-sm font-bold">Тело</legend>
          <div className="flex gap-2">
            {(["blob", "fluff"] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBody(b)}
                aria-pressed={body === b}
                className={`min-h-11 flex-1 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
                  body === b ? "border-lavender-deep bg-lavender-soft text-lavender-deep" : "border-line"
                }`}
              >
                {b === "blob" ? "Клякса" : "Пушистик"}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-3">
          <legend className="mb-1.5 text-sm font-bold">Цвет</legend>
          <div className="flex flex-wrap gap-2">
            {CHAR_COLOR_LIST.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => setColor(col)}
                aria-pressed={color === col}
                aria-label={CHAR_COLOR_NAMES[col]}
                className={`h-9 w-9 rounded-full border-[3px] transition-transform ${
                  color === col ? "scale-110 border-ink" : "border-transparent"
                }`}
                style={{ background: `var(--color-${col})` }}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="mb-1.5 text-sm font-bold">Глазки</legend>
          <div className="flex gap-2">
            {(["dot", "happy", "star"] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEyes(e)}
                aria-pressed={eyes === e}
                className={`min-h-11 flex-1 rounded-xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
                  eyes === e ? "border-lavender-deep bg-lavender-soft text-lavender-deep" : "border-line"
                }`}
              >
                {e === "dot" ? "Точки" : e === "happy" ? "Счастливые" : "Звёзды"}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-2xl border-2 border-line-strong px-4 py-3 font-bold transition-colors hover:bg-cream"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onSave({ body, color, eyes })}
            className="min-h-12 flex-1 rounded-2xl bg-ink px-4 py-3 font-bold text-cream hover:bg-ink/85"
          >
            Приручить!
          </button>
        </div>
      </div>
    </div>
  );
}
