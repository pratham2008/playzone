"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 50;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = (CANVAS_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING))) / 2;

const BRICK_COLORS = ['#00f3ff', '#bc13fe', '#ff00ff', '#39ff14', '#f97316'];

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
};

export default function BrickBreaker() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [score, setScore] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paddleX = useRef((CANVAS_WIDTH - PADDLE_WIDTH) / 2);
    const ballX = useRef(CANVAS_WIDTH / 2);
    const ballY = useRef(CANVAS_HEIGHT - 50);
    const ballDX = useRef(4);
    const ballDY = useRef(-4);
    const bricks = useRef<{ x: number; y: number; alive: boolean; color: string }[]>([]);
    const particles = useRef<Particle[]>([]);
    const frameId = useRef<number>(0);
    const bgOffset = useRef(0);

    const initBricks = useCallback(() => {
        const newBricks: typeof bricks.current = [];
        for (let r = 0; r < BRICK_ROWS; r++) {
            for (let c = 0; c < BRICK_COLS; c++) {
                newBricks.push({
                    x: BRICK_OFFSET_LEFT + c * (BRICK_WIDTH + BRICK_PADDING),
                    y: BRICK_OFFSET_TOP + r * (BRICK_HEIGHT + BRICK_PADDING),
                    alive: true,
                    color: BRICK_COLORS[r % BRICK_COLORS.length]
                });
            }
        }
        bricks.current = newBricks;
    }, []);

    const resetGame = useCallback(() => {
        paddleX.current = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
        ballX.current = CANVAS_WIDTH / 2;
        ballY.current = CANVAS_HEIGHT - 50;
        ballDX.current = 4 * (Math.random() > 0.5 ? 1 : -1);
        ballDY.current = -4;
        particles.current = [];
        initBricks();
        setScore(0);
        setGameOver(false);
        setWon(false);
        setIsPlaying(true);
    }, [initBricks]);

    const spawnParticles = (x: number, y: number, color: string) => {
        for (let i = 0; i < 10; i++) {
            particles.current.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color
            });
        }
    };

    const drawHexGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.save();
        ctx.strokeStyle = '#1a103c';
        ctx.lineWidth = 2;
        bgOffset.current += 0.2;

        const size = 40;
        const h = size * Math.sqrt(3);

        for (let y = -h; y < height + h; y += h) {
            for (let x = -size; x < width + size * 2; x += size * 3) {
                const dy = (Math.floor((x / (size * 3))) % 2) * (h / 2);
                const pulse = Math.sin((x + y + bgOffset.current * 10) * 0.005) * 0.5 + 0.5;

                ctx.globalAlpha = 0.1 + pulse * 0.1;
                ctx.beginPath();
                // Draw Hexagon (simplified)
                ctx.moveTo(x, y + dy);
                ctx.lineTo(x + size, y + dy);
                ctx.lineTo(x + size * 1.5, y + dy + h / 2);
                ctx.lineTo(x + size, y + dy + h);
                ctx.lineTo(x, y + dy + h);
                ctx.lineTo(x - size * 0.5, y + dy + h / 2);
                ctx.closePath();
                ctx.stroke();
            }
        }
        ctx.restore();
    };

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw animated background
        drawHexGrid(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Update and draw particles
        particles.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        particles.current = particles.current.filter(p => p.life > 0);

        // Draw bricks
        let aliveCount = 0;
        bricks.current.forEach(brick => {
            if (brick.alive) {
                aliveCount++;

                // Draw brick body
                ctx.fillStyle = brick.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = brick.color;
                ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT);

                // Draw glow/glass effect (lighter top, darker bottom)
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillRect(brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT / 2);

                ctx.shadowBlur = 0;
            }
        });

        // Win condition
        if (aliveCount === 0) {
            setWon(true);
            setIsPlaying(false);
            return;
        }

        // Draw paddle (Capsule style)
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f3ff';

        ctx.beginPath();
        ctx.roundRect(paddleX.current, CANVAS_HEIGHT - 30, PADDLE_WIDTH, PADDLE_HEIGHT, 10);
        ctx.fill();

        // Paddle Engine lights
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(paddleX.current + 10, CANVAS_HEIGHT - 25, 20, 5);
        ctx.fillRect(paddleX.current + PADDLE_WIDTH - 30, CANVAS_HEIGHT - 25, 20, 5);
        ctx.shadowBlur = 0;

        // Ball physics
        ballX.current += ballDX.current;
        ballY.current += ballDY.current;

        // Wall collision
        if (ballX.current < BALL_RADIUS || ballX.current > CANVAS_WIDTH - BALL_RADIUS) {
            ballDX.current = -ballDX.current;
            // Wall hit effect?
        }
        if (ballY.current < BALL_RADIUS) {
            ballDY.current = -ballDY.current;
        }

        // Bottom - game over
        if (ballY.current > CANVAS_HEIGHT - BALL_RADIUS) {
            setGameOver(true);
            setIsPlaying(false);
            return;
        }

        // Paddle collision
        if (
            ballY.current + BALL_RADIUS > CANVAS_HEIGHT - 30 &&
            ballY.current < CANVAS_HEIGHT - 30 + PADDLE_HEIGHT &&
            ballX.current > paddleX.current &&
            ballX.current < paddleX.current + PADDLE_WIDTH
        ) {
            ballDY.current = -Math.abs(ballDY.current);
            // Add angle based on hit position
            const hitPos = (ballX.current - paddleX.current) / PADDLE_WIDTH;
            ballDX.current = 6 * (hitPos - 0.5);

            // Paddle hit visual
            spawnParticles(ballX.current, CANVAS_HEIGHT - 30, '#ffffff');
        }

        // Brick collision
        bricks.current.forEach(brick => {
            if (brick.alive) {
                if (
                    ballX.current > brick.x &&
                    ballX.current < brick.x + BRICK_WIDTH &&
                    ballY.current > brick.y &&
                    ballY.current < brick.y + BRICK_HEIGHT
                ) {
                    brick.alive = false;
                    ballDY.current = -ballDY.current;
                    setScore(s => s + 10);
                    spawnParticles(brick.x + BRICK_WIDTH / 2, brick.y + BRICK_HEIGHT / 2, brick.color);
                }
            }
        });

        // Draw ball
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(ballX.current, ballY.current, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'left';
        ctx.shadowColor = '#bc13fe';
        ctx.shadowBlur = 5;
        ctx.fillText(`SCORE: ${score}`, 20, 40);
        ctx.shadowBlur = 0;

        if (isPlaying && !gameOver && !won) {
            frameId.current = requestAnimationFrame(gameLoop);
        }
    }, [isPlaying, gameOver, won, score]);

    useEffect(() => {
        if (isPlaying && !gameOver && !won) {
            frameId.current = requestAnimationFrame(gameLoop);
        }
        return () => cancelAnimationFrame(frameId.current);
    }, [isPlaying, gameOver, won, gameLoop]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const x = (e.clientX - rect.left) * scaleX;
            paddleX.current = Math.max(0, Math.min(CANVAS_WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-8">
                <Link href="/">
                    <Button variant="secondary" className="backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(0,180,255,0.6)]">
                BRICK BREAKER
            </h1>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="rounded-xl border border-white/20 cursor-none shadow-[0_0_50px_rgba(0,180,255,0.2)]"
                    style={{ maxWidth: '90vw', height: 'auto' }}
                />

                <AnimatePresence>
                    {(!isPlaying || gameOver || won) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md rounded-xl border border-white/10"
                        >
                            <div className="text-center">
                                {won && <div className="text-5xl font-black text-neon-lime mb-4 drop-shadow-[0_0_15px_rgba(34,197,94,0.9)]">VICTORY</div>}
                                {gameOver && <div className="text-5xl font-black text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)]">GAME OVER</div>}
                                {(gameOver || won) && <div className="text-2xl text-white mb-6">Final Score: {score}</div>}

                                <Button onClick={resetGame} variant="primary" glow className="text-xl px-10 py-6 rounded-full">
                                    {gameOver || won ? <><RotateCcw className="mr-2" /> Play Again</> : <><Play className="mr-2" /> Start Game</>}
                                </Button>
                                <p className="text-gray-400 mt-6 text-sm">Use mouse to control paddle</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
