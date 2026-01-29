"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw, ArrowRight, ArrowDown, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

const SHAPES = [
    { type: 'I', shape: [[1, 1, 1, 1]], color: 'cyan' },
    { type: 'O', shape: [[1, 1], [1, 1]], color: 'yellow' },
    { type: 'T', shape: [[0, 1, 0], [1, 1, 1]], color: 'purple' },
    { type: 'S', shape: [[0, 1, 1], [1, 1, 0]], color: 'green' },
    { type: 'Z', shape: [[1, 1, 0], [0, 1, 1]], color: 'red' },
    { type: 'J', shape: [[1, 0, 0], [1, 1, 1]], color: 'blue' },
    { type: 'L', shape: [[0, 0, 1], [1, 1, 1]], color: 'orange' },
];

const COLORS: Record<string, string> = {
    cyan: 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.8)]',
    yellow: 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]',
    purple: 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.8)]',
    green: 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]',
    red: 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]',
    blue: 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]',
    orange: 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)]',
    ghost: 'bg-white/10 border border-white/20',
};

type Piece = {
    shape: number[][];
    color: string;
    x: number;
    y: number;
};

export default function Tetris() {
    const [grid, setGrid] = useState<(string | null)[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    const [activePiece, setActivePiece] = useState<Piece | null>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [highScore, setHighScore] = useState(0);

    const gameInterval = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        const saved = localStorage.getItem('tetris-highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    // 1. checkCollision (Independent)
    const checkCollision = useCallback((shape: number[][], x: number, y: number, currentGrid: (string | null)[][]) => {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const newX = x + c;
                    const newY = y + r;
                    if (
                        newX < 0 ||
                        newX >= COLS ||
                        newY >= ROWS ||
                        (newY >= 0 && currentGrid[newY][newX])
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }, []);

    // 2. spawnPiece (Depends on checkCollision)
    const spawnPiece = useCallback(() => {
        const type = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const newPiece: Piece = {
            shape: type.shape,
            color: type.color,
            x: Math.floor(COLS / 2) - Math.floor(type.shape[0].length / 2),
            y: 0,
        };

        // Check collision on spawn
        if (checkCollision(newPiece.shape, newPiece.x, newPiece.y, grid)) {
            setGameOver(true);
            setIsPlaying(false);
        } else {
            setActivePiece(newPiece);
        }
    }, [grid, checkCollision]);

    // 3. mergePiece (Depends on grid, score, highScore)
    // Note: We avoid calling spawnPiece directly here to avoid circular dep loop in some linters, 
    // but logic-wise merge leads to spawn.
    // To be safe, we'll set activePiece to null, and let an effect trigger spawn if playing.
    const mergePiece = useCallback(() => {
        if (!activePiece) return;
        const newGrid = grid.map(row => [...row]);
        for (let r = 0; r < activePiece.shape.length; r++) {
            for (let c = 0; c < activePiece.shape[r].length; c++) {
                if (activePiece.shape[r][c]) {
                    if (activePiece.y + r >= 0) {
                        newGrid[activePiece.y + r][activePiece.x + c] = activePiece.color;
                    }
                }
            }
        }

        // Clear lines
        let rowsCleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
            if (newGrid[r].every(cell => cell !== null)) {
                newGrid.splice(r, 1);
                newGrid.unshift(Array(COLS).fill(null));
                rowsCleared++;
                r++; // Check same row index again
            }
        }

        if (rowsCleared > 0) {
            const points = [0, 100, 300, 500, 800][rowsCleared];
            setScore(s => {
                const newScore = s + points;
                if (newScore > highScore) {
                    setHighScore(newScore);
                    localStorage.setItem('tetris-highscore', newScore.toString());
                }
                return newScore;
            });
        }

        setGrid(newGrid);
        setActivePiece(null); // Triggers spawn effect
    }, [activePiece, grid, highScore]);

    // 4. movePiece (Depends on checkCollision, mergePiece)
    const movePiece = useCallback((dx: number, dy: number) => {
        if (!activePiece || !isPlaying || gameOver) return;
        if (!checkCollision(activePiece.shape, activePiece.x + dx, activePiece.y + dy, grid)) {
            setActivePiece({ ...activePiece, x: activePiece.x + dx, y: activePiece.y + dy });
        } else if (dy > 0) {
            mergePiece();
        }
    }, [activePiece, isPlaying, gameOver, grid, checkCollision, mergePiece]);

    // 5. rotatePiece
    const rotatePiece = useCallback(() => {
        if (!activePiece || !isPlaying || gameOver) return;
        const rotatedShape = activePiece.shape[0].map((_, i) => activePiece.shape.map(row => row[i]).reverse());
        if (!checkCollision(rotatedShape, activePiece.x, activePiece.y, grid)) {
            setActivePiece({ ...activePiece, shape: rotatedShape });
        }
    }, [activePiece, isPlaying, gameOver, grid, checkCollision]);

    // 6. dropPiece
    const dropPiece = useCallback(() => {
        if (!activePiece || !isPlaying || gameOver) return;
        let dropY = activePiece.y;
        while (!checkCollision(activePiece.shape, activePiece.x, dropY + 1, grid)) {
            dropY++;
        }
        // Force update to dropY. We can't call mergePiece immediately as strict state might not be updated yet.
        // We will just place it there. Next tick or user input will merge.
        // Or we can manually trigger merge logic on NEW state? Too complex for now.
        // Just setting it.
        setActivePiece({ ...activePiece, y: dropY });
    }, [activePiece, isPlaying, gameOver, grid, checkCollision]);


    // Game Loop
    useEffect(() => {
        if (isPlaying && !gameOver) {
            gameInterval.current = setInterval(() => {
                movePiece(0, 1);
            }, 500); // Speed
        }
        return () => clearInterval(gameInterval.current);
    }, [isPlaying, gameOver, movePiece]);

    const startGame = useCallback(() => {
        setGrid(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        setActivePiece(null);
    }, []);

    // Initial spawn effect & Respawn
    useEffect(() => {
        if (isPlaying && !activePiece && !gameOver) {
            spawnPiece();
        }
    }, [isPlaying, activePiece, gameOver, spawnPiece]);


    // Input handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activePiece && isPlaying && !gameOver) {
                if (['ArrowUp', 'ArrowDown', ' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                }

                if (e.key === 'ArrowLeft') movePiece(-1, 0);
                if (e.key === 'ArrowRight') movePiece(1, 0);
                if (e.key === 'ArrowDown') movePiece(0, 1);
                if (e.key === 'ArrowUp') rotatePiece();
                if (e.key === ' ') dropPiece();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activePiece, isPlaying, gameOver, movePiece, rotatePiece, dropPiece]);

    // Ghost Piece Calculation
    const getGhostY = useCallback(() => {
        if (!activePiece) return 0;
        let ghostY = activePiece.y;
        while (!checkCollision(activePiece.shape, activePiece.x, ghostY + 1, grid)) {
            ghostY++;
        }
        return ghostY;
    }, [activePiece, grid, checkCollision]);

    const renderGrid = () => {
        const displayGrid = grid.map(row => [...row]);

        // Render Ghost
        if (activePiece && isPlaying) {
            const ghostY = getGhostY();
            for (let r = 0; r < activePiece.shape.length; r++) {
                for (let c = 0; c < activePiece.shape[r].length; c++) {
                    if (activePiece.shape[r][c] && ghostY + r >= 0) {
                        // Only draw ghost if cell is empty
                        if (!displayGrid[ghostY + r][activePiece.x + c]) {
                            displayGrid[ghostY + r][activePiece.x + c] = 'ghost';
                        }
                    }
                }
            }
        }

        // Render Active Piece
        if (activePiece) {
            for (let r = 0; r < activePiece.shape.length; r++) {
                for (let c = 0; c < activePiece.shape[r].length; c++) {
                    if (activePiece.shape[r][c] && activePiece.y + r >= 0) {
                        displayGrid[activePiece.y + r][activePiece.x + c] = activePiece.color;
                    }
                }
            }
        }

        return displayGrid;
    };

    const displayGrid = renderGrid();

    return (
        <div className="h-screen w-full overflow-hidden flex flex-col items-center justify-center p-4 bg-gray-950">
            <div className="absolute top-8 left-8">
                <Link href="/">
                    <Button variant="secondary" className="backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 drop-shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                NEON STACK
            </h1>

            <div className="flex gap-8 items-start">
                <div className="relative p-1 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                    <div
                        className="grid gap-[1px] bg-black/50"
                        style={{
                            gridTemplateColumns: `repeat(${COLS}, ${BLOCK_SIZE}px)`,
                            gridTemplateRows: `repeat(${ROWS}, ${BLOCK_SIZE}px)`
                        }}
                    >
                        {displayGrid.map((row, y) =>
                            row.map((cell, x) => (
                                <div
                                    key={`${x}-${y}`}
                                    className={cn(
                                        "w-full h-full transition-colors duration-100",
                                        cell ? COLORS[cell] : "bg-black/30"
                                    )}
                                />
                            ))
                        )}
                    </div>

                    <AnimatePresence>
                        {(!isPlaying || gameOver) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg"
                            >
                                <div className="text-center">
                                    {gameOver && (
                                        <>
                                            <div className="text-4xl font-bold text-red-500 mb-2">GAME OVER</div>
                                            <div className="text-xl text-white mb-4">Score: {score}</div>
                                        </>
                                    )}
                                    <Button onClick={startGame} variant="primary" glow className="text-xl px-8 py-4">
                                        {gameOver ? <><RotateCcw className="mr-2" /> Retry</> : <><Play className="mr-2" /> Start</>}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="glass p-6 rounded-xl w-48 text-center">
                        <div className="text-gray-400 text-sm mb-1">SCORE</div>
                        <div className="text-3xl font-bold text-white mb-4">{score}</div>
                        <div className="text-gray-400 text-sm mb-1">HIGH SCORE</div>
                        <div className="text-xl font-bold text-neon-purple">{highScore}</div>
                    </div>

                    <div className="glass p-6 rounded-xl w-48">
                        <div className="text-gray-400 text-xs mb-4 text-center uppercase tracking-widest">Controls</div>
                        <div className="flex flex-col gap-2 text-sm text-gray-300">
                            <div className="flex items-center justify-between">
                                <span>Move</span>
                                <div className="flex gap-1"><ArrowLeft size={16} /><ArrowRight size={16} /></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Rotate</span>
                                <ArrowDown size={16} className="rotate-180" />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Soft Drop</span>
                                <ArrowDown size={16} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Hard Drop</span>
                                <span className="font-mono border border-white/20 rounded px-1 text-xs">SPC</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
