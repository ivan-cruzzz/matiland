import type { Reward } from "./quests";
import { SHOP_ITEMS } from "./shopItems";

export const todayKey = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const seasonKey = (d = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

/* ---------- Сделка дня ---------- */

const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Товар дня (−30%), детерминированно от даты. */
export function dealOfTheDay(dateKeyStr = todayKey()): string | null {
  const pool = SHOP_ITEMS.filter((i) => !i.seasonal && i.currency === "coins");
  if (pool.length === 0) return null;
  return pool[hashString(dateKeyStr) % pool.length].id;
}

export function dealPrice(price: number): number {
  return Math.max(1, Math.round(price * 0.7));
}

/* ---------- Колесо удачи ---------- */

export interface WheelSegment {
  label: string;
  type: "coins" | "gems" | "chest";
  value: number;
  weight: number;
  color: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: "10", type: "coins", value: 10, weight: 24, color: "#A8E6CF" },
  { label: "20", type: "coins", value: 20, weight: 22, color: "#FFE38A" },
  { label: "35", type: "coins", value: 35, weight: 18, color: "#A6D8F0" },
  { label: "50", type: "coins", value: 50, weight: 14, color: "#C9B8F0" },
  { label: "×1", type: "gems", value: 1, weight: 8, color: "#FFD3B6" },
  { label: "?", type: "chest", value: 0, weight: 8, color: "#FFB3AB" },
  { label: "5", type: "coins", value: 5, weight: 6, color: "#E3F7EE" },
];

/** Индекс сегмента по весам. */
export function spinWheel(): number {
  const total = WHEEL_SEGMENTS.reduce((s, seg) => s + seg.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    roll -= WHEEL_SEGMENTS[i].weight;
    if (roll <= 0) return i;
  }
  return WHEEL_SEGMENTS.length - 1;
}

/* ---------- Сундуки ---------- */

export interface ChestLoot {
  coins?: number;
  gems?: number;
}

export function chestLoot(kind: "small" | "big"): ChestLoot {
  if (kind === "small") {
    const coins = 15 + Math.floor(Math.random() * 26); // 15–40
    return Math.random() < 0.12 ? { gems: 1 } : { coins };
  }
  const coins = 60 + Math.floor(Math.random() * 61); // 60–120
  return Math.random() < 0.35 ? { gems: 2, coins } : { coins };
}

/* ---------- Ежедневный вход ---------- */

/** Награда за вход: цикл из 7 дней. */
export function dailyReward(day: number): ChestLoot {
  const table: ChestLoot[] = [
    { coins: 10 },
    { coins: 15 },
    { coins: 20 },
    { coins: 25 },
    { gems: 1 },
    { coins: 40 },
    { coins: 60, gems: 1 },
  ];
  return table[(day - 1) % 7];
}

/* ---------- Сезонный пропуск ---------- */

export const SEASON_TIERS = 30;
export const SEASON_TIER_XP = 150;

/** Сезонные предметы выдаются на 5, 15 и 25 уровне пропуска. */
const SEASON_ITEM_TIERS: Record<number, string> = {
  5: "hat-boat",
  15: "bg-meadow",
  25: "fr-garland",
};

export function seasonReward(tier: number): Reward & { item?: string } {
  if (SEASON_ITEM_TIERS[tier]) return { item: SEASON_ITEM_TIERS[tier] };
  if (tier === SEASON_TIERS) return { coins: 200, gems: 5 };
  return tier % 2 === 0 ? { gems: 1 } : { coins: 40 };
}

export function seasonTierReached(seasonXp: number): number {
  return Math.min(SEASON_TIERS, Math.floor(seasonXp / SEASON_TIER_XP));
}
