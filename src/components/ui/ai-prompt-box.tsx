import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

interface PromptInputBoxProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Чипы-подсказки над полем (паттерн Prompt Input with Actions). */
  suggestions?: string[];
}

/**
 * Тёмный чат-бокс из miniDESIGN (адаптация AI Prompt Box):
 * авторост textarea, Enter — отправка, Shift+Enter — перенос,
 * белая круглая кнопка отправки при наличии текста.
 */
export default function PromptInputBox({
  onSend,
  disabled = false,
  placeholder = "Спроси Умню о чём-нибудь...",
  suggestions = [],
}: PromptInputBoxProps) {
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  return (
    <div>
      {suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2" aria-label="Подсказки">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSend(s)}
              disabled={disabled}
              className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-gray-300 transition-colors duration-200 hover:bg-white/20 hover:text-white disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="rounded-3xl border border-[#444444] bg-[#1F2023] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)]">
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label="Сообщение для Умни"
          disabled={disabled}
          className="max-h-40 w-full resize-none rounded-xl border-none bg-transparent px-3 py-2.5 text-base text-gray-100 outline-none placeholder:text-gray-400 disabled:opacity-50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#444444]"
        />
        <div className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={submit}
            aria-label="Отправить сообщение"
            disabled={disabled}
            className={`grid h-9 w-9 place-items-center rounded-full transition-all duration-200 ${
              value.trim()
                ? "bg-white text-[#1F2023] hover:bg-white/85"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
