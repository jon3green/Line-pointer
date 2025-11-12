'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode, useState } from 'react';

interface InteractiveButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  ripple?: boolean;
  glow?: boolean;
  magnetic?: boolean;
}

export function InteractiveButton({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  ripple = true,
  glow = true,
  magnetic = true,
  className = '',
  ...props
}: InteractiveButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const variants = {
    primary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white',
    outline: 'bg-transparent hover:bg-white/5 text-white border-2 border-white/20 hover:border-white/40',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white',
    glass: 'glass-premium hover:bg-white/10 text-white border border-white/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    setMousePosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, 600);
    }

    // @ts-ignore
    if (props.onClick) props.onClick(e);
  };

  return (
    <motion.button
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
      }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.1,
      }}
      className={`
        relative overflow-hidden
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl font-semibold
        transition-all duration-200
        flex items-center justify-center gap-2
        ${glow && isHovered ? 'shadow-[0_0_30px_rgba(16,185,129,0.3)]' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
      {...props}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={isHovered ? { x: '100%' } : { x: '-100%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full"
          initial={{
            width: 0,
            height: 0,
            x: ripple.x,
            y: ripple.y,
            opacity: 1,
          }}
          animate={{
            width: 300,
            height: 300,
            x: ripple.x - 150,
            y: ripple.y - 150,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}

      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {leftIcon && (
          <motion.span
            animate={isHovered ? { x: -2 } : { x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {leftIcon}
          </motion.span>
        )}
        {children}
        {rightIcon && (
          <motion.span
            animate={isHovered ? { x: 2 } : { x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {rightIcon}
          </motion.span>
        )}
      </span>

      {/* Glow effect border */}
      {glow && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0"
          animate={{
            opacity: isHovered ? 1 : 0,
            boxShadow: isHovered
              ? '0 0 20px rgba(16,185,129,0.5), inset 0 0 20px rgba(16,185,129,0.1)'
              : '0 0 0 rgba(16,185,129,0)',
          }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}

// Preset button variants for common use cases
export function PrimaryButton(props: Omit<InteractiveButtonProps, 'variant'>) {
  return <InteractiveButton variant="gradient" {...props} />;
}

export function SecondaryButton(props: Omit<InteractiveButtonProps, 'variant'>) {
  return <InteractiveButton variant="glass" glow={false} {...props} />;
}

export function OutlineButton(props: Omit<InteractiveButtonProps, 'variant'>) {
  return <InteractiveButton variant="outline" {...props} />;
}

// Icon Button with circular shape
interface IconButtonProps extends Omit<InteractiveButtonProps, 'children' | 'leftIcon' | 'rightIcon'> {
  icon: ReactNode;
}

export function IconButton({ icon, size = 'md', ...props }: IconButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <InteractiveButton
      size={size}
      className={`${sizeClasses[size]} !p-0 rounded-full`}
      {...props}
    >
      {icon}
    </InteractiveButton>
  );
}

// Button Group for related actions
interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
  return (
    <div className={`flex gap-3 flex-wrap ${className}`}>
      {children}
    </div>
  );
}
