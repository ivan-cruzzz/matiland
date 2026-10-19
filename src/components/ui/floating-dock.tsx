import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Gamepad2, Home, ShoppingBag, Sparkles } from "lucide-react";
import { CharacterView } from "../character/CharacterView";
import { usePlayer } from "../../store/PlayerContext";

const NAV_ITEMS = [
  { to: "/", label: "Игры", icon: "games" },
  { to: "/minigames", label: "Мини-игры", icon: "mini" },
  { to: "/shop", label: "Магазин", icon: "shop" },
  { to: "/assistant", label: "Умня", icon: "spark" },
  { to: "/profile", label: "Профиль", icon: "profile" },
] as const;

/** Плавающий док из miniDESIGN: стекло, каскадный масштаб, точка-индикатор. */
export default function FloatingDock() {
  const [hovered, setHovered] = useState<number | null>(null);
  const { player } = usePlayer();

  const scaleFor = (i: number) => {
    if (hovered === null) return 1;
    const d = Math.abs(hovered - i);
    return d === 0 ? 1.35 : d === 1 ? 1.15 : d === 2 ? 1.05 : 1;
  };

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 sm:bottom-8"
    >
      <div className="rounded-2xl border border-line/60 bg-surface/80 p-3 shadow-dock backdrop-blur-xl">
        <ul className="flex items-end gap-1.5 sm:gap-2">
          {NAV_ITEMS.map((item, i) => (
            <li key={item.to} className="relative">
              <NavLink
                to={item.to}
                end={item.to === "/"}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                aria-label={item.label}
                style={{ transform: `scale(${scaleFor(i)})`, transformOrigin: "bottom" }}
                className={({ isActive }) =>
                  `flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ease-out hover:bg-cream ${
                    isActive ? "bg-lavender-soft" : ""
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.icon === "profile" && player ? (
                      <CharacterView
                        base={player.base}
                        color={player.color}
                        equipped={player.equipped}
                        level={Math.floor(player.xp / 100) + 1}
                        size={30}
                        head
                      />
                    ) : item.icon === "games" ? (
                      <Home size={22} strokeWidth={2} aria-hidden="true" className={isActive ? "text-lavender-deep" : "text-ink-soft"} />
                    ) : item.icon === "mini" ? (
                      <Gamepad2 size={22} strokeWidth={2} aria-hidden="true" className={isActive ? "text-lavender-deep" : "text-ink-soft"} />
                    ) : item.icon === "shop" ? (
                      <ShoppingBag size={22} strokeWidth={2} aria-hidden="true" className={isActive ? "text-lavender-deep" : "text-ink-soft"} />
                    ) : (
                      <Sparkles size={22} strokeWidth={2} aria-hidden="true" className={isActive ? "text-lavender-deep" : "text-ink-soft"} />
                    )}
                    {isActive && (
                      <span
                        className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-lavender-deep"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
              {hovered === i && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-cream after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-ink"
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
