import { motion } from "motion/react";

interface LogoProps {
  showText?: boolean;
}

export function Logo({ showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Rotating Geometric Ellipses */}
        <motion.svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{
            duration: 10,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          <ellipse
            cx="20"
            cy="20"
            rx="18"
            ry="7"
            fill="none"
            stroke="currentColor"
            className="text-slate-900"
            strokeWidth="3"
            transform="rotate(-45 20 20)"
          />
          <ellipse
            cx="20"
            cy="20"
            rx="18"
            ry="7"
            fill="none"
            stroke="currentColor"
            className="text-orange-500"
            strokeWidth="3"
            transform="rotate(45 20 20)"
          />
        </motion.svg>
        
        {/* Animated letter V */}
        <motion.div
           className="text-slate-900 font-extrabold text-xl relative z-10 font-sans"
           animate={{
            scale: [1, 1.1, 1],
           }}
           transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
           }}
        >
          V
        </motion.div>
      </div>
      {showText && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="font-bold text-2xl uppercase tracking-tighter flex"
        >
          <span className="text-slate-900">Vui</span>
          <span className="text-orange-500 ml-1">Task</span>
        </motion.div>
      )}
    </div>
  );
}
