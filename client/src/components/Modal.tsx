import { useEffect, useRef, useState } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max width of the content panel (default: max-w-sm) */
  maxWidth?: string;
  /** Don't close on backdrop click */
  preventBackdropClose?: boolean;
  /** Additional className for the content panel */
  className?: string;
}

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = "max-w-sm",
  preventBackdropClose = false,
  className = "",
}: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const [animating, setAnimating] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Force reflow so the animation restarts from hidden state
      void document.body.offsetHeight;
      requestAnimationFrame(() => setAnimating(true));
      closingRef.current = false;
    } else if (mounted) {
      // Start close animation
      setAnimating(false);
      closingRef.current = true;
    }
  }, [open]);

  const handleAnimEnd = () => {
    if (closingRef.current) {
      setMounted(false);
      closingRef.current = false;
    }
  };

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center ${animating ? "modal-overlay-open" : "modal-overlay-closing"}`}
      onClick={preventBackdropClose ? undefined : onClose}
      onAnimationEnd={handleAnimEnd}
    >
      <div
        className={`w-full ${maxWidth} ${className} ${animating ? "modal-panel-open" : "modal-panel-closing"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
