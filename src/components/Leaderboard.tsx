import { useState, useEffect } from "react";
import { LeaderboardEntry } from "../types";

const LEADERBOARD_KEY = "snake-leaderboard";

export const addToLeaderboard = (entry: LeaderboardEntry) => {
  const leaderboard = getLeaderboard();
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem(
    LEADERBOARD_KEY,
    JSON.stringify(leaderboard.slice(0, 10))
  );
};

export const getLeaderboard = (): LeaderboardEntry[] => {
  const stored = localStorage.getItem(LEADERBOARD_KEY);
  return stored ? JSON.parse(stored) : [];
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-2 bg-gray-800 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400">#{index + 1}</span>
              <span className="font-medium">{entry.name}</span>
              <span className="text-sm text-gray-400">
                ({entry.difficulty})
              </span>
            </div>
            <div className="text-vercel-cyan">{entry.score}</div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="text-center text-gray-400">No scores yet</div>
        )}
      </div>
    </div>
  );
}
