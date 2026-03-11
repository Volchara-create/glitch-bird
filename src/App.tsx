import { useState, useEffect, useRef } from 'react'
import './App.css'

const GRAVITY = 0.5;
const JUMP_STRENGTH = -7;
const INITIAL_PIPE_SPEED = 3;
const PIPE_GAP = 180;
const PIPE_WIDTH = 70;
const GAME_HEIGHT = 600;
const GAME_WIDTH = 400;
const BIRD_WIDTH = 45;
const BIRD_HEIGHT = 35;

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
  const [rotation, setRotation] = useState(0);
  
  const gameLoopRef = useRef<number>(0);
  const pipeSpawnTimerRef = useRef(0);

  // Складність: швидкість зростає з рівнем
  const level = Math.floor(score / 10) + 1;
  const currentPipeSpeed = INITIAL_PIPE_SPEED + (level - 1) * 0.5;

  const jump = () => {
    if (isGameOver) return;
    if (!isStarted) setIsStarted(true);
    setBirdVelocity(JUMP_STRENGTH);
  };

  const resetGame = () => {
    setBirdY(250);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setRotation(0);
    setIsGameOver(false);
    setIsStarted(false);
    pipeSpawnTimerRef.current = 0;
  };

  // Механіка перевороту кожні 10 очок
  useEffect(() => {
    if (score > 0 && score % 10 === 0) {
      setRotation((score / 10) * 45);
    }
  }, [score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') jump();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, isGameOver]);

  useEffect(() => {
    if (!isStarted || isGameOver) return;

    const update = () => {
      setBirdY(y => {
        const newY = y + birdVelocity;
        if (newY <= 0 || newY + BIRD_HEIGHT >= GAME_HEIGHT) {
          setIsGameOver(true);
          return y;
        }
        return newY;
      });
      setBirdVelocity(v => v + GRAVITY);

      setPipes(currentPipes => {
        const nextPipes = currentPipes
          .map(p => ({ ...p, x: p.x - currentPipeSpeed }))
          .filter(p => p.x + PIPE_WIDTH > 0);

        for (const pipe of nextPipes) {
          const birdRight = 50 + BIRD_WIDTH;
          const birdLeft = 50;
          const pipeRight = pipe.x + PIPE_WIDTH;
          const pipeLeft = pipe.x;

          if (birdRight > pipeLeft && birdLeft < pipeRight) {
            if (birdY < pipe.topHeight || birdY + BIRD_HEIGHT > pipe.topHeight + PIPE_GAP) {
              setIsGameOver(true);
            }
          }

          if (pipe.x + currentPipeSpeed >= 50 && pipe.x < 50) {
            setScore(s => s + 1);
          }
        }
        return nextPipes;
      });

      pipeSpawnTimerRef.current += 1;
      // Спавн труб залежить від швидкості
      if (pipeSpawnTimerRef.current >= Math.max(60, 100 - level * 5)) {
        const minHeight = 80;
        const maxHeight = GAME_HEIGHT - PIPE_GAP - 80;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        setPipes(p => [...p, { id: Date.now(), x: GAME_WIDTH, topHeight }]);
        pipeSpawnTimerRef.current = 0;
      }
      
      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [isStarted, isGameOver, birdVelocity, birdY, currentPipeSpeed, level]);

  return (
    <div className="game-viewport" style={{ transform: `rotate(${rotation}deg)` }}>
      <div className="game-container" onClick={jump}>
        <div className="score">{score}</div>
        <div className="level-badge">LEVEL {level}</div>
        
        {(!isStarted || isGameOver) && (
          <div className="overlay">
            <h1>{isGameOver ? 'GAME OVER' : 'FLAPPY BIRD'}</h1>
            {isGameOver && <h2>Score: {score}</h2>}
            <button className="btn-start" onClick={(e) => { e.stopPropagation(); isGameOver ? resetGame() : jump(); }}>
              {isGameOver ? 'TRY AGAIN' : 'START GAME'}
            </button>
            {!isGameOver && <p style={{marginTop: '20px'}}>Press Space or Click</p>}
          </div>
        )}

        <div 
          className="bird" 
          style={{ 
            top: birdY, 
            transform: `rotate(${Math.min(birdVelocity * 3, 45)}deg)` 
          }} 
        >
          <div className="bird-wing"></div>
          <div className="bird-beak"></div>
        </div>

        {pipes.map(pipe => (
          <div key={pipe.id} className="pipe-container" style={{ left: pipe.x }}>
            <div className="pipe-top" style={{ height: pipe.topHeight }}>
              <div className="pipe-cap"></div>
            </div>
            <div className="pipe-bottom" style={{ height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP }}>
              <div className="pipe-cap"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
