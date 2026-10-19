import type { RoomSlot, SlotId } from "./types";

export type Currency = "coins" | "gems";
export type Hue = "mint" | "lavender" | "peach" | "sunny" | "coral" | "sky";

export interface ShopItem {
  id: string;
  slot: SlotId | RoomSlot | "color";
  name: string;
  price: number;
  currency: Currency;
  hue: Hue;
  levelReq?: number;
  /** Только через сезонный пропуск — в магазине не продаётся. */
  seasonal?: boolean;
  /** Скрытые служебные товары (свой питомец и т.п.). */
  hidden?: boolean;
}

export const SLOT_NAMES: Partial<Record<SlotId | RoomSlot | "color", string>> = {
  hat: "Шапки",
  glasses: "Очки",
  pet: "Питомцы",
  background: "Фоны",
  frame: "Рамки",
  back: "Крылья и плащи",
  hand: "Для лапки",
  pattern: "Узоры",
  friend: "Друзья",
  wallpaper: "Обои",
  floor: "Пол",
  poster: "Постеры",
  toy: "Игрушки",
  lamp: "Светильники",
  color: "Цвета",
};

export type ShopCategory =
  | "hat"
  | "glasses"
  | "pet"
  | "background"
  | "frame"
  | "back"
  | "hand"
  | "pattern"
  | "friend"
  | "room"
  | "legendary";

export const SHOP_CATEGORIES: { id: ShopCategory; name: string }[] = [
  { id: "hat", name: "Шапки" },
  { id: "glasses", name: "Очки" },
  { id: "pet", name: "Питомцы" },
  { id: "background", name: "Фоны" },
  { id: "frame", name: "Рамки" },
  { id: "back", name: "Крылья" },
  { id: "hand", name: "Лапка" },
  { id: "pattern", name: "Узоры" },
  { id: "friend", name: "Друзья" },
  { id: "room", name: "Комната" },
  { id: "legendary", name: "Легендарные" },
];

export const SHOP_ITEMS: ShopItem[] = [
  // Шапки
  { id: "hat-cap", slot: "hat", name: "Кепка", price: 30, currency: "coins", hue: "mint" },
  { id: "hat-party", slot: "hat", name: "Колпак", price: 45, currency: "coins", hue: "coral" },
  { id: "hat-flower", slot: "hat", name: "Цветок", price: 55, currency: "coins", hue: "peach" },
  { id: "hat-phones", slot: "hat", name: "Наушники", price: 75, currency: "coins", hue: "sky" },
  { id: "hat-wizard", slot: "hat", name: "Волшебная шляпа", price: 95, currency: "coins", hue: "lavender", levelReq: 2 },
  { id: "hat-crown", slot: "hat", name: "Корона", price: 130, currency: "coins", hue: "sunny", levelReq: 3 },
  { id: "hat-boat", slot: "hat", name: "Шляпа-кораблик", price: 0, currency: "coins", hue: "sky", seasonal: true },
  // Очки
  { id: "gl-round", slot: "glasses", name: "Круглые очки", price: 40, currency: "coins", hue: "sky" },
  { id: "gl-sun", slot: "glasses", name: "Солнечные очки", price: 65, currency: "coins", hue: "sunny" },
  { id: "gl-star", slot: "glasses", name: "Звёздные очки", price: 90, currency: "coins", hue: "lavender", levelReq: 2 },
  // Питомцы
  { id: "pet-star", slot: "pet", name: "Звёздочка", price: 60, currency: "coins", hue: "sunny" },
  { id: "pet-snail", slot: "pet", name: "Улитка", price: 75, currency: "coins", hue: "peach" },
  { id: "pet-chick", slot: "pet", name: "Цыплёнок", price: 90, currency: "coins", hue: "coral" },
  { id: "pet-ghost", slot: "pet", name: "Пушистый дух", price: 110, currency: "coins", hue: "lavender", levelReq: 2 },
  { id: "pet-custom", slot: "pet", name: "Свой питомец", price: 0, currency: "coins", hue: "mint", hidden: true },
  // Фоны
  { id: "bg-mint", slot: "background", name: "Мятные волны", price: 50, currency: "coins", hue: "mint" },
  { id: "bg-lavender", slot: "background", name: "Лавандовое небо", price: 50, currency: "coins", hue: "lavender" },
  { id: "bg-sunny", slot: "background", name: "Солнечные полосы", price: 70, currency: "coins", hue: "sunny" },
  { id: "bg-peach", slot: "background", name: "Персиковый закат", price: 85, currency: "coins", hue: "peach", levelReq: 2 },
  { id: "bg-sky", slot: "background", name: "Небо со звёздами", price: 100, currency: "coins", hue: "sky", levelReq: 3 },
  { id: "bg-meadow", slot: "background", name: "Полянка", price: 0, currency: "coins", hue: "mint", seasonal: true },
  // Рамки
  { id: "fr-dashed", slot: "frame", name: "Пунктирная рамка", price: 40, currency: "coins", hue: "mint" },
  { id: "fr-stars", slot: "frame", name: "Звёздная рамка", price: 90, currency: "coins", hue: "lavender", levelReq: 2 },
  { id: "fr-flowers", slot: "frame", name: "Цветочная рамка", price: 120, currency: "coins", hue: "coral", levelReq: 3 },
  { id: "fr-garland", slot: "frame", name: "Гирлянда", price: 0, currency: "coins", hue: "sunny", seasonal: true },
  // Крылья и плащи
  { id: "back-wings", slot: "back", name: "Крылышки", price: 150, currency: "coins", hue: "sky", levelReq: 4 },
  { id: "back-cape", slot: "back", name: "Плащ", price: 110, currency: "coins", hue: "coral", levelReq: 3 },
  // Для лапки
  { id: "hand-flag", slot: "hand", name: "Флажок", price: 45, currency: "coins", hue: "mint" },
  { id: "hand-icecream", slot: "hand", name: "Мороженое", price: 55, currency: "coins", hue: "peach" },
  { id: "hand-wand", slot: "hand", name: "Волшебная палочка", price: 90, currency: "coins", hue: "lavender", levelReq: 2 },
  // Узоры
  { id: "pat-stars", slot: "pattern", name: "Звёздочки", price: 60, currency: "coins", hue: "sunny" },
  { id: "pat-stripes", slot: "pattern", name: "Полоски", price: 50, currency: "coins", hue: "mint" },
  { id: "pat-hearts", slot: "pattern", name: "Сердечки", price: 60, currency: "coins", hue: "coral" },
  // Друзья
  { id: "friend-cat", slot: "friend", name: "Дружок-котик", price: 80, currency: "coins", hue: "peach" },
  { id: "friend-bunny", slot: "friend", name: "Дружок-зайчик", price: 80, currency: "coins", hue: "lavender" },
  { id: "friend-dragon", slot: "friend", name: "Дружок-дракоша", price: 120, currency: "coins", hue: "mint", levelReq: 3 },
  // Комната
  { id: "wall-plain", slot: "wallpaper", name: "Обои однотонные", price: 40, currency: "coins", hue: "mint" },
  { id: "wall-stars", slot: "wallpaper", name: "Обои со звёздами", price: 70, currency: "coins", hue: "lavender", levelReq: 2 },
  { id: "wall-rainbow", slot: "wallpaper", name: "Радужные обои", price: 100, currency: "coins", hue: "coral", levelReq: 3 },
  { id: "floor-wood", slot: "floor", name: "Деревянный пол", price: 40, currency: "coins", hue: "peach" },
  { id: "floor-carpet", slot: "floor", name: "Ковёр", price: 60, currency: "coins", hue: "lavender" },
  { id: "poster-math", slot: "poster", name: "Постер «Математика»", price: 50, currency: "coins", hue: "sky" },
  { id: "poster-space", slot: "poster", name: "Постер «Космос»", price: 70, currency: "coins", hue: "lavender", levelReq: 2 },
  { id: "toy-ball", slot: "toy", name: "Мячик", price: 45, currency: "coins", hue: "coral" },
  { id: "toy-bear", slot: "toy", name: "Медвежонок", price: 65, currency: "coins", hue: "peach", levelReq: 2 },
  { id: "lamp-star", slot: "lamp", name: "Светильник-звезда", price: 55, currency: "coins", hue: "sunny" },
  { id: "lamp-moon", slot: "lamp", name: "Светильник-луна", price: 80, currency: "coins", hue: "sky", levelReq: 3 },
  // Легендарные (самоцветы)
  { id: "hat-crown-gold", slot: "hat", name: "Золотая корона", price: 5, currency: "gems", hue: "sunny" },
  { id: "back-wings-rainbow", slot: "back", name: "Радужные крылья", price: 8, currency: "gems", hue: "lavender" },
  { id: "halo", slot: "back", name: "Нимб", price: 10, currency: "gems", hue: "sunny", levelReq: 8 },
  { id: "unlock-golden", slot: "color", name: "Золотой окрас", price: 8, currency: "gems", hue: "sunny" },
  { id: "unlock-rainbow", slot: "color", name: "Радужный окрас", price: 12, currency: "gems", hue: "lavender" },
];

export const itemById = (id: string | undefined) => SHOP_ITEMS.find((i) => i.id === id);

export function itemsForCategory(cat: ShopCategory): ShopItem[] {
  return SHOP_ITEMS.filter((i) => {
    if (i.seasonal || i.hidden) return false;
    if (cat === "legendary") return i.currency === "gems";
    if (cat === "room") return ["wallpaper", "floor", "poster", "toy", "lamp"].includes(i.slot);
    return i.slot === cat && i.currency === "coins";
  });
}
