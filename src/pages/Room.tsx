import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { RoomScene } from "../components/character/RoomScene";
import { usePlayer } from "../store/PlayerContext";
import { itemById, SLOT_NAMES } from "../lib/shopItems";
import type { RoomSlot } from "../lib/types";

const SLOTS: RoomSlot[] = ["wallpaper", "floor", "poster", "toy", "lamp"];

export default function Room() {
  const { player, setRoomSlot } = usePlayer();
  if (!player) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Комната героя</h1>
          <p className="text-sm text-ink-soft">Обустрой комнату, как захочешь.</p>
        </div>
        <Link
          to="/shop"
          className="flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream transition-colors hover:bg-ink/85"
        >
          <ShoppingBag size={16} aria-hidden="true" />
          Всё для комнаты
        </Link>
      </div>

      <div className="mb-5 grid place-items-center rounded-3xl border border-line bg-surface p-4 shadow-card">
        <RoomScene
          room={player.room}
          size={560}
          petName={player.petName}
          customPet={player.customPet}
          className="w-full max-w-xl"
        />
      </div>

      <section aria-label="Обстановка комнаты" className="space-y-4">
        {SLOTS.map((slot) => {
          const owned = player.owned.map(itemById).filter((i) => i && i.slot === slot);
          const active = player.room[slot];
          return (
            <div key={slot} className="rounded-3xl border border-line bg-surface p-4 shadow-card">
              <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ink-soft">
                {SLOT_NAMES[slot]}
              </h2>
              {owned.length === 0 ? (
                <p className="text-sm text-ink-mute">
                  Пока ничего нет — загляни в магазин в раздел «Комната».
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {owned.map(
                    (item) =>
                      item && (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRoomSlot(slot, active === item.id ? "" : item.id)}
                          aria-pressed={active === item.id}
                          className={`min-h-11 rounded-xl border-2 px-4 py-2 text-sm font-bold transition-colors ${
                            active === item.id
                              ? "border-mint-deep bg-mint-soft text-mint-deep"
                              : "border-line-strong bg-surface hover:border-lavender-deep"
                          }`}
                        >
                          {item.name}
                        </button>
                      ),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
