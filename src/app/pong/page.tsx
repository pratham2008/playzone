"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 12;
const PADDLE_SPEED = 8;
const AI_SPEED = 6;

export default function Pong() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameState, setGameState] = useState<'start' | 'playing' | 'scored' | 'won' | 'lost'>('start');
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameId = useRef<number>(0);

    // Game Objects
    const ball = useRef({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 6, dy: 6 });
    const playerY = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const aiY = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
    const particles = useRef<{ x: number, y: number, vx: number, vy: number, life: number, color: string }[]>([]);

    const resetBall = (direction: number) => {
        ball.current = {
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT / 2,
            dx: 6 * direction,
            dy: (Math.random() - 0.5) * 8
        };
    };

    const resetGame = useCallback(() => {
        setPlayerScore(0);
        setAiScore(0);
        playerY.current = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
        aiY.current = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
        resetBall(1);
        setGameState('playing');
        setIsPlaying(true);
    }, []);

    const spawnParticles = (x: number, y: number, color: string) => {
        for (let i = 0; i < 8; i++) {
            particles.current.push({
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color
            });
        }
    };

    const drawScanlines = (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < CANVAS_HEIGHT; i += 4) {
            ctx.fillRect(0, i, CANVAS_WIDTH, 2);
        }
    };

    const update = () => {
        // Player Movement (Mouse handled in event listener, but clamped here)
        playerY.current = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerY.current));

        // AI Movement
        const centerAi = aiY.current + PADDLE_HEIGHT / 2;
        if (centerAi < ball.current.y - 10) {
            aiY.current += AI_SPEED;
        } else if (centerAi > ball.current.y + 10) {
            aiY.current -= AI_SPEED;
        }
        aiY.current = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, aiY.current));

        // Ball Movement
        if (gameState === 'playing') {
            ball.current.x += ball.current.dx;
            ball.current.y += ball.current.dy;

            // Wall Collision
            if (ball.current.y <= 0 || ball.current.y >= CANVAS_HEIGHT - BALL_SIZE) {
                ball.current.dy *= -1;
                spawnParticles(ball.current.x, ball.current.y, '#ffffff');
            }

            // Paddle Collision
            // Player
            if (ball.current.x <= 20 + PADDLE_WIDTH &&
                ball.current.y + BALL_SIZE >= playerY.current &&
                ball.current.y <= playerY.current + PADDLE_HEIGHT) {
                ball.current.dx = Math.abs(ball.current.dx) + 0.5; // Speed up
                ball.current.dy += (Math.random() - 0.5) * 2; // Randomize angle
                ball.current.x = 20 + PADDLE_WIDTH + 1; // Unstick
                spawnParticles(ball.current.x, ball.current.y, '#00f3ff');
            }

            // AI
            if (ball.current.x >= CANVAS_WIDTH - 20 - PADDLE_WIDTH - BALL_SIZE &&
                ball.current.y + BALL_SIZE >= aiY.current &&
                ball.current.y <= aiY.current + PADDLE_HEIGHT) {
                ball.current.dx = -Math.abs(ball.current.dx) - 0.5;
                ball.current.x = CANVAS_WIDTH - 20 - PADDLE_WIDTH - BALL_SIZE - 1;
                spawnParticles(ball.current.x, ball.current.y, '#ff0055');
            }

            // Scoring
            if (ball.current.x < 0) {
                setAiScore(s => s + 1);
                resetBall(1);
                spawnParticles(0, ball.current.y, '#ff0055');
            } else if (ball.current.x > CANVAS_WIDTH) {
                setPlayerScore(s => s + 1);
                resetBall(-1);
                spawnParticles(CANVAS_WIDTH, ball.current.y, '#00f3ff');
            }
        }

        // Particle update
        particles.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
        });
        particles.current = particles.current.filter(p => p.life > 0);
    };

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        update();

        // Check Win
        if (playerScore >= 10 && gameState === 'playing') {
            setGameState('won');
            setIsPlaying(false);
        } else if (aiScore >= 10 && gameState === 'playing') {
            setGameState('lost');
            setIsPlaying(false);
        }

        // DRAW
        // Background
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Center Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.setLineDash([10, 10]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, 0);
        ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);

        // Particles
        particles.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Player Paddle (Neon Blue)
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 15;
        ctx.fillRect(20, playerY.current, PADDLE_WIDTH, PADDLE_HEIGHT);

        // AI Paddle (Neon Red)
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 15;
        ctx.fillRect(CANVAS_WIDTH - 20 - PADDLE_WIDTH, aiY.current, PADDLE_WIDTH, PADDLE_HEIGHT);

        // Ball (Bright White)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(ball.current.x, ball.current.y, BALL_SIZE, BALL_SIZE);

        ctx.shadowBlur = 0;
        drawScanlines(ctx);

        if (gameState === 'playing') {
            frameId.current = requestAnimationFrame(gameLoop);
        }
    }, [gameState, playerScore, aiScore]);

    useEffect(() => {
        if (gameState === 'playing') {
            frameId.current = requestAnimationFrame(gameLoop);
        }
        return () => cancelAnimationFrame(frameId.current);
    }, [gameState, gameLoop]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!canvasRef.current || gameState !== 'playing') return;
            const rect = canvasRef.current.getBoundingClientRect();
            const scaleY = CANVAS_HEIGHT / rect.height;
            const relativeY = (e.clientY - rect.top) * scaleY;
            playerY.current = relativeY - PADDLE_HEIGHT / 2;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
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

            <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-red-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                CYBER PADDLE
            </h1>

            <div className="relative">
                <div className="absolute top-4 left-0 w-full flex justify-between px-12 z-10 font-mono text-4xl font-bold pointer-events-none">
                    <div className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{playerScore}</div>
                    <div className="text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]">{aiScore}</div>
                </div>

                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="rounded-xl border border-white/20 cursor-none bg-[#050510] shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    style={{ maxWidth: '90vw', maxHeight: '70vh', width: 'auto', height: 'auto' }}
                />

                <AnimatePresence>
                    {gameState !== 'playing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl"
                        >
                            <div className="text-center">
                                {gameState === 'won' && <div className="text-5xl font-black text-neon-lime mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)]">YOU WIN</div>}
                                {gameState === 'lost' && <div className="text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]">DEFEAT</div>}
                                <Button onClick={resetGame} variant="primary" glow className="text-xl px-10 py-6 rounded-full">
                                    {gameState === 'start' ? <><Play className="mr-2" /> Start Match</> : <><RotateCcw className="mr-2" /> Rematch</>}
                                </Button>
                                <p className="text-gray-400 mt-6 text-sm">Move mouse to control BLUE paddle</p>
                                <p className="text-gray-500 text-xs mt-2">First to 10 points wins</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
