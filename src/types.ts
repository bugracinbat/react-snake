export type Position = {
  x: number;
  y: number;
};

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type PowerUpType = "SPEED" | "SLOW" | "POINTS" | "GHOST";

export type PowerUp = {
  position: Position;
  type: PowerUpType;
  active: boolean;
  duration?: number;
};

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  condition: (params: {
    score: number;
    snakeLength: number;
    speedUps?: number;
    ghostUsed?: boolean;
  }) => boolean;
};

export type GameState = {
  snake: Position[];
  food: Position;
  direction: Direction;
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  difficulty: Difficulty;
  powerUps: PowerUp[];
  activeEffects: {
    speed?: number;
    ghost?: boolean;
  };
  achievements: Achievement[];
};

export type LeaderboardEntry = {
  name: string;
  score: number;
  date: string;
  difficulty: Difficulty;
};
