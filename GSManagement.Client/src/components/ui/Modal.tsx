import { useEffect, type ReactNode } from "react";
import {
  X,
} from "lucide-react";

interface ModalProps {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: "sm" | "md" | "lg";
}

const WIDTH = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" };

// Centered dialog; Escape or clicking the backdrop closes it.
export default function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  width = "md",
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className={`card w-full ${WIDTH[width]} shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-fg-3">{description}</p>}
          </div>
          <button onClick={onClose} className="btn-ghost -mr-1.5 rounded-xl p-1.5" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line bg-inset px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
