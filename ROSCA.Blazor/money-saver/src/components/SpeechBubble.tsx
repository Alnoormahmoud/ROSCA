import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  side?: "left" | "right";
  className?: string;
}

export function SpeechBubble({
  children,
  side = "right",
  className = "",
}: SpeechBubbleProps) {
  const tailSide = side === "right" ? "left-0 -translate-x-2" : "right-0 translate-x-2";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={`relative bg-white border-2 border-primary/20 rounded-3xl px-6 py-5 shadow-lg max-w-md ${className}`}
    >
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l-2 border-b-2 border-primary/20 ${tailSide} rotate-45`}
        aria-hidden="true"
      />
      <div className="relative text-foreground">{children}</div>
    </motion.div>
  );
}
