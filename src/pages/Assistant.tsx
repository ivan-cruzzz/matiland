import { useEffect, useRef, useState } from "react";
import PromptInputBox from "../components/ui/ai-prompt-box";
import { MunyaAvatar } from "../components/character/CharacterView";
import { generateTask } from "../lib/mathGenerator";

interface Msg {
  id: number;
  from: "user" | "unya";
  text: string;
}

const GREETING: Msg = {
  id: 0,
  from: "unya",
  text: "Привет! Я Умня — совёнок-помощник Матилэнда. Настоящий интеллект ко мне ещё в пути, но я уже умею подкидывать задачки и шутить про числа!",
};

const SUGGESTIONS = [
  "Дай задачку",
  "Как учить умножение?",
  "Расскажи что-нибудь весёлое",
  "Кто ты?",
];

const JOKES = [
  "— Минус, почему ты такой грустный? — Потому что меня все время отнимают!",
  "Что тяжелее: килограмм пуха или килограмм железа? Одинаково — ведь это килограмм!",
  "Почему у родителей всегда больше денег? Потому что они знают таблицу умножения!",
];

const DEFAULTS = [
  "Хм, пока я только учусь и знаю не так много. Зато отлично даю задачки — напиши «Дай задачку»!",
  "Ух, такой вопрос мне не по клюву — этот раздел в разработке. Спроси лучше про умножение!",
  "Я ещё маленький совёнок, но скоро стану по-настоящему умным помощником!",
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface Reply {
  text: string;
  /** Ответ к выданной задачке, который можно проверить командой «проверить». */
  pendingAnswer?: number;
}

function replyFor(input: string, pending: number | null): Reply {
  const q = input.toLowerCase();

  if (/провер|показ.*ответ|какой ответ/.test(q)) {
    if (pending !== null) {
      return { text: `Правильный ответ: ${pending}. Решал(а) сам(а) — молодец!` };
    }
    return { text: "Сначала возьмём задачку — напиши «Дай задачку»!" };
  }
  if (/задач|пример/.test(q)) {
    const t = generateTask("mixed", "easy");
    return {
      text: `Ловите: ${t.prompt.replace(" = ?", "")}. Сколько получится? Напишите «проверить», когда будете готовы!`,
      pendingAnswer: t.answer,
    };
  }
  if (/умнож|таблиц/.test(q)) {
    return {
      text: "Учите таблицу по одному столбику в день и приговаривайте рифмы: «пятью пять — двадцать пять», «шестью шесть — тридцать шесть». Пять минут в день — и через месяц вся таблица ваша!",
    };
  }
  if (/делен|раздели|поровну/.test(q)) {
    return {
      text: "Деление — это когда делим поровну. Если 12 конфет разделить между 4 друзьями, каждый получит по 3! Проверка: 3 × 4 = 12.",
    };
  }
  if (/складыв|плюс|сложен/.test(q)) {
    return {
      text: "Секрет сложения: раскладывай числа на удобные части. 47 + 25 = 47 + 20 + 5 = 67 + 5 = 72. Так проще, чем считать в уме столбиком!",
    };
  }
  if (/вычит|минус/.test(q)) {
    return {
      text: "При вычитании удобно считать до круглого числа: 53 − 8 = 53 − 3 − 5 = 50 − 5 = 45. Попробуй сам(а)!",
    };
  }
  if (/привет|здравств|хай|ку\b/.test(q)) {
    return { text: "И тебе привет! Готов(а) решать примеры и зарабатывать монеты для своего героя?" };
  }
  if (/кто ты|что умеешь|расскажи о себе/.test(q)) {
    return {
      text: "Я Умня, цифровой совёнок из Матилэнда. Пока я отвечаю заготовленными фразами — это прототип. Но задачки выдаю по-настоящему!",
    };
  }
  if (/шутк|весел|скучно|смешн/.test(q)) {
    return { text: pick(JOKES) };
  }
  if (/спасибо|благодар/.test(q)) {
    return { text: "Всегда пожалуйста! Прилетай ещё — у меня полно задачек." };
  }
  if (/монет|магазин|купит/.test(q)) {
    return {
      text: "Монеты дают за верные ответы: 5 за каждую, бонус за серию из 5 подряд и +50 за идеальный раунд. Трать их в магазине на шапки, питомцев и фоны!",
    };
  }
  return { text: pick(DEFAULTS) };
}

export default function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [typing, setTyping] = useState(false);
  const pendingRef = useRef<number | null>(null);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = (text: string) => {
    if (typing) return;
    setMessages((m) => [...m, { id: nextId.current++, from: "user", text }]);
    setTyping(true);
    const { text: reply, pendingAnswer } = replyFor(text, pendingRef.current);
    const delay = 700 + Math.random() * 700;
    setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, from: "unya", text: reply }]);
      pendingRef.current = pendingAnswer !== undefined ? pendingAnswer : null;
      setTyping(false);
    }, delay);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex h-[calc(100dvh-230px)] min-h-[440px] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        {/* Шапка чата */}
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <MunyaAvatar size={44} />
          <div>
            <p className="font-black tracking-tight">Умня</p>
            <p className="text-xs font-semibold text-ink-mute">ИИ-помощник · прототип</p>
          </div>
        </div>

        {/* Лента сообщений */}
        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
          {messages.map((m) =>
            m.from === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm font-semibold text-cream sm:max-w-[75%]">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex items-end gap-2">
                <span className="shrink-0" aria-hidden="true">
                  <MunyaAvatar size={26} />
                </span>
                <p className="max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-cream px-4 py-2.5 text-sm font-semibold sm:max-w-[75%]">
                  {m.text}
                </p>
              </div>
            ),
          )}
          {typing && (
            <div className="flex items-end gap-2">
              <span className="shrink-0" aria-hidden="true">
                <MunyaAvatar size={26} />
              </span>
              <span
                className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-cream px-4 py-3"
                role="status"
                aria-label="Умня печатает"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-mute"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </span>
            </div>
          )}
        </div>

        {/* Ввод */}
        <div className="border-t border-line px-4 py-4">
          <div className="mb-3 flex flex-wrap gap-2" aria-label="Подсказки">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                disabled={typing}
                className="min-h-9 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:border-lavender-deep hover:text-lavender-deep disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <PromptInputBox onSend={send} disabled={typing} />
        </div>
      </div>
    </div>
  );
}
