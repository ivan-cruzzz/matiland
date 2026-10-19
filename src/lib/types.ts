import type { Task } from "./tasks";

export type BaseId = "cat" | "bunny" | "robot" | "dragon" | "alien";
export type BaseColor = "mint" | "lavender" | "peach" | "sunny" | "coral" | "sky";
export type CharColor = BaseColor | "golden" | "rainbow";
export type ColorUnlock = "golden" | "rainbow";

export type SlotId =
  | "hat"
  | "glasses"
  | "pet"
  | "background"
  | "frame"
  | "back"
  | "hand"
  | "pattern"
  | "friend";

export type RoomSlot = "wallpaper" | "floor" | "poster" | "toy" | "lamp";

export interface PetDesign {
  body: "blob" | "fluff";
  color: BaseColor;
  eyes: "dot" | "happy" | "star";
}

export interface DayRecord {
  /** Локальная дата YYYY-MM-DD */
  date: string;
  solved: number;
  correct: number;
}

export interface QuestState {
  id: string;
  progress: number;
}

export interface Player {
  id: string;
  name: string;
  base: BaseId;
  color: CharColor;
  coins: number;
  gems: number;
  xp: number;
  rounds: number;
  bestStreak: number;
  perfectCount: number;
  visits: number;
  /** Текущая серия дней входа */
  streakDays: number;
  lastVisit: string | null;
  owned: string[];
  equipped: Partial<Record<SlotId, string>>;
  history: DayRecord[];
  /** Статистика по типам задач: kind -> solved/correct */
  stats: Record<string, { solved: number; correct: number }>;
  /** Последние ошибочные задачи — возвращаются в следующих раундах */
  wrongTasks: Task[];
  quests: QuestState[];
  questsDone: string[];
  achievements: string[];
  season: { key: string; xp: number; claimed: number[] };
  daily: { date: string; done: boolean } | null;
  wheelLast: string | null;
  pendingChest: "small" | "big" | null;
  room: Partial<Record<RoomSlot, string>>;
  petName: string;
  /** Друг-компаньон: "base:color" */
  companion: string | null;
  customPet: PetDesign | null;
  rareColors: ColorUnlock[];
  olympiadBest: number;
  /** Родительский лимит игры, минут в день */
  limitMin: number | null;
  /** дата -> секунды игры */
  play: Record<string, number>;
}

export interface Toast {
  id: number;
  kind: "achievement" | "quest" | "level" | "chest" | "daily" | "info";
  title: string;
  text?: string;
}

export interface MetaState {
  profiles: Player[];
  activeId: string | null;
  sound: boolean;
  theme: "light" | "dark";
  parentPin: string | null;
  /** Дата последнего показа окна ежедневного входа */
  dailySeen: string | null;
  toasts: Toast[];
  toastSeq: number;
}

export const XP_PER_LEVEL = 100;
export const levelOf = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
export const xpIntoLevel = (xp: number) => xp % XP_PER_LEVEL;

export const RANKS: [number, string][] = [
  [1, "Новичок"],
  [3, "Ученик"],
  [5, "Считарка"],
  [7, "Знаток"],
  [10, "Мастер"],
  [15, "Магистр математики"],
];

export function rankOf(level: number): string {
  let rank = RANKS[0][1];
  for (const [lvl, name] of RANKS) {
    if (level >= lvl) rank = name;
  }
  return rank;
}

export const localDate = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const monthKey = (d = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
