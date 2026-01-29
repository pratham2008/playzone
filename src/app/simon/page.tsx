"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['green', 'red', 'yellow', 'blue'] as const;
type Color = typeof COLORS[number];

// Frequencies for each color (C major chordish)
const FREQUENCIES: Record<Color, number> = {
    green: 329.63, // E4
    red: 261.63,   // C4
    yellow: 392.00, // G4
    blue: 523.25   // C5
};

const COLOR_STYLES: Record<Color, { base: string; active: string; glow: string; ring: string }> = {
    green: {
        base: 'bg-green-900/40 border-green-600/50',
        active: 'bg-green-400 shadow-[0_0_60px_rgba(74,222,128,1)] border-green-300',
        glow: 'rgba(74,222,128,0.6)',
        ring: 'border-green-500/30'
    },
    red: {
        base: 'bg-red-900/40 border-red-600/50',
        active: 'bg-red-500 shadow-[0_0_60px_rgba(239,68,68,1)] border-red-300',
        glow: 'rgba(239,68,68,0.6)',
        ring: 'border-red-500/30'
    },
    yellow: {
        base: 'bg-yellow-900/40 border-yellow-600/50',
        active: 'bg-yellow-400 shadow-[0_0_60px_rgba(250,204,21,1)] border-yellow-300',
        glow: 'rgba(250,204,21,0.6)',
        ring: 'border-yellow-500/30'
    },
    blue: {
        base: 'bg-blue-900/40 border-blue-600/50',
        active: 'bg-blue-500 shadow-[0_0_60px_rgba(59,130,246,1)] border-blue-300',
        glow: 'rgba(59,130,246,0.6)',
        ring: 'border-blue-500/30'
    }
};

export default function SimonSays() {
    const [gameState, setGameState] = useState<'idle' | 'showing' | 'input' | 'gameover'>('idle');
    const [sequence, setSequence] = useState<Color[]>([]);
    const [playerIndex, setPlayerIndex] = useState(0);
    const [activeColor, setActiveColor] = useState<Color | null>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('simon-highscore');
        if (saved) setHighScore(parseInt(saved));

        // Init Audio Context
        if (typeof window !== 'undefined') {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContext();
        }

        return () => {
            audioCtxRef.current?.close();
        };
    }, []);

    const playTone = useCallback((freq: number, type: 'sine' | 'triangle' = 'sine', duration: number = 0.3) => {
        if (isMuted || !audioCtxRef.current) return;

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, [isMuted]);

    const playErrorTone = useCallback(() => {
        playTone(150, 'triangle', 0.5);
    }, [playTone]);

    const playSequence = useCallback((seq: Color[]) => {
        setGameState('showing');
        let i = 0;
        const play = () => {
            if (i >= seq.length) {
                setActiveColor(null);
                setGameState('input');
                setPlayerIndex(0);
                return;
            }
            const color = seq[i];
            setActiveColor(color);
            playTone(FREQUENCIES[color]);

            timeoutRef.current = setTimeout(() => {
                setActiveColor(null);
                timeoutRef.current = setTimeout(() => {
                    i++;
                    play();
                }, 150); // Gap between tones
            }, 600); // Tone duration
        };
        timeoutRef.current = setTimeout(play, 800);
    }, [playTone]);

    const startGame = useCallback(() => {
        const firstColor = COLORS[Math.floor(Math.random() * 4)];
        setSequence([firstColor]);
        setScore(0);
        setGameState('showing');
        playSequence([firstColor]);
    }, [playSequence]);

    const handleColorClick = useCallback((color: Color) => {
        if (gameState !== 'input') return;

        setActiveColor(color);
        playTone(FREQUENCIES[color]);
        setTimeout(() => setActiveColor(null), 200);

        if (color === sequence[playerIndex]) {
            if (playerIndex === sequence.length - 1) {
                // Completed sequence
                const newScore = sequence.length;
                setScore(newScore);
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('simon-highscore', newScore.toString());
                }
                // Add new color
                const nextColor = COLORS[Math.floor(Math.random() * 4)];
                const newSequence = [...sequence, nextColor];
                setSequence(newSequence);
                setTimeout(() => playSequence(newSequence), 1000);
            } else {
                setPlayerIndex(playerIndex + 1);
            }
        } else {
            // Wrong color
            playErrorTone();
            setGameState('gameover');
        }
    }, [gameState, sequence, playerIndex, highScore, playSequence, playTone, playErrorTone]);

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current);
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050510] relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05),transparent_70%)] pointer-events-none" />

            <div className="absolute top-8 left-8 z-20">
                <Link href="/">
                    <Button variant="secondary" className="backdrop-blur-md border border-white/10">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            <div className="absolute top-8 right-8 z-20">
                <Button
                    variant="ghost"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:bg-white/10 w-10 h-10 p-0 flex items-center justify-center rounded-full"
                >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </Button>
            </div>

            <div className="z-10 text-center mb-12">
                <h1 className="text-4xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    NEON SIMON
                </h1>
                <div className="text-gray-400 font-mono text-sm tracking-widest">MEMORY SYNC PROTOCOL</div>
            </div>

            {/* Game Board */}
            <div className="relative w-[340px] h-[340px] md:w-[450px] md:h-[450px]">
                {/* Decorative Rings */}
                <div className="absolute inset-0 rounded-full border border-white/5 scale-125 animate-pulse-slow pointer-events-none" />
                <div className="absolute inset-0 rounded-full border border-white/5 scale-110 pointer-events-none" />

                {/* Buttons Container */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-4 rotate-45">
                    {COLORS.map((color, i) => {
                        return null; // Logic in render below
                    })}
                </div>

                {/* Buttons manual layout */}

                {/* Top Left: Green */}
                <button
                    onClick={() => handleColorClick('green')}
                    className={cn(
                        "absolute top-0 left-0 w-[48%] h-[48%] rounded-tl-full border-t-8 border-l-8 transition-all duration-100",
                        COLOR_STYLES.green.base,
                        activeColor === 'green' && COLOR_STYLES.green.active,
                        gameState === 'input' ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
                    )}
                />

                {/* Top Right: Red */}
                <button
                    onClick={() => handleColorClick('red')}
                    className={cn(
                        "absolute top-0 right-0 w-[48%] h-[48%] rounded-tr-full border-t-8 border-r-8 transition-all duration-100",
                        COLOR_STYLES.red.base,
                        activeColor === 'red' && COLOR_STYLES.red.active,
                        gameState === 'input' ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
                    )}
                />

                {/* Bottom Left: Yellow */}
                <button
                    onClick={() => handleColorClick('yellow')}
                    className={cn(
                        "absolute bottom-0 left-0 w-[48%] h-[48%] rounded-bl-full border-b-8 border-l-8 transition-all duration-100",
                        COLOR_STYLES.yellow.base,
                        activeColor === 'yellow' && COLOR_STYLES.yellow.active,
                        gameState === 'input' ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
                    )}
                />

                {/* Bottom Right: Blue */}
                <button
                    onClick={() => handleColorClick('blue')}
                    className={cn(
                        "absolute bottom-0 right-0 w-[48%] h-[48%] rounded-br-full border-b-8 border-r-8 transition-all duration-100",
                        COLOR_STYLES.blue.base,
                        activeColor === 'blue' && COLOR_STYLES.blue.active,
                        gameState === 'input' ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
                    )}
                />

                {/* Center Core */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gray-900 border-4 border-gray-800 flex items-center justify-center z-10 shadow-2xl">
                    <div className="text-center">
                        <div className="text-gray-500 text-xs font-mono uppercase mb-1">Score</div>
                        <div className={cn(
                            "text-4xl font-black text-white font-mono",
                            gameState === 'showing' && "animate-pulse text-cyan-400"
                        )}>
                            {score}
                        </div>
                        {gameState === 'gameover' && (
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <Button onClick={startGame} variant="primary" glow className="rounded-full px-8 py-4 text-lg">
                                    RESTART
                                </Button>
                            </div>
                        )}
                        {gameState === 'idle' && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Button onClick={startGame} variant="primary" glow className="rounded-full w-24 h-24 text-xl font-bold shadow-[0_0_40px_rgba(6,182,212,0.6)] flex items-center justify-center p-0">
                                    PLAY
                                </Button>
                            </div>
                        )}
                        {/* Status Light */}
                        <div className={cn(
                            "w-2 h-2 rounded-full mx-auto mt-2",
                            gameState === 'input' ? "bg-green-500 shadow-[0_0_10px_lime]" :
                                gameState === 'showing' ? "bg-red-500 shadow-[0_0_10px_red]" : "bg-gray-700"
                        )} />
                    </div>
                </div>
            </div>

            {/* High Score Pill */}
            <div className="mt-16 glass px-6 py-2 rounded-full flex gap-4 items-center">
                <span className="text-gray-400 text-sm">HIGH SCORE</span>
                <span className="text-xl font-bold text-white">{highScore}</span>
            </div>

            <p className="mt-4 text-gray-500 text-sm animate-pulse">
                {gameState === 'showing' ? 'WATCH SEQUENCE...' : gameState === 'input' ? 'YOUR TURN' : ''}
            </p>

        </div>
    );
}
