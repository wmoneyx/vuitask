import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}

export function AnimatedText({ children, className, delay = 0, as: Component = 'span' }: AnimatedTextProps) {
  const MotionComponent = motion.create(Component as any);
  return (
    <MotionComponent
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
      className={cn("inline-block", className)}
    >
      {children}
    </MotionComponent>
  );
}

export function AnimatedDiv({ children, className, delay = 0, ...props }: AnimatedTextProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay, ease: "easeOut" }}
      className={className}
      {...props as any}
    >
      {children}
    </motion.div>
  );
}
