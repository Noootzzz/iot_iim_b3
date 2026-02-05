"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2, Ban, ArrowLeft } from "lucide-react";
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
      <div className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-2xl p-8 text-center">
        <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Ban className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
        <p className="text-gray-500 mb-6">
          Vous ne pouvez pas créer de compte manuellement. Veuillez scanner un
          badge sur le lecteur pour commencer.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
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

      if (returnToLobby) {
        // Mode Lobby multi-joueur : on retourne à l'accueil avec les états préservés
        const p1 = searchParams.get("p1");
        const s1 = searchParams.get("scan1");
        const slot = searchParams.get("slot"); // "1" ou "2"

        const params = new URLSearchParams();
        if (p1) params.set("p1", p1);
        if (s1) params.set("scan1", s1);

        // On insère le nouveau joueur dans le slot approprié
        if (slot === "1") {
          params.set("p1", String(data.user.id));
          params.set("scan1", String(scanId));
        } else {
          params.set("p2", String(data.user.id));
          params.set("scan2", String(scanId));
        }

        router.push(`/?${params.toString()}`);
      } else {
        // Mode legacy (juste au cas où)
        router.push(`/game?userId=${data.user.id}&scanId=${scanId}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 shadow-xl rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Nouveau Badge Détecté
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Finalisez l'activation de votre carte.
        </p>
      </div>

      {/* Carte visuelle du badge détecté */}
      <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-4">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <CreditCard className="text-indigo-600 w-6 h-6" />
        </div>
        <div>
          <p className="text-indigo-900 font-bold text-sm">
            Badge physique #ID
          </p>
          <p className="text-indigo-600/80 text-xs font-mono tracking-wider">
            {rfidParam}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Choisissez un Pseudo
          </label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
            placeholder="Ex: PlayerOne"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de récupération
          </label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-gray-400"
            placeholder="email@exemple.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm disabled:opacity-70 mt-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Associer le badge et Jouer"
          )}
        </button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-gray-500">Chargement...</div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
