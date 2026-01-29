import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    glow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', glow = false, ...props }, ref) => {
        const variants = {
            primary: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan hover:bg-neon-cyan hover:text-black',
            secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
            danger: 'bg-neon-pink/20 text-neon-pink border border-neon-pink hover:bg-neon-pink hover:text-black',
            ghost: 'bg-transparent text-gray-400 hover:text-white',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'px-6 py-2 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-2',
                    variants[variant],
                    glow && variant === 'primary' && 'hover:shadow-[0_0_15px_var(--neon-cyan)]',
                    glow && variant === 'danger' && 'hover:shadow-[0_0_15px_var(--neon-pink)]',
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
