import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface GameCardProps {
    title: string;
    description: string;
    href: string;
    color: 'cyan' | 'pink' | 'lime' | 'purple';
    icon?: React.ReactNode;
    image?: string;
}

export function GameCard({ title, description, href, color, icon, image }: GameCardProps) {
    const colorStyles = {
        cyan: {
            border: 'group-hover:border-neon-cyan',
            shadow: 'group-hover:shadow-[0_0_20px_var(--neon-cyan)]',
            bg: 'bg-neon-cyan/20',
            text: 'text-neon-cyan'
        },
        pink: {
            border: 'group-hover:border-neon-pink',
            shadow: 'group-hover:shadow-[0_0_20px_var(--neon-pink)]',
            bg: 'bg-neon-pink/20',
            text: 'text-neon-pink'
        },
        lime: {
            border: 'group-hover:border-neon-lime',
            shadow: 'group-hover:shadow-[0_0_20px_var(--neon-lime)]',
            bg: 'bg-neon-lime/20',
            text: 'text-neon-lime'
        },
        purple: {
            border: 'group-hover:border-neon-purple',
            shadow: 'group-hover:shadow-[0_0_20px_var(--neon-purple)]',
            bg: 'bg-neon-purple/20',
            text: 'text-neon-purple'
        },
    };

    const styles = colorStyles[color];

    return (
        <Link href={href} className={cn(
            "group relative block w-full overflow-hidden rounded-3xl bg-gray-900 border border-white/10 transition-all duration-500",
            styles.border
        )}>
            <div className="relative aspect-[4/3] w-full overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className={cn("w-full h-full flex items-center justify-center", styles.bg)}>
                        {icon}
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-4 mb-2">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xl backdrop-blur-md shadow-lg",
                            styles.bg,
                            styles.text
                        )}>
                            {icon}
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-wide drop-shadow-md group-hover:text-glow transition-all">
                            {title}
                        </h3>
                    </div>
                    {/* Description only shows on hover/focus if space permits, or simpler implementation: always show but constrained */}
                    <p className="text-gray-300 text-sm line-clamp-2 opacity-0 h-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                        {description}
                    </p>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100">
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md border border-white/50 text-white shadow-[0_0_30px_rgba(255,255,255,0.3)]",
                        styles.bg
                    )}>
                        <ArrowRight className="w-8 h-8" />
                    </div>
                </div>
            </div>
        </Link>
    )
}
