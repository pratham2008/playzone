"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Users, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type Player = 'X' | 'O' | null;
type GameMode = 'select' | 'friend' | 'ai';

const WINNING_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

export default function TicTacToe() {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<Player>(null);
    const [gameMode, setGameMode] = useState<GameMode>('select');

    const checkWinner = useCallback((squares: Player[]): Player => {
        for (const [a, b, c] of WINNING_LINES) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        return null;
    }, []);

    // Minimax AI
    const minimax = useCallback((squares: Player[], isMaximizing: boolean): number => {
        const win = checkWinner(squares);
        if (win === 'O') return 10;
        if (win === 'X') return -10;
        if (squares.every(Boolean)) return 0;

        if (isMaximizing) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (!squares[i]) {
                    squares[i] = 'O';
                    best = Math.max(best, minimax(squares, false));
                    squares[i] = null;
                }
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < 9; i++) {
                if (!squares[i]) {
                    squares[i] = 'X';
                    best = Math.min(best, minimax(squares, true));
                    squares[i] = null;
                }
            }
            return best;
        }
    }, [checkWinner]);

    const findBestMove = useCallback((squares: Player[]): number => {
        let bestScore = -Infinity;
        let bestMove = -1;
        for (let i = 0; i < 9; i++) {
            if (!squares[i]) {
                squares[i] = 'O';
                const score = minimax(squares, false);
                squares[i] = null;
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }, [minimax]);

    // AI Move
    useEffect(() => {
        if (gameMode !== 'ai' || isXNext || winner || board.every(Boolean)) return;

        const timer = setTimeout(() => {
            const aiMove = findBestMove([...board]);
            if (aiMove !== -1) {
                const newBoard = [...board];
                newBoard[aiMove] = 'O';
                setBoard(newBoard);
                setIsXNext(true);
                const win = checkWinner(newBoard);
                if (win) setWinner(win);
            }
        }, 500); // Delay for UX

        return () => clearTimeout(timer);
    }, [board, isXNext, winner, gameMode, findBestMove, checkWinner]);

    const handleClick = (i: number) => {
        if (board[i] || winner) return;
        if (gameMode === 'ai' && !isXNext) return; // Block clicks during AI turn

        const newBoard = [...board];
        newBoard[i] = isXNext ? 'X' : 'O';
        setBoard(newBoard);
        setIsXNext(!isXNext);

        const win = checkWinner(newBoard);
        if (win) setWinner(win);
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
    };

    const startGame = (mode: 'friend' | 'ai') => {
        setGameMode(mode);
        resetGame();
    };

    const goToMenu = () => {
        setGameMode('select');
        resetGame();
    };

    const isDraw = !winner && board.every(Boolean);

    // Mode Selection Screen
    if (gameMode === 'select') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="absolute top-8 left-8">
                    <Link href="/">
                        <Button variant="secondary" className="backdrop-blur-md">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Button>
                    </Link>
                </div>

                <h1 className="text-4xl md:text-6xl font-black mb-12 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 text-glow-cyan">
                    TIC-TAC-TOE
                </h1>

                <div className="flex flex-col md:flex-row gap-6">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startGame('friend')}
                        className="glass p-8 rounded-2xl border border-neon-cyan/30 hover:border-neon-cyan transition-all hover:shadow-[0_0_30px_var(--neon-cyan)] group"
                    >
                        <Users className="w-16 h-16 mx-auto mb-4 text-neon-cyan group-hover:drop-shadow-[0_0_10px_var(--neon-cyan)]" />
                        <h2 className="text-2xl font-bold text-white mb-2">Play with Friend</h2>
                        <p className="text-gray-400 text-sm">Local 2-player mode</p>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startGame('ai')}
                        className="glass p-8 rounded-2xl border border-neon-pink/30 hover:border-neon-pink transition-all hover:shadow-[0_0_30px_var(--neon-pink)] group"
                    >
                        <Bot className="w-16 h-16 mx-auto mb-4 text-neon-pink group-hover:drop-shadow-[0_0_10px_var(--neon-pink)]" />
                        <h2 className="text-2xl font-bold text-white mb-2">Play vs AI</h2>
                        <p className="text-gray-400 text-sm">Challenge the machine</p>
                    </motion.button>
                </div>
            </div>
        );
    }

    // Game Screen
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-8">
                <Button variant="secondary" className="backdrop-blur-md" onClick={goToMenu}>
                    <ArrowLeft className="w-4 h-4" /> Menu
                </Button>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 text-glow-cyan">
                TIC-TAC-TOE
            </h1>

            <div className="mb-8 flex items-center justify-between w-64 md:w-80 px-4 py-2 rounded-full glass">
                <div className={cn("text-xl font-bold transition-all", isXNext && !winner ? "text-neon-cyan scale-110 drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]" : "text-gray-500")}>
                    {gameMode === 'ai' ? 'You (X)' : 'Player X'}
                </div>
                <div className="h-6 w-[1px] bg-white/20"></div>
                <div className={cn("text-xl font-bold transition-all", !isXNext && !winner ? "text-neon-pink scale-110 drop-shadow-[0_0_5px_rgba(255,0,255,0.8)]" : "text-gray-500")}>
                    {gameMode === 'ai' ? 'AI (O)' : 'Player O'}
                </div>
            </div>

            <div className="relative">
                <div className="grid grid-cols-3 gap-3 md:gap-4 p-4 rounded-2xl glass">
                    {board.map((cell, i) => (
                        <button
                            key={i}
                            onClick={() => handleClick(i)}
                            disabled={!!cell || !!winner || (gameMode === 'ai' && !isXNext)}
                            className={cn(
                                "w-20 h-20 md:w-28 md:h-28 rounded-xl flex items-center justify-center text-5xl md:text-7xl font-bold transition-all duration-200",
                                "bg-black/40 hover:bg-black/60",
                                !cell && !winner && (gameMode === 'friend' || isXNext) && "hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]",
                                cell === 'X' ? "text-neon-cyan text-glow-cyan" : "text-neon-pink text-glow-pink"
                            )}
                        >
                            {cell && (
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    {cell}
                                </motion.div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Winner Overlay */}
                <AnimatePresence>
                    {(winner || isDraw) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl z-10"
                        >
                            <div className="text-center">
                                <h2 className="text-4xl font-bold mb-4 text-white">
                                    {winner ? (
                                        <span className={cn(winner === 'X' ? "text-neon-cyan" : "text-neon-pink")}>
                                            {gameMode === 'ai' ? (winner === 'X' ? 'YOU WIN!' : 'AI WINS!') : `${winner} WINS!`}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300">DRAW!</span>
                                    )}
                                </h2>
                                <div className="flex gap-4">
                                    <Button onClick={resetGame} variant="primary" glow>
                                        <RotateCcw className="w-4 h-4" /> Play Again
                                    </Button>
                                    <Button onClick={goToMenu} variant="secondary">
                                        Menu
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
