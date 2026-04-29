import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot.png";

interface MascotProps {
  size?: number;
  className?: string;
  bounce?: boolean;
}

export function Mascot({ size = 120, className = "", bounce = true }: MascotProps) {
  return (
    <motion.img
      src={mascotImg}
      alt="Saver mascot"
      width={size}
      height={size}
      className={`object-contain drop-shadow-xl select-none ${className}`}
      animate={bounce ? { y: [0, -8, 0] } : undefined}
      transition={
        bounce
          ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    />
  );
}
