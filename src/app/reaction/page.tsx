"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type GameState = 'idle' | 'waiting' | 'ready' | 'clicked' | 'early';

export default function ReactionGame() {
    const [gameState, setGameState] = useState<GameState>('idle');
    const [reactionTime, setReactionTime] = useState<number | null>(null);
    const [bestTime, setBestTime] = useState<number | null>(null);
    const [attempts, setAttempts] = useState<number[]>([]);

    const startTimeRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const startGame = useCallback(() => {
        setGameState('waiting');
        setReactionTime(null);

        // Random delay between 2-5 seconds
        const delay = 2000 + Math.random() * 3000;
        timeoutRef.current = setTimeout(() => {
            startTimeRef.current = Date.now();
            setGameState('ready');
        }, delay);
    }, []);

    const handleClick = useCallback(() => {
        if (gameState === 'waiting') {
            clearTimeout(timeoutRef.current);
            setGameState('early');
        } else if (gameState === 'ready') {
            const time = Date.now() - startTimeRef.current;
            setReactionTime(time);
            setAttempts(prev => [...prev.slice(-4), time]); // Keep last 5
            setGameState('clicked');

            if (!bestTime || time < bestTime) {
                setBestTime(time);
            }
        } else if (gameState === 'idle' || gameState === 'clicked' || gameState === 'early') {
            startGame();
        }
    }, [gameState, bestTime, startGame]);

    const getAverageTime = () => {
        if (attempts.length === 0) return null;
        return Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length);
    };

    const getTimeColor = (time: number) => {
        if (time < 200) return 'text-neon-lime';
        if (time < 300) return 'text-neon-cyan';
        if (time < 400) return 'text-yellow-400';
        return 'text-orange-400';
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-8">
                <Link href="/">
                    <Button variant="secondary" className="backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                REACTION TEST
            </h1>

            <motion.button
                onClick={handleClick}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "w-80 h-80 md:w-96 md:h-96 rounded-3xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer select-none",
                    gameState === 'idle' && "bg-neon-cyan/20 border-2 border-neon-cyan hover:shadow-[0_0_40px_var(--neon-cyan)]",
                    gameState === 'waiting' && "bg-red-500/30 border-2 border-red-500",
                    gameState === 'ready' && "bg-neon-lime/30 border-2 border-neon-lime shadow-[0_0_50px_var(--neon-lime)] animate-pulse",
                    gameState === 'clicked' && "bg-neon-cyan/20 border-2 border-neon-cyan",
                    gameState === 'early' && "bg-orange-500/30 border-2 border-orange-500"
                )}
            >
                {gameState === 'idle' && (
                    <div className="text-center">
                        <Zap className="w-16 h-16 mx-auto mb-4 text-neon-cyan" />
                        <div className="text-2xl font-bold text-white mb-2">Click to Start</div>
                        <div className="text-gray-400 text-sm">Test your reflexes</div>
                    </div>
                )}

                {gameState === 'waiting' && (
                    <div className="text-center">
                        <div className="text-4xl font-bold text-red-400 mb-2">Wait...</div>
                        <div className="text-gray-400 text-sm">Click when it turns green</div>
                    </div>
                )}

                {gameState === 'ready' && (
                    <div className="text-center">
                        <div className="text-5xl font-black text-neon-lime mb-2">CLICK!</div>
                    </div>
                )}

                {gameState === 'clicked' && reactionTime && (
                    <div className="text-center">
                        <div className={cn("text-6xl font-black mb-2", getTimeColor(reactionTime))}>
                            {reactionTime}ms
                        </div>
                        <div className="text-gray-400 text-sm mb-4">Click to try again</div>
                    </div>
                )}

                {gameState === 'early' && (
                    <div className="text-center">
                        <div className="text-4xl font-bold text-orange-400 mb-2">Too Early!</div>
                        <div className="text-gray-400 text-sm">Click to try again</div>
                    </div>
                )}
            </motion.button>

            {(bestTime || getAverageTime()) && (
                <div className="mt-8 flex gap-8 text-center">
                    {bestTime && (
                        <div>
                            <div className="text-gray-400 text-sm">Best</div>
                            <div className={cn("text-2xl font-bold", getTimeColor(bestTime))}>{bestTime}ms</div>
                        </div>
                    )}
                    {getAverageTime() && (
                        <div>
                            <div className="text-gray-400 text-sm">Average</div>
                            <div className="text-2xl font-bold text-white">{getAverageTime()}ms</div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6 text-gray-500 text-sm text-center max-w-md">
                When the box turns <span className="text-neon-lime">green</span>, click as fast as you can!
            </div>
        </div>
    );
}
