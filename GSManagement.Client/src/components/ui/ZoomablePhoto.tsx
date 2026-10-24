import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
} from "lucide-react";

interface ZoomablePhotoProps {
  src: string;
  alt: string;
  // Classes for the thumbnail <img>, same as a plain <img> would get.
  imgClassName?: string;
  // Classes for the clickable wrapper (e.g. size/shrink in flex layouts).
  className?: string;
}

// A photo thumbnail that opens full size in a popup when clicked.
export default function ZoomablePhoto({
  src,
  alt,
  imgClassName = "w-full h-full object-cover rounded-full",
  className = "w-full h-full",
}: ZoomablePhotoProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="View photo"
        className={`block rounded-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${className}`}
      >
        <img src={src} alt={alt} className={imgClassName} />
      </button>
      {open && <PhotoLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

function PhotoLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  // Close on Escape.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Rendered into <body> so cards with overflow-hidden or the sidebar
  // can't clip or stack above it.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-slate-900/80 dark:bg-black/85 backdrop-blur-xs p-4 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>
      <img
        src={src}
        alt={alt}
        // Clicking the photo itself doesn't close it; the backdrop does.
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain cursor-default"
      />
      <p className="text-sm font-medium text-white/90">{alt}</p>
    </div>,
    document.body,
  );
}
