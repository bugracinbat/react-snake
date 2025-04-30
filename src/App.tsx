import Game from "./components/Game";
import Leaderboard from "./components/Leaderboard";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <>
      <div className="min-h-screen bg-black text-white">
        <header className="py-6">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-vercel-blue via-vercel-cyan to-vercel-purple bg-clip-text text-transparent">
            Vercel Snake
          </h1>
        </header>

        <main className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Game />
            <Leaderboard />
          </div>
        </main>

        <footer className="py-6 text-center text-gray-400">
          <p>Use arrow keys to move, space to pause</p>
        </footer>
      </div>
      <Analytics />
    </>
  );
}

export default App;
