"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2, Ban, Shield } from "lucide-react";
import Link from "next/link";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfidParam = searchParams.get("rfid");
  const scanId = searchParams.get("scanId");

  const [formData, setFormData] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔒 PROTECTION : Si pas de RFID dans l'URL, on bloque l'affichage
  if (!rfidParam) {
    return (
      <div className="card-hextech corner-decor w-full max-w-sm p-6 text-center">
        <div className="mx-auto w-10 h-10 rounded-full bg-[#e84057]/10 border border-[#e84057]/30 flex items-center justify-center mb-3">
          <Ban className="w-5 h-5 text-[#e84057]" />
        </div>
        <h2 className="text-base font-display font-bold text-[#f0e6d2] mb-1">
          Accès refusé
        </h2>
        <p className="text-[#a09b8c] text-xs mb-4">
          Veuillez scanner un badge sur le lecteur pour commencer.
        </p>
        <Link
          href="/"
          className="btn-lol-ghost px-4 py-2 rounded-md inline-flex items-center justify-center gap-1.5 text-xs w-full"
        >
          <Shield className="w-3.5 h-3.5" /> Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  // --- Logique du formulaire (uniquement si RFID présent) ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, rfidUuid: rfidParam }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erreur création");

      const returnToLobby = searchParams.get("returnToLobby");
      const borne = searchParams.get("borne");

      if (returnToLobby) {
        const p1 = searchParams.get("p1");
        const s1 = searchParams.get("scan1");
        const slot = searchParams.get("slot");

        const params = new URLSearchParams();
        if (p1) params.set("p1", p1);
        if (s1) params.set("scan1", s1);
        if (borne) params.set("borne", borne);

        if (slot === "1") {
          params.set("p1", String(data.user.id));
          params.set("scan1", String(scanId));
        } else {
          params.set("p2", String(data.user.id));
          params.set("scan2", String(scanId));
        }

        router.push(`/?${params.toString()}`);
      } else {
        const gameParams = new URLSearchParams({
          userId: data.user.id,
          scanId: String(scanId),
        });
        if (borne) gameParams.set("borne", borne);
        router.push(`/game?${gameParams.toString()}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-hextech corner-decor w-full max-w-sm p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-[#c8aa6e] tracking-wider">
          Nouveau Badge
        </h2>
        <p className="text-[#a09b8c] text-xs mt-0.5">
          Finalisez l&apos;activation de votre carte.
        </p>
      </div>

      {/* Badge card */}
      <div className="mb-4 p-2.5 bg-[#0a1628] border border-[#785a28]/30 rounded-lg flex items-center gap-3">
        <div className="bg-[#091428] p-1.5 rounded-md border border-[#785a28]/20">
          <CreditCard className="text-[#c8aa6e] w-4 h-4" />
        </div>
        <div>
          <p className="text-[#f0e6d2] font-display font-bold text-xs tracking-wider">
            Badge physique
          </p>
          <p className="text-[#785a28] text-[10px] font-mono tracking-wider">
            {rfidParam}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-display text-[#a09b8c] mb-1 tracking-wider uppercase">
            Pseudo d&apos;invocateur
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 text-sm bg-[#0a1628] border border-[#785a28]/30 rounded-md text-[#f0e6d2] focus:border-[#c8aa6e] focus:ring-1 focus:ring-[#c8aa6e]/30 outline-none transition-all placeholder-[#5b5a56]"
            placeholder="Ex: PlayerOne"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-xs font-display text-[#a09b8c] mb-1 tracking-wider uppercase">
            Email
          </label>
          <input
            type="email"
            required
            className="w-full px-3 py-2 text-sm bg-[#0a1628] border border-[#785a28]/30 rounded-md text-[#f0e6d2] focus:border-[#c8aa6e] focus:ring-1 focus:ring-[#c8aa6e]/30 outline-none transition-all placeholder-[#5b5a56]"
            placeholder="email@exemple.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        {error && (
          <div className="p-2 bg-[#e84057]/10 text-[#e84057] text-xs rounded-md border border-[#e84057]/20">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-lol w-full py-2.5 rounded-md text-sm font-display font-semibold tracking-wider flex justify-center items-center gap-2 disabled:opacity-70 mt-1"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Activer & Jouer"
          )}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="w-[800px] h-[480px] rift-bg flex items-center justify-center p-3">
      <Suspense
        fallback={
          <p className="text-[#a09b8c] font-display tracking-widest text-sm">
            Chargement...
          </p>
        }
      >
        <RegisterContent />
      </Suspense>
    </div>
  );
}
