"use client";

import { useRfidPolling } from "@/hooks/useRfidPolling";
import { Users, Wifi, Shield, Swords, Loader2, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";

interface ConnectedPlayer {
  id: string;
  username: string;
}

interface PendingRequest {
  id: number;
  rfidUuid: string;
  slot: "1" | "2";
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const p1Id = searchParams.get("p1");
  const s1Id = searchParams.get("scan1");
  const p2Id = searchParams.get("p2");
  const s2Id = searchParams.get("scan2");
  const borne = searchParams.get("borne");

  const [player1, setPlayer1] = useState<ConnectedPlayer | null>(null);
  const [player2, setPlayer2] = useState<ConnectedPlayer | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(
    null,
  );
  const [pendingRejected, setPendingRejected] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

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
        const params = new URLSearchParams({
          userId: p1Id,
          scanId: s1Id,
          player2Id: p2Id,
          scan2Id: s2Id,
        });
        if (borne) params.set("borne", borne);
        router.push(`/game?${params.toString()}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [p1Id, p2Id, s1Id, s2Id, router, borne]);

  useEffect(() => {
    if (!pendingRequest) return;

    const url = `/api/registration-requests/stream?requestId=${pendingRequest.id}`;
    const eventSource = new EventSource(url);
    sseRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.status === "approved" && data.user && data.scanId) {
        const borneStr = borne ? `&borne=${borne}` : "";

        if (pendingRequest.slot === "1") {
          router.push(`/?p1=${data.user.id}&scan1=${data.scanId}${borneStr}`);
        } else {
          router.push(
            `/?p1=${p1Id}&scan1=${s1Id}&p2=${data.user.id}&scan2=${data.scanId}${borneStr}`,
          );
        }
        setPendingRequest(null);
      } else if (data.status === "rejected") {
        setPendingRequest(null);
        setPendingRejected(true);
        setTimeout(() => setPendingRejected(false), 4000);
      }
    };

    eventSource.onerror = () => {
      console.warn("Registration SSE connection lost, reconnecting...");
    };

    return () => {
      eventSource.close();
      sseRef.current = null;
    };
  }, [pendingRequest, p1Id, s1Id, borne, router]);

  const handleScan = async (scan: any) => {
    if (!scan.known || !scan.user) {
      const targetSlot: "1" | "2" = !p1Id ? "1" : "2";

      try {
        const res = await fetch("/api/registration-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rfidUuid: scan.rfidUuid,
            scanId: scan.id,
            machineId: borne || null,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setPendingRequest({
            id: data.request.id,
            rfidUuid: scan.rfidUuid,
            slot: targetSlot,
          });
        }
      } catch (err) {
        console.error("Erreur création demande:", err);
      }
      return;
    }

    const scannedUser = scan.user;
    const borneStr = borne ? `&borne=${borne}` : "";

    if (!player1) {
      router.push(`/?p1=${scannedUser.id}&scan1=${scan.id}${borneStr}`);
    } else if (!player2) {
      if (String(scannedUser.id) === String(p1Id)) {
        console.warn("Joueur déjà connecté");
        return;
      }
      router.push(
        `/?p1=${p1Id}&scan1=${s1Id}&p2=${scannedUser.id}&scan2=${scan.id}${borneStr}`,
      );
    }
  };

  useRfidPolling(handleScan, borne);

  return (
    <div className="w-full min-h-screen rift-bg flex flex-col items-center justify-center relative px-4">
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#c8aa6e]/40 to-transparent" />

      {pendingRequest && (
        <div className="absolute inset-0 z-50 bg-[#010a13]/90 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="card-hextech corner-decor w-full max-w-[380px] p-6 text-center">
            <div className="relative mx-auto w-14 h-14 mb-4">
              <span className="absolute inset-0 rounded-full border-2 border-[#c8aa6e]/30 animate-ping" />
              <div className="relative w-14 h-14 rounded-full bg-[#0a1628] border border-[#785a28] flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#c8aa6e] animate-pulse" />
              </div>
            </div>
            <h2 className="font-display text-base font-bold text-[#c8aa6e] tracking-wider mb-2">
              Badge non enregistré
            </h2>
            <p className="text-[#a09b8c] text-xs mb-3">
              Une demande de création de compte a été envoyée à
              l&apos;administrateur.
            </p>
            <div className="bg-[#0a1628] border border-[#785a28]/30 rounded-lg p-3 mb-4">
              <p className="text-[10px] text-[#785a28] uppercase tracking-[0.2em] font-display mb-1">
                Badge RFID
              </p>
              <p className="text-[#c8aa6e] font-mono text-xs tracking-wider">
                {pendingRequest.rfidUuid}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-[#785a28] animate-spin" />
              <p className="text-[10px] text-[#5b5a56] uppercase tracking-[0.2em] font-display">
                En attente de validation...
              </p>
            </div>
          </div>
        </div>
      )}

      {pendingRejected && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#e84057]/10 border border-[#e84057]/30 rounded-lg px-5 py-2.5 animate-fadeIn">
          <p className="text-[#e84057] text-xs font-display tracking-wider">
            Demande refusée par l&apos;administrateur
          </p>
        </div>
      )}

      <div className="flex flex-col items-center mb-5">
        <img
          src="/Riftbound_icon.png"
          alt="Riftbound"
          className="w-14 h-14 object-contain mb-2 drop-shadow-[0_0_12px_rgba(200,170,110,0.3)]"
        />
        <h1 className="font-display text-2xl font-bold gold-gradient tracking-[0.15em] uppercase">
          Riftbound
        </h1>
        <p className="text-[#a09b8c] text-[10px] uppercase tracking-[0.35em] mt-1 font-display">
          Arena
        </p>
      </div>

      <div className="w-40 h-px bg-linear-to-r from-transparent via-[#785a28] to-transparent mb-4" />

      <p className="text-[#a09b8c] text-xs mb-5">
        En attente de 2 invocateurs pour le combat...
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 w-full max-w-[560px]">
        <div
          className={`w-full sm:w-[230px] card-hextech corner-decor rounded-lg px-5 py-4 transition-all duration-300 ${
            player1
              ? "border-[#c8aa6e] shadow-[0_0_15px_rgba(200,170,110,0.1)]"
              : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                player1
                  ? "bg-linear-to-b from-[#c89b3c] to-[#785a28] border-[#c8aa6e] text-[#010a13]"
                  : "bg-[#0a1628] border-[#785a28] text-[#a09b8c]"
              }`}
            >
              {player1 ? (
                <Shield className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-[#f0e6d2]">
                {player1 ? player1.username : "Invocateur I"}
              </p>
              <p
                className={`text-[10px] uppercase tracking-[0.15em] font-semibold mt-0.5 ${
                  player1 ? "text-[#c8aa6e]" : "text-[#5b5a56]"
                }`}
              >
                {player1 ? "✦ Prêt" : "En attente..."}
              </p>
            </div>
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#0a1628] border border-[#785a28]/50 flex items-center justify-center">
          <Swords className="w-4 h-4 text-[#785a28]" />
        </div>

        <div
          className={`w-full sm:w-[230px] card-hextech corner-decor rounded-lg px-5 py-4 transition-all duration-300 ${
            player2
              ? "border-[#c8aa6e] shadow-[0_0_15px_rgba(200,170,110,0.1)]"
              : ""
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                player2
                  ? "bg-linear-to-b from-[#c89b3c] to-[#785a28] border-[#c8aa6e] text-[#010a13]"
                  : "bg-[#0a1628] border-[#785a28]/60 text-[#a09b8c]"
              }`}
            >
              {player2 ? (
                <Shield className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-display font-semibold text-[#f0e6d2]">
                {player2 ? player2.username : "Invocateur II"}
              </p>
              <p
                className={`text-[10px] uppercase tracking-[0.15em] font-semibold mt-0.5 ${
                  player2 ? "text-[#c8aa6e]" : "text-[#5b5a56]"
                }`}
              >
                {player2 ? "✦ Prêt" : "En attente..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-6 w-6 rounded-full border border-[#c8aa6e]/30 animate-scan-ring"></span>
          <Wifi className="relative w-4 h-4 text-[#c8aa6e]" />
        </div>
        <p className="text-[10px] text-[#785a28] font-medium uppercase tracking-[0.2em] font-display">
          Scannez vos badges
        </p>
      </div>

      <div className="mt-5">
        <button
          onClick={() => router.push("/game?mode=demo")}
          className="btn-lol-ghost px-4 py-1.5 rounded text-[9px]"
        >
          Test Game →
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#785a28]/30 to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen rift-bg flex items-center justify-center">
          <p className="text-[#a09b8c] font-display tracking-widest text-sm">
            Chargement...
          </p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
