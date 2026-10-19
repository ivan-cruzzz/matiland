import { AnimatePresence, motion } from "framer-motion";
import { Gift, Star, Target, Trophy } from "lucide-react";
import { useEffect } from "react";
import { usePlayer } from "../../store/PlayerContext";
import type { Toast } from "../../lib/types";

const ICONS: Record<Toast["kind"], typeof Trophy> = {
  achievement: Trophy,
  quest: Target,
  level: Star,
  chest: Gift,
  daily: Gift,
  info: Star,
};

const TINTS: Record<Toast["kind"], string> = {
  achievement: "bg-sunny-soft border-sunny text-sunny-deep",
  quest: "bg-mint-soft border-mint text-mint-deep",
  level: "bg-lavender-soft border-lavender text-lavender-deep",
  chest: "bg-peach-soft border-peach text-peach-deep",
  daily: "bg-sky-soft border-sky text-sky-deep",
  info: "bg-mint-soft border-mint text-mint-deep",
};

function ToastCard({ toast }: { toast: Toast }) {
  const { dismissToast } = usePlayer();
  const Icon = ICONS[toast.kind];

  useEffect(() => {
    const id = setTimeout(() => dismissToast(toast.id), 4600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={`flex max-w-xs items-start gap-2.5 rounded-2xl border-2 px-4 py-3 shadow-pop ${TINTS[toast.kind]}`}
      role="status"
    >
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-black leading-tight">{toast.title}</p>
        {toast.text && <p className="mt-0.5 text-xs font-semibold opacity-80">{toast.text}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Закрыть уведомление"
        className="ml-auto shrink-0 rounded-full px-1 text-sm font-black opacity-50 hover:opacity-100"
      >
        ×
      </button>
    </motion.div>
  );
}

/** Всплывающие награды: достижения, квесты, уровни, сундуки. */
export default function ToastStack() {
  const { meta } = usePlayer();
  return (
    <div className="pointer-events-none fixed right-3 top-16 z-[70] flex flex-col items-end gap-2 sm:right-5">
      <AnimatePresence>
        {meta.toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
