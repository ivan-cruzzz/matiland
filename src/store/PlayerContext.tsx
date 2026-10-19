import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { Task } from "../lib/tasks";
import { pendingAchievements } from "../lib/achievements";
import {
  chestLoot,
  dealOfTheDay,
  dealPrice,
  dailyReward,
  seasonKey,
  seasonReward,
  seasonTierReached,
  todayKey,
  WHEEL_SEGMENTS,
  type ChestLoot,
} from "../lib/economy";
import { questById, type QuestDef, type Reward } from "../lib/quests";
import { itemById, type ShopItem } from "../lib/shopItems";
import {
  levelOf,
  localDate,
  monthKey,
  XP_PER_LEVEL,
  type BaseColor,
  type BaseId,
  type CharColor,
  type ColorUnlock,
  type MetaState,
  type PetDesign,
  type Player,
  type QuestState,
  type RoomSlot,
  type SlotId,
  type Toast,
} from "../lib/types";

const STORAGE_KEY = "matiland-meta-v2";
const LEGACY_KEY = "matiland-player-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

function newPlayer(name: string, base: BaseId, color: BaseColor): Player {
  return {
    id: uid(),
    name,
    base,
    color,
    coins: 100,
    gems: 0,
    xp: 0,
    rounds: 0,
    bestStreak: 0,
    perfectCount: 0,
    visits: 1,
    streakDays: 1,
    lastVisit: localDate(),
    owned: [],
    equipped: {},
    history: [],
    stats: {},
    wrongTasks: [],
    quests: [],
    questsDone: [],
    achievements: [],
    season: { key: monthKey(), xp: 0, claimed: [] },
    daily: null,
    wheelLast: null,
    pendingChest: null,
    room: {},
    petName: "",
    companion: null,
    customPet: null,
    rareColors: [],
    olympiadBest: 0,
    limitMin: null,
    play: {},
  };
}

function emptyMeta(): MetaState {
  return {
    profiles: [],
    activeId: null,
    sound: true,
    theme: "light",
    parentPin: null,
    dailySeen: null,
    toasts: [],
    toastSeq: 1,
  };
}

function migrateLegacy(): MetaState | null {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw) as Record<string, unknown>;
    if (typeof old?.name !== "string") return null;
    const p = newPlayer(old.name as string, old.base as BaseId, old.color as BaseColor);
    p.coins = typeof old.coins === "number" ? old.coins : 100;
    p.xp = typeof old.xp === "number" ? old.xp : 0;
    p.rounds = typeof old.rounds === "number" ? old.rounds : 0;
    p.bestStreak = typeof old.bestStreak === "number" ? old.bestStreak : 0;
    p.owned = Array.isArray(old.owned) ? (old.owned as string[]) : [];
    p.equipped = (old.equipped as Player["equipped"]) ?? {};
    p.history = Array.isArray(old.history) ? (old.history as Player["history"]) : [];
    return { ...emptyMeta(), profiles: [p], activeId: p.id };
  } catch {
    return null;
  }
}

function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacy() ?? emptyMeta();
    const parsed = JSON.parse(raw) as MetaState;
    if (!Array.isArray(parsed?.profiles)) return migrateLegacy() ?? emptyMeta();
    return { ...emptyMeta(), ...parsed, toasts: [] };
  } catch {
    return migrateLegacy() ?? emptyMeta();
  }
}

export interface FinishPayload {
  /** Статистика по типам задач: kind -> solved/correct */
  kindStats: Record<string, { solved: number; correct: number }>;
  solved: number;
  correct: number;
  streak: number;
  perfect: boolean;
  coins: number;
  gems: number;
  xp: number;
  seconds: number;
  wrongTasks: Task[];
  chest?: "small" | "big" | null;
  seasonXp?: number;
  /** Метка особого режима (например, «daily») */
  label?: string;
}

type Action =
  | { type: "create"; name: string; base: BaseId; color: BaseColor }
  | { type: "switch"; id: string }
  | { type: "delete"; id: string }
  | { type: "setSound"; on: boolean }
  | { type: "setTheme"; theme: "light" | "dark" }
  | { type: "setPin"; pin: string | null }
  | { type: "setLimit"; min: number | null }
  | { type: "heartbeat" }
  | { type: "dailySeen" }
  | { type: "assignQuests"; quests: QuestState[] }
  | { type: "finishGame"; payload: FinishPayload }
  | { type: "buy"; item: ShopItem; deal: boolean }
  | { type: "toggleEquip"; slot: SlotId; itemId: string }
  | { type: "setRoomSlot"; slot: RoomSlot; itemId: string }
  | { type: "renamePet"; name: string }
  | { type: "setCustomPet"; design: PetDesign }
  | { type: "repaint"; color: CharColor }
  | { type: "gift"; toId: string; amount: number }
  | { type: "claimSeason"; tier: number }
  | { type: "applyWheel"; segIndex: number }
  | { type: "openChest"; loot: ChestLoot }
  | { type: "completeDaily" }
  | { type: "olympiad"; stage: number; coins: number; gems: number }
  | { type: "exchange"; dir: "coinsToXp" | "xpToCoins" }
  | { type: "addPlay"; seconds: number }
  | { type: "dismissToast"; id: number }
  | { type: "resetActive" };

function toast(meta: MetaState, kind: Toast["kind"], title: string, text?: string): MetaState {
  const t: Toast = { id: meta.toastSeq, kind, title, text };
  return { ...meta, toastSeq: meta.toastSeq + 1, toasts: [...meta.toasts, t].slice(-5) };
}

function grantReward(p: Player, r: Reward): Player {
  return {
    ...p,
    coins: p.coins + (r.coins ?? 0),
    gems: p.gems + (r.gems ?? 0),
  };
}

/** Прогресс квестов по метрикам раунда; завершённые — с наградой и тостом. */
function advanceQuests(meta: MetaState, p: Player, payload: FinishPayload): { player: Player; meta: MetaState } {
  let player = p;
  let m = meta;
  const quests: QuestState[] = [];
  for (const q of p.quests) {
    const def = questById(q.id);
    if (!def) continue;
    let progress = q.progress;
    switch (def.metric) {
      case "tasks":
        progress += payload.solved;
        break;
      case "rounds":
        progress += 1;
        break;
      case "streak":
        progress = Math.max(progress, payload.streak);
        break;
      case "perfect":
        progress += payload.perfect ? 1 : 0;
        break;
      case "buys":
        break;
      default: {
        const key = def.metric.slice("topic:".length);
        progress += payload.kindStats[key]?.correct ?? 0;
        break;
      }
    }
    if (progress >= def.goal) {
      player = grantReward(player, def.reward);
      player = { ...player, questsDone: [...player.questsDone, q.id] };
      m = toast(
        m,
        "quest",
        "Квест выполнен!",
        `${def.text} · +${def.reward.coins ?? 0}${def.reward.gems ? ` и ${def.reward.gems} самоцвет.` : " монет"}`,
      );
    } else {
      quests.push({ ...q, progress });
    }
  }
  player = { ...player, quests };
  return { player, meta: m };
}

function checkAchievements(meta: MetaState, p: Player): { player: Player; meta: MetaState } {
  let player = p;
  let m = meta;
  for (const a of pendingAchievements(p)) {
    player = grantReward(player, a.reward);
    player = { ...player, achievements: [...player.achievements, a.id] };
    if (a.reward.color) {
      player = { ...player, rareColors: [...player.rareColors, a.reward.color] };
    }
    m = toast(m, "achievement", `Достижение: ${a.name}`, a.desc);
  }
  return { player, meta: m };
}

function applyAll(meta: MetaState, p: Player): MetaState {
  const ach = checkAchievements(meta, p);
  return updateActive(ach.meta, () => ach.player);
}

function updateActive(meta: MetaState, fn: (p: Player) => Player): MetaState {
  return {
    ...meta,
    profiles: meta.profiles.map((p) => (p.id === meta.activeId ? fn(p) : p)),
  };
}

function activeOf(meta: MetaState): Player | null {
  return meta.profiles.find((p) => p.id === meta.activeId) ?? null;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function reducer(meta: MetaState, action: Action): MetaState {
  switch (action.type) {
    case "create": {
      const p = newPlayer(action.name.trim() || "Герой", action.base, action.color);
      return { ...meta, profiles: [...meta.profiles, p], activeId: p.id };
    }
    case "switch":
      return { ...meta, activeId: action.id };
    case "delete": {
      const profiles = meta.profiles.filter((p) => p.id !== action.id);
      return {
        ...meta,
        profiles,
        activeId: meta.activeId === action.id ? (profiles[0]?.id ?? null) : meta.activeId,
      };
    }
    case "setSound":
      return { ...meta, sound: action.on };
    case "setTheme":
      return { ...meta, theme: action.theme };
    case "setPin":
      return { ...meta, parentPin: action.pin };
    case "setLimit":
      return updateActive(meta, (p) => ({ ...p, limitMin: action.min }));
    case "heartbeat": {
      const p = activeOf(meta);
      if (!p) return meta;
      const today = localDate();
      if (p.lastVisit === today) return meta;
      const streakDays = p.lastVisit === yesterdayKey() ? p.streakDays + 1 : 1;
      const reward = dailyReward(streakDays);
      const next = grantReward(
        { ...p, lastVisit: today, streakDays, visits: p.visits + 1 },
        reward,
      );
      const m = toast(
        meta,
        "daily",
        `День ${streakDays} подряд!`,
        `Подарок за вход: +${reward.coins ?? 0}${reward.gems ? ` и ${reward.gems} самоцвет` : " монет"}`,
      );
      return updateActive(m, () => next);
    }
    case "dailySeen":
      return { ...meta, dailySeen: todayKey() };
    case "assignQuests": {
      const p = activeOf(meta);
      if (!p || p.quests.length >= 3) return meta;
      const have = new Set(p.quests.map((q) => q.id));
      const done = new Set(p.questsDone);
      const add = action.quests
        .filter((q) => !have.has(q.id) && !done.has(q.id))
        .slice(0, 3 - p.quests.length);
      if (add.length === 0) return meta;
      return updateActive(meta, (pl) => ({ ...pl, quests: [...pl.quests, ...add] }));
    }
    case "finishGame": {
      const p = activeOf(meta);
      if (!p) return meta;
      const payload = action.payload;
      const beforeLevel = levelOf(p.xp);
      const today = localDate();
      const sk = seasonKey();
      const season = p.season.key === sk ? p.season : { key: sk, xp: 0, claimed: [] };

      let next: Player = {
        ...p,
        coins: p.coins + payload.coins,
        gems: p.gems + payload.gems,
        xp: p.xp + payload.xp,
        rounds: p.rounds + 1,
        bestStreak: Math.max(p.bestStreak, payload.streak),
        perfectCount: p.perfectCount + (payload.perfect ? 1 : 0),
        history: (() => {
          const same = p.history.find((h) => h.date === today);
          const rest = p.history.filter((h) => h.date !== today);
          rest.push({
            date: today,
            solved: (same?.solved ?? 0) + payload.solved,
            correct: (same?.correct ?? 0) + payload.correct,
          });
          return rest.sort((a, b) => a.date.localeCompare(b.date)).slice(-365);
        })(),
        stats: (() => {
          const stats = { ...p.stats };
          for (const [kind, st] of Object.entries(payload.kindStats)) {
            const prev = stats[kind] ?? { solved: 0, correct: 0 };
            stats[kind] = { solved: prev.solved + st.solved, correct: prev.correct + st.correct };
          }
          return stats;
        })(),
        wrongTasks: [...p.wrongTasks, ...payload.wrongTasks].slice(-5),
        season: { ...season, xp: season.xp + (payload.seasonXp ?? 0) },
        daily:
          payload.label === "daily"
            ? { date: today, done: true }
            : p.daily,
        play: { ...p.play, [today]: (p.play[today] ?? 0) + payload.seconds },
      };

      let m = meta;
      const q = advanceQuests(m, next, payload);
      next = q.player;
      m = q.meta;
      const a = checkAchievements(m, next);
      next = a.player;
      m = a.meta;
      if (payload.chest) next = { ...next, pendingChest: payload.chest };
      if (levelOf(next.xp) > beforeLevel) {
        m = toast(m, "level", `Новый уровень: ${levelOf(next.xp)}!`, "Так держать!");
      }
      return updateActive(m, () => next);
    }
    case "buy": {
      const p = activeOf(meta);
      if (!p || p.owned.includes(action.item.id)) return meta;
      if (action.item.levelReq && levelOf(p.xp) < action.item.levelReq) return meta;
      const cost = action.deal ? dealPrice(action.item.price) : action.item.price;
      if (action.item.currency === "gems" ? p.gems < cost : p.coins < cost) return meta;

      let next: Player = {
        ...p,
        coins: action.item.currency === "coins" ? p.coins - cost : p.coins,
        gems: action.item.currency === "gems" ? p.gems - cost : p.gems,
        owned: [...p.owned, action.item.id],
      };

      if (action.item.slot === "color") {
        const color: ColorUnlock | null =
          action.item.id === "unlock-golden" ? "golden" : action.item.id === "unlock-rainbow" ? "rainbow" : null;
        if (color && !next.rareColors.includes(color)) {
          next = { ...next, rareColors: [...next.rareColors, color] };
        }
        return applyAll(meta, next);
      }

      // Квесты с метрикой «покупка».
      const quests: QuestState[] = [];
      let m = meta;
      for (const q of next.quests) {
        const def = questById(q.id);
        if (def?.metric === "buys") {
          if (q.progress + 1 >= def.goal) {
            next = grantReward(next, def.reward);
            next = { ...next, questsDone: [...next.questsDone, q.id] };
            m = toast(m, "quest", "Квест выполнен!", def.text);
          } else {
            quests.push({ ...q, progress: q.progress + 1 });
          }
        } else {
          quests.push(q);
        }
      }
      next = { ...next, quests };
      return applyAll(m, next);
    }
    case "toggleEquip": {
      const p = activeOf(meta);
      if (!p || !p.owned.includes(action.itemId)) return meta;
      return updateActive(meta, (pl) => {
        const equipped = { ...pl.equipped };
        if (equipped[action.slot] === action.itemId) delete equipped[action.slot];
        else equipped[action.slot] = action.itemId;
        if (action.slot === "friend") {
          const friendBase = equipped.friend ? equipped.friend.replace("friend-", "") : null;
          return { ...pl, equipped, companion: friendBase };
        }
        return { ...pl, equipped };
      });
    }
    case "setRoomSlot":
      return updateActive(meta, (p) => ({ ...p, room: { ...p.room, [action.slot]: action.itemId } }));
    case "renamePet":
      return updateActive(meta, (p) => ({ ...p, petName: action.name.slice(0, 16) }));
    case "setCustomPet":
      return updateActive(meta, (p) => ({
        ...p,
        customPet: action.design,
        owned: p.owned.includes("pet-custom") ? p.owned : [...p.owned, "pet-custom"],
      }));
    case "repaint":
      return updateActive(meta, (p) => ({ ...p, color: action.color }));
    case "gift": {
      const from = activeOf(meta);
      if (!from || from.id === action.toId || from.coins < action.amount || action.amount <= 0) return meta;
      return {
        ...meta,
        profiles: meta.profiles.map((p) => {
          if (p.id === from.id) return { ...p, coins: p.coins - action.amount };
          if (p.id === action.toId) return { ...p, coins: p.coins + action.amount };
          return p;
        }),
      };
    }
    case "claimSeason": {
      const p = activeOf(meta);
      if (!p || p.season.key !== seasonKey()) return meta;
      if (p.season.claimed.includes(action.tier)) return meta;
      if (seasonTierReached(p.season.xp) < action.tier) return meta;
      const reward = seasonReward(action.tier);
      let next = grantReward(p, reward);
      if (reward.item) next = { ...next, owned: [...next.owned, reward.item] };
      next = {
        ...next,
        season: { ...next.season, claimed: [...next.season.claimed, action.tier] },
      };
      const item = reward.item ? itemById(reward.item) : null;
      return updateActive(
        toast(
          meta,
          "info",
          `Уровень ${action.tier} сезона!`,
          item ? `Получено: ${item.name}` : `+${reward.coins ?? 0}${reward.gems ? ` и ${reward.gems} самоцвет` : " монет"}`,
        ),
        () => next,
      );
    }
    case "applyWheel": {
      const p = activeOf(meta);
      if (!p || p.wheelLast === todayKey()) return meta;
      const seg = WHEEL_SEGMENTS[action.segIndex] ?? WHEEL_SEGMENTS[0];
      let next = grantReward({ ...p, wheelLast: todayKey() }, {
        coins: seg.type === "coins" ? seg.value : 0,
        gems: seg.type === "gems" ? seg.value : 0,
      });
      if (seg.type === "chest") next = { ...next, pendingChest: "small" };
      return updateActive(meta, () => next);
    }
    case "openChest": {
      const p = activeOf(meta);
      if (!p || !p.pendingChest) return meta;
      const next = grantReward({ ...p, pendingChest: null }, action.loot);
      return updateActive(
        toast(
          meta,
          "chest",
          "Сундук открыт!",
          `+${action.loot.coins ?? 0}${action.loot.gems ? ` и ${action.loot.gems} самоцвет` : " монет"}`,
        ),
        () => next,
      );
    }
    case "completeDaily": {
      const p = activeOf(meta);
      if (!p) return meta;
      const today = localDate();
      if (p.daily?.date === today && p.daily.done) return meta;
      const next = grantReward(
        { ...p, pendingChest: "small", daily: { date: today, done: true } },
        { coins: 30 },
      );
      return updateActive(meta, () => next);
    }
    case "olympiad": {
      const p = activeOf(meta);
      if (!p) return meta;
      const next = grantReward(
        { ...p, olympiadBest: Math.max(p.olympiadBest, action.stage) },
        { coins: action.coins, gems: action.gems },
      );
      return updateActive(meta, () => next);
    }
    case "exchange":
      return updateActive(meta, (p) => {
        if (action.dir === "coinsToXp" && p.coins >= 100) {
          return { ...p, coins: p.coins - 100, xp: p.xp + 20 };
        }
        if (action.dir === "xpToCoins" && p.xp >= XP_PER_LEVEL) {
          return { ...p, coins: p.coins + 40, xp: p.xp - XP_PER_LEVEL };
        }
        return p;
      });
    case "addPlay": {
      const p = activeOf(meta);
      if (!p) return meta;
      const today = localDate();
      return updateActive(meta, (pl) => ({
        ...pl,
        play: { ...pl.play, [today]: (pl.play[today] ?? 0) + action.seconds },
      }));
    }
    case "dismissToast":
      return { ...meta, toasts: meta.toasts.filter((t) => t.id !== action.id) };
    case "resetActive": {
      const p = activeOf(meta);
      if (!p) return meta;
      const fresh = newPlayer(p.name, p.base, "mint");
      return updateActive(meta, () => ({ ...fresh, id: p.id, name: p.name, base: p.base }));
    }
    default:
      return meta;
  }
}

interface AppStore {
  meta: MetaState;
  player: Player | null;
  profiles: Player[];
  createProfile: (p: { name: string; base: BaseId; color: BaseColor }) => void;
  switchProfile: (id: string) => void;
  deleteProfile: (id: string) => void;
  setSound: (on: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setParentPin: (pin: string | null) => void;
  setTimeLimit: (min: number | null) => void;
  heartbeat: () => void;
  markDailySeen: () => void;
  assignQuests: (defs: QuestDef[]) => void;
  finishGame: (payload: FinishPayload) => void;
  buyItem: (item: ShopItem, deal?: boolean) => boolean;
  toggleEquip: (slot: SlotId, itemId: string) => void;
  setRoomSlot: (slot: RoomSlot, itemId: string) => void;
  renamePet: (name: string) => void;
  setCustomPet: (design: PetDesign) => void;
  repaint: (color: CharColor) => void;
  giftCoins: (toId: string, amount: number) => void;
  claimSeason: (tier: number) => void;
  applyWheel: (segIndex: number) => void;
  openChest: () => void;
  completeDaily: () => void;
  finishOlympiad: (stage: number, coins: number, gems: number) => void;
  exchange: (dir: "coinsToXp" | "xpToCoins") => void;
  addPlaySeconds: (seconds: number) => void;
  dismissToast: (id: number) => void;
  resetActive: () => void;
  dealId: string | null;
}

const AppContext = createContext<AppStore | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [meta, dispatch] = useReducer(reducer, undefined, loadMeta);
  const [dealId] = useState(() => dealOfTheDay());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta));
  }, [meta]);

  useEffect(() => {
    document.documentElement.dataset.theme = meta.theme;
  }, [meta.theme]);

  const player = useMemo(
    () => meta.profiles.find((p) => p.id === meta.activeId) ?? null,
    [meta.profiles, meta.activeId],
  );

  const store = useMemo<AppStore>(() => {
    return {
      meta,
      player,
      profiles: meta.profiles,
      createProfile: (p) => dispatch({ type: "create", ...p }),
      switchProfile: (id) => dispatch({ type: "switch", id }),
      deleteProfile: (id) => dispatch({ type: "delete", id }),
      setSound: (on) => dispatch({ type: "setSound", on }),
      setTheme: (theme) => dispatch({ type: "setTheme", theme }),
      setParentPin: (pin) => dispatch({ type: "setPin", pin }),
      setTimeLimit: (min) => dispatch({ type: "setLimit", min }),
      heartbeat: () => dispatch({ type: "heartbeat" }),
      markDailySeen: () => dispatch({ type: "dailySeen" }),
      assignQuests: (defs) =>
        dispatch({ type: "assignQuests", quests: defs.map((d) => ({ id: d.id, progress: 0 })) }),
      finishGame: (payload) => dispatch({ type: "finishGame", payload }),
      buyItem: (item, deal = false) => {
        const cur = activeOf(meta);
        if (!cur) return false;
        if (cur.owned.includes(item.id)) return false;
        const cost = deal ? dealPrice(item.price) : item.price;
        if (item.levelReq && levelOf(cur.xp) < item.levelReq) return false;
        if (item.currency === "gems" ? cur.gems < cost : cur.coins < cost) return false;
        dispatch({ type: "buy", item, deal });
        return true;
      },
      toggleEquip: (slot, itemId) => dispatch({ type: "toggleEquip", slot, itemId }),
      setRoomSlot: (slot, itemId) => dispatch({ type: "setRoomSlot", slot, itemId }),
      renamePet: (name) => dispatch({ type: "renamePet", name }),
      setCustomPet: (design) => dispatch({ type: "setCustomPet", design }),
      repaint: (color) => dispatch({ type: "repaint", color }),
      giftCoins: (toId, amount) => dispatch({ type: "gift", toId, amount }),
      claimSeason: (tier) => dispatch({ type: "claimSeason", tier }),
      applyWheel: (segIndex) => dispatch({ type: "applyWheel", segIndex }),
      openChest: () => {
        const cur = activeOf(meta);
        if (!cur?.pendingChest) return;
        dispatch({ type: "openChest", loot: chestLoot(cur.pendingChest) });
      },
      completeDaily: () => dispatch({ type: "completeDaily" }),
      finishOlympiad: (stage, coins, gems) => dispatch({ type: "olympiad", stage, coins, gems }),
      exchange: (dir) => dispatch({ type: "exchange", dir }),
      addPlaySeconds: (seconds) => dispatch({ type: "addPlay", seconds }),
      dismissToast: (id) => dispatch({ type: "dismissToast", id }),
      resetActive: () => dispatch({ type: "resetActive" }),
      dealId,
    };
  }, [meta, player, dealId]);

  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function usePlayer(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
