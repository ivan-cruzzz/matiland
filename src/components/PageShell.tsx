import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Plus, Star, Sun, UserRound, Volume2, VolumeX } from "lucide-react";
import FloatingDock from "./ui/floating-dock";
import CoinBadge, { GemBadge } from "./ui/coin-badge";
import ToastStack from "./ui/toasts";
import { ChestModal, DailyModal } from "./ui/reward-modals";
import { CharacterView } from "./character/CharacterView";
import { usePlayer } from "../store/PlayerContext";
import { playSound } from "../lib/sound";
import { pickQuests } from "../lib/quests";
import { localDate } from "../lib/types";

/** Падающий сезонный декор: листья (IX–XI), снег (XII–II), лепестки (III–V), блики (VI–VIII). */
function SeasonDecor() {
  const month = new Date().getMonth();
  const season =
    month >= 8 && month <= 10
      ? "leaves"
      : month === 11 || month <= 1
        ? "snow"
        : month >= 2 && month <= 4
          ? "petals"
          : "sun";
  const colors: Record<string, string[]> = {
    leaves: ["#E8A25C", "#C97B3D", "#D9902F"],
    snow: ["#FFFFFF", "#DCEFFB", "#C9E4F5"],
    petals: ["#FFD3DE", "#FFC4E1", "#FFE3EC"],
    sun: ["#FFE38A", "#FFF3C4"],
  };
  const round = season === "snow" || season === "sun";
  const items = Array.from({ length: 12 });
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {items.map((_, i) => (
        <motion.span
          key={i}
          className={round ? "absolute rounded-full" : "absolute"}
          style={{
            left: `${(i * 8.5 + 4) % 100}%`,
            width: season === "snow" ? 7 : season === "sun" ? 5 : 13,
            height: season === "snow" ? 7 : season === "sun" ? 5 : 15,
            background: colors[season][i % colors[season].length],
            top: -20,
          }}
          animate={{ y: ["-20px", "110vh"], rotate: [0, 360], opacity: [0, 0.75, 0.75, 0] }}
          transition={{
            duration: 14 + (i % 5) * 3,
            repeat: Infinity,
            delay: i * 2.2,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

export default function PageShell({ children }: { children: ReactNode }) {
  const {
    player,
    profiles,
    meta,
    setSound,
    setTheme,
    switchProfile,
    heartbeat,
    assignQuests,
    markDailySeen,
  } = usePlayer();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Визит: серия дней + подарок
  useEffect(() => {
    heartbeat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id]);

  // Выдача трёх активных квестов
  useEffect(() => {
    if (player && player.quests.length < 3) {
      assignQuests(pickQuests(player.questsDone));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id, player?.quests.length]);

  const dailyOpen = Boolean(player) && meta.dailySeen !== localDate();

  return (
    <div className="relative min-h-dvh">
      <SeasonDecor />
      <ToastStack />
      <ChestModal />
      <DailyModal open={dailyOpen} onClose={markDailySeen} />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:shadow-pop"
      >
        К основному содержанию
      </a>

      <header className="relative z-10 mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 pt-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-black tracking-tight text-ink"
          aria-label="Матилэнд — на главную"
        >
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-lavender" aria-hidden="true">
            <Star size={20} className="text-white" fill="currentColor" />
          </span>
          Матилэнд
        </Link>

        {player && (
          <div className="flex flex-wrap items-center gap-1.5">
            <CoinBadge coins={player.coins} />
            <GemBadge gems={player.gems} />
            <button
              type="button"
              onClick={() => {
                setSound(!meta.sound);
                if (!meta.sound) playSound("click", true);
              }}
              aria-pressed={meta.sound}
              aria-label={meta.sound ? "Выключить звук" : "Включить звук"}
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:text-ink"
            >
              {meta.sound ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={() => setTheme(meta.theme === "dark" ? "light" : "dark")}
              aria-pressed={meta.theme === "dark"}
              aria-label={meta.theme === "dark" ? "Светлая тема" : "Ночная тема"}
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-ink-soft transition-colors hover:text-ink"
            >
              {meta.theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>

            {/* Переключатель профилей */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSwitcherOpen((o) => !o)}
                aria-expanded={switcherOpen}
                aria-label="Профили"
                className="flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1 pr-3 transition-colors hover:border-lavender"
              >
                <CharacterView base={player.base} color={player.color} size={30} head />
                <span className="max-w-20 truncate text-sm font-bold">{player.name}</span>
              </button>
              <AnimatePresence>
                {switcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-line bg-surface p-2 shadow-pop"
                    role="menu"
                  >
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          switchProfile(p.id);
                          setSwitcherOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-bold transition-colors hover:bg-cream ${
                          p.id === player.id ? "text-lavender-deep" : ""
                        }`}
                      >
                        <CharacterView base={p.base} color={p.color} size={28} head />
                        <span className="truncate">{p.name}</span>
                        {p.id === player.id && <span className="ml-auto text-xs">●</span>}
                      </button>
                    ))}
                    <Link
                      to="/onboarding?add=1"
                      onClick={() => setSwitcherOpen(false)}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-lavender-deep transition-colors hover:bg-cream"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-lavender-soft" aria-hidden="true">
                        <Plus size={16} />
                      </span>
                      Новый герой
                    </Link>
                    <Link
                      to="/parent"
                      onClick={() => setSwitcherOpen(false)}
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-ink-soft transition-colors hover:bg-cream"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-cream" aria-hidden="true">
                        <UserRound size={15} />
                      </span>
                      Родителям
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </header>

      <main id="main" className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-10 pt-5">
        {children}
      </main>

      <footer className="relative z-10 pb-28 text-center">
        <Link to="/parent" className="text-xs font-bold text-ink-mute transition-colors hover:text-ink">
          Родителям
        </Link>
      </footer>

      <FloatingDock />
    </div>
  );
}
