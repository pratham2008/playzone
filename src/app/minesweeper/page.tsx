"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw, Flag, Bomb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ROWS = 16;
const COLS = 16;
const MINES = 40;

type Cell = {
    x: number;
    y: number;
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
};

export default function Minesweeper() {
    const [grid, setGrid] = useState<Cell[][]>([]);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
    const [mineCount, setMineCount] = useState(MINES);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef<NodeJS.Timeout>(null!);

    const initGrid = () => {
        // Create empty grid
        const newGrid: Cell[][] = [];
        for (let y = 0; y < ROWS; y++) {
            const row: Cell[] = [];
            for (let x = 0; x < COLS; x++) {
                row.push({ x, y, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 });
            }
            newGrid.push(row);
        }

        // Place Mines
        let minesPlaced = 0;
        while (minesPlaced < MINES) {
            const y = Math.floor(Math.random() * ROWS);
            const x = Math.floor(Math.random() * COLS);
            if (!newGrid[y][x].isMine) {
                newGrid[y][x].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate Neighbors
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (newGrid[y][x].isMine) continue;
                let mines = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dy === 0 && dx === 0) continue;
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && newGrid[ny][nx].isMine) {
                            mines++;
                        }
                    }
                }
                newGrid[y][x].neighborMines = mines;
            }
        }

        setGrid(newGrid);
        setMineCount(MINES);
        setTimer(0);
        setGameState('playing');

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    };

    useEffect(() => {
        initGrid();
        return () => clearInterval(timerRef.current);
    }, []);

    const revealCell = (y: number, x: number) => {
        if (gameState !== 'playing' || grid[y][x].isRevealed || grid[y][x].isFlagged) return;

        const newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell }))])];
        const cell = newGrid[y][x];

        if (cell.isMine) {
            // BOOM
            cell.isRevealed = true;
            setGrid(newGrid);
            setGameState('lost');
            clearInterval(timerRef.current);
            // Reveal all mines
            revealAllMines(newGrid);
            return;
        }

        // Flood fill
        const queue = [[y, x]];
        while (queue.length > 0) {
            const [cy, cx] = queue.pop()!;
            const current = newGrid[cy][cx];

            if (!current.isRevealed && !current.isFlagged) {
                current.isRevealed = true;
                if (current.neighborMines === 0) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const ny = cy + dy;
                            const nx = cx + dx;
                            if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && !newGrid[ny][nx].isRevealed) {
                                queue.push([ny, nx]);
                            }
                        }
                    }
                }
            }
        }

        setGrid(newGrid);
        checkWin(newGrid);
    };

    const toggleFlag = (e: React.MouseEvent, y: number, x: number) => {
        e.preventDefault();
        if (gameState !== 'playing' || grid[y][x].isRevealed) return;

        const newGrid = [...grid.map(row => [...row.map(cell => ({ ...cell }))])];
        newGrid[y][x].isFlagged = !newGrid[y][x].isFlagged;
        setGrid(newGrid);
        setMineCount(c => newGrid[y][x].isFlagged ? c - 1 : c + 1);
    };

    const revealAllMines = (currentGrid: Cell[][]) => {
        const newGrid = currentGrid.map(row => row.map(cell => {
            if (cell.isMine) return { ...cell, isRevealed: true };
            return cell;
        }));
        setGrid(newGrid);
    };

    const checkWin = (currentGrid: Cell[][]) => {
        let unrevealedSafe = 0;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (!currentGrid[y][x].isMine && !currentGrid[y][x].isRevealed) {
                    unrevealedSafe++;
                }
            }
        }
        if (unrevealedSafe === 0) {
            setGameState('won');
            clearInterval(timerRef.current);
        }
    };

    const getNumberColor = (num: number) => {
        const colors = [
            'text-transparent',
            'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]',
            'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]',
            'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]',
            'text-purple-400',
            'text-yellow-400',
            'text-pink-400',
            'text-orange-400',
            'text-gray-400',
        ];
        return colors[num];
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

            <h1 className="text-4xl md:text-5xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                DATA SWEEPER
            </h1>

            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-6 px-2 font-mono text-xl">
                    <div className="bg-black/50 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 flex items-center gap-2 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]">
                        <Bomb size={20} /> {mineCount}
                    </div>

                    <Button onClick={initGrid} variant="ghost" className="hover:bg-white/10 p-2 rounded-full">
                        <div className={cn("text-3xl transition-transform", gameState === 'lost' ? "grayscale" : "")}>
                            {gameState === 'playing' ? '😎' : gameState === 'won' ? '🥳' : gameState === 'lost' ? '💀' : '🙂'}
                        </div>
                    </Button>

                    <div className="bg-black/50 px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-400 w-24 text-right shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]">
                        {timer.toString().padStart(3, '0')}
                    </div>
                </div>

                <div
                    className="grid gap-[2px] bg-white/5 p-[2px] rounded-lg"
                    style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
                >
                    {grid.map((row, y) => (
                        row.map((cell, x) => (
                            <div
                                key={`${y}-${x}`}
                                onClick={() => revealCell(y, x)}
                                onContextMenu={(e) => toggleFlag(e, y, x)}
                                className={cn(
                                    "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-lg font-bold cursor-pointer transition-all duration-100 select-none",
                                    !cell.isRevealed && "bg-slate-800 hover:bg-slate-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]",
                                    cell.isRevealed && "bg-black/40",
                                    cell.isRevealed && cell.isMine && "bg-red-500/50",
                                    "border border-white/5 rounded-sm"
                                )}
                            >
                                {cell.isFlagged && !cell.isRevealed && <Flag size={16} className="text-red-500" fill="currentColor" />}
                                {cell.isRevealed && cell.isMine && <Bomb size={18} className="text-white animate-pulse" />}
                                {cell.isRevealed && !cell.isMine && cell.neighborMines > 0 && (
                                    <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                                )}
                            </div>
                        ))
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {gameState !== 'playing' && gameState !== 'idle' && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mt-6 font-bold text-2xl flex flex-col items-center gap-4"
                    >
                        {gameState === 'won' && <span className="text-neon-lime drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]">SYSTEM DECRYPTED SUCCESSFULLY!</span>}
                        {gameState === 'lost' && <span className="text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">FIREWALL TRIGGERED!</span>}

                        <Button onClick={initGrid} variant="primary" glow className="px-8 py-2">
                            {gameState === 'won' ? 'Hack Another Node' : 'Retry Decryption'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
