import { motion } from "motion/react";

interface LogoProps {
  showText?: boolean;
}

export function Logo({ showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
        {/* Modern Circular Logo Background */}
        <motion.div className="absolute inset-0 bg-slate-900 rounded-full shadow-md flex items-center justify-center overflow-hidden">
          {/* Subtle outer stroke effect */}
          <motion.div 
            className="absolute inset-1 border-[2px] border-amber-500/30 rounded-full border-t-amber-500 border-l-amber-500/80" 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          <svg className="absolute z-10 w-[26px] h-[26px] mt-0.5" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* The V shape (bottom layer) */}
            <path d="M4 6 L12 19 L20 6" stroke="#fff" strokeWidth="2.5" />
            
            {/* The S cutout mask (middle layer) to create 3D overlap effect */}
            <path d="M15 7.5 C15 5.5 13.5 5 12 5 C10.5 5 9 5.5 9 7.5 C9 9.5 10.5 10.5 12 11.5 C13.5 12.5 15 13.5 15 15.5 C15 17.5 13.5 18 12 18 C10.5 18 9 17.5 9 15.5" stroke="#0F172A" strokeWidth="5.5" />
            <path d="M12 3 V5 M12 18 V21" stroke="#0F172A" strokeWidth="5.5" />
            
            {/* The S shape forming $ (top layer) with glow */}
            <g className="drop-shadow-[0_0_2px_rgba(245,158,11,0.8)]">
              <path d="M15 7.5 C15 5.5 13.5 5 12 5 C10.5 5 9 5.5 9 7.5 C9 9.5 10.5 10.5 12 11.5 C13.5 12.5 15 13.5 15 15.5 C15 17.5 13.5 18 12 18 C10.5 18 9 17.5 9 15.5" stroke="#F59E0B" strokeWidth="2.5" />
              <path d="M12 3 V5 M12 18 V21" stroke="#F59E0B" strokeWidth="2.5" />
            </g>
          </svg>
        </motion.div>
      </div>
      {showText && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="font-bold text-2xl uppercase tracking-tighter flex items-center"
        >
          {["V", "u", "i", "T", "a", "s", "k"].map((char, i) => (
            <motion.span
              key={i}
              className={`inline-block ${i < 3 ? "text-slate-900" : "text-amber-500"} ${i === 3 ? "ml-1" : ""}`}
              animate={{ y: [0, -3, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      )}
    </div>
  );
}
