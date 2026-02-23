"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LogOut, Timer, Plus, Minus, Crown, Swords, Shield, Flame } from "lucide-react";

interface User {
  id: string;
  username: string;
}

const WINNING_SCORE = 8;

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const scanId = searchParams.get("scanId");
  const player2Id = searchParams.get("player2Id");
  const scan2Id = searchParams.get("scan2Id");
  const isLocal = searchParams.get("mode") === "local";

  const [user, setUser] = useState<User | null>(null);
  const [player2, setPlayer2] = useState<User | null>(null);

  const [gameState, setGameState] = useState<"LOADING" | "PLAYING" | "FINISHED">(
    "LOADING"
  );
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [winner, setWinner] = useState<User | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (isLocal) {
      setUser({ id: "c752edcc-b731-458d-8c22-db44d7111e9f", username: "Noot" });
      setPlayer2({ id: "e2a0407d-6b7e-4adc-9a28-f7ccbebaa009", username: "SxLaDrill" });
      startTimeRef.current = new Date();
      setGameState("PLAYING");
      return;
    }

    if (!userId || !scanId || !player2Id || !scan2Id) {
      router.push("/");
      return;
    }

    const verifyAndStart = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/auth/verify?userId=${userId}&scanId=${scanId}`),
          fetch(`/api/auth/verify?userId=${player2Id}&scanId=${scan2Id}`),
        ]);
        if (!res1.ok || !res2.ok) throw new Error("Session invalide");
        const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
        setUser(data1.user);
        setPlayer2(data2.user);
        startTimeRef.current = new Date();
        setGameState("PLAYING");
      } catch (e) {
        console.error("Erreur auth:", e);
        router.push("/");
      }
    };

    verifyAndStart();
  }, [userId, scanId, player2Id, scan2Id, isLocal, router]);

  useEffect(() => {
    if (gameState === "PLAYING") {
      timerRef.current = setInterval(() => {
        setElapsed((e) => e + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "PLAYING") return;
    if (score1 >= WINNING_SCORE) {
      endGame(user, score1, score2);
    } else if (score2 >= WINNING_SCORE) {
      endGame(player2, score1, score2);
    }
  }, [score1, score2]);

  const endGame = async (
    gameWinner: User | null,
    finalScore1: number,
    finalScore2: number
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setWinner(gameWinner);
    setGameState("FINISHED");

    try {
      await fetch("/api/game-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1Id: user?.id,
          player2Id: player2?.id,
          player1Score: finalScore1,
          player2Score: finalScore2,
          winnerId: gameWinner?.id || null,
          durationSeconds: elapsed,
        }),
      });
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
    }
  };

  const handleLogout = async () => {
    if (!isLocal) {
      if (scanId)
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId }),
        });
      if (scan2Id)
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scanId: scan2Id }),
        });
    }
    router.push("/");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- LOADING ---
  if (gameState === "LOADING") {
    return (
      <div className="min-h-screen rift-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/Riftbound_icon.png" alt="Riftbound" className="w-20 h-20 object-contain mx-auto animate-pulse" />
          <p className="text-[#a09b8c] font-display tracking-widest uppercase text-sm">
            Invocation en cours...
          </p>
        </div>
      </div>
    );
  }

  // --- FINISHED (Recap) ---
  if (gameState === "FINISHED") {
    return (
      <div className="min-h-screen rift-bg flex items-center justify-center p-4">
        <div className="max-w-lg w-full card-rift rounded-2xl p-10 text-center space-y-8 relative overflow-hidden">
          {/* Top gold line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c8aa6e] to-transparent" />

          {/* Crown */}
          <div className="inline-flex p-5 rounded-full bg-gradient-to-b from-[#c89b3c]/20 to-transparent border border-[#c8aa6e]/30">
            <Crown className="w-10 h-10 text-[#c8aa6e]" />
          </div>

          <div>
            <p className="text-xs font-display text-[#785a28] uppercase tracking-[0.3em] mb-2">
              Victoire
            </p>
            <h2 className="font-display text-3xl font-bold gold-gradient">
              {winner?.username || "Égalité"}
            </h2>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-3 items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-[#a09b8c] mb-2 font-display uppercase tracking-wider">
                {user?.username}
              </p>
              <p
                className={`text-5xl font-display font-black ${
                  winner?.id === user?.id
                    ? "text-[#c8aa6e]"
                    : "text-[#5b5a56]"
                }`}
              >
                {score1}
              </p>
            </div>
            <div className="text-center">
              <Swords className="w-6 h-6 text-[#463714] mx-auto" />
            </div>
            <div className="text-center">
              <p className="text-xs text-[#a09b8c] mb-2 font-display uppercase tracking-wider">
                {player2?.username}
              </p>
              <p
                className={`text-5xl font-display font-black ${
                  winner?.id === player2?.id
                    ? "text-[#0ac8b9]"
                    : "text-[#5b5a56]"
                }`}
              >
                {score2}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center justify-center gap-2 text-[#5b5a56]">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-display tracking-wider">
              {formatTime(elapsed)}
            </span>
          </div>

          {/* Return button */}
          <button
            onClick={handleLogout}
            className="w-full btn-rift px-6 py-3.5 rounded-lg text-sm flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Retour au lobby
          </button>

          {/* Bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#463714] to-transparent" />
        </div>
      </div>
    );
  }

  // --- PLAYING ---
  return (
    <div className="min-h-screen rift-bg text-[#f0e6d2] flex flex-col">
      {/* Header */}
      <header className="bg-[#111827]/80 backdrop-blur-sm border-b border-[#463714] px-6 py-3 flex justify-between items-center relative">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#c8aa6e]/30 to-transparent" />

        <div className="flex items-center gap-3">
          <img src="/Riftbound_icon.png" alt="Riftbound" className="w-8 h-8 object-contain" />
          <h1 className="font-display text-lg font-bold text-[#c8aa6e] tracking-widest uppercase">
            Riftbound
          </h1>
        </div>

        {/* Timer central */}
        <div className="flex items-center gap-2 bg-[#0a0e1a] border border-[#463714] px-5 py-1.5 rounded-full">
          <Timer className="w-4 h-4 text-[#785a28]" />
          <span className="text-lg font-mono font-bold text-[#c8aa6e] tracking-wider">
            {formatTime(elapsed)}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 hover:bg-[#1a2340] rounded-lg border border-transparent hover:border-[#463714] text-[#5b5a56] hover:text-[#a09b8c] transition-all"
          title="Quitter"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Score target indicator */}
      <div className="bg-[#0a0e1a]/60 border-b border-[#463714]/50 py-1.5 text-center">
        <p className="text-[10px] text-[#5b5a56] uppercase tracking-[0.3em] font-display">
          Premier à <span className="text-[#c8aa6e]">{WINNING_SCORE}</span> points
        </p>
      </div>

      {/* Split-screen game area */}
      <main className="flex-1 grid grid-cols-2 gap-0 relative">
        {/* Center VS divider */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-14 h-14 rounded-full bg-[#0a0e1a] border-2 border-[#463714] flex items-center justify-center">
            <Swords className="w-6 h-6 text-[#785a28]" />
          </div>
        </div>

        {/* Player 1 - Left (Gold) */}
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#c8aa6e]/5 to-transparent border-r border-[#463714]/50 relative">
          <p className="text-xs font-display text-[#785a28] uppercase tracking-[0.3em] mb-2">
            Invocateur I
          </p>
          <h2 className="font-display text-2xl font-bold text-[#c8aa6e] mb-8 tracking-wide">
            {user?.username}
          </h2>

          {/* Score */}
          <div className="text-8xl font-display font-black text-[#c8aa6e] tabular-nums mb-10 drop-shadow-[0_0_30px_rgba(200,170,110,0.2)]">
            {score1}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setScore1((s) => Math.max(0, s - 1))}
              className="w-14 h-14 rounded-full bg-[#151c2f] border-2 border-[#463714] hover:border-[#e84057]/50 hover:bg-[#e84057]/10 active:bg-[#e84057]/20 transition-all flex items-center justify-center active:scale-90"
            >
              <Minus className="w-5 h-5 text-[#e84057]" />
            </button>
            <button
              onClick={() => setScore1((s) => s + 1)}
              className="w-20 h-20 rounded-full bg-gradient-to-b from-[#c89b3c] to-[#785a28] border-2 border-[#c8aa6e] hover:from-[#f0e6d2] hover:to-[#c89b3c] active:scale-90 transition-all flex items-center justify-center shadow-[0_0_25px_rgba(200,170,110,0.2)]"
            >
              <Plus className="w-7 h-7 text-[#0a0e1a]" />
            </button>
          </div>
        </div>

        {/* Player 2 - Right (Teal/Cyan) */}
        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-bl from-[#0ac8b9]/5 to-transparent relative">
          <p className="text-xs font-display text-[#0ac8b9]/50 uppercase tracking-[0.3em] mb-2">
            Invocateur II
          </p>
          <h2 className="font-display text-2xl font-bold text-[#0ac8b9] mb-8 tracking-wide">
            {player2?.username}
          </h2>

          {/* Score */}
          <div className="text-8xl font-display font-black text-[#0ac8b9] tabular-nums mb-10 drop-shadow-[0_0_30px_rgba(10,200,185,0.2)]">
            {score2}
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setScore2((s) => Math.max(0, s - 1))}
              className="w-14 h-14 rounded-full bg-[#151c2f] border-2 border-[#463714] hover:border-[#e84057]/50 hover:bg-[#e84057]/10 active:bg-[#e84057]/20 transition-all flex items-center justify-center active:scale-90"
            >
              <Minus className="w-5 h-5 text-[#e84057]" />
            </button>
            <button
              onClick={() => setScore2((s) => s + 1)}
              className="w-20 h-20 rounded-full bg-gradient-to-b from-[#0ac8b9] to-[#005a82] border-2 border-[#0ac8b9] hover:from-[#5ef5e6] hover:to-[#0ac8b9] active:scale-90 transition-all flex items-center justify-center shadow-[0_0_25px_rgba(10,200,185,0.2)]"
            >
              <Plus className="w-7 h-7 text-[#0a0e1a]" />
            </button>
          </div>
        </div>
      </main>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#0a0e1a] flex border-t border-[#463714]/30">
        <div
          className="bg-gradient-to-r from-[#785a28] to-[#c8aa6e] transition-all duration-300"
          style={{ width: `${(score1 / WINNING_SCORE) * 50}%` }}
        />
        <div
          className="bg-gradient-to-l from-[#005a82] to-[#0ac8b9] transition-all duration-300 ml-auto"
          style={{ width: `${(score2 / WINNING_SCORE) * 50}%` }}
        />
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen rift-bg flex items-center justify-center">
          <p className="text-[#a09b8c] font-display tracking-widest">
            Chargement...
          </p>
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
