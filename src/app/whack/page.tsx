"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const GAME_DURATION = 30; // seconds
const GRID_SIZE = 9;

export default function WhackAMole() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [activeHoles, setActiveHoles] = useState<number[]>([]);
    const [highScore, setHighScore] = useState(0);

    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const moleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        const saved = localStorage.getItem('whack-highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const spawnMole = useCallback(() => {
        if (!isPlaying) return;

        const numMoles = Math.random() > 0.7 ? 2 : 1;
        const holes: number[] = [];
        while (holes.length < numMoles) {
            const hole = Math.floor(Math.random() * GRID_SIZE);
            if (!holes.includes(hole)) holes.push(hole);
        }
        setActiveHoles(holes);

        // Mole disappears after random time
        moleTimeoutRef.current = setTimeout(() => {
            setActiveHoles([]);
            // Spawn next mole
            const nextDelay = 800 + Math.random() * 600;
            timeoutRef.current = setTimeout(spawnMole, nextDelay);
        }, 1000 + Math.random() * 500);
    }, [isPlaying]);

    const startGame = useCallback(() => {
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setActiveHoles([]);
        setGameOver(false);
        setIsPlaying(true);
    }, []);

    useEffect(() => {
        if (isPlaying) {
            const delay = 500 + Math.random() * 500;
            timeoutRef.current = setTimeout(spawnMole, delay);
        }
        return () => {
            clearTimeout(timeoutRef.current);
            clearTimeout(moleTimeoutRef.current);
        };
    }, [isPlaying, spawnMole]);

    useEffect(() => {
        if (!isPlaying || gameOver) return;

        if (timeLeft <= 0) {
            setIsPlaying(false);
            setGameOver(true);
            setActiveHoles([]);
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('whack-highscore', score.toString());
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, gameOver, timeLeft, score, highScore]);

    const handleWhack = (index: number) => {
        if (activeHoles.includes(index)) {
            setScore(s => s + 10);
            setActiveHoles(prev => prev.filter(h => h !== index));
        }
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

            <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                WHACK-A-MOLE
            </h1>

            {isPlaying && (
                <div className="flex gap-8 mb-6 text-xl font-bold font-mono">
                    <div className="text-neon-cyan">SCORE: {score}</div>
                    <div className={cn("transition-colors", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-white")}>
                        TIME: {timeLeft}s
                    </div>
                </div>
            )}

            <div className="relative">
                <div className="grid grid-cols-3 gap-4 p-6 rounded-2xl glass">
                    {Array.from({ length: GRID_SIZE }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => handleWhack(i)}
                            disabled={!isPlaying}
                            className={cn(
                                "w-20 h-20 md:w-28 md:h-28 rounded-xl flex items-center justify-center transition-all duration-100",
                                "bg-black/40 border border-white/10",
                                isPlaying && "hover:bg-white/5 cursor-crosshair",
                                activeHoles.includes(i) && "bg-orange-500/30 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)]"
                            )}
                        >
                            <AnimatePresence>
                                {activeHoles.includes(i) && (
                                    <motion.div
                                        initial={{ scale: 0, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 0, y: 20 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <Target className="w-12 h-12 md:w-16 md:h-16 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    ))}
                </div>

                <AnimatePresence>
                    {(!isPlaying || gameOver) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl"
                        >
                            <div className="text-center">
                                {gameOver && (
                                    <>
                                        <div className="text-3xl font-bold text-white mb-2">TIME&apos;S UP!</div>
                                        <div className="text-5xl font-black text-orange-500 mb-2">{score}</div>
                                        <div className="text-gray-400 mb-6">High Score: {highScore}</div>
                                    </>
                                )}
                                <Button onClick={startGame} variant="primary" glow className="text-xl px-8 py-4">
                                    {gameOver ? <><RotateCcw className="mr-2" /> Play Again</> : <><Play className="mr-2" /> Start</>}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-6 text-gray-500 text-sm text-center">
                Click targets as fast as you can!
            </div>
        </div>
    );
}
