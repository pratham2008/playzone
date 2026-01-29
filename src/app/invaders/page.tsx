"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 700;
const PLAYER_SIZE = 40;
const ALIEN_SIZE = 30;
const ALIEN_ROWS = 5;
const ALIEN_COLS = 8;
const BULLET_SPEED = 7;
const ALIEN_SPEED_BASE = 1;

export default function SpaceInvaders() {
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'won'>('start');
    const [score, setScore] = useState(0);
    const [wave, setWave] = useState(1);
    const [lives, setLives] = useState(3);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameId = useRef<number>(0);

    // Game State Refs
    const playerX = useRef(CANVAS_WIDTH / 2);
    const playerBullets = useRef<{ x: number, y: number }[]>([]);
    const alienBullets = useRef<{ x: number, y: number }[]>([]);
    const aliens = useRef<{ x: number, y: number, alive: boolean, type: number }[]>([]);
    const particles = useRef<{ x: number, y: number, vx: number, vy: number, life: number, color: string }[]>([]);

    const alienDirection = useRef(1); // 1 = right, -1 = left
    const alienSpeed = useRef(ALIEN_SPEED_BASE);
    const lastAlienMove = useRef(0);
    const lastAlienShoot = useRef(0);

    const initAliens = useCallback(() => {
        const newAliens = [];
        for (let r = 0; r < ALIEN_ROWS; r++) {
            for (let c = 0; c < ALIEN_COLS; c++) {
                newAliens.push({
                    x: 50 + c * 50,
                    y: 50 + r * 40,
                    alive: true,
                    type: Math.floor(r / 2) // 0, 1, 2 for varied sprites handles
                });
            }
        }
        aliens.current = newAliens;
        alienDirection.current = 1;
        playerBullets.current = [];
        alienBullets.current = [];
    }, []);

    const startGame = useCallback(() => {
        setScore(0);
        setWave(1);
        setLives(3);
        alienSpeed.current = ALIEN_SPEED_BASE;
        initAliens();
        setGameState('playing');
        playerX.current = CANVAS_WIDTH / 2;
    }, [initAliens]);

    const spawnParticles = (x: number, y: number, color: string) => {
        for (let i = 0; i < 8; i++) {
            particles.current.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                color
            });
        }
    };

    const drawAlien = (ctx: CanvasRenderingContext2D, x: number, y: number, type: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = type === 0 ? '#ff00ff' : type === 1 ? '#00f3ff' : '#39ff14';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;

        // Simple Pixel Art Shapes
        if (type === 0) { // Squid
            ctx.fillRect(5, 5, 20, 20);
            ctx.clearRect(8, 8, 4, 4);
            ctx.clearRect(18, 8, 4, 4);
            ctx.fillRect(5, 25, 4, 5);
            ctx.fillRect(21, 25, 4, 5);
        } else if (type === 1) { // Crab
            ctx.fillRect(2, 8, 26, 14);
            ctx.fillRect(0, 5, 4, 6);
            ctx.fillRect(26, 5, 4, 6);
            ctx.clearRect(8, 10, 4, 4);
            ctx.clearRect(18, 10, 4, 4);
        } else { // Octopus
            ctx.fillRect(5, 5, 20, 15);
            ctx.fillRect(2, 10, 26, 5);
            ctx.fillRect(5, 20, 5, 8);
            ctx.fillRect(12, 20, 6, 8);
            ctx.fillRect(20, 20, 5, 8);
            ctx.clearRect(10, 8, 4, 4);
            ctx.clearRect(16, 8, 4, 4);
        }

        ctx.restore();
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D, x: number) => {
        const y = CANVAS_HEIGHT - 50;

        ctx.save();
        ctx.translate(x + 20, y + 20); // Center pivot

        // Engine Glow
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 20;

        // Main Body (V-Shape Fighter)
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -25); // Nose
        ctx.lineTo(15, 10); // Right Wing Tip
        ctx.lineTo(0, 5);   // Rear Center
        ctx.lineTo(-15, 10); // Left Wing Tip
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit
        ctx.fillStyle = '#00f3ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(3, 0);
        ctx.lineTo(0, -2);
        ctx.lineTo(-3, 0);
        ctx.closePath();
        ctx.fill();

        // Engine Thrusters
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.beginPath();
        ctx.arc(-8, 12, 3, 0, Math.PI * 2);
        ctx.arc(8, 12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Cannons
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-14, 0, 2, 10);
        ctx.fillRect(12, 0, 2, 10);

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

        // Update Aliens
        const now = Date.now();
        const activeAliens = aliens.current.filter(a => a.alive);

        if (activeAliens.length === 0 && gameState === 'playing') {
            // Next Wave
            alienSpeed.current += 0.5;
            setWave(w => w + 1);
            initAliens();
            return; // Restart loop next frame
        }

        // Alien Movement
        let shouldReverse = false;
        if (now - lastAlienMove.current > Math.max(50, 600 - (activeAliens.length * 10) - (wave * 50))) {
            lastAlienMove.current = now;
            aliens.current.forEach(a => {
                a.x += 10 * alienDirection.current;
            });

            // Check edges
            const leftMost = Math.min(...activeAliens.map(a => a.x));
            const rightMost = Math.max(...activeAliens.map(a => a.x));

            if (rightMost > CANVAS_WIDTH - ALIEN_SIZE || leftMost < 10) {
                alienDirection.current *= -1;
                aliens.current.forEach(a => a.y += 20); // Drop down

                // Game Over if reach bottom
                if (Math.max(...activeAliens.map(a => a.y)) > CANVAS_HEIGHT - 100) {
                    setGameState('gameover');
                }
            }
        }

        // Alien Shooting
        if (now - lastAlienShoot.current > Math.max(500, 2000 - wave * 200)) {
            lastAlienShoot.current = now;
            const shooter = activeAliens[Math.floor(Math.random() * activeAliens.length)];
            if (shooter) {
                alienBullets.current.push({ x: shooter.x + ALIEN_SIZE / 2, y: shooter.y + ALIEN_SIZE });
            }
        }

        // Update Bullets
        playerBullets.current.forEach(b => b.y -= BULLET_SPEED);
        playerBullets.current = playerBullets.current.filter(b => b.y > -20);

        alienBullets.current.forEach(b => b.y += BULLET_SPEED * 0.8);
        alienBullets.current = alienBullets.current.filter(b => b.y < CANVAS_HEIGHT + 20);

        // Collision: Player Bullet vs Alien
        playerBullets.current.forEach((bullet, bIdx) => {
            aliens.current.forEach(alien => {
                if (alien.alive) {
                    if (bullet.x > alien.x && bullet.x < alien.x + ALIEN_SIZE &&
                        bullet.y > alien.y && bullet.y < alien.y + ALIEN_SIZE) {
                        alien.alive = false;
                        playerBullets.current.splice(bIdx, 1); // Remove bullet (rough)
                        setScore(s => s + 10 * wave);
                        spawnParticles(alien.x + 15, alien.y + 15, '#39ff14');
                    }
                }
            });
        });

        // Collision: Alien Bullet vs Player
        alienBullets.current.forEach((bullet, bIdx) => {
            const px = playerX.current;
            const py = CANVAS_HEIGHT - 40;
            if (bullet.x > px && bullet.x < px + 40 &&
                bullet.y > py && bullet.y < py + 20) {
                // Hit player
                alienBullets.current.splice(bIdx, 1);
                setLives(l => {
                    const newLives = l - 1;
                    if (newLives <= 0) setGameState('gameover');
                    return newLives;
                });
                spawnParticles(px + 20, py + 10, '#00f3ff');
            }
        });

        // Update Particles
        particles.current.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
        });
        particles.current = particles.current.filter(p => p.life > 0);

        // Drawing Objects
        aliens.current.forEach(a => {
            if (a.alive) drawAlien(ctx, a.x, a.y, a.type);
        });

        drawPlayer(ctx, playerX.current);

        // Draw Player Bullets
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 10;
        playerBullets.current.forEach(b => {
            ctx.fillRect(b.x - 2, b.y, 4, 15);
        });

        // Draw Alien Bullets
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        alienBullets.current.forEach(b => {
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x - 3, b.y - 10);
            ctx.lineTo(b.x + 3, b.y - 10);
            ctx.fill();
        });

        // Draw Particles
        particles.current.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        ctx.shadowBlur = 0;

        if (gameState === 'playing') {
            frameId.current = requestAnimationFrame(gameLoop);
        }
    }, [gameState, wave, initAliens]);

    useEffect(() => {
        if (gameState === 'playing') {
            frameId.current = requestAnimationFrame(gameLoop);
        }
        return () => cancelAnimationFrame(frameId.current);
    }, [gameState, gameLoop]);

    // Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === 'playing') {
                if (e.code === 'ArrowLeft') playerX.current = Math.max(0, playerX.current - 20);
                if (e.code === 'ArrowRight') playerX.current = Math.min(CANVAS_WIDTH - 40, playerX.current + 20);
                if (e.code === 'Space') {
                    // Shoot limit
                    if (playerBullets.current.length < 3) {
                        playerBullets.current.push({ x: playerX.current + 20, y: CANVAS_HEIGHT - 60 });
                    }
                }
            } else if (e.code === 'Space' && (gameState === 'start' || gameState === 'gameover')) {
                startGame();
            }
        };
        const handleMouseMove = (e: MouseEvent) => {
            if (canvasRef.current && gameState === 'playing') {
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = CANVAS_WIDTH / rect.width;
                const x = (e.clientX - rect.left) * scaleX;
                playerX.current = Math.max(0, Math.min(CANVAS_WIDTH - 40, x - 20));
            }
        };
        const handleClick = () => {
            if (gameState === 'playing' && playerBullets.current.length < 3) {
                playerBullets.current.push({ x: playerX.current + 20, y: CANVAS_HEIGHT - 60 });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
        };
    }, [gameState, startGame]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="absolute top-8 left-8">
                <Link href="/">
                    <Button variant="secondary" className="backdrop-blur-md">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                GALACTIC DEFENSE
            </h1>

            <div className="flex justify-between w-full max-w-[600px] mb-2 font-mono text-xl text-white">
                <div>SCORE: {score}</div>
                <div>WAVE: {wave}</div>
                <div className="flex gap-1 text-red-500">
                    {Array(lives).fill('♥').map((h, i) => <span key={i}>{h}</span>)}
                </div>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="rounded-xl border border-white/20 bg-[#050510] shadow-[0_0_30px_rgba(0,0,0,0.8)] cursor-crosshair"
                    style={{ maxWidth: '90vw', maxHeight: '75vh', width: 'auto', height: 'auto' }}
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
                                {gameState === 'gameover' && <div className="text-5xl font-black text-red-500 mb-4">INVASION SUCCESSFUL</div>}
                                {gameState === 'gameover' && <div className="text-2xl text-white mb-6">Final Score: {score}</div>}

                                <Button onClick={startGame} variant="primary" glow className="text-xl px-10 py-6 rounded-full">
                                    {gameState === 'start' ? <><Play className="mr-2" /> Launch Defender</> : <><RotateCcw className="mr-2" /> Retry Mission</>}
                                </Button>
                                <p className="text-gray-400 mt-6 text-sm">Mouse/Arrows to Move • Click/Space to Shoot</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
