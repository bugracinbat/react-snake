import Game from "./components/Game";
import Leaderboard from "./components/Leaderboard";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <>
      <div className="min-h-screen bg-black text-white">
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
