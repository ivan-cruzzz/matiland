import type { Topic } from "./tasks";

export interface Reward {
  coins?: number;
  gems?: number;
}

/** Метрика квеста: сколько всего задач / раундов / серия / идеальные / покупки / по теме. */
export type QuestMetric =
  | "tasks"
  | "rounds"
  | "streak"
  | "perfect"
  | "buys"
  | `topic:${Topic}`;

export interface QuestDef {
  id: string;
  metric: QuestMetric;
  goal: number;
  text: string;
  reward: Reward;
}

export const QUEST_POOL: QuestDef[] = [
  { id: "q-tasks-30", metric: "tasks", goal: 30, text: "Реши 30 задач", reward: { coins: 60 } },
  { id: "q-tasks-60", metric: "tasks", goal: 60, text: "Реши 60 задач", reward: { coins: 100, gems: 1 } },
  { id: "q-rounds-3", metric: "rounds", goal: 3, text: "Сыграй 3 раунда", reward: { coins: 40 } },
  { id: "q-rounds-7", metric: "rounds", goal: 7, text: "Сыграй 7 раундов", reward: { coins: 80 } },
  { id: "q-streak-5", metric: "streak", goal: 5, text: "Собери серию из 5 верных подряд", reward: { coins: 50 } },
  { id: "q-streak-10", metric: "streak", goal: 10, text: "Собери серию из 10 верных подряд", reward: { coins: 90, gems: 1 } },
  { id: "q-perfect-1", metric: "perfect", goal: 1, text: "Заверши раунд без ошибок", reward: { coins: 70 } },
  { id: "q-mul-20", metric: "topic:mul", goal: 20, text: "Реши 20 задач на умножение", reward: { coins: 70 } },
  { id: "q-add-20", metric: "topic:add", goal: 20, text: "Реши 20 задач на сложение", reward: { coins: 50 } },
  { id: "q-sub-20", metric: "topic:sub", goal: 20, text: "Реши 20 задач на вычитание", reward: { coins: 50 } },
  { id: "q-div-15", metric: "topic:div", goal: 15, text: "Реши 15 задач на деление", reward: { coins: 70 } },
  { id: "q-clock-10", metric: "topic:clock", goal: 10, text: "Определи время на 10 часах", reward: { coins: 60 } },
  { id: "q-money-10", metric: "topic:money", goal: 10, text: "Посчитай сдачу 10 раз", reward: { coins: 60 } },
  { id: "q-word-10", metric: "topic:word", goal: 10, text: "Реши 10 задач со словами", reward: { coins: 70 } },
  { id: "q-buy-1", metric: "buys", goal: 1, text: "Купи любую вещь в магазине", reward: { coins: 30 } },
];

export function questById(id: string): QuestDef | undefined {
  return QUEST_POOL.find((q) => q.id === id);
}

/** Три случайных квеста, не входящие в уже выполненные. */
export function pickQuests(exclude: string[]): QuestDef[] {
  const free = QUEST_POOL.filter((q) => !exclude.includes(q.id));
  const out: QuestDef[] = [];
  while (out.length < 3 && free.length > 0) {
    const idx = Math.floor(Math.random() * free.length);
    out.push(free.splice(idx, 1)[0]);
  }
  return out;
}
