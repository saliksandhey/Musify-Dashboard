import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "lg",
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container with max-h-[90vh] and flex-col */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: "-45%" }}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, y: "-45%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 z-50 w-[92vw]",
              sizeMap[size],
              "max-h-[88vh] flex flex-col bg-surface-2 border border-white/10 rounded-2xl shadow-2xl overflow-hidden",
              className
            )}
          >
            {/* Header (Fixed at top of modal) */}
            {(title || description) && (
              <div className="flex items-start justify-between p-5 border-b border-white/8 flex-shrink-0 bg-surface-2 z-10">
                <div>
                  {title && (
                    <h2 className="text-lg font-bold text-foreground tracking-tight">{title}</h2>
                  )}
                  {description && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/8 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Body (Scrollable container so form fields are never cut off) */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
