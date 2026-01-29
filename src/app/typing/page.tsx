"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const SPAWN_RATE_INITIAL = 2000;
const WORD_SPEED_INITIAL = 0.5;

const WORD_LIST = [
    "SYSTEM", "HACK", "DATA", "CYBER", "NEON", "CODE", "MATRIX", "NODE", "REACT", "NEXT",
    "SERVER", "CLIENT", "PROXY", "TOKEN", "AUTH", "BUILD", "DEPLOY", "DEBUG", "TRACE", "STACK",
    "QUEUE", "HEAP", "CACHE", "CLOUD", "PIXEL", "SPRITE", "LOGIC", "ASYNC", "AWAIT", "PROMISE",
    "CONST", "VAR", "LET", "TYPE", "CLASS", "VOID", "NULL", "FLOAT", "INT", "CHAR",
    "LINUX", "WINDOWS", "MAC", "BASH", "SHELL", "ROOT", "SUDO", "CHMOD", "GREP", "CURL",
    "FIREWALL", "ENCRYPT", "DECRYPT", "CIPHER", "HASH", "SALT", "KEY", "PAIR", "SSH", "SSL",
    "DOCKER", "KUBE", "POD", "MESH", "GRPC", "REST", "JSON", "XML", "YAML", "HTML"
];

export default function TypingGame() {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [input, setInput] = useState('');
    const [lives, setLives] = useState(5);
    const [wpm, setWpm] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameId = useRef<number>(0);

    // Game State
    const words = useRef<{ text: string, x: number, y: number, speed: number, typed: string, completed: boolean }[]>([]);
    const lastSpawnTime = useRef(0);
    const spawnRate = useRef(SPAWN_RATE_INITIAL);
    const gameTime = useRef(0);
    const wordsTyped = useRef(0);

    const rainDrops = useRef<{ x: number, y: number, speed: number, chars: string }[]>([]);

    const scoreRef = useRef(0);
    const livesRef = useRef(5);

    const initRain = useCallback(() => {
        const drops = [];
        for (let i = 0; i < 50; i++) {
            drops.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                speed: 2 + Math.random() * 5,
                chars: String.fromCharCode(0x30A0 + Math.random() * 96)
            });
        }
        rainDrops.current = drops;
    }, []);

    const startGame = useCallback(() => {
        setScore(0);
        scoreRef.current = 0;
        setLives(5);
        livesRef.current = 5;
        setInput('');
        setWpm(0);
        words.current = [];
        spawnRate.current = SPAWN_RATE_INITIAL;
        gameTime.current = 0;
        wordsTyped.current = 0;
        setGameState('playing');
        initRain();
    }, [initRain]);

    // Initial Rain
    useEffect(() => {
        initRain();
    }, [initRain]);

    const spawnWord = () => {
        const text = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
        // Ensure no duplicates on screen
        if (words.current.some(w => w.text === text)) return;

        words.current.push({
            text,
            x: 50 + Math.random() * (CANVAS_WIDTH - 150),
            y: -30,
            speed: WORD_SPEED_INITIAL + (score / 500) + Math.random() * 0.5,
            typed: "",
            completed: false
        });
    };

    const drawRain = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#0F380F'; // Dark Matrix green bg fade
        ctx.fillStyle = 'rgba(0, 20, 0, 0.3)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Trails effect

        ctx.font = '14px monospace';
        rainDrops.current.forEach(drop => {
            ctx.fillStyle = '#003B00'; // Darker trail
            ctx.fillText(drop.chars, drop.x, drop.y);

            // Head
            ctx.fillStyle = '#00FF41'; // Bright green
            ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), drop.x, drop.y + 15);

            drop.y += drop.speed;
            if (drop.y > CANVAS_HEIGHT) {
                drop.y = -20;
                drop.x = Math.random() * CANVAS_WIDTH;
            }
        });
    };

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw Matrix Rain Background
        drawRain(ctx);

        const now = Date.now();
        if (gameState === 'playing') {
            // Difficulty ramping
            spawnRate.current = Math.max(500, SPAWN_RATE_INITIAL - scoreRef.current * 2);

            // Spawn
            if (now - lastSpawnTime.current > spawnRate.current) {
                spawnWord();
                lastSpawnTime.current = now;
            }

            // Update Words
            words.current.forEach(word => {
                word.y += word.speed;
                if (word.y > CANVAS_HEIGHT - 30) {
                    // Hit bottom
                    if (!word.completed) {
                        word.completed = true;

                        livesRef.current -= 1;
                        setLives(livesRef.current);

                        if (livesRef.current <= 0) {
                            setGameState('gameover');
                        }
                    }
                }
            });

            // Clean up
            words.current = words.current.filter(w => w.y < CANVAS_HEIGHT + 20 && !w.completed);

            // Calculate WPM rough
            gameTime.current += 16; // ms per frame approx
            if (gameTime.current > 0) {
                setWpm(Math.floor((wordsTyped.current / (gameTime.current / 60000))));
            }
        }

        // Draw Words
        ctx.font = 'bold 24px monospace';
        words.current.forEach(word => {
            // Draw box background
            const width = ctx.measureText(word.text).width + 20;
            ctx.fillStyle = 'rgba(0, 20, 0, 0.8)';
            ctx.strokeStyle = '#008F11';
            ctx.lineWidth = 1;
            ctx.fillRect(word.x - 10, word.y - 30, width, 40);
            ctx.strokeRect(word.x - 10, word.y - 30, width, 40);

            // Draw Text
            // Matched part
            ctx.fillStyle = '#00FF41'; // Green matched
            ctx.fillText(word.typed, word.x, word.y);

            // Remaining part
            const typedWidth = ctx.measureText(word.typed).width;
            ctx.fillStyle = '#ffffff'; // White remaining
            ctx.fillText(word.text.substring(word.typed.length), word.x + typedWidth, word.y);

            // Target indicator (if partially typed)
            if (word.typed.length > 0) {
                ctx.strokeStyle = '#00FF41';
                ctx.lineWidth = 2;
                ctx.strokeRect(word.x - 10, word.y - 30, width, 40);
            }
        });

        // Draw Score/HUD overlay in canvas for retro feel
        // (Actually doing HUD in HTML for cleaner text)

        if (gameState === 'playing') {
            frameId.current = requestAnimationFrame(gameLoop);
        }
    }, [gameState, score]);

    useEffect(() => {
        if (gameState === 'playing') {
            frameId.current = requestAnimationFrame(gameLoop);
        }
        return () => cancelAnimationFrame(frameId.current);
    }, [gameState, gameLoop]);

    // Input Handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;

            // Prevent default for game keys to stop scrolling/etc if needed
            if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
                const char = e.key.toUpperCase();

                // Find matching words
                // Prioritize words that are already partially typed
                let target = words.current.find(w => w.typed.length > 0 && w.text[w.typed.length] === char);

                if (!target) {
                    // If no active word, find a new one that starts with this char
                    // Prioritize lowest word (closest to bottom) usually, or random
                    // Let's filter candidates
                    const candidates = words.current.filter(w => w.typed.length === 0 && w.text[0] === char);
                    if (candidates.length > 0) {
                        // Pick the one with lowest Y (closest to bottom/highest Y value)
                        target = candidates.reduce((prev, curr) => (prev.y > curr.y ? prev : curr));
                    }
                }

                if (target) {
                    target.typed += char;
                    if (target.typed === target.text) {
                        // Word Complete
                        scoreRef.current += target!.text.length * 10;
                        setScore(scoreRef.current);
                        wordsTyped.current++;
                        target.completed = true;
                    }
                    setInput(target.typed); // Just for debug/display if needed
                } else {
                    // Mismatch/Mistyped
                    // Penalty? Sound?
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);


    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-8">
                <Link href="/">
                    <Button variant="secondary" className="backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-300 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] font-mono">
                HACKER RUN
            </h1>

            <div className="flex justify-between w-full max-w-[800px] mb-2 font-mono text-xl text-green-400 font-bold bg-black/50 p-4 rounded-xl border border-green-500/30">
                <div>SCORE: {score}</div>
                <div>WPM: {wpm}</div>
                <div className="flex gap-2">
                    SYSTEM INTEGRITY:
                    <div className="flex">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className={cn("w-4 h-6 mx-1 border border-green-500", i < lives ? "bg-green-500" : "bg-transparent opacity-30")} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="rounded-xl border border-green-500/30 bg-black shadow-[0_0_50px_rgba(0,255,65,0.2)]"
                    style={{ maxWidth: '90vw', maxHeight: '75vh', width: 'auto', height: 'auto' }}
                />

                <AnimatePresence>
                    {gameState !== 'playing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl border border-green-500/20"
                        >
                            <div className="text-center font-mono">
                                {gameState === 'gameover' && <div className="text-5xl font-bold text-red-500 mb-4 tracking-tighter">BREACH DETECTED</div>}
                                {gameState === 'gameover' && <div className="text-2xl text-green-400 mb-6">Data Recovered: {score} bytes</div>}

                                <Button onClick={startGame} variant="primary" glow className="text-xl px-10 py-6 rounded-none border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors font-mono">
                                    {gameState === 'start' ? '> INITIALIZE SEQUENCE' : '> REBOOT SYSTEM'}
                                </Button>
                                <p className="text-green-600 mt-6 text-sm">Type the falling words to secure the network.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
