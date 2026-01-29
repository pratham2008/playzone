"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, BrainCircuit, Zap, Atom, Cpu, Wifi, Radio, Radar, Grip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Card Icons
const ICONS = [Zap, Atom, Cpu, Wifi, Radio, Radar, Grip, BrainCircuit];

type Card = {
    id: number;
    icon: number; // Index in ICONS
    isFlipped: boolean;
    isMatched: boolean;
};

export default function MemoryGame() {
    const [cards, setCards] = useState<Card[]>([]);
    const [flipped, setFlipped] = useState<number[]>([]); // Store indices
    const [matches, setMatches] = useState(0);
    const [moves, setMoves] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const initializeGame = useCallback(() => {
        // Generate pairs: 8 pairs = 16 cards
        const pairs = [...Array(8).keys()].flatMap(i => [i, i]);
        // Shuffle
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }

        setCards(pairs.map((icon, id) => ({
            id,
            icon,
            isFlipped: false,
            isMatched: false
        })));
        setFlipped([]);
        setMatches(0);
        setMoves(0);
        setIsProcessing(false);
    }, []);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    const handleCardClick = (index: number) => {
        if (isProcessing || cards[index].isFlipped || cards[index].isMatched) return;

        // Flip card
        const newCards = [...cards];
        newCards[index].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flipped, index];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setIsProcessing(true);
            setMoves(m => m + 1);

            const [first, second] = newFlipped;

            if (newCards[first].icon === newCards[second].icon) {
                // Match
                newCards[first].isMatched = true;
                newCards[second].isMatched = true;
                setCards(newCards);
                setMatches(m => m + 1);
                setFlipped([]);
                setIsProcessing(false);
            } else {
                // No match - Wait then unflip
                setTimeout(() => {
                    setCards(prev => prev.map((c, i) =>
                        (i === first || i === second) ? { ...c, isFlipped: false } : c
                    ));
                    setFlipped([]);
                    setIsProcessing(false);
                }, 1000);
            }
        }
    };

    const isGameOver = matches === 8;

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
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-purple-600 text-glow-pink mb-2">
                    NEURO MATCH
                </h1>
                <div className="flex justify-center gap-8 text-xl font-bold font-mono">
                    <div className="text-neon-pink">MOVES: {moves}</div>
                    <div className="text-gray-400">PAIRS: {matches}/8</div>
                </div>
            </div>

            <div className="relative p-6">
                <div className="grid grid-cols-4 gap-3 md:gap-4">
                    {cards.map((card, index) => {
                        const Icon = ICONS[card.icon];
                        return (
                            <div key={index} className="perspective-1000 w-16 h-16 md:w-24 md:h-24">
                                <motion.div
                                    className={cn(
                                        "relative w-full h-full transition-all duration-500 preserve-3d cursor-pointer",
                                    )}
                                    animate={{ rotateY: card.isFlipped ? 180 : 0 }}
                                    onClick={() => handleCardClick(index)}
                                >
                                    {/* Front (Hidden) */}
                                    <div className="absolute inset-0 backface-hidden bg-white/10 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors shadow-[0_0_10px_rgba(255,105,180,0.1)]">
                                        <BrainCircuit className="w-6 h-6 md:w-8 md:h-8 text-white/30" />
                                    </div>

                                    {/* Back (Revealed) */}
                                    <div
                                        className="absolute inset-0 backface-hidden rounded-xl flex items-center justify-center border-2 border-neon-pink bg-black/80 shadow-[0_0_15px_var(--neon-pink)]"
                                        style={{ transform: 'rotateY(180deg)' }}
                                    >
                                        <Icon className={cn(
                                            "w-8 h-8 md:w-10 md:h-10 text-neon-pink",
                                            card.isMatched && "animate-pulse drop-shadow-[0_0_5px_white]"
                                        )} />
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {isGameOver && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl z-20 -m-4"
                        >
                            <div className="text-center p-8 bg-black/50 border border-neon-pink rounded-2xl shadow-[0_0_50px_var(--neon-pink)]">
                                <h2 className="text-4xl font-bold mb-2 text-white">SYSTEM LINKED!</h2>
                                <p className="text-xl text-gray-300 mb-6">Completed in {moves} moves</p>
                                <Button onClick={initializeGame} variant="danger" glow className="text-xl px-8 py-3 w-full">
                                    <RotateCcw className="mr-2" /> Replay
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
        </div>
    );
}
