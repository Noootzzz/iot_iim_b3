"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Swords,
  Trophy,
  Timer,
  LogOut,
  Crown,
  Shield,
  Trash2,
  Pencil,
  X,
  Check,
  TrendingUp,
  Target,
  Zap,
  CalendarDays,
  UserPlus,
  BarChart3,
  Hash,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────
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

interface DayCount {
  day: string;
  count: number;
}

interface Stats {
  totalUsers: number;
  totalSessions: number;
  avgDurationSeconds: number;
  totalPoints: number;
  avgScorePerPlayer: number;
  longestGameSeconds: number;
  shortestGameSeconds: number;
  highestScore: number;
  closestGameDiff: number;
  todaySessions: number;
  weekSessions: number;
  newUsersThisWeek: number;
  sessionsPerDay: DayCount[];
}

type Tab = "stats" | "users" | "sessions";

// ─── Helpers ─────────────────────────────────────────────────────
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
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

// ─── Main Component ─────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [allSessions, setAllSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, usersRes, sessionsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/sessions"),
      ]);

      if (statsRes.status === 401 || usersRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      const [statsData, usersData, sessionsData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        sessionsRes.json(),
      ]);

      setStats(statsData.stats);
      setAllUsers(usersData.users || []);
      setAllSessions(sessionsData.sessions || []);
    } catch {
      setError("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Administration
              </h1>
              <p className="text-xs text-slate-400 -mt-0.5">Tableau de bord</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-slate-500 hover:text-slate-700 text-sm transition"
            >
              ← Retour au jeu
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {[
            { key: "stats" as Tab, label: "Statistiques", icon: BarChart3 },
            { key: "users" as Tab, label: "Joueurs", icon: Users },
            { key: "sessions" as Tab, label: "Parties", icon: Swords },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                tab === key
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {tab === "stats" && stats && (
          <StatsTab
            stats={stats}
            users={allUsers}
            sessions={allSessions}
            onSwitchTab={setTab}
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

// ═══════════════════════════════════════════════════════════════
// ─── STATS TAB ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function StatsTab({
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
  const topPlayers = [...users]
    .filter((u) => u.role === "user")
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = [...sessions]
    .filter((s) => s.endedAt && s.endedAt.slice(0, 10) === todayStr)
    .sort(
      (a, b) =>
        new Date(b.endedAt ?? 0).getTime() - new Date(a.endedAt ?? 0).getTime(),
    );

  return (
    <div className="space-y-6">
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          color="blue"
          label="Joueurs"
          value={stats.totalUsers}
          onClick={() => onSwitchTab("users")}
        />
        <KpiCard
          icon={Swords}
          color="purple"
          label="Parties"
          value={stats.totalSessions}
          onClick={() => onSwitchTab("sessions")}
        />
        <KpiCard
          icon={Timer}
          color="green"
          label="Durée moy."
          value={fmt(stats.avgDurationSeconds)}
        />
        <KpiCard
          icon={Target}
          color="yellow"
          label="Points totaux"
          value={stats.totalPoints.toLocaleString()}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          color="cyan"
          label="Score moy./joueur"
          value={stats.avgScorePerPlayer}
        />
        <KpiCard
          icon={Zap}
          color="red"
          label="Plus haut score"
          value={stats.highestScore}
        />
        <KpiCard
          icon={CalendarDays}
          color="orange"
          label="Parties aujourd'hui"
          value={stats.todaySessions}
          onClick={() => onSwitchTab("sessions")}
        />
        <KpiCard
          icon={UserPlus}
          color="emerald"
          label="Nouveaux (semaine)"
          value={stats.newUsersThisWeek}
        />
      </div>

      {/* KPI Row 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={Timer}
          color="teal"
          label="Partie la + longue"
          value={fmt(stats.longestGameSeconds)}
        />
        <KpiCard
          icon={Zap}
          color="pink"
          label="Partie la + courte"
          value={fmt(stats.shortestGameSeconds)}
        />
        <KpiCard
          icon={Swords}
          color="indigo"
          label="Parties (semaine)"
          value={stats.weekSessions}
          onClick={() => onSwitchTab("sessions")}
        />
        <KpiCard
          icon={Target}
          color="amber"
          label="Écart min."
          value={`${stats.closestGameDiff} pts`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classement */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-amber-500 w-5 h-5" />
            <h2 className="font-semibold text-base text-slate-800">
              Classement Joueurs
            </h2>
          </div>
          {topPlayers.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune donnée</p>
          ) : (
            <ol className="space-y-0.5">
              {topPlayers.map((p, i) => {
                const barWidth =
                  topPlayers[0].wins > 0
                    ? (p.wins / topPlayers[0].wins) * 100
                    : 0;
                return (
                  <li
                    key={p.id}
                    className="relative flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition group"
                  >
                    {/* Win bar background */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg opacity-[0.07] transition-all"
                      style={{
                        width: `${barWidth}%`,
                        background:
                          i === 0
                            ? "linear-gradient(90deg, #f59e0b, #d97706)"
                            : i === 1
                              ? "linear-gradient(90deg, #94a3b8, #64748b)"
                              : i === 2
                                ? "linear-gradient(90deg, #f97316, #ea580c)"
                                : "linear-gradient(90deg, #6366f1, #4f46e5)",
                      }}
                    />
                    <div className="flex items-center gap-3 relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? "bg-amber-100 text-amber-600"
                            : i === 1
                              ? "bg-slate-200 text-slate-500"
                              : i === 2
                                ? "bg-orange-100 text-orange-600"
                                : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {i === 0 ? <Crown className="w-3.5 h-3.5" /> : i + 1}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          i < 3 ? "text-slate-800" : "text-slate-600"
                        }`}
                      >
                        {p.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs relative z-10">
                      <span className="text-emerald-600 font-semibold">
                        {p.wins} victoire{p.wins !== 1 ? "s" : ""}
                      </span>
                      <span className="text-slate-400">
                        {p.gamesPlayed} partie{p.gamesPlayed !== 1 ? "s" : ""}
                      </span>
                      <span className="text-slate-400">
                        {p.totalPoints} points cumulés
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          p.winRate >= 60
                            ? "bg-emerald-50 text-emerald-600"
                            : p.winRate >= 40
                              ? "bg-amber-50 text-amber-600"
                              : "bg-red-50 text-red-600"
                        }`}
                      >
                        {p.winRate}% taux de victoire
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Parties du jour */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-orange-500 w-5 h-5" />
              <h2 className="font-semibold text-base text-slate-800">
                Parties du jour
              </h2>
            </div>
            <span className="text-slate-400 text-sm">
              {todaySessions.length} partie
              {todaySessions.length !== 1 ? "s" : ""}
            </span>
          </div>
          {todaySessions.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">
              Aucune partie aujourd&apos;hui
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
              {todaySessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 hover:bg-slate-100 transition space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {s.player1Username}
                      </span>
                      <span className="text-indigo-600 font-bold text-sm">
                        {s.player1Score} – {s.player2Score}
                      </span>
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {s.player2Username}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      {s.winnerUsername && (
                        <span className="text-emerald-600">
                          <Trophy className="w-3 h-3 inline mr-0.5" />
                          {s.winnerUsername}
                        </span>
                      )}
                      <span>{fmt(s.durationSeconds)}</span>
                    </div>
                    <span>
                      {s.endedAt
                        ? new Date(s.endedAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────
const colorMap: Record<string, string> = {
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  green: "bg-emerald-50 text-emerald-600",
  yellow: "bg-amber-50 text-amber-600",
  cyan: "bg-cyan-50 text-cyan-600",
  red: "bg-red-50 text-red-600",
  orange: "bg-orange-50 text-orange-600",
  emerald: "bg-emerald-50 text-emerald-600",
  teal: "bg-teal-50 text-teal-600",
  pink: "bg-pink-50 text-pink-600",
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
};

function KpiCard({
  icon: Icon,
  color,
  label,
  value,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
  value: string | number;
  onClick?: () => void;
}) {
  const [bgClass, textClass] = (colorMap[color] || colorMap.blue).split(" ");
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm transition ${
        onClick ? "cursor-pointer hover:shadow-md hover:border-slate-300" : ""
      }`}
      onClick={onClick}
    >
      <div className={`${bgClass} p-2.5 rounded-lg`}>
        <Icon className={`${textClass} w-5 h-5`} />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── USERS TAB ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
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

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.id.includes(search),
  );

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
      setMsg("Utilisateur modifié ✓");
      setTimeout(() => setMsg(""), 2000);
      await onRefresh();
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur et toutes ses parties ?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMsg("Utilisateur supprimé ✓");
      setTimeout(() => setMsg(""), 2000);
      await onRefresh();
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold flex items-center gap-2 text-slate-800">
          <Users className="w-5 h-5 text-blue-500" />
          Gestion des joueurs
          <span className="text-slate-400 text-sm font-normal">
            ({users.length})
          </span>
        </h2>
        {msg && <span className="text-emerald-600 text-sm">{msg}</span>}
      </div>

      <input
        type="text"
        placeholder="Rechercher (nom, email, id)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-80 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
      />

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase border-b border-slate-100">
              <th className="text-left py-3 px-4">Joueur</th>
              <th className="text-left py-3 px-2">Email</th>
              <th className="text-left py-3 px-2">RFID</th>
              <th className="text-center py-3 px-2">Rôle</th>
              <th className="text-center py-3 px-2">Parties</th>
              <th className="text-center py-3 px-2">Victoires</th>
              <th className="text-center py-3 px-2">Win%</th>
              <th className="text-center py-3 px-2">Points</th>
              <th className="text-left py-3 px-2">Inscrit le</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
              >
                {editId === u.id ? (
                  <>
                    <td className="py-2 px-4">
                      <input
                        value={editData.username}
                        onChange={(e) =>
                          setEditData({ ...editData, username: e.target.value })
                        }
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-sm w-28 focus:outline-none focus:border-indigo-400"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        value={editData.email}
                        onChange={(e) =>
                          setEditData({ ...editData, email: e.target.value })
                        }
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-sm w-36 focus:outline-none focus:border-indigo-400"
                      />
                    </td>
                    <td className="py-2 px-2 text-slate-400 text-xs font-mono">
                      {u.rfidUuid ? u.rfidUuid.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <select
                        value={editData.role}
                        onChange={(e) =>
                          setEditData({ ...editData, role: e.target.value })
                        }
                        className="bg-white border border-slate-300 rounded px-1 py-1 text-xs focus:outline-none focus:border-indigo-400"
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="text-center py-2 px-2 text-slate-600">
                      {u.gamesPlayed}
                    </td>
                    <td className="text-center py-2 px-2 text-slate-600">
                      {u.wins}
                    </td>
                    <td className="text-center py-2 px-2 text-slate-600">
                      {u.winRate}%
                    </td>
                    <td className="text-center py-2 px-2 text-slate-600">
                      {u.totalPoints}
                    </td>
                    <td className="py-2 px-2 text-slate-400 text-xs">
                      {fmtShortDate(u.createdAt)}
                    </td>
                    <td className="text-right py-2 px-4 flex gap-1 justify-end">
                      <button
                        onClick={saveEdit}
                        className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-4 font-medium text-slate-800">
                      {u.username}
                    </td>
                    <td className="py-2 px-2 text-slate-400 text-xs">
                      {u.email || "—"}
                    </td>
                    <td className="py-2 px-2 text-slate-400 text-xs font-mono">
                      {u.rfidUuid ? u.rfidUuid.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="text-center py-2 px-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          u.role === "admin"
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="text-center py-2 px-2 text-slate-600">
                      {u.gamesPlayed}
                    </td>
                    <td className="text-center py-2 px-2 text-emerald-600 font-medium">
                      {u.wins}
                    </td>
                    <td className="text-center py-2 px-2 text-slate-600">
                      {u.winRate}%
                    </td>
                    <td className="text-center py-2 px-2 text-amber-600 font-medium">
                      {u.totalPoints}
                    </td>
                    <td className="py-2 px-2 text-slate-400 text-xs">
                      {fmtShortDate(u.createdAt)}
                    </td>
                    <td className="text-right py-2 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={deleting === u.id}
                          className="p-1.5 bg-slate-100 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 disabled:opacity-50"
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
          <p className="text-slate-400 text-sm text-center py-6">
            Aucun joueur trouvé
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── SESSIONS TAB ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
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
      setMsg("Partie modifiée ✓");
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
      setMsg("Partie supprimée ✓");
      setTimeout(() => setMsg(""), 2000);
      await onRefresh();
    }
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold flex items-center gap-2 text-slate-800">
          <Swords className="w-5 h-5 text-purple-500" />
          Gestion des parties
          <span className="text-slate-400 text-sm font-normal">
            ({sessions.length})
          </span>
        </h2>
        {msg && <span className="text-emerald-600 text-sm">{msg}</span>}
      </div>

      <input
        type="text"
        placeholder="Rechercher (joueur, id)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full sm:w-80 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-sm"
      />

      <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs uppercase border-b border-slate-100">
              <th className="text-left py-3 px-4">
                <Hash className="w-3.5 h-3.5 inline" />
              </th>
              <th className="text-left py-3 px-2">Joueur 1</th>
              <th className="text-center py-3 px-2">Score</th>
              <th className="text-left py-3 px-2">Joueur 2</th>
              <th className="text-left py-3 px-2">Gagnant</th>
              <th className="text-right py-3 px-2">Durée</th>
              <th className="text-right py-3 px-2">Date</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
              >
                {editId === s.id ? (
                  <>
                    <td className="py-2 px-4 text-slate-400 text-xs">
                      #{s.id}
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-800">
                      {s.player1Username}
                    </td>
                    <td className="text-center py-2 px-2">
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
                          className="bg-white border border-slate-300 rounded px-1 py-0.5 text-sm w-12 text-center focus:outline-none focus:border-indigo-400"
                        />
                        <span className="text-slate-400">–</span>
                        <input
                          type="number"
                          value={editData.player2Score}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              player2Score: parseInt(e.target.value) || 0,
                            })
                          }
                          className="bg-white border border-slate-300 rounded px-1 py-0.5 text-sm w-12 text-center focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-800">
                      {s.player2Username}
                    </td>
                    <td className="py-2 px-2">
                      <select
                        value={editData.winnerId}
                        onChange={(e) =>
                          setEditData({ ...editData, winnerId: e.target.value })
                        }
                        className="bg-white border border-slate-300 rounded px-1 py-1 text-xs w-28 focus:outline-none focus:border-indigo-400"
                      >
                        <option value="">Aucun</option>
                        <option value={s.player1Id}>{s.player1Username}</option>
                        <option value={s.player2Id}>{s.player2Username}</option>
                      </select>
                    </td>
                    <td className="text-right py-2 px-2">
                      <input
                        type="number"
                        value={editData.durationSeconds}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            durationSeconds: parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-white border border-slate-300 rounded px-1 py-0.5 text-sm w-16 text-right focus:outline-none focus:border-indigo-400"
                      />
                    </td>
                    <td className="text-right py-2 px-2 text-slate-400 text-xs">
                      {fmtDate(s.endedAt)}
                    </td>
                    <td className="text-right py-2 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={saveEdit}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-4 text-slate-400 text-xs">
                      #{s.id}
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-800">
                      {s.player1Username}
                    </td>
                    <td className="text-center py-2 px-2 font-bold text-indigo-600">
                      {s.player1Score} – {s.player2Score}
                    </td>
                    <td className="py-2 px-2 font-medium text-slate-800">
                      {s.player2Username}
                    </td>
                    <td className="py-2 px-2 text-emerald-600">
                      {s.winnerUsername ?? "—"}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-400">
                      {fmt(s.durationSeconds)}
                    </td>
                    <td className="text-right py-2 px-2 text-slate-400 text-xs">
                      {fmtDate(s.endedAt)}
                    </td>
                    <td className="text-right py-2 px-4">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => startEdit(s)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSession(s.id)}
                          disabled={deleting === s.id}
                          className="p-1.5 bg-slate-100 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 disabled:opacity-50"
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
          <p className="text-slate-400 text-sm text-center py-6">
            Aucune partie trouvée
          </p>
        )}
      </div>
    </div>
  );
}
