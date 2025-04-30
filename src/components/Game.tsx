import { useEffect, useState, useCallback, useRef } from "react";
import useSound from "use-sound";
import {
  Position,
  Direction,
  GameState,
  PowerUpType,
  Difficulty,
  Achievement,
  PowerUp,
} from "../types";
import {
  PauseIcon,
  PlayIcon,
  TrophyIcon,
  BoltIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";
import NameInputDialog from "./NameInputDialog";
import { addToLeaderboard } from "./Leaderboard";

const GRID_SIZE = 20;
const CELL_SIZE = 20; // Slightly smaller cells to prevent overflow
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
];
const INITIAL_FOOD = { x: 5, y: 5 };

const DIFFICULTY_SETTINGS = {
  EASY: { speed: 200, powerUpChance: 0.1 },
  MEDIUM: { speed: 150, powerUpChance: 0.15 },
  HARD: { speed: 100, powerUpChance: 0.2 },
};

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-blood",
    name: "First Blood",
    description: "Score your first point",
    unlocked: false,
    condition: ({ score }) => score >= 10,
  },
  {
    id: "snake-master",
    name: "Snake Master",
    description: "Reach a score of 100",
    unlocked: false,
    condition: ({ score }) => score >= 100,
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Collect 3 speed power-ups",
    unlocked: false,
    condition: ({ speedUps }) => (speedUps ?? 0) >= 3,
  },
  {
    id: "ghost-rider",
    name: "Ghost Rider",
    description: "Use ghost mode to pass through yourself",
    unlocked: false,
    condition: ({ ghostUsed }) => ghostUsed ?? false,
  },
];

const getRandomPosition = (): Position => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE),
});

const getRandomPowerUp = (): PowerUpType => {
  const types: PowerUpType[] = ["SPEED", "SLOW", "POINTS", "GHOST"];
  return types[Math.floor(Math.random() * types.length)];
};

export default function Game() {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: INITIAL_FOOD,
    direction: "UP",
    isGameOver: false,
    isPaused: false,
    score: 0,
    difficulty: "MEDIUM",
    powerUps: [],
    activeEffects: {},
    achievements: ACHIEVEMENTS,
  });

  const [showNameDialog, setShowNameDialog] = useState(false);
  const [playEat] = useSound("/sounds/eat.mp3", { volume: 0.5 });
  const [playGameOver] = useSound("/sounds/game-over.mp3", { volume: 0.5 });
  const [playPowerUp] = useSound("/sounds/power-up.mp3", { volume: 0.5 });
  const [playAchievement] = useSound("/sounds/achievement.mp3", {
    volume: 0.5,
  });
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameLoop = useRef<number | undefined>(undefined);
  const speedUpCount = useRef(0);
  const ghostUsed = useRef(false);

  const wrapPosition = (pos: Position): Position => {
    let newX = pos.x;
    let newY = pos.y;

    if (newX < 0) newX = GRID_SIZE - 1;
    if (newX >= GRID_SIZE) newX = 0;
    if (newY < 0) newY = GRID_SIZE - 1;
    if (newY >= GRID_SIZE) newY = 0;

    return { x: newX, y: newY };
  };

  const checkCollision = useCallback(
    (head: Position): boolean => {
      if (gameState.activeEffects.ghost) return false;
      return gameState.snake.some(
        (segment) => segment.x === head.x && segment.y === head.y
      );
    },
    [gameState.snake, gameState.activeEffects.ghost]
  );

  const checkAchievements = useCallback(() => {
    const newAchievements = gameState.achievements.map((achievement) => {
      if (
        !achievement.unlocked &&
        achievement.condition({
          score: gameState.score,
          snakeLength: gameState.snake.length,
          speedUps: speedUpCount.current,
          ghostUsed: ghostUsed.current,
        })
      ) {
        playAchievement();
        return { ...achievement, unlocked: true };
      }
      return achievement;
    });

    if (
      newAchievements.some(
        (a, i) => a.unlocked !== gameState.achievements[i].unlocked
      )
    ) {
      setGameState((prev) => ({ ...prev, achievements: newAchievements }));
    }
  }, [
    gameState.score,
    gameState.snake.length,
    gameState.achievements,
    playAchievement,
  ]);

  const applyPowerUp = useCallback(
    (type: PowerUpType) => {
      playPowerUp();
      switch (type) {
        case "SPEED":
          speedUpCount.current++;
          setGameState((prev) => ({
            ...prev,
            activeEffects: { ...prev.activeEffects, speed: 0.7 },
          }));
          setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              activeEffects: { ...prev.activeEffects, speed: undefined },
            }));
          }, 5000);
          break;
        case "SLOW":
          setGameState((prev) => ({
            ...prev,
            activeEffects: { ...prev.activeEffects, speed: 1.5 },
          }));
          setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              activeEffects: { ...prev.activeEffects, speed: undefined },
            }));
          }, 5000);
          break;
        case "GHOST":
          ghostUsed.current = true;
          setGameState((prev) => ({
            ...prev,
            activeEffects: { ...prev.activeEffects, ghost: true },
          }));
          setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              activeEffects: { ...prev.activeEffects, ghost: false },
            }));
          }, 5000);
          break;
        case "POINTS":
          setGameState((prev) => ({
            ...prev,
            score: prev.score + 50,
          }));
          break;
      }
    },
    [playPowerUp]
  );

  const moveSnake = useCallback(() => {
    if (gameState.isGameOver || gameState.isPaused) return;

    const head = { ...gameState.snake[0] };

    switch (gameState.direction) {
      case "UP":
        head.y -= 1;
        break;
      case "DOWN":
        head.y += 1;
        break;
      case "LEFT":
        head.x -= 1;
        break;
      case "RIGHT":
        head.x += 1;
        break;
    }

    const wrappedHead = wrapPosition(head);

    if (checkCollision(wrappedHead)) {
      playGameOver();
      setGameState((prev) => ({ ...prev, isGameOver: true }));
      setShowNameDialog(true);
      return;
    }

    const newSnake = [wrappedHead];
    const didEatFood =
      wrappedHead.x === gameState.food.x && wrappedHead.y === gameState.food.y;

    if (didEatFood) {
      playEat();
      newSnake.push(...gameState.snake);
      const newScore = gameState.score + 10;
      setGameState((prev) => ({
        ...prev,
        food: getRandomPosition(),
        score: newScore,
      }));

      // Chance to spawn power-up
      if (
        Math.random() < DIFFICULTY_SETTINGS[gameState.difficulty].powerUpChance
      ) {
        const powerUp: PowerUp = {
          position: getRandomPosition(),
          type: getRandomPowerUp(),
          active: true,
        };
        setGameState((prev) => ({
          ...prev,
          powerUps: [...prev.powerUps, powerUp],
        }));
      }

      checkAchievements();
    } else {
      newSnake.push(...gameState.snake.slice(0, -1));
    }

    // Check for power-up collection
    const collectedPowerUp = gameState.powerUps.find(
      (p) => p.position.x === wrappedHead.x && p.position.y === wrappedHead.y
    );

    if (collectedPowerUp) {
      applyPowerUp(collectedPowerUp.type);
      setGameState((prev) => ({
        ...prev,
        powerUps: prev.powerUps.filter((p) => p !== collectedPowerUp),
      }));
    }

    setGameState((prev) => ({
      ...prev,
      snake: newSnake,
    }));
  }, [
    gameState,
    checkCollision,
    playEat,
    playGameOver,
    checkAchievements,
    applyPowerUp,
  ]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState.isGameOver) return;

      // Prevent default scrolling behavior for arrow keys and space
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (gameState.direction !== "DOWN") {
            setGameState((prev) => ({ ...prev, direction: "UP" }));
          }
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (gameState.direction !== "UP") {
            setGameState((prev) => ({ ...prev, direction: "DOWN" }));
          }
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (gameState.direction !== "RIGHT") {
            setGameState((prev) => ({ ...prev, direction: "LEFT" }));
          }
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (gameState.direction !== "LEFT") {
            setGameState((prev) => ({ ...prev, direction: "RIGHT" }));
          }
          break;
        case " ":
        case "p":
        case "P":
          setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
          break;
        case "1":
          setGameState((prev) => ({ ...prev, difficulty: "EASY" }));
          break;
        case "2":
          setGameState((prev) => ({ ...prev, difficulty: "MEDIUM" }));
          break;
        case "3":
          setGameState((prev) => ({ ...prev, difficulty: "HARD" }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState.direction, gameState.isGameOver]);

  useEffect(() => {
    if (!gameState.isGameOver && !gameState.isPaused) {
      const speed = DIFFICULTY_SETTINGS[gameState.difficulty].speed;
      const adjustedSpeed = gameState.activeEffects.speed
        ? speed * gameState.activeEffects.speed
        : speed;
      gameLoop.current = setInterval(moveSnake, adjustedSpeed);
    }
    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current);
    };
  }, [
    gameState.isGameOver,
    gameState.isPaused,
    moveSnake,
    gameState.difficulty,
    gameState.activeEffects.speed,
  ]);

  const resetGame = () => {
    speedUpCount.current = 0;
    ghostUsed.current = false;
    setGameState({
      snake: INITIAL_SNAKE,
      food: getRandomPosition(),
      direction: "UP",
      isGameOver: false,
      isPaused: false,
      score: 0,
      difficulty: "MEDIUM",
      powerUps: [],
      activeEffects: {},
      achievements: ACHIEVEMENTS,
    });
  };

  const handleNameSubmit = (name?: string) => {
    setShowNameDialog(false);
    if (name) {
      addToLeaderboard({
        name,
        score: gameState.score,
        date: new Date().toISOString(),
        difficulty: gameState.difficulty,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center w-full mb-4">
        <div className="text-2xl font-bold" role="status" aria-live="polite">
          Score: {gameState.score}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setGameState((prev) => ({ ...prev, difficulty: "EASY" }))
            }
            className={`btn ${
              gameState.difficulty === "EASY" ? "btn-primary" : "btn-secondary"
            }`}
          >
            Easy
          </button>
          <button
            onClick={() =>
              setGameState((prev) => ({ ...prev, difficulty: "MEDIUM" }))
            }
            className={`btn ${
              gameState.difficulty === "MEDIUM"
                ? "btn-primary"
                : "btn-secondary"
            }`}
          >
            Medium
          </button>
          <button
            onClick={() =>
              setGameState((prev) => ({ ...prev, difficulty: "HARD" }))
            }
            className={`btn ${
              gameState.difficulty === "HARD" ? "btn-primary" : "btn-secondary"
            }`}
          >
            Hard
          </button>
        </div>
      </div>

      <div
        className="relative w-full aspect-square max-w-[500px]"
        ref={gameContainerRef}
      >
        <div
          className="game-grid bg-gray-900 p-4 rounded-lg w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          }}
          role="grid"
          aria-label="Snake game board"
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);
            const isSnake = gameState.snake.some(
              (segment) => segment.x === x && segment.y === y
            );
            const isFood = gameState.food.x === x && gameState.food.y === y;
            const isHead =
              gameState.snake[0].x === x && gameState.snake[0].y === y;
            const powerUp = gameState.powerUps.find(
              (p) => p.position.x === x && p.position.y === y
            );

            return (
              <div
                key={index}
                className={`
                  ${isSnake ? "snake-segment" : ""}
                  ${isHead ? "bg-vercel-blue" : isSnake ? "bg-vercel-cyan" : ""}
                  ${isFood ? "food" : ""}
                  ${powerUp ? "power-up" : ""}
                  ${!isSnake && !isFood && !powerUp ? "bg-gray-800" : ""}
                `}
                role="gridcell"
                aria-label={
                  isHead
                    ? "Snake head"
                    : isSnake
                    ? "Snake body"
                    : isFood
                    ? "Food"
                    : powerUp
                    ? `Power-up: ${powerUp.type}`
                    : "Empty cell"
                }
              />
            );
          })}
        </div>

        {(gameState.isGameOver || gameState.isPaused) && !showNameDialog && (
          <div
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg"
            role="dialog"
            aria-label={gameState.isGameOver ? "Game Over" : "Game Paused"}
          >
            <div className="text-center">
              {gameState.isGameOver ? (
                <>
                  <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                  <button
                    onClick={resetGame}
                    className="btn btn-primary"
                    aria-label="Play Again"
                  >
                    Play Again
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    setGameState((prev) => ({ ...prev, isPaused: false }))
                  }
                  className="btn btn-secondary"
                  aria-label="Resume Game"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() =>
            setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
          }
          className="btn btn-secondary"
          aria-label={gameState.isPaused ? "Resume Game" : "Pause Game"}
        >
          {gameState.isPaused ? (
            <PlayIcon className="w-6 h-6" aria-hidden="true" />
          ) : (
            <PauseIcon className="w-6 h-6" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-400 text-center">
        <p>Controls: Arrow keys or WASD to move</p>
        <p>Space or P to pause</p>
        <p>1, 2, 3 to change difficulty</p>
      </div>

      <div className="mt-4 w-full">
        <h3 className="text-lg font-bold mb-2">Achievements</h3>
        <div className="grid grid-cols-2 gap-2">
          {gameState.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-2 rounded-lg ${
                achievement.unlocked
                  ? "bg-vercel-purple text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {achievement.unlocked ? (
                  <TrophyIcon className="w-5 h-5" />
                ) : (
                  <TrophyIcon className="w-5 h-5 opacity-50" />
                )}
                <div>
                  <div className="font-medium">{achievement.name}</div>
                  <div className="text-sm">{achievement.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <NameInputDialog isOpen={showNameDialog} onClose={handleNameSubmit} />
    </div>
  );
}
