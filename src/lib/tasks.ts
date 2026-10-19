export type Topic =
  | "add"
  | "sub"
  | "mul"
  | "div"
  | "missing"
  | "compare"
  | "sign"
  | "fraction"
  | "geometry"
  | "clock"
  | "money"
  | "word";

/** «mixed» — мешанина из арифметики; полный список тем — в TOPIC_GROUPS. */
export type TopicId = Topic | "mixed";

export type Difficulty = "easy" | "medium" | "hard";

export interface Task {
  prompt: string;
  answer: string;
  options: string[];
  /** Реальная тема (после раскрытия mixed) — ключ статистики. */
  kind: Topic;
  art?: { type: "fraction"; n: number; d: number } | { type: "clock"; h: number; m: number };
}

export const TOPIC_NAMES: Record<TopicId, string> = {
  add: "Сложение",
  sub: "Вычитание",
  mul: "Умножение",
  div: "Деление",
  missing: "Пропущенное число",
  compare: "Больше и меньше",
  sign: "Выбери знак",
  fraction: "Доли",
  geometry: "Фигуры и периметр",
  clock: "Часы и время",
  money: "Деньги и сдача",
  word: "Задачи",
  mixed: "Арифметика-микс",
};

export const TOPIC_GROUPS: { name: string; topics: Topic[] }[] = [
  { name: "Арифметика", topics: ["add", "sub", "mul", "div"] },
  { name: "Логика", topics: ["missing", "compare", "sign", "fraction"] },
  { name: "Жизнь и формы", topics: ["geometry", "clock", "money", "word"] },
];

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};

const rnd = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Ответ + правдоподобные дистракторы, все разные. */
function numericOptions(answer: number, count = 3): string[] {
  const opts = new Set<number>([answer]);
  const spread = Math.max(3, Math.round(Math.abs(answer) * 0.2) + 2);
  while (opts.size < count) {
    const delta = rnd(1, spread);
    const cand = answer + (Math.random() < 0.5 ? -delta : delta);
    if (cand >= 0) opts.add(cand);
  }
  return shuffle([...opts]).map(String);
}

function stringOptions(answer: string, distractors: string[]): string[] {
  const opts = new Set<string>([answer, ...distractors]);
  return shuffle([...opts]);
}

const NAMES = ["Аня", "Миша", "Лиза", "Федя", "Катя", "Гоша", "Соня", "Марк"];
const THINGS = ["яблоки", "конфеты", "наклейки", "мячика", "книги"];

/* ---------- Генераторы по темам ---------- */

function genAdd(d: Difficulty): Task {
  if (d === "easy") {
    const a = rnd(1, 10), b = rnd(1, 10);
    return { kind: "add", prompt: `${a} + ${b} = ?`, answer: String(a + b), options: numericOptions(a + b) };
  }
  if (d === "medium") {
    const a = rnd(11, 89), b = rnd(2, 100 - a);
    return { kind: "add", prompt: `${a} + ${b} = ?`, answer: String(a + b), options: numericOptions(a + b) };
  }
  const a = rnd(105, 500), b = rnd(100, 999 - a);
  return { kind: "add", prompt: `${a} + ${b} = ?`, answer: String(a + b), options: numericOptions(a + b) };
}

function genSub(d: Difficulty): Task {
  if (d === "easy") {
    const a = rnd(5, 20), b = rnd(1, a - 1);
    return { kind: "sub", prompt: `${a} − ${b} = ?`, answer: String(a - b), options: numericOptions(a - b) };
  }
  if (d === "medium") {
    const a = rnd(30, 100), b = rnd(10, a - 1);
    return { kind: "sub", prompt: `${a} − ${b} = ?`, answer: String(a - b), options: numericOptions(a - b) };
  }
  const a = rnd(300, 999), b = rnd(50, a - 1);
  return { kind: "sub", prompt: `${a} − ${b} = ?`, answer: String(a - b), options: numericOptions(a - b) };
}

function genMul(d: Difficulty): Task {
  if (d === "easy") {
    const a = rnd(2, 5), b = rnd(2, 5);
    return { kind: "mul", prompt: `${a} × ${b} = ?`, answer: String(a * b), options: numericOptions(a * b) };
  }
  if (d === "medium") {
    const a = rnd(2, 9), b = rnd(2, 9);
    return { kind: "mul", prompt: `${a} × ${b} = ?`, answer: String(a * b), options: numericOptions(a * b) };
  }
  const a = rnd(11, 19), b = rnd(2, 9);
  return { kind: "mul", prompt: `${a} × ${b} = ?`, answer: String(a * b), options: numericOptions(a * b) };
}

function genDiv(d: Difficulty): Task {
  if (d === "easy") {
    const b = rnd(2, 5), q = rnd(2, 5);
    return { kind: "div", prompt: `${b * q} : ${b} = ?`, answer: String(q), options: numericOptions(q) };
  }
  if (d === "medium") {
    const b = rnd(2, 9), q = rnd(2, 9);
    return { kind: "div", prompt: `${b * q} : ${b} = ?`, answer: String(q), options: numericOptions(q) };
  }
  const b = rnd(3, 9), q = rnd(10, 20);
  return { kind: "div", prompt: `${b * q} : ${b} = ?`, answer: String(q), options: numericOptions(q) };
}

function genMissing(d: Difficulty): Task {
  const [a, b] =
    d === "hard"
      ? [rnd(15, 60), rnd(15, 60)]
      : d === "medium"
        ? [rnd(8, 30), rnd(5, 30)]
        : [rnd(2, 10), rnd(2, 10)];
  const sum = a + b;
  const hideB = Math.random() < 0.5;
  const prompt = hideB ? `${a} + ? = ${sum}` : `? + ${b} = ${sum}`;
  return { kind: "missing", prompt, answer: String(hideB ? b : a), options: numericOptions(hideB ? b : a) };
}

function genCompare(d: Difficulty): Task {
  const limit = d === "hard" ? 900 : d === "medium" ? 100 : 20;
  let a = rnd(1, limit);
  let b = rnd(1, limit);
  while (a === b) b = rnd(1, limit);
  const big = Math.max(a, b);
  const third = Math.max(0, big + rnd(1, 3));
  return {
    kind: "compare",
    prompt: "Какое число самое большое?",
    answer: String(big),
    options: shuffle([...new Set([String(a), String(b), String(third)])]),
  };
}

function genSign(d: Difficulty): Task {
  const kind =
    d === "easy"
      ? pick(["+", "−"] as const)
      : d === "medium"
        ? pick(["+", "−", "×"] as const)
        : pick(["+", "−", "×", ":"] as const);
  let a = 1, b = 1, c = 0;
  if (kind === "+") { a = rnd(2, d === "easy" ? 10 : 50); b = rnd(2, d === "easy" ? 10 : 50); c = a + b; }
  else if (kind === "−") { a = rnd(5, d === "easy" ? 20 : 99); b = rnd(1, a - 1); c = a - b; }
  else if (kind === "×") { a = rnd(2, 9); b = rnd(2, 9); c = a * b; }
  else { b = rnd(2, 9); c = rnd(2, 9); a = b * c; }
  return {
    kind: "sign",
    prompt: `${a} ? ${b} = ${c}`,
    answer: kind,
    options: shuffle([...new Set(["+", "−", "×", ":"])]),
  };
}

function genFraction(d: Difficulty): Task {
  const denom = d === "easy" ? pick([2, 3, 4]) : d === "medium" ? pick([4, 6, 8]) : pick([5, 8, 10]);
  const num = rnd(1, denom - 1);
  return {
    kind: "fraction",
    prompt: "Какая часть пиццы закрашена?",
    answer: `${num}/${denom}`,
    options: stringOptions(`${num}/${denom}`, [`${num + 1}/${denom}`, `${denom - num}/${denom}`]),
    art: { type: "fraction", n: num, d: denom },
  };
}

function genGeometry(d: Difficulty): Task {
  if (d === "easy") {
    const shapes = ["круг", "квадрат", "треугольник", "прямоугольник", "пятиугольник"];
    const name = pick(shapes);
    const distractors = shuffle(shapes.filter((n) => n !== name)).slice(0, 2);
    return { kind: "geometry", prompt: "Какая фигура здесь лишняя?", answer: name, options: stringOptions(name, distractors) };
  }
  const a = rnd(2, d === "medium" ? 12 : 45);
  const b = rnd(2, d === "medium" ? 12 : 45);
  const p = 2 * (a + b);
  return {
    kind: "geometry",
    prompt: `Периметр прямоугольника со сторонами ${a} см и ${b} см?`,
    answer: String(p),
    options: numericOptions(p),
  };
}

function genClock(d: Difficulty): Task {
  const h = rnd(1, 12);
  const m = d === "easy" ? 0 : d === "medium" ? pick([0, 30]) : pick([0, 15, 30, 45]);
  const fmt = (hh: number, mm: number) => `${hh}:${String(mm).padStart(2, "0")}`;
  const wrongs = new Set<string>();
  while (wrongs.size < 2) {
    const wh = rnd(1, 12);
    const wm = pick([0, 15, 30, 45]);
    if (wh !== h || wm !== m) wrongs.add(fmt(wh, wm));
  }
  return {
    kind: "clock",
    prompt: "Который час на часах?",
    answer: fmt(h, m),
    options: stringOptions(fmt(h, m), [...wrongs]),
    art: { type: "clock", h, m },
  };
}

function genMoney(d: Difficulty): Task {
  if (d === "easy") {
    const price = rnd(2, 9) * 10;
    return { kind: "money", prompt: `Сдача со 100 р. при покупке за ${price} р.?`, answer: String(100 - price), options: numericOptions(100 - price) };
  }
  if (d === "medium") {
    const price = rnd(15, 89);
    const paid = pick([100, 200]);
    return { kind: "money", prompt: `Сдача с ${paid} р. при покупке за ${price} р.?`, answer: String(paid - price), options: numericOptions(paid - price) };
  }
  const price = rnd(20, 60);
  const n = rnd(3, 6);
  return { kind: "money", prompt: `Купили ${n} тетрадей по ${price} р. Сдача с 500 р.?`, answer: String(500 - price * n), options: numericOptions(500 - price * n) };
}

function genWord(d: Difficulty): Task {
  const thing = pick(THINGS);
  const name = pick(NAMES);
  if (d === "easy") {
    const a = rnd(4, 12), b = rnd(2, 8);
    return { kind: "word", prompt: `У ${name} было ${a} ${thing}, потом нашли ещё ${b}. Сколько стало?`, answer: String(a + b), options: numericOptions(a + b) };
  }
  if (d === "medium") {
    const a = rnd(12, 30), b = rnd(3, a - 2);
    return { kind: "word", prompt: `У ${name} было ${a} ${thing}, ${b} отдали другу. Сколько осталось?`, answer: String(a - b), options: numericOptions(a - b) };
  }
  const boxes = rnd(3, 6), per = rnd(4, 9);
  return { kind: "word", prompt: `У ${name} ${boxes} коробки по ${per} ${thing}. Сколько всего?`, answer: String(boxes * per), options: numericOptions(boxes * per) };
}

const GENERATORS: Record<Topic, (d: Difficulty) => Task> = {
  add: genAdd,
  sub: genSub,
  mul: genMul,
  div: genDiv,
  missing: genMissing,
  compare: genCompare,
  sign: genSign,
  fraction: genFraction,
  geometry: genGeometry,
  clock: genClock,
  money: genMoney,
  word: genWord,
};

export function isTopic(v: string): v is Topic {
  return v in GENERATORS;
}

export function isTopicId(v: string): v is TopicId {
  return v === "mixed" || isTopic(v);
}

export function isDifficulty(v: string): v is Difficulty {
  return v === "easy" || v === "medium" || v === "hard";
}

export function generateTask(topic: TopicId, difficulty: Difficulty): Task {
  const real: Topic = topic === "mixed" ? pick(["add", "sub", "mul", "div"] as const) : topic;
  return GENERATORS[real](difficulty);
}

export interface RoundOptions {
  /** Количество задач в раунде. */
  length?: number;
  /** Задачи для повторения ошибок — вставляются в середину раунда. */
  repeatWrong?: Task[];
}

export function buildRound(topic: TopicId, difficulty: Difficulty, opts: RoundOptions = {}): Task[] {
  const len = opts.length ?? 10;
  const tasks: Task[] = [];
  for (let i = 0; i < len; i++) {
    let t = generateTask(topic, difficulty);
    let guard = 0;
    while (guard++ < 8 && tasks.length > 0 && tasks[tasks.length - 1].prompt === t.prompt) {
      t = generateTask(topic, difficulty);
    }
    tasks.push(t);
  }
  // Повторение ошибок: до 2 сохранённых задач возвращаются на позиции 3 и 7.
  const wrong = (opts.repeatWrong ?? []).slice(0, 2);
  wrong.forEach((t, i) => {
    const at = Math.min(tasks.length - 1, 3 + i * 4);
    tasks[at] = { ...t, options: shuffle([...t.options]) };
  });
  return tasks;
}

/** Задача на шаг проще (для адаптивной сложности). */
export function easier(d: Difficulty): Difficulty {
  return d === "hard" ? "medium" : "easy";
}

/** Подсказка-первый-шаг по типу задачи. */
export function hintFor(task: Task): string {
  switch (task.kind) {
    case "add":
      return "Разложи числа на удобные части: сначала десятки, потом единицы.";
    case "sub":
      return "Посчитай, сколько не хватает до круглого числа, а потом прибавь остаток.";
    case "mul":
      return "Замени умножение сложением: 6 × 4 — это 6 + 6 + 6 + 6.";
    case "div":
      return "Подумай: сколько раз делитель помещается в числе? Проверь умножением.";
    case "missing":
      return "Чтобы найти спрятанное число, вычти известное из ответа.";
    case "compare":
      return "Сравни по разрядам: сначала сотни, потом десятки, потом единицы.";
    case "sign":
      return "Подставь каждый знак по очереди и посмотри, какой даёт верный ответ.";
    case "fraction":
      return "Считай все части — это знаменатель. Закрашенные части — числитель.";
    case "geometry":
      return "Периметр — это сумма всех сторон. У прямоугольника стороны попарно равны.";
    case "clock":
      return "Короткая стрелка — час, длинная — минуты. Каждое большое деление — 5 минут.";
    case "money":
      return "Сдача = сколько отдал − сколько стоит покупка.";
    case "word":
      return "Выпиши числа и подумай: их складывают, вычитают или умножают?";
    default:
      return "Сделай шаг за шагом — всё получится!";
  }
}
