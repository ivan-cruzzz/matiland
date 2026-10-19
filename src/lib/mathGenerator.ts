export type Topic = "add" | "sub" | "mul" | "div" | "mixed";
export type Difficulty = "easy" | "medium" | "hard";

export interface Task {
  prompt: string;
  answer: number;
  options: number[];
}

const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ответ + два правдоподобных неверных варианта, все разные и неотрицательные. */
function makeOptions(answer: number): number[] {
  const opts = new Set<number>([answer]);
  const spread = Math.max(3, Math.round(Math.abs(answer) * 0.2) + 2);
  while (opts.size < 3) {
    const delta = rnd(1, spread);
    const cand = answer + (Math.random() < 0.5 ? -delta : delta);
    if (cand >= 0) opts.add(cand);
  }
  return shuffle([...opts]);
}

function build(real: Exclude<Topic, "mixed">, diff: Difficulty): Task {
  let prompt = "";
  let answer = 0;

  if (real === "add") {
    if (diff === "easy") {
      const a = rnd(1, 10);
      const b = rnd(1, 10);
      prompt = `${a} + ${b} = ?`;
      answer = a + b;
    } else if (diff === "medium") {
      const a = rnd(11, 89);
      const b = rnd(2, 100 - a);
      prompt = `${a} + ${b} = ?`;
      answer = a + b;
    } else {
      const a = rnd(105, 500);
      const b = rnd(100, 999 - a);
      prompt = `${a} + ${b} = ?`;
      answer = a + b;
    }
  } else if (real === "sub") {
    if (diff === "easy") {
      const a = rnd(5, 20);
      const b = rnd(1, a - 1);
      prompt = `${a} − ${b} = ?`;
      answer = a - b;
    } else if (diff === "medium") {
      const a = rnd(30, 100);
      const b = rnd(10, a - 1);
      prompt = `${a} − ${b} = ?`;
      answer = a - b;
    } else {
      const a = rnd(300, 999);
      const b = rnd(50, a - 1);
      prompt = `${a} − ${b} = ?`;
      answer = a - b;
    }
  } else if (real === "mul") {
    if (diff === "easy") {
      const a = rnd(2, 5);
      const b = rnd(2, 5);
      prompt = `${a} × ${b} = ?`;
      answer = a * b;
    } else if (diff === "medium") {
      const a = rnd(2, 9);
      const b = rnd(2, 9);
      prompt = `${a} × ${b} = ?`;
      answer = a * b;
    } else {
      const a = rnd(11, 19);
      const b = rnd(2, 9);
      prompt = `${a} × ${b} = ?`;
      answer = a * b;
    }
  } else {
    if (diff === "easy") {
      const b = rnd(2, 5);
      const q = rnd(2, 5);
      prompt = `${b * q} : ${b} = ?`;
      answer = q;
    } else if (diff === "medium") {
      const b = rnd(2, 9);
      const q = rnd(2, 9);
      prompt = `${b * q} : ${b} = ?`;
      answer = q;
    } else {
      const b = rnd(3, 9);
      const q = rnd(10, 20);
      prompt = `${b * q} : ${b} = ?`;
      answer = q;
    }
  }

  return { prompt, answer, options: makeOptions(answer) };
}

export function generateTask(topic: Topic, difficulty: Difficulty): Task {
  const real =
    topic === "mixed"
      ? pick(["add", "sub", "mul", "div"] as const)
      : topic;
  return build(real, difficulty);
}

export const TOPIC_NAMES: Record<Topic, string> = {
  add: "Сложение",
  sub: "Вычитание",
  mul: "Умножение",
  div: "Деление",
  mixed: "Всё вместе",
};

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};

export function isTopic(v: string): v is Topic {
  return ["add", "sub", "mul", "div", "mixed"].includes(v);
}

export function isDifficulty(v: string): v is Difficulty {
  return ["easy", "medium", "hard"].includes(v);
}
