"use client";

import { useRfidPolling } from "@/hooks/useRfidPolling";
import { Scan, Users, CheckCircle, Wifi, Swords, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

interface ConnectedPlayer {
  id: string;
  username: string;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const p1Id = searchParams.get("p1");
  const s1Id = searchParams.get("scan1");
  const p2Id = searchParams.get("p2");
  const s2Id = searchParams.get("scan2");

  const [player1, setPlayer1] = useState<ConnectedPlayer | null>(null);
  const [player2, setPlayer2] = useState<ConnectedPlayer | null>(null);

  useEffect(() => {
    if (p1Id) {
      fetch(`/api/users?id=${p1Id}`)
        .then((r) => r.json())
        .then((d) => d.user && setPlayer1(d.user));
    }
    if (p2Id) {
      fetch(`/api/users?id=${p2Id}`)
        .then((r) => r.json())
        .then((d) => d.user && setPlayer2(d.user));
    }
  }, [p1Id, p2Id]);

  useEffect(() => {
    if (p1Id && p2Id && s1Id && s2Id) {
      const timer = setTimeout(() => {
        router.push(
          `/game?userId=${p1Id}&scanId=${s1Id}&player2Id=${p2Id}&scan2Id=${s2Id}`
        );
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [p1Id, p2Id, s1Id, s2Id, router]);

  const handleScan = (scan: any) => {
    if (!scan.known || !scan.user) {
      const currentState = new URLSearchParams();
      if (p1Id) {
        currentState.set("p1", p1Id);
        currentState.set("scan1", s1Id!);
      }
      const targetSlot = !p1Id ? "1" : "2";
      currentState.set("slot", targetSlot);
      currentState.set("returnToLobby", "true");

      router.push(
        `/register?rfid=${scan.rfidUuid}&scanId=${
          scan.id
        }&${currentState.toString()}`
      );
      return;
    }

    const scannedUser = scan.user;

    if (!player1) {
      router.push(`/?p1=${scannedUser.id}&scan1=${scan.id}`);
    } else if (!player2) {
      if (String(scannedUser.id) === String(p1Id)) {
        console.warn("Joueur déjà connecté");
        return;
      }
      router.push(
        `/?p1=${p1Id}&scan1=${s1Id}&p2=${scannedUser.id}&scan2=${scan.id}`
      );
    }
  };

  useRfidPolling(handleScan);

  return (
    <div className="min-h-screen rift-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full card-rift rounded-2xl p-10 text-center relative overflow-hidden">
        {/* Decorative top border glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c8aa6e] to-transparent" />

        {/* Logo */}
        <div className="mb-2 flex flex-col items-center">
          <img src="/Riftbound_icon.png" alt="Riftbound" className="w-28 h-28 object-contain mb-2" />
          <h1 className="font-display text-3xl font-bold gold-gradient tracking-widest">
            RIFTBOUND
          </h1>
          <p className="text-[#a09b8c] text-xs uppercase tracking-[0.3em] mt-1">
            Arena
          </p>
        </div>

        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#785a28] to-transparent mx-auto my-6" />

        <p className="text-[#a09b8c] text-base mb-10">
          En attente de 2 invocateurs pour le combat...
        </p>

        <div className="grid grid-cols-2 gap-6 mb-10">
          {/* Slot Joueur 1 */}
          <div
            className={`p-6 rounded-xl border transition-all duration-300 ${
              player1
                ? "border-[#c8aa6e] bg-[#c8aa6e]/5 glow-gold"
                : "border-[#463714] bg-[#0a0e1a]/50"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                  player1
                    ? "bg-gradient-to-b from-[#c89b3c] to-[#785a28] border-[#c8aa6e] text-[#0a0e1a]"
                    : "bg-[#151c2f] border-[#463714] text-[#5b5a56]"
                }`}
              >
                {player1 ? (
                  <Shield className="w-7 h-7" />
                ) : (
                  <Users className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-[#f0e6d2] text-lg">
                  {player1 ? player1.username : "Invocateur 1"}
                </h3>
                <p className={`text-xs uppercase tracking-[0.2em] font-semibold mt-1 ${
                  player1 ? "text-[#c8aa6e]" : "text-[#5b5a56]"
                }`}>
                  {player1 ? "✦ Prêt" : "En attente..."}
                </p>
              </div>
            </div>
          </div>

          {/* Slot Joueur 2 */}
          <div
            className={`p-6 rounded-xl border transition-all duration-300 ${
              player2
                ? "border-[#c8aa6e] bg-[#c8aa6e]/5 glow-gold"
                : "border-[#463714] bg-[#0a0e1a]/50"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                  player2
                    ? "bg-gradient-to-b from-[#c89b3c] to-[#785a28] border-[#c8aa6e] text-[#0a0e1a]"
                    : "bg-[#151c2f] border-[#463714] text-[#5b5a56]"
                }`}
              >
                {player2 ? (
                  <Shield className="w-7 h-7" />
                ) : (
                  <Users className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="font-display font-bold text-[#f0e6d2] text-lg">
                  {player2 ? player2.username : "Invocateur 2"}
                </h3>
                <p className={`text-xs uppercase tracking-[0.2em] font-semibold mt-1 ${
                  player2 ? "text-[#c8aa6e]" : "text-[#5b5a56]"
                }`}>
                  {player2 ? "✦ Prêt" : "En attente..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scan indicator */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-[#c8aa6e] opacity-20"></span>
            <Wifi className="relative text-[#c8aa6e] w-7 h-7" />
          </div>
          <p className="text-xs text-[#785a28] font-medium uppercase tracking-[0.2em]">
            Scannez vos badges pour rejoindre l&apos;arène
          </p>
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-4 mt-8">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#463714]" />
          <span className="text-xs text-[#5b5a56] uppercase tracking-[0.2em] font-display">ou</span>
          <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#463714]" />
        </div>

        {/* Bouton local */}
        <button
          onClick={() => router.push("/game?mode=local")}
          className="mt-6 w-full btn-rift px-6 py-3.5 rounded-lg flex items-center justify-center gap-3 text-sm"
        >
          <Swords className="w-5 h-5" />
          Duel Local
        </button>

        {/* Bottom decorative border */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#463714] to-transparent" />
      </div>
    </div>
  );
}

export default function Home() {
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
      <HomeContent />
    </Suspense>
  );
}
