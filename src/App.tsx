import { useState, useEffect, useRef } from 'react'
import './App.css'

const GRAVITY = 0.6;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3;
const PIPE_GAP = 160;
const PIPE_WIDTH = 60;
const GAME_HEIGHT = 600;
const GAME_WIDTH = 400;
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;

interface PipeData {
  id: number;
  x: number;
  topHeight: number;
}

function App() {
  const [birdY, setBirdY] = useState(250);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<PipeData[]>([]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  
  const gameLoopRef = useRef<number>(0);
  const pipeSpawnTimerRef = useRef(0);
  const lastTimeRef = useRef(0);

  const jump = () => {
    if (isGameOver) return;
    if (!isStarted) {
      setIsStarted(true);
    }
    setBirdVelocity(JUMP_STRENGTH);
  };

  const resetGame = () => {
    setBirdY(250);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setIsGameOver(false);
    setIsStarted(false);
    pipeSpawnTimerRef.current = 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') jump();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isGameOver]);

  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const update = (time: number) => {
      if (lastTimeRef.current !== undefined) {
        // Simple fixed-rate update logic for consistency
        setBirdY(y => {
          const newY = y + birdVelocity;
          // Check collision with floor or ceiling
          if (newY <= 0 || newY + BIRD_HEIGHT >= GAME_HEIGHT) {
            setIsGameOver(true);
            return y;
          }
          return newY;
        });
        setBirdVelocity(v => v + GRAVITY);

        // Move pipes
        setPipes(currentPipes => {
          const nextPipes = currentPipes
            .map(p => ({ ...p, x: p.x - PIPE_SPEED }))
            .filter(p => p.x + PIPE_WIDTH > 0);

          // Check collisions
          for (const pipe of nextPipes) {
            const birdRight = 50 + BIRD_WIDTH;
            const birdLeft = 50;
            const pipeRight = pipe.x + PIPE_WIDTH;
            const pipeLeft = pipe.x;

            if (birdRight > pipeLeft && birdLeft < pipeRight) {
              // Bird is horizontally within pipe bounds
              if (birdY < pipe.topHeight || birdY + BIRD_HEIGHT > pipe.topHeight + PIPE_GAP) {
                setIsGameOver(true);
              }
            }

            // Score update
            if (pipe.x + PIPE_SPEED >= 50 && pipe.x < 50) {
              setScore(s => s + 1);
            }
          }

          return nextPipes;
        });

        // Spawn pipes
        pipeSpawnTimerRef.current += 1;
        if (pipeSpawnTimerRef.current >= 100) {
          const minHeight = 50;
          const maxHeight = GAME_HEIGHT - PIPE_GAP - 50;
          const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
          
          setPipes(p => [...p, { id: Date.now(), x: GAME_WIDTH, topHeight }]);
          pipeSpawnTimerRef.current = 0;
        }
      }
      
      lastTimeRef.current = time;
      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [isStarted, isGameOver, birdVelocity, birdY]);

  return (
    <div 
      className="game-container" 
      onClick={jump}
    >
      <div className="score">{score}</div>
      
      {!isStarted && !isGameOver && (
        <div className="game-over">
          <h1>FLAPPY BIRD</h1>
          <p>Press Space or Click to Start</p>
        </div>
      )}

      {isGameOver && (
        <div className="game-over">
          <h1>GAME OVER</h1>
          <h2>Score: {score}</h2>
          <button onClick={(e) => { e.stopPropagation(); resetGame(); }}>Try Again</button>
        </div>
      )}

      <div 
        className="bird" 
        style={{ 
          top: birdY, 
          transform: `rotate(${Math.min(birdVelocity * 3, 90)}deg)` 
        }} 
      />

      {pipes.map(pipe => (
        <div key={pipe.id} className="pipe-container" style={{ left: pipe.x }}>
          <div className="pipe-top" style={{ height: pipe.topHeight }} />
          <div className="pipe-bottom" style={{ height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP }} />
        </div>
      ))}
    </div>
  );
}

export default App;
