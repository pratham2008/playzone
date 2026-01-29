import { GameCard } from "@/components/game-card";
import { Ghost, Grid3x3, BrainCircuit, Footprints, Bird, Target, Zap, Grid2x2Plus, Boxes, Palette, LayoutGrid, ArrowLeftRight, Rocket, Bomb, Terminal } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-20 min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-16 relative">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink animate-gradient mb-6 tracking-tighter">
          PLAYZONE
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto font-light">
          Enter the <span className="text-neon-cyan font-bold">Arcadeverse</span>.
          Select a game to start playing.
        </p>
        <div className="absolute -inset-10 bg-neon-purple/20 blur-[100px] -z-10 rounded-full opacity-50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl">
        <GameCard
          title="Neon Snake"
          description="Classic slither game with neon aesthetics. Collect nodes and grow."
          href="/snake"
          color="lime"
          icon={<Ghost className="w-8 h-8" />}
          image="/thumbnails/snake.png"
        />
        <GameCard
          title="Cyber Tic-Tac-Toe"
          description="Play vs Friend or challenge the AI in this strategic duel."
          href="/tictactoe"
          color="cyan"
          icon={<Grid3x3 className="w-8 h-8" />}
          image="/thumbnails/tictactoe.png"
        />
        <GameCard
          title="Neuro Match"
          description="Test your memory. Flip cards to find matching pairs."
          href="/memory"
          color="pink"
          icon={<BrainCircuit className="w-8 h-8" />}
          image="/thumbnails/memory.png"
        />
        <GameCard
          title="Neon Dino"
          description="Chrome Dino reimagined. Jump over obstacles endlessly."
          href="/dino"
          color="lime"
          icon={<Footprints className="w-8 h-8" />}
          image="/thumbnails/dino.png"
        />
        <GameCard
          title="Neon Dash"
          description="Flappy Bird style. Navigate through neon pipes."
          href="/flappy"
          color="purple"
          icon={<Bird className="w-8 h-8" />}
          image="/thumbnails/flappy.png"
        />
        <GameCard
          title="Whack-a-Mole"
          description="Click targets as fast as you can before time runs out!"
          href="/whack"
          color="cyan"
          icon={<Target className="w-8 h-8" />}
          image="/thumbnails/whack.png"
        />
        <GameCard
          title="Reaction Test"
          description="How fast are your reflexes? Test your reaction time."
          href="/reaction"
          color="pink"
          icon={<Zap className="w-8 h-8" />}
          image="/thumbnails/reaction.png"
        />
        <GameCard
          title="2048"
          description="Slide tiles to combine numbers and reach 2048."
          href="/2048"
          color="cyan"
          icon={<Grid2x2Plus className="w-8 h-8" />}
          image="/thumbnails/2048.png"
        />
        <GameCard
          title="Brick Breaker"
          description="Classic Breakout. Bounce the ball to break all bricks."
          href="/breakout"
          color="purple"
          icon={<Boxes className="w-8 h-8" />}
          image="/thumbnails/breakout.png"
        />
        <GameCard
          title="Simon Says"
          description="Pattern memory challenge. Repeat the color sequence."
          href="/simon"
          color="lime"
          icon={<Palette className="w-8 h-8" />}
          image="/thumbnails/simon.png"
        />
        <GameCard
          title="Neon Stack"
          description="Classic block stacking. Clear lines with neon tetrominos."
          href="/tetris"
          color="cyan"
          icon={<LayoutGrid className="w-8 h-8" />}
          image="/thumbnails/tetris.png"
        />
        <GameCard
          title="Cyber Paddle"
          description="The original arcade duel. Defeat the AI."
          href="/pong"
          color="pink"
          icon={<ArrowLeftRight className="w-8 h-8" />}
          image="/thumbnails/pong.png"
        />
        <GameCard
          title="Galactic Defense"
          description="Defend Earth from the neon alien invasion."
          href="/invaders"
          color="purple"
          icon={<Rocket className="w-8 h-8" />}
          image="/thumbnails/invaders.png"
        />
        <GameCard
          title="Data Sweeper"
          description="Hack the grid. Avoid firewalls and clear data."
          href="/minesweeper"
          color="lime"
          icon={<Bomb className="w-8 h-8" />}
          image="/thumbnails/minesweeper.png"
        />
        <GameCard
          title="Hacker Run"
          description="Type fast to bypass security and stop the breach."
          href="/typing"
          color="cyan"
          icon={<Terminal className="w-8 h-8" />}
          image="/thumbnails/typing.png"
        />
      </div>

      <footer className="mt-20 text-gray-500 text-sm">
        <p>&copy; 2026 PlayZone Arcade. Powered by Next.js</p>
      </footer>
    </main>
  );
}
