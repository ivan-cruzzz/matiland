import { ArrowRight } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface FlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
}

/**
 * CTA-кнопка из дизайн-системы miniDESIGN: при наведении круг заливает
 * кнопку, pill морфит в прямоугольник, стрелки меняются с «отскоком».
 */
export function FlowButton({ text, className, type = "button", ...props }: FlowButtonProps) {
  return (
    <button
      type={type}
      className={
        "group relative flex cursor-pointer items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-ink/40 bg-transparent px-8 py-3 text-base font-bold text-ink transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-[12px] hover:border-transparent hover:text-cream active:scale-[0.95] disabled:pointer-events-none disabled:opacity-50 " +
        (className ?? "")
      }
      {...props}
    >
      <ArrowRight
        className="absolute left-[-25%] z-[9] h-4 w-4 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 group-hover:stroke-white"
        aria-hidden="true"
      />
      <span className="relative z-[1] -translate-x-3 transition-all duration-[800ms] ease-out group-hover:translate-x-3">
        {text}
      </span>
      <span
        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-ink opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[220px] group-hover:w-[220px] group-hover:opacity-100"
        aria-hidden="true"
      />
      <ArrowRight
        className="absolute right-4 z-[9] h-4 w-4 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] group-hover:stroke-white"
        aria-hidden="true"
      />
    </button>
  );
}

export default FlowButton;
