import { motion } from "motion/react";
import { AnimatedText } from "./AnimatedText";

interface LogoProps {
  showText?: boolean;
}

export function Logo({ showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Rotating Ellipse */}
        <motion.svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 8,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          <ellipse
            cx="16"
            cy="16"
            rx="14"
            ry="6"
            fill="none"
            stroke="#1e293b"
            strokeWidth="2"
            transform="rotate(-45 16 16)"
          />
          <ellipse
            cx="16"
            cy="16"
            rx="14"
            ry="6"
            fill="none"
            stroke="#FF8C00"
            strokeWidth="2"
            transform="rotate(45 16 16)"
          />
        </motion.svg>
        
        {/* Animated the letter V generating constantly */}
        <motion.div
           className="text-primary font-bold text-lg relative z-10 font-sans"
           animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
           }}
           transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
           }}
        >
          V
        </motion.div>
      </div>
      {showText && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="font-bold text-xl uppercase tracking-tighter flex"
        >
          <span className="text-slate-900">Vui</span>
          <span className="text-gray-500 font-light ml-1">Task</span>
        </motion.div>
      )}
    </div>
  );
}
