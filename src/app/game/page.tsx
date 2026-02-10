"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LogOut, Trophy, Timer, Play } from "lucide-react";

interface User {
  id: string;
  username: string;
}
interface Score {
  id: number;
  scoreValue: number;
  user: { username: string };
}

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Params user 1
  const userId = searchParams.get("userId");
  const scanId = searchParams.get("scanId");

  // Params user 2
  const player2Id = searchParams.get("player2Id");
  const scan2Id = searchParams.get("scan2Id");

  const [user, setUser] = useState<User | null>(null);
  const [player2, setPlayer2] = useState<User | null>(null);

  const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "FINISHED">(
    "IDLE"
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [leaderboard, setLeaderboard] = useState<Score[]>([]);

  useEffect(() => {
    // Il faut 2 joueurs maintenant
    if (!userId || !scanId || !player2Id || !scan2Id) {
      router.push("/");
      return;
    }

    const verifySession = async () => {
      try {
        // Validation JOUEUR 1
        const res1 = await fetch(
          `/api/auth/verify?userId=${userId}&scanId=${scanId}`
        );
        if (!res1.ok) throw new Error("Session Invalid Player 1");
        const data1 = await res1.json();
        setUser(data1.user);

        // Validation JOUEUR 2
        const res2 = await fetch(
          `/api/auth/verify?userId=${player2Id}&scanId=${scan2Id}`
        );
        if (!res2.ok) throw new Error("Session Invalid Player 2");
        const data2 = await res2.json();
        setPlayer2(data2.user);
      } catch (e) {
        console.error("Erreur auth:", e);
        // Si l'un des deux expire, on déconnecte tout le monde pour l'instant
        router.push("/");
      }
    };

    verifySession();
    fetchLeaderboard();
  }, [userId, scanId, player2Id, scan2Id, router]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/scores?limit=5");
      const data = await res.json();
      if (data.scores) setLeaderboard(data.scores);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "PLAYING" && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === "PLAYING") {
      endGame();
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState("PLAYING");
  };

  const handleClick = () => {
    if (gameState === "PLAYING") setScore((s) => s + 1);
  };

  const endGame = async () => {
    setGameState("FINISHED");
    // Enregistrer score pour Joueur 1 (pour l'instant solo, on associe au joueur 1)
    if (user) {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          gameId: 1,
          scoreValue: score,
        }),
      });
      fetchLeaderboard();
    }
  };

  const handleLogout = async () => {
    // Déconnexion des deux sessions
    if (scanId)
      await fetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ scanId }),
      });
    if (scan2Id)
      await fetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ scanId: scan2Id }),
      });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header Blanc */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            R
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Riftbound
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-sm text-gray-600">
            <div>
              J1:{" "}
              <span className="font-bold text-gray-900">{user?.username}</span>
            </div>
            {player2 && (
              <div>
                J2:{" "}
                <span className="font-bold text-gray-900">
                  {player2.username}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Zone de Jeu (Gauche - 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center min-h-[500px]">
          {gameState === "IDLE" && (
            <div className="text-center space-y-6">
              <div className="inline-flex p-4 bg-indigo-50 rounded-full">
                <Play className="w-8 h-8 text-indigo-600 ml-1" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Prêt à jouer ?
                </h2>
                <p className="text-gray-500 mt-2">
                  Challenge de clics : 30 secondes.
                </p>
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-transform active:scale-95"
              >
                Démarrer la session
              </button>
            </div>
          )}

          {gameState === "PLAYING" && (
            <div className="w-full max-w-sm space-y-8 text-center">
              <div className="flex justify-between items-center text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" /> {timeLeft}s
                </div>
                <div>
                  Score:{" "}
                  <span className="text-indigo-600 font-bold text-xl">
                    {score}
                  </span>
                </div>
              </div>

              <button
                onClick={handleClick}
                className="w-48 h-48 mx-auto rounded-full bg-indigo-50 border-4 border-indigo-100 hover:border-indigo-300 active:bg-indigo-100 transition-all flex items-center justify-center text-indigo-600 shadow-inner"
              >
                <span className="text-sm font-medium uppercase tracking-widest pointer-events-none">
                  Cliquez
                </span>
              </button>
            </div>
          )}

          {gameState === "FINISHED" && (
            <div className="text-center space-y-6">
              <h2 className="text-xl font-medium text-gray-600">
                Session terminée
              </h2>
              <div className="text-6xl font-black text-indigo-600 tracking-tighter">
                {score}
              </div>
              <p className="text-gray-400 text-sm">clics au total</p>
              <button
                onClick={startGame}
                className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Rejouer
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard (Droite - 1/3) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Classement</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {leaderboard.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">
                Aucune donnée.
              </p>
            ) : (
              leaderboard.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${
                        idx === 0
                          ? "bg-amber-100 text-amber-700"
                          : idx === 1
                          ? "bg-gray-100 text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[120px]">
                      {entry.user?.username || "Anonyme"}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-indigo-600">
                    {entry.scoreValue}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
