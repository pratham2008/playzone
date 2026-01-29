"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 170; // Slightly wider gap
const GRAVITY = 0.25; // Floatier gravity
const FLAP_FORCE = -5.5; // Adjusted jump
const PIPE_SPEED = 2.5; // Slightly slower
const MAX_FALL_SPEED = 8; // Terminal velocity

export default function FlappyGame() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    const birdY = useRef(CANVAS_HEIGHT / 2);
    const birdVelocity = useRef(0);
    const birdRotation = useRef(0);
    const pipes = useRef<{ x: number; gapY: number; passed: boolean }[]>([]);
    const particles = useRef<{ x: number; y: number; vx: number; vy: number; life: number }[]>([]);
    const frameId = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgOffset = useRef(0);

    useEffect(() => {
        const saved = localStorage.getItem('flappy-highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const flap = useCallback(() => {
        if (isPlaying) {
            birdVelocity.current = FLAP_FORCE;
            // Spawn particles
            for (let i = 0; i < 5; i++) {
                particles.current.push({
                    x: 80 - 10,
                    y: birdY.current,
                    vx: -2 - Math.random() * 2,
                    vy: (Math.random() - 0.5) * 4,
                    life: 1.0
                });
            }
        }
    }, [isPlaying]);

    const resetGame = useCallback(() => {
        birdY.current = CANVAS_HEIGHT / 2;
        birdVelocity.current = 0;
        birdRotation.current = 0;
        pipes.current = [];
        particles.current = [];
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
    }, []);

    const drawShip = (ctx: CanvasRenderingContext2D, y: number, velocity: number) => {
        const x = 80;
        ctx.save();
        ctx.translate(x, y);

        // Calculate rotation based on velocity
        const targetRotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, velocity * 0.1));
        birdRotation.current += (targetRotation - birdRotation.current) * 0.2;
        ctx.rotate(birdRotation.current);

        // Neon Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00f3ff';
        ctx.strokeStyle = '#00f3ff';
        ctx.fillStyle = '#050510';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(15, 0); // Nose
        ctx.lineTo(-10, -10); // Top tail
        ctx.lineTo(-5, 0); // Center back
        ctx.lineTo(-10, 10); // Bottom tail
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Engine glow
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(-15, 0);
        ctx.strokeStyle = '#bc13fe';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.restore();
    };

    const drawPipe = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number, isTop: boolean) => {
        ctx.fillStyle = '#050510';
        ctx.strokeStyle = '#bc13fe';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#bc13fe';

        ctx.fillRect(x, y, PIPE_WIDTH, height);
        ctx.strokeRect(x, y, PIPE_WIDTH, height);

        // Remove shadow for inner details
        ctx.shadowBlur = 0;

        // Tech details
        ctx.strokeStyle = 'rgba(188, 19, 254, 0.3)';
        ctx.beginPath();
        // Vertical lines
        ctx.moveTo(x + 10, y);
        ctx.lineTo(x + 10, y + height);
        ctx.moveTo(x + PIPE_WIDTH - 10, y);
        ctx.lineTo(x + PIPE_WIDTH - 10, y + height);
        // Horizontal lines
        for (let py = y + (isTop ? height % 20 : 0); py < y + height; py += 20) {
            ctx.moveTo(x + 15, py);
            ctx.lineTo(x + PIPE_WIDTH - 15, py);
        }
        ctx.stroke();

        // Pipe cap
        ctx.fillStyle = '#bc13fe';
        const capY = isTop ? y + height - 20 : y;
        ctx.fillRect(x - 5, capY, PIPE_WIDTH + 10, 20);
    };

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Background stars
        bgOffset.current -= 0.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 20; i++) {
            const bx = (i * 30 + bgOffset.current) % CANVAS_WIDTH;
            if (bx < 0) continue; // Wrap handled by loop logic mostly, simple effect
            const by = (i * 4523) % CANVAS_HEIGHT;
            ctx.fillRect((bx + CANVAS_WIDTH) % CANVAS_WIDTH, by, 2, 2);
        }

        // Physics
        birdVelocity.current += GRAVITY;
        if (birdVelocity.current > MAX_FALL_SPEED) birdVelocity.current = MAX_FALL_SPEED;
        birdY.current += birdVelocity.current;

        // Particles
        particles.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
        });
        particles.current = particles.current.filter(p => p.life > 0);

        particles.current.forEach(p => {
            ctx.fillStyle = `rgba(0, 243, 255, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Add pipes
        if (pipes.current.length === 0 || pipes.current[pipes.current.length - 1].x < CANVAS_WIDTH - 220) {
            pipes.current.push({
                x: CANVAS_WIDTH,
                gapY: 100 + Math.random() * (CANVAS_HEIGHT - 200 - PIPE_GAP),
                passed: false
            });
        }

        // Projectile collision helpers
        const shipRadius = 10;
        const birdX = 80;

        // Update and draw pipes
        let collided = false;
        pipes.current = pipes.current.filter(pipe => {
            pipe.x -= PIPE_SPEED;

            // Draw pipes
            drawPipe(ctx, pipe.x, 0, pipe.gapY, true);
            drawPipe(ctx, pipe.x, pipe.gapY + PIPE_GAP, CANVAS_HEIGHT - pipe.gapY - PIPE_GAP, false);

            // Collision check (Axis Aligned Bounding Box vs Circle approximation)
            // Simplified: Box vs Point at center of ship
            if (birdX + shipRadius > pipe.x && birdX - shipRadius < pipe.x + PIPE_WIDTH) {
                if (birdY.current - shipRadius < pipe.gapY || birdY.current + shipRadius > pipe.gapY + PIPE_GAP) {
                    collided = true;
                }
            }

            // Score
            if (!pipe.passed && pipe.x + PIPE_WIDTH < birdX) {
                pipe.passed = true;
                setScore(s => s + 1);
            }

            return pipe.x > -PIPE_WIDTH;
        });

        // Draw Ship
        drawShip(ctx, birdY.current, birdVelocity.current);

        // Ground/ceiling collision
        if (birdY.current - shipRadius < 0 || birdY.current + shipRadius > CANVAS_HEIGHT) {
            collided = true;
        }

        if (collided) {
            setGameOver(true);
            setIsPlaying(false);
            if (score > highScore) {
                setHighScore(score);
                localStorage.setItem('flappy-highscore', score.toString());
            }
            return;
        }

        // Draw score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#bc13fe';
        ctx.shadowBlur = 10;
        ctx.fillText(`${score}`, CANVAS_WIDTH / 2, 80);
        ctx.shadowBlur = 0;

        if (isPlaying && !gameOver) {
            frameId.current = requestAnimationFrame(gameLoop);
        }
    }, [isPlaying, gameOver, score, highScore]);

    useEffect(() => {
        if (isPlaying && !gameOver) {
            frameId.current = requestAnimationFrame(gameLoop);
        }
        return () => cancelAnimationFrame(frameId.current);
    }, [isPlaying, gameOver, gameLoop]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!isPlaying && !gameOver) {
                    resetGame();
                } else if (isPlaying) {
                    flap();
                } else if (gameOver) {
                    resetGame();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, gameOver, flap, resetGame]);

    const handleClick = () => {
        if (!isPlaying && !gameOver) {
            resetGame();
        } else if (isPlaying) {
            flap();
        } else if (gameOver) {
            resetGame();
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

            <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                NEON DASH
            </h1>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onClick={handleClick}
                    className="rounded-xl border border-white/10 cursor-pointer bg-[#050510]"
                    style={{ maxHeight: '70vh', width: 'auto' }}
                />

                <AnimatePresence>
                    {(!isPlaying || gameOver) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl border border-white/10"
                        >
                            <div className="text-center">
                                {gameOver && (
                                    <>
                                        <div className="text-4xl font-bold text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">MISSION FAILED</div>
                                        <div className="text-2xl text-white mb-4">Score: {score}</div>
                                        <div className="text-gray-400 mb-6">Record: {highScore}</div>
                                    </>
                                )}
                                <Button onClick={resetGame} variant="primary" glow className="text-xl px-8 py-6 rounded-full">
                                    {gameOver ? <><RotateCcw className="mr-2" /> Retry Mission</> : <><Play className="mr-2" /> Launch</>}
                                </Button>
                                <p className="text-gray-400 mt-6 text-sm">Press SPACE or tap to fly</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
