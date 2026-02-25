"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Swords,
  Timer,
  LogOut,
  Shield,
  Trash2,
  Pencil,
  X,
  Check,
  RefreshCw,
  Bell,
  CreditCard,
  UserPlus,
  Loader2,
} from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  rfidUuid: string | null;
  role: string;
  createdAt: string;
  wins: number;
  gamesPlayed: number;
  totalPoints: number;
  winRate: number;
}

interface AdminSession {
  id: number;
  player1Id: string;
  player2Id: string;
  player1Username: string;
  player2Username: string;
  player1Score: number;
  player2Score: number;
  winnerId: string | null;
  winnerUsername: string | null;
  durationSeconds: number;
  startedAt: string | null;
  endedAt: string | null;
}

interface Stats {
  totalUsers: number;
  totalSessions: number;
  avgDurationSeconds: number;
  todaySessions: number;
  weekSessions: number;
  newUsersThisWeek: number;
  [key: string]: unknown;
}

interface RegistrationRequest {
  id: number;
  rfidUuid: string;
  scanId: number | null;
  machineId: string | null;
  status: "pending" | "approved" | "rejected";
  createdUserId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

type Tab = "overview" | "users" | "sessions" | "requests";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m${sec > 0 ? ` ${sec}s` : ""}` : `${sec}s`;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtShortDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function timeAgo(d: string | null) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}j`;
}

function buildDailyCounts(sessions: AdminSession[], days: number) {
  const buckets: Record<string, number> = {};
  const labels: { key: string; short: string }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const short = d.toLocaleDateString("fr-FR", { weekday: "narrow" });
    buckets[key] = 0;
    labels.push({ key, short });
  }

  for (const s of sessions) {
    if (!s.endedAt) continue;
    const key = new Date(s.endedAt).toISOString().slice(0, 10);
    if (key in buckets) buckets[key]++;
  }

  return labels.map((l) => ({ label: l.short, count: buckets[l.key] }));
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [allSessions, setAllSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingRequests, setPendingRequests] = useState<RegistrationRequest[]>(
    [],
  );

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, usersRes, sessionsRes, requestsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/sessions"),
        fetch("/api/registration-requests"),
      ]);

      if (statsRes.status === 401 || usersRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const [statsData, usersData, sessionsData, requestsData] =
        await Promise.all([
          statsRes.json(),
          usersRes.json(),
          sessionsRes.json(),
          requestsRes.json(),
        ]);

      setStats(statsData.stats);
      setAllUsers(usersData.users || []);
      setAllSessions(sessionsData.sessions || []);
      setPendingRequests(requestsData.requests || []);
    } catch {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const eventSource = new EventSource(
      "/api/registration-requests/admin-stream",
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new-request" && data.request) {
          setPendingRequests((prev) => {
            if (prev.some((r) => r.id === data.request.id)) return prev;
            return [...prev, data.request];
          });
        }
      } catch {}
    };

    eventSource.onerror = () => {
      console.warn("Admin registration SSE lost, reconnecting...");
    };

    return () => eventSource.close();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-400 text-sm">Chargement…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-2">{error}</p>
          <button
            onClick={() => {
              setError("");
              setLoading(true);
              fetchAll();
            }}
            className="text-sm underline text-neutral-500"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "requests", label: "Demandes", badge: pendingRequests.length },
    { key: "users", label: `Joueurs (${allUsers.length})` },
    { key: "sessions", label: `Parties (${allSessions.length})` },
  ];

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="bg-white border-b border-neutral-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-neutral-400" />
            <span className="font-semibold text-sm tracking-tight">
              Riftbound Admin
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setLoading(true);
                fetchAll();
              }}
              className="p-2 text-neutral-400 hover:text-neutral-600 rounded transition"
              title="Rafraîchir"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-neutral-400 hover:text-neutral-600 text-xs px-3 py-2 transition"
            >
              ← Retour
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 px-3 py-2 text-xs transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-neutral-200 px-6">
        <div className="max-w-6xl mx-auto flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-3 text-sm border-b-2 transition flex items-center gap-1.5 ${
                tab === t.key
                  ? "border-neutral-900 text-neutral-900 font-medium"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {tab === "overview" && stats && (
          <OverviewTab
            stats={stats}
            users={allUsers}
            sessions={allSessions}
            onSwitchTab={setTab}
          />
        )}
        {tab === "requests" && (
          <RegistrationRequestsTab
            requests={pendingRequests}
            onRefresh={fetchAll}
          />
        )}
        {tab === "users" && <UsersTab users={allUsers} onRefresh={fetchAll} />}
        {tab === "sessions" && (
          <SessionsTab
            sessions={allSessions}
            users={allUsers}
            onRefresh={fetchAll}
          />
        )}
      </div>
    </main>
  );
}

function OverviewTab({
  stats,
  users,
  sessions,
  onSwitchTab,
}: {
  stats: Stats;
  users: AdminUser[];
  sessions: AdminSession[];
  onSwitchTab: (tab: Tab) => void;
}) {
  const players = users.filter((u) => u.role === "user");
  const topPlayers = [...players]
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
    .slice(0, 5);

  const recentSessions = [...sessions]
    .sort(
      (a, b) =>
        new Date(b.endedAt ?? 0).getTime() - new Date(a.endedAt ?? 0).getTime(),
    )
    .slice(0, 5);

  const daily = buildDailyCounts(sessions, 7);
  const maxBar = Math.max(...daily.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-px bg-neutral-200 rounded-lg overflow-hidden">
        {[
          {
            label: "Joueurs",
            value: stats.totalUsers,
            detail:
              stats.newUsersThisWeek > 0
                ? `+${stats.newUsersThisWeek} cette sem.`
                : null,
            detailColor: "text-emerald-600",
            valueColor: "",
          },
          {
            label: "Parties",
            value: stats.totalSessions,
            detail:
              stats.weekSessions > 0
                ? `${stats.weekSessions} cette sem.`
                : null,
            detailColor: "text-blue-500",
            valueColor: "",
          },
          {
            label: "Durée moy.",
            value: fmt(stats.avgDurationSeconds),
            detail: null,
            detailColor: "",
            valueColor: "",
          },
          {
            label: "Aujourd'hui",
            value: stats.todaySessions,
            detail: null,
            detailColor: "",
            valueColor: stats.todaySessions > 0 ? "text-emerald-600" : "",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-5">
            <p className="text-xs text-neutral-400 mb-1">{kpi.label}</p>
            <p
              className={`text-2xl font-semibold tabular-nums ${kpi.valueColor}`}
            >
              {kpi.value}
            </p>
            {kpi.detail && (
              <p
                className={`text-[11px] mt-1 ${kpi.detailColor || "text-neutral-400"}`}
              >
                {kpi.detail}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
            7 derniers jours
          </h3>
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-end gap-1.5" style={{ height: 120 }}>
              {daily.map((d, i) => {
                const h = d.count > 0 ? (d.count / maxBar) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    {d.count > 0 && (
                      <span className="text-[10px] text-neutral-500 mb-1 tabular-nums">
                        {d.count}
                      </span>
                    )}
                    <div
                      className={`w-full rounded-sm ${
                        d.count > 0 ? "bg-blue-500" : "bg-neutral-100"
                      }`}
                      style={{
                        height: d.count > 0 ? `${h}%` : 2,
                        minHeight: 2,
                      }}
                    />
                    <span className="text-[10px] text-neutral-400 mt-1.5 uppercase">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              Classement
            </h3>
            <button
              onClick={() => onSwitchTab("users")}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 underline-offset-2 hover:underline"
            >
              Tout voir
            </button>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
            {topPlayers.length === 0 ? (
              <p className="text-neutral-400 text-sm text-center py-8">
                Aucun joueur
              </p>
            ) : (
              topPlayers.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs w-4 tabular-nums text-right font-semibold ${
                        i === 0
                          ? "text-amber-500"
                          : i === 1
                            ? "text-neutral-400"
                            : i === 2
                              ? "text-amber-700"
                              : "text-neutral-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-neutral-800">
                      {p.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs tabular-nums">
                    <span className="text-emerald-600 font-medium">
                      {p.wins}v
                    </span>
                    <span className="text-neutral-400">{p.gamesPlayed}p</span>
                    <span
                      className={`${
                        p.winRate >= 60
                          ? "text-emerald-600"
                          : p.winRate >= 40
                            ? "text-amber-500"
                            : "text-neutral-400"
                      }`}
                    >
                      {p.winRate}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
            Dernières parties
          </h3>
          <button
            onClick={() => onSwitchTab("sessions")}
            className="text-[11px] text-neutral-400 hover:text-neutral-600 underline-offset-2 hover:underline"
          >
            Tout voir
          </button>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
          {recentSessions.length === 0 ? (
            <p className="text-neutral-400 text-sm text-center py-8">
              Aucune partie
            </p>
          ) : (
            recentSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <span
                    className={
                      s.winnerId === s.player1Id
                        ? "font-medium text-emerald-700"
                        : "text-neutral-500"
                    }
                  >
                    {s.player1Username}
                  </span>
                  <span className="text-neutral-800 font-mono text-xs font-medium tabular-nums">
                    {s.player1Score}–{s.player2Score}
                  </span>
                  <span
                    className={
                      s.winnerId === s.player2Id
                        ? "font-medium text-emerald-700"
                        : "text-neutral-500"
                    }
                  >
                    {s.player2Username}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-400 shrink-0">
                  <span>{fmt(s.durationSeconds)}</span>
                  <span className="tabular-nums">{timeAgo(s.endedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function UsersTab({
  users,
  onRefresh,
}: {
  users: AdminUser[];
  onRefresh: () => Promise<void>;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    username: "",
    email: "",
    role: "",
  });
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [sortBy, setSortBy] = useState<"name" | "wins" | "winRate" | "games">(
    "name",
  );

  const filtered = users
    .filter(
      (u) =>
        (u.username.toLowerCase().includes(search.toLowerCase()) ||
          (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
          u.id.includes(search)) &&
        (roleFilter === "all" || u.role === roleFilter),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "wins":
          return b.wins - a.wins;
        case "winRate":
          return b.winRate - a.winRate;
        case "games":
          return b.gamesPlayed - a.gamesPlayed;
        default:
          return a.username.localeCompare(b.username);
      }
    });

  const startEdit = (u: AdminUser) => {
    setEditId(u.id);
    setEditData({ username: u.username, email: u.email || "", role: u.role });
  };

  const saveEdit = async () => {
    if (!editId) return;
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, ...editData }),
    });
    if (res.ok) {
      setEditId(null);
      setMsg("Modifié");
      setTimeout(() => setMsg(""), 2000);
      await onRefresh();
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur et toutes ses parties ?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("Supprimé");
      setTimeout(() => setMsg(""), 2000);
      await onRefresh();
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-sm w-56 placeholder-neutral-300 focus:outline-none focus:border-neutral-400"
        />
        <select
          value={roleFilter}
          onChange={(e) =>
            setRoleFilter(e.target.value as "all" | "user" | "admin")
          }
          className="bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-600 focus:outline-none focus:border-neutral-400"
        >
          <option value="all">Tous les rôles</option>
          <option value="user">Joueurs</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "name" | "wins" | "winRate" | "games")
          }
          className="bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-600 focus:outline-none focus:border-neutral-400"
        >
          <option value="name">Tri : Nom</option>
          <option value="wins">Tri : Victoires ↓</option>
          <option value="winRate">Tri : Win% ↓</option>
          <option value="games">Tri : Parties ↓</option>
        </select>
        {(search || roleFilter !== "all" || sortBy !== "name") && (
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
              setSortBy("name");
            }}
            className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2 transition"
          >
            Réinitialiser
          </button>
        )}
        <span className="text-xs text-neutral-400 ml-auto">
          {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
        </span>
        {msg && (
          <span
            className={`text-xs ${msg === "Supprimé" ? "text-red-500" : "text-emerald-500"}`}
          >
            {msg}
          </span>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-neutral-400 border-b border-neutral-100">
              <th className="text-left py-2.5 px-4 font-medium">Nom</th>
              <th className="text-left py-2.5 px-3 font-medium">RFID</th>
              <th className="text-center py-2.5 px-3 font-medium">Rôle</th>
              <th className="text-center py-2.5 px-3 font-medium">Parties</th>
              <th className="text-center py-2.5 px-3 font-medium">Victoires</th>
              <th className="text-center py-2.5 px-3 font-medium">Win%</th>
              <th className="text-left py-2.5 px-3 font-medium">Inscrit</th>
              <th className="text-right py-2.5 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50/50">
                {editId === u.id ? (
                  <>
                    <td className="py-2 px-4">
                      <input
                        value={editData.username}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            username: e.target.value,
                          })
                        }
                        className="border border-neutral-300 rounded px-2 py-0.5 text-sm w-28 focus:outline-none focus:border-neutral-500"
                      />
                    </td>
                    <td className="py-2 px-3 text-neutral-400 text-xs font-mono">
                      {u.rfidUuid ? u.rfidUuid.slice(0, 8) : "—"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <select
                        value={editData.role}
                        onChange={(e) =>
                          setEditData({ ...editData, role: e.target.value })
                        }
                        className="border border-neutral-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:border-neutral-500"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="text-center py-2 px-3 text-neutral-500">
                      {u.gamesPlayed}
                    </td>
                    <td className="text-center py-2 px-3 text-neutral-500">
                      {u.wins}
                    </td>
                    <td className="text-center py-2 px-3 text-neutral-500">
                      {u.winRate}%
                    </td>
                    <td className="py-2 px-3 text-neutral-400 text-xs">
                      {fmtShortDate(u.createdAt)}
                    </td>
                    <td className="text-right py-2 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={saveEdit}
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-4 text-neutral-800">{u.username}</td>
                    <td className="py-2 px-3 text-neutral-400 text-xs font-mono">
                      {u.rfidUuid ? u.rfidUuid.slice(0, 8) : "—"}
                    </td>
                    <td className="text-center py-2 px-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.role === "admin"
                            ? "bg-indigo-50 text-indigo-600 font-medium"
                            : "bg-neutral-50 text-neutral-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="text-center py-2 px-3 text-neutral-500 tabular-nums">
                      {u.gamesPlayed}
                    </td>
                    <td className="text-center py-2 px-3 text-neutral-800 font-medium tabular-nums">
                      {u.wins}
                    </td>
                    <td
                      className={`text-center py-2 px-3 tabular-nums ${
                        u.winRate >= 60
                          ? "text-emerald-600 font-medium"
                          : u.winRate >= 40
                            ? "text-amber-500"
                            : "text-neutral-500"
                      }`}
                    >
                      {u.winRate}%
                    </td>
                    <td className="py-2 px-3 text-neutral-400 text-xs">
                      {fmtShortDate(u.createdAt)}
                    </td>
                    <td className="text-right py-2 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1 rounded hover:bg-neutral-100 text-neutral-300 hover:text-neutral-500"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={deleting === u.id}
                          className="p-1 rounded hover:bg-red-50 text-neutral-300 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-neutral-400 text-sm text-center py-8">
            Aucun résultat
          </p>
        )}
      </div>
    </div>
  );
}

function SessionsTab({
  sessions,
  users,
  onRefresh,
}: {
  sessions: AdminSession[];
  users: AdminUser[];
  onRefresh: () => Promise<void>;
}) {
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    player1Score: 0,
    player2Score: 0,
    winnerId: "",
    durationSeconds: 0,
  });
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const filtered = sessions.filter(
    (s) =>
      s.player1Username.toLowerCase().includes(search.toLowerCase()) ||
      s.player2Username.toLowerCase().includes(search.toLowerCase()) ||
      String(s.id).includes(search),
  );

  const startEdit = (s: AdminSession) => {
    setEditId(s.id);
    setEditData({
      player1Score: s.player1Score,
      player2Score: s.player2Score,
      winnerId: s.winnerId || "",
      durationSeconds: s.durationSeconds,
    });
  };

  const saveEdit = async () => {
    if (editId === null) return;
    const res = await fetch("/api/admin/sessions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, ...editData }),
    });
    if (res.ok) {
      setEditId(null);
      setMsg("Modifié");
      setTimeout(() => setMsg(""), 2000);
      await onRefresh();
    }
  };

  const deleteSession = async (id: number) => {
    if (!confirm("Supprimer cette partie ?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/sessions?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMsg("Supprimé");
      setTimeout(() => setMsg(""), 2000);
      await onRefresh();
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-sm w-64 placeholder-neutral-300 focus:outline-none focus:border-neutral-400"
        />
        {msg && (
          <span
            className={`text-xs ${msg === "Supprimé" ? "text-red-500" : "text-emerald-500"}`}
          >
            {msg}
          </span>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-neutral-400 border-b border-neutral-100">
              <th className="text-left py-2.5 px-4 font-medium">#</th>
              <th className="text-left py-2.5 px-3 font-medium">Joueur 1</th>
              <th className="text-center py-2.5 px-3 font-medium">Score</th>
              <th className="text-left py-2.5 px-3 font-medium">Joueur 2</th>
              <th className="text-left py-2.5 px-3 font-medium">Gagnant</th>
              <th className="text-right py-2.5 px-3 font-medium">Durée</th>
              <th className="text-right py-2.5 px-3 font-medium">Date</th>
              <th className="text-right py-2.5 px-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-neutral-50/50">
                {editId === s.id ? (
                  <>
                    <td className="py-2 px-4 text-neutral-400 text-xs">
                      {s.id}
                    </td>
                    <td className="py-2 px-3 text-neutral-800">
                      {s.player1Username}
                    </td>
                    <td className="text-center py-2 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={editData.player1Score}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              player1Score: parseInt(e.target.value) || 0,
                            })
                          }
                          className="border border-neutral-300 rounded px-1 py-0.5 text-sm w-12 text-center focus:outline-none focus:border-neutral-500"
                        />
                        <span className="text-neutral-300">–</span>
                        <input
                          type="number"
                          value={editData.player2Score}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              player2Score: parseInt(e.target.value) || 0,
                            })
                          }
                          className="border border-neutral-300 rounded px-1 py-0.5 text-sm w-12 text-center focus:outline-none focus:border-neutral-500"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-neutral-800">
                      {s.player2Username}
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={editData.winnerId}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            winnerId: e.target.value,
                          })
                        }
                        className="border border-neutral-300 rounded px-1 py-0.5 text-xs w-28 focus:outline-none focus:border-neutral-500"
                      >
                        <option value="">—</option>
                        <option value={s.player1Id}>{s.player1Username}</option>
                        <option value={s.player2Id}>{s.player2Username}</option>
                      </select>
                    </td>
                    <td className="text-right py-2 px-3">
                      <input
                        type="number"
                        value={editData.durationSeconds}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            durationSeconds: parseInt(e.target.value) || 0,
                          })
                        }
                        className="border border-neutral-300 rounded px-1 py-0.5 text-sm w-16 text-right focus:outline-none focus:border-neutral-500"
                      />
                    </td>
                    <td className="text-right py-2 px-3 text-neutral-400 text-xs">
                      {fmtDate(s.endedAt)}
                    </td>
                    <td className="text-right py-2 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={saveEdit}
                          className="p-1 rounded hover:bg-emerald-50 text-emerald-500 hover:text-emerald-600"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-1 rounded hover:bg-red-50 text-neutral-400 hover:text-red-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-4 text-neutral-300 text-xs tabular-nums">
                      {s.id}
                    </td>
                    <td className="py-2 px-3 text-neutral-800">
                      {s.player1Username}
                    </td>
                    <td className="text-center py-2 px-3 font-mono text-xs font-medium text-neutral-800 tabular-nums">
                      {s.player1Score}–{s.player2Score}
                    </td>
                    <td className="py-2 px-3 text-neutral-800">
                      {s.player2Username}
                    </td>
                    <td
                      className={`py-2 px-3 ${s.winnerUsername ? "text-emerald-600 font-medium" : "text-neutral-300"}`}
                    >
                      {s.winnerUsername ?? "—"}
                    </td>
                    <td className="text-right py-2 px-3 text-neutral-400 text-xs tabular-nums">
                      {fmt(s.durationSeconds)}
                    </td>
                    <td className="text-right py-2 px-3 text-neutral-400 text-xs">
                      {fmtDate(s.endedAt)}
                    </td>
                    <td className="text-right py-2 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => startEdit(s)}
                          className="p-1 rounded hover:bg-neutral-100 text-neutral-300 hover:text-neutral-500"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSession(s.id)}
                          disabled={deleting === s.id}
                          className="p-1 rounded hover:bg-red-50 text-neutral-300 hover:text-red-500 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-neutral-400 text-sm text-center py-8">
            Aucun résultat
          </p>
        )}
      </div>
    </div>
  );
}

function RegistrationRequestsTab({
  requests,
  onRefresh,
}: {
  requests: RegistrationRequest[];
  onRefresh: () => Promise<void>;
}) {
  const [formData, setFormData] = useState<
    Record<number, { username: string; email: string }>
  >({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<Record<number, string>>({});

  const getForm = (id: number) => formData[id] || { username: "", email: "" };

  const updateForm = (
    id: number,
    field: "username" | "email",
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [id]: { ...getForm(id), [field]: value },
    }));
  };

  const approve = async (requestId: number) => {
    const form = getForm(requestId);
    if (!form.username.trim()) {
      setError((prev) => ({ ...prev, [requestId]: "Le pseudo est requis" }));
      return;
    }

    setSubmitting(requestId);
    setError((prev) => {
      const copy = { ...prev };
      delete copy[requestId];
      return copy;
    });

    try {
      const res = await fetch("/api/registration-requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          username: form.username.trim(),
          email: form.email.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError((prev) => ({
          ...prev,
          [requestId]: data.error || "Erreur",
        }));
        return;
      }

      setMsg(`Compte "${form.username}" créé !`);
      setTimeout(() => setMsg(""), 3000);

      setFormData((prev) => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });

      await onRefresh();
    } catch {
      setError((prev) => ({
        ...prev,
        [requestId]: "Erreur réseau",
      }));
    } finally {
      setSubmitting(null);
    }
  };

  const reject = async (requestId: number) => {
    setSubmitting(requestId);

    try {
      const res = await fetch("/api/registration-requests/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        setMsg("Demande refusée");
        setTimeout(() => setMsg(""), 3000);
        await onRefresh();
      }
    } catch {
      console.error("Erreur rejet");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-medium text-neutral-600">
            Demandes d&apos;inscription en attente
          </h3>
          {requests.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </div>
        {msg && (
          <span className="text-xs text-emerald-500 font-medium">{msg}</span>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-lg p-8 text-center">
          <UserPlus className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
          <p className="text-neutral-400 text-sm">Aucune demande en attente</p>
          <p className="text-neutral-300 text-xs mt-1">
            Les nouvelles demandes apparaîtront ici en temps réel
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const form = getForm(req.id);
            const isSubmitting = submitting === req.id;
            const reqError = error[req.id];

            return (
              <div
                key={req.id}
                className="bg-white border border-neutral-200 rounded-lg p-4 animate-fadeIn"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">
                          Nouveau badge détecté
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-neutral-400 font-mono">
                            {req.rfidUuid}
                          </span>
                          {req.machineId && (
                            <span className="text-[10px] text-neutral-300 bg-neutral-50 px-1.5 py-0.5 rounded">
                              {req.machineId}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-300">
                            {timeAgo(req.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end gap-2 mt-3">
                      <div className="flex-1">
                        <label className="block text-[10px] text-neutral-400 uppercase tracking-wide mb-1 font-medium">
                          Pseudo
                        </label>
                        <input
                          type="text"
                          placeholder="Pseudo du joueur"
                          value={form.username}
                          onChange={(e) =>
                            updateForm(req.id, "username", e.target.value)
                          }
                          disabled={isSubmitting}
                          className="w-full border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm placeholder-neutral-300 focus:outline-none focus:border-neutral-400 disabled:opacity-50"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-neutral-400 uppercase tracking-wide mb-1 font-medium">
                          Email (optionnel)
                        </label>
                        <input
                          type="email"
                          placeholder="email@exemple.com"
                          value={form.email}
                          onChange={(e) =>
                            updateForm(req.id, "email", e.target.value)
                          }
                          disabled={isSubmitting}
                          className="w-full border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm placeholder-neutral-300 focus:outline-none focus:border-neutral-400 disabled:opacity-50"
                        />
                      </div>
                      <button
                        onClick={() => approve(req.id)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition disabled:opacity-50 shrink-0"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Créer
                      </button>
                      <button
                        onClick={() => reject(req.id)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 bg-neutral-100 hover:bg-red-50 text-neutral-400 hover:text-red-500 px-3 py-1.5 rounded-md text-sm transition disabled:opacity-50 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {reqError && (
                      <p className="text-xs text-red-500 mt-1.5">{reqError}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
