"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  LogOut,
  Timer,
  Plus,
  Minus,
  Crown,
  Swords,
  Shield,
} from "lucide-react";

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
  const borne = searchParams.get("borne");
  const isDemo = searchParams.get("mode") === "demo";

  const [user, setUser] = useState<User | null>(null);
  const [player2, setPlayer2] = useState<User | null>(null);

  const [gameState, setGameState] = useState<
    "LOADING" | "PLAYING" | "FINISHED"
  >("LOADING");
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [winner, setWinner] = useState<User | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    // --- DEMO MODE (temporaire) ---
    if (isDemo) {
      setUser({ id: "demo-1", username: "Player 1" });
      setPlayer2({ id: "demo-2", username: "Player 2" });
      startTimeRef.current = new Date();
      setGameState("PLAYING");
      return;
    }

    if (!userId || !scanId || !player2Id || !scan2Id) {
      router.push(borne ? `/?borne=${borne}` : "/");
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
        router.push(borne ? `/?borne=${borne}` : "/");
      }
    };

    verifyAndStart();
  }, [userId, scanId, player2Id, scan2Id, isDemo, router]);

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
    finalScore2: number,
  ) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setWinner(gameWinner);
    setGameState("FINISHED");

    if (isDemo) return;

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
    if (!isDemo) {
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
    router.push(borne ? `/?borne=${borne}` : "/");
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // --- LOADING ---
  if (gameState === "LOADING") {
    return (
      <div className="w-[800px] h-[480px] rift-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <img
            src="/Riftbound_icon.png"
            alt="Riftbound"
            className="w-12 h-12 object-contain mx-auto animate-pulse drop-shadow-[0_0_12px_rgba(200,170,110,0.3)]"
          />
          <p className="text-[#a09b8c] font-display tracking-[0.2em] uppercase text-xs">
            Invocation en cours...
          </p>
        </div>
      </div>
    );
  }

  // --- FINISHED ---
  if (gameState === "FINISHED") {
    return (
      <div className="w-[800px] h-[480px] rift-bg flex items-center justify-center relative">
        {/* Top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#c8aa6e]/40 to-transparent" />

        <div className="w-[480px] text-center space-y-5">
          {/* Crown */}
          <div className="inline-flex p-4 rounded-full bg-linear-to-b from-[#c89b3c]/15 to-transparent border border-[#785a28]/40">
            <Crown className="w-8 h-8 text-[#c8aa6e] drop-shadow-[0_0_10px_rgba(200,170,110,0.3)]" />
          </div>

          {/* Winner */}
          <div>
            <p className="text-[10px] font-display text-[#785a28] uppercase tracking-[0.3em] mb-1">
              Victoire
            </p>
            <h2 className="font-display text-2xl font-bold gold-gradient tracking-wider">
              {winner?.username || "Égalité"}
            </h2>
          </div>

          {/* Scores */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-[10px] text-[#a09b8c] mb-1 font-display uppercase tracking-wider">
                {user?.username}
              </p>
              <p
                className={`text-4xl font-display font-black tabular-nums ${
                  winner?.id === user?.id ? "text-[#c8aa6e]" : "text-[#5b5a56]"
                }`}
              >
                {score1}
              </p>
            </div>

            <Swords className="w-5 h-5 text-[#785a28]/60" />

            <div className="text-center">
              <p className="text-[10px] text-[#a09b8c] mb-1 font-display uppercase tracking-wider">
                {player2?.username}
              </p>
              <p
                className={`text-4xl font-display font-black tabular-nums ${
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
          <div className="flex items-center justify-center gap-1.5 text-[#5b5a56]">
            <Timer className="w-3 h-3" />
            <span className="text-xs font-display tracking-wider">
              {formatTime(elapsed)}
            </span>
          </div>

          {/* Return button */}
          <button
            onClick={handleLogout}
            className="btn-lol px-8 py-2.5 rounded-md flex items-center justify-center gap-2 mx-auto"
          >
            <Shield className="w-3.5 h-3.5" />
            Retour au lobby
          </button>
        </div>

        {/* Bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#785a28]/30 to-transparent" />
      </div>
    );
  }

  // --- PLAYING ---
  return (
    <div className="w-[800px] h-[480px] rift-bg text-[#f0e6d2] flex flex-col overflow-hidden relative">
      {/* Header */}
      <header className="bg-[#010a13]/80 backdrop-blur-sm border-b border-[#785a28]/30 px-4 py-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/Riftbound_icon.png"
            alt="Riftbound"
            className="w-5 h-5 object-contain"
          />
          <h1 className="font-display text-xs font-bold text-[#c8aa6e] tracking-[0.15em] uppercase">
            Riftbound
          </h1>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 bg-[#010a13] border border-[#785a28]/40 px-4 py-1 rounded-full">
          <Timer className="w-3 h-3 text-[#785a28]" />
          <span className="text-sm font-mono font-bold text-[#c8aa6e] tracking-wider">
            {formatTime(elapsed)}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 hover:bg-[#0a1628] rounded-md border border-transparent hover:border-[#785a28]/30 text-[#5b5a56] hover:text-[#a09b8c] transition-all"
          title="Quitter"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      {/* Score target */}
      <div className="bg-[#010a13]/50 border-b border-[#785a28]/15 py-1 text-center shrink-0">
        <p className="text-[9px] text-[#5b5a56] uppercase tracking-[0.3em] font-display">
          Premier à <span className="text-[#c8aa6e]">{WINNING_SCORE}</span>{" "}
          points
        </p>
      </div>

      {/* Game area — split screen */}
      <main className="flex-1 grid grid-cols-2 gap-0 relative min-h-0">
        {/* VS divider */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-10 h-10 rounded-full bg-[#010a13] border border-[#785a28]/50 flex items-center justify-center shadow-[0_0_20px_rgba(1,10,19,0.8)]">
            <Swords className="w-4 h-4 text-[#785a28]" />
          </div>
        </div>

        {/* Vertical divider */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-linear-to-b from-[#785a28]/30 via-[#785a28]/10 to-[#785a28]/30 z-0" />

        {/* Player 1 — Gold */}
        <div className="flex flex-col items-center justify-center p-4 relative">
          <p className="text-[10px] font-display text-[#785a28] uppercase tracking-[0.25em] mb-1">
            Invocateur I
          </p>
          <h2 className="font-display text-base font-bold text-[#c8aa6e] mb-5 tracking-wider">
            {user?.username}
          </h2>

          <div className="text-6xl font-display font-black text-[#c8aa6e] tabular-nums mb-6 drop-shadow-[0_0_25px_rgba(200,170,110,0.15)]">
            {score1}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setScore1((s) => Math.max(0, s - 1))}
              className="w-11 h-11 rounded-full bg-[#091428] border border-[#785a28]/30 hover:border-[#e84057]/50 hover:bg-[#e84057]/5 active:bg-[#e84057]/10 transition-all flex items-center justify-center active:scale-90"
            >
              <Minus className="w-4 h-4 text-[#e84057]" />
            </button>
            <button
              onClick={() => setScore1((s) => s + 1)}
              className="w-16 h-16 rounded-full bg-linear-to-b from-[#c89b3c] to-[#785a28] border border-[#c8aa6e] hover:from-[#f0e6d2] hover:to-[#c89b3c] active:scale-90 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(200,170,110,0.15)]"
            >
              <Plus className="w-6 h-6 text-[#010a13]" />
            </button>
          </div>
        </div>

        {/* Player 2 — Teal */}
        <div className="flex flex-col items-center justify-center p-4 relative">
          <p className="text-[10px] font-display text-[#0ac8b9]/40 uppercase tracking-[0.25em] mb-1">
            Invocateur II
          </p>
          <h2 className="font-display text-base font-bold text-[#0ac8b9] mb-5 tracking-wider">
            {player2?.username}
          </h2>

          <div className="text-6xl font-display font-black text-[#0ac8b9] tabular-nums mb-6 drop-shadow-[0_0_25px_rgba(10,200,185,0.15)]">
            {score2}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setScore2((s) => Math.max(0, s - 1))}
              className="w-11 h-11 rounded-full bg-[#091428] border border-[#785a28]/30 hover:border-[#e84057]/50 hover:bg-[#e84057]/5 active:bg-[#e84057]/10 transition-all flex items-center justify-center active:scale-90"
            >
              <Minus className="w-4 h-4 text-[#e84057]" />
            </button>
            <button
              onClick={() => setScore2((s) => s + 1)}
              className="w-16 h-16 rounded-full bg-linear-to-b from-[#0ac8b9] to-[#005a82] border border-[#0ac8b9] hover:from-[#5ef5e6] hover:to-[#0ac8b9] active:scale-90 transition-all flex items-center justify-center shadow-[0_0_20px_rgba(10,200,185,0.15)]"
            >
              <Plus className="w-6 h-6 text-[#010a13]" />
            </button>
          </div>
        </div>
      </main>

      {/* Progress bar */}
      <div className="h-1 bg-[#010a13] flex shrink-0">
        <div
          className="bg-linear-to-r from-[#785a28] to-[#c8aa6e] transition-all duration-300"
          style={{ width: `${(score1 / WINNING_SCORE) * 50}%` }}
        />
        <div
          className="bg-linear-to-l from-[#005a82] to-[#0ac8b9] transition-all duration-300 ml-auto"
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
        <div className="w-[800px] h-[480px] rift-bg flex items-center justify-center">
          <p className="text-[#a09b8c] font-display tracking-widest text-sm">
            Chargement...
          </p>
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
