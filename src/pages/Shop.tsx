import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";
import { CharacterView } from "../components/character/CharacterView";
import { RoomScene } from "../components/character/RoomScene";
import { CoinIcon, GemIcon } from "../components/ui/coin-badge";
import { usePlayer } from "../store/PlayerContext";
import { levelOf } from "../lib/types";
import {
  itemsForCategory,
  SHOP_CATEGORIES,
  type ShopCategory,
  type ShopItem,
} from "../lib/shopItems";
import { dealPrice } from "../lib/economy";
import type { BaseId, CharColor, RoomSlot, SlotId } from "../lib/types";

const ROOM_SLOTS: string[] = ["wallpaper", "floor", "poster", "toy", "lamp"];

export default function Shop() {
  const { player, buyItem, toggleEquip, setRoomSlot, dealId } = usePlayer();
  const [category, setCategory] = useState<ShopCategory>("hat");

  if (!player) return null;
  const level = levelOf(player.xp);
  const items = itemsForCategory(category);

  const handleBuy = (item: ShopItem, deal: boolean) => {
    buyItem(item, deal);
  };

  const handleToggle = (item: ShopItem) => {
    if (ROOM_SLOTS.includes(item.slot)) {
      const slot = item.slot as RoomSlot;
      setRoomSlot(slot, player.room[slot] === item.id ? "" : item.id);
    } else if (item.slot !== "color") {
      toggleEquip(item.slot as SlotId, item.id);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Магазин</h1>
          <p className="text-sm text-ink-soft">
            Наряжай героя, обустраивай комнату, открывай легендарные вещи за самоцветы.
          </p>
        </div>
        <LinkToRoom />
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Категории товаров">
        {SHOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            aria-pressed={category === cat.id}
            className={`min-h-11 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
              category === cat.id
                ? "border-lavender-deep bg-lavender-soft text-lavender-deep"
                : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            base={player.base}
            color={player.color}
            owned={player.owned.includes(item.id)}
            equippedId={player.equipped[item.slot as SlotId]}
            activeRoom={player.room[item.slot as RoomSlot]}
            rareUnlocked={
              (item.id === "unlock-golden" && player.rareColors.includes("golden")) ||
              (item.id === "unlock-rainbow" && player.rareColors.includes("rainbow"))
            }
            coins={player.coins}
            gems={player.gems}
            level={level}
            isDeal={item.id === dealId && item.currency === "coins"}
            onBuy={handleBuy}
            onToggle={handleToggle}
          />
        ))}
      </ul>
    </div>
  );
}

function LinkToRoom() {
  return (
    <Link
      to="/room"
      className="min-h-11 rounded-full border border-line-strong bg-surface px-4 py-2 text-center text-sm font-bold transition-colors hover:border-lavender-deep hover:text-lavender-deep"
    >
      Моя комната
    </Link>
  );
}

interface CardProps {
  item: ShopItem;
  base: BaseId;
  color: CharColor;
  owned: boolean;
  equippedId: string | undefined;
  activeRoom: string | undefined;
  rareUnlocked: boolean;
  coins: number;
  gems: number;
  level: number;
  isDeal: boolean;
  onBuy: (item: ShopItem, deal: boolean) => void;
  onToggle: (item: ShopItem) => void;
}

function ShopItemCard({
  item,
  base,
  color,
  owned,
  equippedId,
  activeRoom,
  coins,
  gems,
  level,
  isDeal,
  onBuy,
  onToggle,
}: CardProps) {
  const isRoom = ROOM_SLOTS.includes(item.slot);
  const isColor = item.slot === "color";
  const equipped = owned && !isRoom && !isColor && equippedId === item.id;
  const roomActive = owned && isRoom && activeRoom === item.id;
  const locked = !owned && item.levelReq !== undefined && level < item.levelReq;
  const cost = isDeal ? dealPrice(item.price) : item.price;
  const affordable = item.currency === "gems" ? gems >= cost : coins >= cost;

  return (
    <motion.li layout className="rounded-3xl border border-line bg-surface p-4 shadow-card">
      <div className={`relative grid h-40 place-items-center overflow-hidden rounded-2xl bg-cream`}>
        {isRoom ? (
          <RoomScene room={{ [item.slot as RoomSlot]: item.id }} size={190} />
        ) : isColor ? (
          <div
            className="h-20 w-20 rounded-full border-4 border-white shadow-pop"
            style={{
              background:
                item.id === "unlock-golden"
                  ? "linear-gradient(135deg,#F9C440,#FFEFB8)"
                  : "linear-gradient(135deg,#FF948A,#FFD45E,#7ED4B4,#7FC2E6,#AB93E6)",
            }}
            aria-hidden="true"
          />
        ) : (
          <CharacterView
            base={base}
            color={color}
            equipped={{ [item.slot as SlotId]: item.id }}
            size={120}
          />
        )}
        {isDeal && (
          <span className="absolute left-2 top-2 rounded-full bg-coral-deep px-2.5 py-1 text-[10px] font-black text-cream">
            Товар дня −30%
          </span>
        )}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-black tracking-tight">{item.name}</h3>
        {owned && !isColor ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-mint-soft px-2.5 py-1 text-[11px] font-bold text-mint-deep">
            <Check size={12} aria-hidden="true" /> Куплено
          </span>
        ) : owned && isColor ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-lavender-soft px-2.5 py-1 text-[11px] font-bold text-lavender-deep">
            <Check size={12} aria-hidden="true" /> Открыто
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1 rounded-full border border-sunny bg-sunny-soft px-2.5 py-1 font-mono text-xs font-bold text-sunny-deep">
            {isDeal && <s className="opacity-60">{item.price}</s>}
            {item.currency === "gems" ? <GemIcon size={14} /> : <CoinIcon size={14} />}
            {cost}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-ink-mute">{SLOT_LABELS[item.slot] ?? ""}</p>

      <div className="mt-3">
        {owned && !isColor ? (
          <button
            type="button"
            onClick={() => onToggle(item)}
            aria-pressed={equipped || roomActive}
            className={`min-h-11 w-full rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors ${
              equipped || roomActive
                ? "border-mint-deep bg-mint-soft text-mint-deep hover:bg-mint/40"
                : "border-line-strong bg-surface text-ink hover:border-lavender-deep hover:text-lavender-deep"
            }`}
          >
            {isRoom
              ? roomActive
                ? "Применено — убрать?"
                : "Применить в комнате"
              : equipped
                ? "Надето — снять?"
                : "Надеть"}
          </button>
        ) : owned && isColor ? (
          <p className="min-h-11 rounded-xl bg-lavender-soft px-4 py-2.5 text-center text-sm font-bold text-lavender-deep">
            Окрас открыт — выбери в профиле
          </p>
        ) : locked ? (
          <button
            type="button"
            disabled
            className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-line bg-cream px-4 py-2 text-sm font-bold text-ink-mute"
          >
            <Lock size={14} aria-hidden="true" />
            С {item.levelReq} уровня
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onBuy(item, isDeal)}
            disabled={!affordable}
            className="min-h-11 w-full rounded-xl bg-ink px-4 py-2 text-sm font-bold text-cream transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {affordable
              ? `Купить за ${cost} ${item.currency === "gems" ? "самоцвет." : "монет"}`
              : "Не хватает"}
          </button>
        )}
      </div>
    </motion.li>
  );
}

const SLOT_LABELS: Record<string, string> = {
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
  color: "Окрас героя",
};
