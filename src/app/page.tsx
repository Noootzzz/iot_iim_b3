"use client";

import { useRfidPolling } from "@/hooks/useRfidPolling";
import { Scan, Users, CheckCircle, Wifi } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

interface ConnectedPlayer {
  id: string;
  username: string;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // On récupère l'état actuel depuis l'URL (persistence simple)
  const p1Id = searchParams.get("p1");
  const s1Id = searchParams.get("scan1");
  const p2Id = searchParams.get("p2");
  const s2Id = searchParams.get("scan2");

  const [player1, setPlayer1] = useState<ConnectedPlayer | null>(null);
  const [player2, setPlayer2] = useState<ConnectedPlayer | null>(null);

  // Charger les infos des joueurs si présents dans l'URL
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

  // Si on a les 2 joueurs, on démarre le jeu après un court délai
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

  // Gérer les scans entrants
  const handleScan = (scan: any) => {
    // Si c'est un scan inconnu, on redirige vers l'inscription en préservant l'état
    if (!scan.known || !scan.user) {
      const currentState = new URLSearchParams();
      if (p1Id) {
        currentState.set("p1", p1Id);
        currentState.set("scan1", s1Id!); // On suppose que scan1 existe si p1 existe
      }
      // On indique qu'on s'attend à remplir le slot 1 ou 2
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

    // Logique d'ajout au lobby
    if (!player1) {
      // Ajout Slot 1
      router.push(`/?p1=${scannedUser.id}&scan1=${scan.id}`);
    } else if (!player2) {
      // Empêcher le même joueur de se scanner deux fois
      if (String(scannedUser.id) === String(p1Id)) {
        console.warn("Joueur déjà connecté");
        return;
      }
      // Ajout Slot 2
      router.push(
        `/?p1=${p1Id}&scan1=${s1Id}&p2=${scannedUser.id}&scan2=${scan.id}`
      );
    }
  };

  useRfidPolling(handleScan);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
          Lobby
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          En attente de 2 joueurs pour commencer la partie...
        </p>

        <div className="grid grid-cols-2 gap-8 mb-10">
          {/* Slot Joueur 1 */}
          <div
            className={`p-6 rounded-xl border-2 transition-all ${
              player1
                ? "border-indigo-500 bg-indigo-50"
                : "border-dashed border-gray-300"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  player1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {player1 ? (
                  <CheckCircle className="w-8 h-8" />
                ) : (
                  <Users className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {player1 ? player1.username : "Joueur 1"}
                </h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                  {player1 ? "Prêt" : "En attente du badge..."}
                </p>
              </div>
            </div>
          </div>

          {/* Slot Joueur 2 */}
          <div
            className={`p-6 rounded-xl border-2 transition-all ${
              player2
                ? "border-indigo-500 bg-indigo-50"
                : "border-dashed border-gray-300"
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  player2
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {player2 ? (
                  <CheckCircle className="w-8 h-8" />
                ) : (
                  <Users className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {player2 ? player2.username : "Joueur 2"}
                </h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                  {player2 ? "Prêt" : "En attente du badge..."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <Wifi className="relative text-indigo-600 w-8 h-8" />
          </div>
          <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider">
            Scanner vos badges pour rejoindre le jeu
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <HomeContent />
    </Suspense>
  );
}
