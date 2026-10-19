import type { Player } from "./types";
import { levelOf, localDate } from "./types";
import type { Reward } from "./quests";

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  reward: Reward & { color?: "golden" | "rainbow" };
  check: (p: Player) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "a-first-round", name: "Первый шаг", desc: "Сыграть первый раунд", reward: { coins: 20 }, check: (p) => p.rounds >= 1 },
  { id: "a-rounds-10", name: "Десяточка", desc: "Сыграть 10 раундов", reward: { coins: 60 }, check: (p) => p.rounds >= 10 },
  { id: "a-rounds-50", name: "Полсотни", desc: "Сыграть 50 раундов", reward: { coins: 150, gems: 1 }, check: (p) => p.rounds >= 50 },
  { id: "a-streak-5", name: "Пятёрка подряд", desc: "Серия из 5 верных", reward: { coins: 40 }, check: (p) => p.bestStreak >= 5 },
  { id: "a-streak-10", name: "Десяточка подряд", desc: "Серия из 10 верных", reward: { coins: 80 }, check: (p) => p.bestStreak >= 10 },
  { id: "a-streak-20", name: "Двадцатка", desc: "Серия из 20 верных", reward: { coins: 160, gems: 2 }, check: (p) => p.bestStreak >= 20 },
  { id: "a-perfect-1", name: "Без ошибок", desc: "Идеальный раунд", reward: { coins: 50 }, check: (p) => p.perfectCount >= 1 },
  { id: "a-perfect-5", name: "Снайпер", desc: "5 идеальных раундов", reward: { coins: 140, gems: 1 }, check: (p) => p.perfectCount >= 5 },
  { id: "a-level-3", name: "Ученик", desc: "Достичь 3 уровня", reward: { coins: 70 }, check: (p) => levelOf(p.xp) >= 3 },
  { id: "a-level-5", name: "Крылышки", desc: "Достичь 5 уровня", reward: { coins: 120 }, check: (p) => levelOf(p.xp) >= 5 },
  { id: "a-level-10", name: "Мастер", desc: "Достичь 10 уровня", reward: { coins: 250, gems: 3 }, check: (p) => levelOf(p.xp) >= 10 },
  { id: "a-rich", name: "Богач", desc: "Накопить 500 монет", reward: { gems: 1 }, check: (p) => p.coins >= 500 },
  { id: "a-shop-5", name: "Модник", desc: "Купить 5 вещей", reward: { coins: 80 }, check: (p) => p.owned.length >= 5 },
  { id: "a-week", name: "Постоянство", desc: "Заходить 5 дней подряд", reward: { coins: 100, gems: 1 }, check: (p) => p.streakDays >= 5 },
  { id: "a-golden", name: "Золотой герой", desc: "Серия из 15 верных", reward: { coins: 120, color: "golden" }, check: (p) => p.bestStreak >= 15 },
  { id: "a-rainbow", name: "Радужный чемпион", desc: "10 идеальных раундов", reward: { gems: 3, color: "rainbow" }, check: (p) => p.perfectCount >= 10 },
];

/** Все достижения, выполняемые профилем, но ещё не открытые. */
export function pendingAchievements(p: Player): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !p.achievements.includes(a.id) && a.check(p));
}

export function achievementById(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Сколько секунд сегодня сыграно (для родительского лимита). */
export function playedTodaySeconds(p: Player): number {
  return p.play[localDate()] ?? 0;
}
