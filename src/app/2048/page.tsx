"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Grid = (number | null)[][];

const GRID_SIZE = 4;

const createEmptyGrid = (): Grid =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

const getRandomEmptyCell = (grid: Grid): [number, number] | null => {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (!grid[r][c]) empty.push([r, c]);
        }
    }
    return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
};

const addRandomTile = (grid: Grid): Grid => {
    const newGrid = grid.map(row => [...row]);
    const cell = getRandomEmptyCell(newGrid);
    if (cell) {
        newGrid[cell[0]][cell[1]] = Math.random() < 0.9 ? 2 : 4;
    }
    return newGrid;
};

const rotateGrid = (grid: Grid): Grid => {
    const n = grid.length;
    return grid[0].map((_, i) => grid.map(row => row[n - 1 - i]));
};

const slideRow = (row: (number | null)[]): { row: (number | null)[]; score: number } => {
    let arr = row.filter(x => x !== null) as number[];
    let score = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr.splice(i + 1, 1);
        }
    }
    while (arr.length < GRID_SIZE) arr.push(null as unknown as number);
    return { row: arr, score };
};

const moveLeft = (grid: Grid): { grid: Grid; score: number; moved: boolean } => {
    let totalScore = 0;
    let moved = false;
    const newGrid = grid.map(row => {
        const { row: newRow, score } = slideRow(row);
        totalScore += score;
        if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
        return newRow;
    });
    return { grid: newGrid, score: totalScore, moved };
};

const move = (grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): { grid: Grid; score: number; moved: boolean } => {
    let rotated = grid;
    const rotations = { left: 0, up: 1, right: 2, down: 3 };
    for (let i = 0; i < rotations[direction]; i++) rotated = rotateGrid(rotated);

    const result = moveLeft(rotated);

    for (let i = 0; i < (4 - rotations[direction]) % 4; i++) result.grid = rotateGrid(result.grid);

    return result;
};

const checkGameOver = (grid: Grid): boolean => {
    for (const dir of ['left', 'right', 'up', 'down'] as const) {
        if (move(grid, dir).moved) return false;
    }
    return true;
};

const getTileColor = (value: number | null): string => {
    if (!value) return 'bg-white/5';
    const colors: Record<number, string> = {
        2: 'bg-cyan-900/50 text-cyan-300',
        4: 'bg-cyan-800/50 text-cyan-200',
        8: 'bg-orange-700/60 text-orange-200',
        16: 'bg-orange-600/70 text-orange-100',
        32: 'bg-red-600/70 text-red-100',
        64: 'bg-red-500/80 text-white',
        128: 'bg-yellow-500/70 text-yellow-100 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
        256: 'bg-yellow-400/80 text-yellow-900 shadow-[0_0_20px_rgba(234,179,8,0.6)]',
        512: 'bg-yellow-300/90 text-yellow-900 shadow-[0_0_25px_rgba(234,179,8,0.7)]',
        1024: 'bg-purple-500/80 text-white shadow-[0_0_30px_rgba(168,85,247,0.6)]',
        2048: 'bg-neon-cyan text-black shadow-[0_0_40px_var(--neon-cyan)]',
    };
    return colors[value] || 'bg-purple-400 text-white shadow-[0_0_40px_rgba(168,85,247,0.8)]';
};

export default function Game2048() {
    const [grid, setGrid] = useState<Grid>(createEmptyGrid());
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('2048-best');
        if (saved) setBestScore(parseInt(saved));
        initGame();
    }, []);

    const initGame = () => {
        let newGrid = createEmptyGrid();
        newGrid = addRandomTile(newGrid);
        newGrid = addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
        setWon(false);
    };

    const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
        if (gameOver) return;

        const result = move(grid, direction);
        if (!result.moved) return;

        let newGrid = addRandomTile(result.grid);
        const newScore = score + result.score;

        setGrid(newGrid);
        setScore(newScore);

        if (newScore > bestScore) {
            setBestScore(newScore);
            localStorage.setItem('2048-best', newScore.toString());
        }

        // Check for 2048
        if (!won && newGrid.flat().includes(2048)) {
            setWon(true);
        }

        if (checkGameOver(newGrid)) {
            setGameOver(true);
        }
    }, [grid, score, bestScore, gameOver, won]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const dir = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
                handleMove(dir);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleMove]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-8">
                <Link href="/">
                    <Button variant="secondary" className="backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                2048
            </h1>

            <div className="flex gap-8 mb-6">
                <div className="glass px-6 py-3 rounded-xl text-center">
                    <div className="text-gray-400 text-xs uppercase">Score</div>
                    <div className="text-2xl font-bold text-white">{score}</div>
                </div>
                <div className="glass px-6 py-3 rounded-xl text-center">
                    <div className="text-gray-400 text-xs uppercase">Best</div>
                    <div className="text-2xl font-bold text-neon-cyan">{bestScore}</div>
                </div>
                <Button variant="secondary" onClick={initGame} className="self-center">
                    <RotateCcw className="w-4 h-4" />
                </Button>
            </div>

            <div className="relative">
                <div className="grid grid-cols-4 gap-2 p-3 rounded-xl glass">
                    {grid.flat().map((value, i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center font-bold text-xl md:text-2xl transition-all",
                                getTileColor(value)
                            )}
                        >
                            <AnimatePresence>
                                {value && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={cn(value >= 1000 && "text-lg md:text-xl")}
                                    >
                                        {value}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>

                <AnimatePresence>
                    {(gameOver || won) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl"
                        >
                            <div className="text-center">
                                <div className={cn("text-4xl font-bold mb-4", won ? "text-neon-cyan" : "text-red-500")}>
                                    {won ? "YOU WIN!" : "GAME OVER"}
                                </div>
                                <Button onClick={initGame} variant="primary" glow>
                                    <RotateCcw className="mr-2" /> New Game
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-6 text-gray-500 text-sm">
                Use arrow keys to move tiles
            </div>
        </div>
    );
}
