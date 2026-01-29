"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GAME_HEIGHT = 300; // Taller for sky
const GROUND_HEIGHT = 60;
const DINO_SIZE = 50;
const GRAVITY = 0.8;
const JUMP_FORCE = -16;
const GAME_SPEED_INITIAL = 7;
const GAME_SPEED_INCREMENT = 0.0005;

export default function DinoGame() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    const dinoY = useRef(0);
    const dinoVelocity = useRef(0);
    const obstacles = useRef<{ x: number; height: number; type: number }[]>([]);
    const gameSpeed = useRef(GAME_SPEED_INITIAL);
    const frameId = useRef<number>(0);
    const lastObstacleTime = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isJumping = useRef(false);
    const bgOffset = useRef(0);
    const runFrame = useRef(0);

    useEffect(() => {
        const saved = localStorage.getItem('dino-highscore');
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const jump = useCallback(() => {
        if (!isJumping.current && dinoY.current === 0) {
            dinoVelocity.current = JUMP_FORCE;
            isJumping.current = true;
        }
    }, []);

    const resetGame = useCallback(() => {
        dinoY.current = 0;
        dinoVelocity.current = 0;
        obstacles.current = [];
        gameSpeed.current = GAME_SPEED_INITIAL;
        lastObstacleTime.current = 0;
        isJumping.current = false;
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        bgOffset.current = 0;
    }, []);

    const drawSun = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const sunX = width / 2;
        const sunY = height - GROUND_HEIGHT - 50;
        const sunRadius = 80;

        // Gradient Sun
        const grad = ctx.createLinearGradient(sunX, sunY - sunRadius, sunX, sunY + sunRadius);
        grad.addColorStop(0, '#ffff00');
        grad.addColorStop(0.5, '#ff00ff');
        grad.addColorStop(1, '#9900ff');

        ctx.save();
        ctx.fillStyle = grad;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sun lines (Scanlines)
        ctx.fillStyle = '#0f0f23'; // Match sky color to cut through
        for (let y = sunY - 20; y < sunY + sunRadius; y += 12) {
            const height = 2 + (y - (sunY - 20)) / 10;
            ctx.fillRect(sunX - sunRadius, y, sunRadius * 2, height);
        }
        ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const horizonY = height - GROUND_HEIGHT;
        const speed = gameSpeed.current * 0.8;
        bgOffset.current = (bgOffset.current - speed) % 100;

        ctx.save();
        ctx.beginPath();
        // Perspective vertical lines
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff00ff';

        const centerX = width / 2;
        for (let x = -width; x < width * 2; x += 80) {
            // Draw lines radiating from center horizon
            ctx.moveTo(centerX + (x - centerX) * 0.2, horizonY); // Vanishing point area
            ctx.lineTo(x, height);
        }

        // Horizontal moving lines
        const zStart = bgOffset.current;
        for (let z = 0; z < height - horizonY; z += 20) {
            const perspectiveY = horizonY + Math.pow(z / (height - horizonY), 2) * (height - horizonY); // Exponential spacing
            const movingY = horizonY + Math.pow((z + Math.abs(bgOffset.current)) % 100 / 100, 2) * (height - horizonY); // Moving effect

            // Simple linear bars for now to save perf, refined perspective
            const yPos = horizonY + (z + Math.abs(bgOffset.current)) % ((height - horizonY));
            // Let's use simpler linear scanlines for the floor grid effect
            // Actually, let's just draw horizontal lines that move down
        }

        // Better Floor Grid
        // Draw horizontal lines moving DOWN the screen (towards player)
        const floorHeight = height - horizonY;
        const moveOffset = Math.abs(bgOffset.current) % 40;

        for (let i = 0; i < floorHeight; i += 40) {
            const y = horizonY + i + moveOffset;
            if (y > height) continue;
            // Scale alpha by distance
            const alpha = (y - horizonY) / floorHeight;
            ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        ctx.restore();
    };

    const drawDino = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        ctx.save();
        ctx.translate(x, y);

        // Wireframe Style
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f3ff';
        ctx.strokeStyle = '#00f3ff'; // Cyan wireframe
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        // Nodes
        const nodes = [
            [20, -40], [45, -40], [45, -25], [30, -25], [30, -20], // Head
            [25, -5], [-10, -5], [-20, -20], [-25, -35], [-10, -25], [20, -25] // Body/Tail
        ];

        ctx.beginPath();
        ctx.moveTo(nodes[0][0], nodes[0][1]);
        for (let i = 1; i < nodes.length; i++) ctx.lineTo(nodes[i][0], nodes[i][1]);
        ctx.closePath();
        ctx.stroke();

        // Internal Grid/Wireframe lines
        ctx.beginPath();
        ctx.moveTo(30, -25); ctx.lineTo(25, -5);
        ctx.moveTo(-10, -25); ctx.lineTo(-10, -5);
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
        ctx.stroke();

        // Glowing Eye
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.fillRect(35, -36, 4, 4);

        // Legs
        ctx.strokeStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.beginPath();
        if (dinoY.current < 0) {
            ctx.moveTo(5, -5); ctx.lineTo(0, 10);
            ctx.moveTo(15, -5); ctx.lineTo(20, 5);
        } else {
            const f = Math.floor(runFrame.current / 5) % 2;
            if (f === 0) {
                ctx.moveTo(5, -5); ctx.lineTo(5, 5);
                ctx.moveTo(15, -5); ctx.lineTo(20, -2);
            } else {
                ctx.moveTo(5, -5); ctx.lineTo(0, -2);
                ctx.moveTo(15, -5); ctx.lineTo(15, 5);
            }
        }
        ctx.stroke();

        ctx.restore();
    };

    const drawObstacle = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number, type: number) => {
        ctx.save();
        ctx.translate(x, y);

        // Glitch Spike
        ctx.shadowBlur = 15;
        const color = type === 0 ? '#ff0055' : '#ff9900'; // Red or Orange
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.fillStyle = color; // Solid fill for readability
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(15, -height);
        ctx.lineTo(30, 0);
        ctx.fill();
        ctx.stroke();

        // Glitch lines
        if (Math.random() > 0.8) {
            const offset = (Math.random() - 0.5) * 10;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-5 + offset, -height / 2, 40, 2);
        }

        ctx.restore();
    };

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Sky Background (Deep Blue/Purple)
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(0.5, '#302b63');
        grad.addColorStop(1, '#24243e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Retro Sun
        drawSun(ctx, canvas.width, canvas.height);

        // 3. Grid Floor
        // Fill floor background first
        ctx.fillStyle = '#1a0b2e'; // Darker purple floor
        ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
        drawGrid(ctx, canvas.width, canvas.height);

        // 4. Horizon Line
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00f3ff';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - GROUND_HEIGHT);
        ctx.lineTo(canvas.width, canvas.height - GROUND_HEIGHT);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Physics
        dinoVelocity.current += GRAVITY;
        dinoY.current += dinoVelocity.current;

        if (dinoY.current > 0) {
            dinoY.current = 0;
            dinoVelocity.current = 0;
            isJumping.current = false;
        }

        runFrame.current++;

        // Draw Dino
        const dinoX = 80;
        const dinoBottom = canvas.height - GROUND_HEIGHT + dinoY.current;
        drawDino(ctx, dinoX, dinoBottom);

        // Spawn obstacles
        const now = Date.now();
        if (now - lastObstacleTime.current > 1500 + Math.random() * 1000 - (gameSpeed.current * 10)) {
            obstacles.current.push({
                x: canvas.width,
                height: 40 + Math.random() * 20,
                type: Math.floor(Math.random() * 2)
            });
            lastObstacleTime.current = now;
        }

        // Update and draw obstacles
        obstacles.current = obstacles.current.filter(obs => {
            obs.x -= gameSpeed.current;

            drawObstacle(ctx, obs.x, canvas.height - GROUND_HEIGHT, obs.height, obs.type);

            // Collision detection
            const dinoRect = {
                x: dinoX - 10,
                y: dinoBottom - 35,
                width: 40,
                height: 35
            };
            const obsRect = {
                x: obs.x + 5,
                y: canvas.height - GROUND_HEIGHT - obs.height,
                width: 20,
                height: obs.height
            };

            if (
                dinoRect.x < obsRect.x + obsRect.width &&
                dinoRect.x + dinoRect.width > obsRect.x &&
                dinoRect.y < obsRect.y + obsRect.height &&
                dinoRect.y + dinoRect.height > obsRect.y
            ) {
                setGameOver(true);
                setIsPlaying(false);
                if (score > highScore) {
                    setHighScore(Math.floor(score));
                    localStorage.setItem('dino-highscore', Math.floor(score).toString());
                }
            }

            return obs.x > -50;
        });

        // Update score
        if (isPlaying && !gameOver) {
            setScore(s => s + 0.1);
            gameSpeed.current += GAME_SPEED_INCREMENT;
        }

        // UI Text (Score)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'right';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.fillText(`SCORE: ${Math.floor(score)}`, canvas.width - 20, 40);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '18px monospace';
        ctx.shadowBlur = 0;
        ctx.fillText(`HI: ${highScore}`, canvas.width - 20, 65);

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
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (!isPlaying && !gameOver) {
                    resetGame();
                } else if (isPlaying) {
                    jump();
                } else if (gameOver) {
                    resetGame();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, gameOver, jump, resetGame]);

    const handleCanvasClick = () => {
        if (!isPlaying && !gameOver) {
            resetGame();
        } else if (isPlaying) {
            jump();
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

            <h1 className="text-4xl md:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_25px_rgba(236,72,153,0.6)]">
                SYNTH DINO
            </h1>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={GAME_HEIGHT + GROUND_HEIGHT}
                    onClick={handleCanvasClick}
                    className="rounded-xl border border-white/20 cursor-pointer max-w-full shadow-[0_0_50px_rgba(147,51,234,0.3)]"
                    style={{ maxWidth: '90vw', height: 'auto' }}
                />

                <AnimatePresence>
                    {(!isPlaying || gameOver) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-xl border border-white/10"
                        >
                            <div className="text-center">
                                {gameOver && (
                                    <>
                                        <div className="text-6xl font-black text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.9)] tracking-widest uppercase">Wasted</div>
                                        <div className="text-2xl text-white mb-6 font-mono">Score: {Math.floor(score)}</div>
                                    </>
                                )}
                                <Button onClick={resetGame} variant="primary" glow className="text-xl px-10 py-6 rounded-full border-2 border-white/20">
                                    {gameOver ? <><RotateCcw className="mr-2" /> RESTART GAME</> : <><Play className="mr-2" /> ENTER GRID</>}
                                </Button>
                                <p className="text-gray-400 mt-6 text-sm font-mono tracking-wider">PRESS SPACE TO JUMP</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
