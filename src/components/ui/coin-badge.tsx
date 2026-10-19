import { AnimatePresence, motion } from "framer-motion";

export function CoinIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#FFD45E" stroke="#3D3A37" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="9" fill="#FFE38A" stroke="#C98A0B" strokeWidth="1.5" />
      <path
        d="M16 11l1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.5z"
        fill="#C98A0B"
      />
    </svg>
  );
}

export default function CoinBadge({ coins }: { coins: number }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 shadow-card"
      role="status"
      aria-label={`Монет: ${coins}`}
    >
      <CoinIcon size={22} />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={coins}
          initial={{ y: -10, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="font-mono text-sm font-bold tabular-nums"
        >
          {coins}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function GemIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M6 3 L18 3 L22 9 L12 21 L2 9 Z" fill="#C9B8F0" stroke="#3D3A37" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M2 9 L22 9 M9 9 L12 21 L15 9 M6 3 L9 9 M18 3 L15 9" stroke="#AB93E6" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function GemBadge({ gems }: { gems: number }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 shadow-card"
      role="status"
      aria-label={`Самоцветов: ${gems}`}
    >
      <GemIcon size={18} />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={gems}
          initial={{ y: -10, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="font-mono text-sm font-bold tabular-nums"
        >
          {gems}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
