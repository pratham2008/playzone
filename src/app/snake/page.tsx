"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const GRID_SIZE = 20;
const SPEED = 150;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function SnakeGame() {
    const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Point>({ x: 15, y: 5 });
    const [direction, setDirection] = useState<Direction>('UP');
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Ref to hold direction to prevent double moves in one tick
    const directionRef = useRef<Direction>('UP');

    // Initialize High Score
    useEffect(() => {
        const saved = localStorage.getItem('snake-highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    useEffect(() => {
        setHighScore(currentHigh => {
            if (score > currentHigh) {
                localStorage.setItem('snake-highscore', score.toString());
                return score;
            }
            return currentHigh;
        });
    }, [score]);

    const generateFood = useCallback((currentSnake: Point[]) => {
        let newFood: Point;
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
            const collision = currentSnake.some(s => s.x === newFood?.x && s.y === newFood?.y);
            if (!collision) break;
        }
        return newFood;
    }, []);

    const resetGame = () => {
        setSnake([{ x: 10, y: 10 }]);
        setFood(generateFood([{ x: 10, y: 10 }]));
        setDirection('UP');
        directionRef.current = 'UP';
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
    };

    const moveSnake = useCallback(() => {
        if (gameOver || !isPlaying) return;

        setSnake(prev => {
            const head = { ...prev[0] };

            switch (directionRef.current) {
                case 'UP': head.y -= 1; break;
                case 'DOWN': head.y += 1; break;
                case 'LEFT': head.x -= 1; break;
                case 'RIGHT': head.x += 1; break;
            }

            // Wall Collision
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                setGameOver(true);
                setIsPlaying(false);
                return prev;
            }

            // Self Collision
            if (prev.some(s => s.x === head.x && s.y === head.y)) {
                setGameOver(true);
                setIsPlaying(false);
                return prev;
            }

            const newSnake = [head, ...prev];

            // Eat Food
            if (head.x === food.x && head.y === food.y) {
                setScore(s => s + 10);
                setFood(generateFood(newSnake));
            } else {
                newSnake.pop();
            }

            return newSnake;
        });
    }, [food, gameOver, isPlaying, generateFood]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                    if (directionRef.current !== 'DOWN') directionRef.current = 'UP';
                    break;
                case 'ArrowDown':
                    if (directionRef.current !== 'UP') directionRef.current = 'DOWN';
                    break;
                case 'ArrowLeft':
                    if (directionRef.current !== 'RIGHT') directionRef.current = 'LEFT';
                    break;
                case 'ArrowRight':
                    if (directionRef.current !== 'LEFT') directionRef.current = 'RIGHT';
                    break;
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(moveSnake, SPEED);
        return () => clearInterval(interval);
    }, [isPlaying, moveSnake]);

    // Handle touch controls for mobile
    const handleTouch = (d: Direction) => {
        if (d === 'UP' && directionRef.current !== 'DOWN') directionRef.current = 'UP';
        if (d === 'DOWN' && directionRef.current !== 'UP') directionRef.current = 'DOWN';
        if (d === 'LEFT' && directionRef.current !== 'RIGHT') directionRef.current = 'LEFT';
        if (d === 'RIGHT' && directionRef.current !== 'LEFT') directionRef.current = 'RIGHT';
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-8">
                <Link href="/">
                    <Button variant="secondary" className="backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-lime to-green-400 text-glow-lime mb-2">
                    NEON SNAKE
                </h1>
                <div className="flex justify-center gap-8 text-xl font-bold font-mono">
                    <div className="text-neon-lime">SCORE: {score}</div>
                    <div className="text-gray-400">HIGH: {highScore}</div>
                </div>
            </div>

            <div className="relative p-1 bg-gray-800/50 rounded-lg border border-white/10 backdrop-blur-sm shadow-[0_0_30px_rgba(57,255,20,0.1)]">
                <div
                    className="grid gap-[1px] bg-black/40 rounded-lg overflow-hidden"
                    style={{
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        width: 'min(90vw, 400px)',
                        height: 'min(90vw, 400px)'
                    }}
                >
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const isHead = snake[0].x === x && snake[0].y === y;
                        const isBody = snake.some(s => s.x === x && s.y === y);
                        const isFood = food.x === x && food.y === y;

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "w-full h-full transition-all duration-100 rounded-sm",
                                    isHead ? "bg-white shadow-[0_0_10px_white] z-10" :
                                        isBody ? "bg-neon-lime shadow-[0_0_5px_var(--neon-lime)]" :
                                            isFood ? "bg-neon-pink shadow-[0_0_10px_var(--neon-pink)] animate-pulse rounded-full" :
                                                "bg-white/5"
                                )}
                            />
                        );
                    })}
                </div>

                <AnimatePresence>
                    {(!isPlaying || gameOver) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg z-20"
                        >
                            <div className="text-center">
                                {gameOver && <div className="text-4xl font-bold text-red-500 mb-4 text-glow">GAME OVER</div>}
                                <Button onClick={resetGame} variant="primary" glow className="text-xl px-8 py-4">
                                    {gameOver ? <><RotateCcw className="mr-2" /> Try Again</> : <><Play className="mr-2" /> Start Game</>}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile Controls */}
            <div className="mt-8 grid grid-cols-3 gap-2 md:hidden">
                <div />
                <Button variant="secondary" onClick={() => handleTouch('UP')} className="h-12 w-12 flex items-center justify-center">↑</Button>
                <div />
                <Button variant="secondary" onClick={() => handleTouch('LEFT')} className="h-12 w-12 flex items-center justify-center">←</Button>
                <Button variant="secondary" onClick={() => handleTouch('DOWN')} className="h-12 w-12 flex items-center justify-center">↓</Button>
                <Button variant="secondary" onClick={() => handleTouch('RIGHT')} className="h-12 w-12 flex items-center justify-center">→</Button>
            </div>

            <div className="mt-4 text-gray-500 text-sm hidden md:block">
                Use Arrow Keys to Move
            </div>
        </div>
    );
}
