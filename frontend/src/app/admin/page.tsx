"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface SessionLog {
  id: string;
  userName: string;
  userEmail: string;
  topic: string;
  mode: string;
  voice: string;
  startedAt: string;
  endedAt?: string;
  duration?: string;
  score?: number;
  certificationStatus?: "pass" | "fail";
  status: "active" | "completed" | "abandoned";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data = await res.json();
      setLogs(data.logs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.topic.toLowerCase().includes(search.toLowerCase()) ||
      l.mode.toLowerCase().includes(search.toLowerCase())
  );

  const totalSessions = logs.length;
  const completedSessions = logs.filter((l) => l.status === "completed").length;
  const avgScore =
    completedSessions > 0
      ? Math.round(
          logs
            .filter((l) => l.score != null)
            .reduce((sum, l) => sum + (l.score || 0), 0) /
            logs.filter((l) => l.score != null).length
        )
      : 0;
  const certPassed = logs.filter((l) => l.certificationStatus === "pass").length;

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-gray-400 animate-pulse">Loading logs...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-white">
            Demo<span className="text-blue-500">Coach</span>
            <span className="text-gray-500 font-normal ml-2">/ Admin Dashboard</span>
          </h1>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {error && (
          <div className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalSessions}</div>
            <div className="text-xs text-gray-500 mt-1">Total Sessions</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{completedSessions}</div>
            <div className="text-xs text-gray-500 mt-1">Completed</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{avgScore || "—"}</div>
            <div className="text-xs text-gray-500 mt-1">Avg Score</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{certPassed}</div>
            <div className="text-xs text-gray-500 mt-1">Certifications Passed</div>
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, topic, or mode..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-900/80 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {logs.length === 0
                      ? "No sessions recorded yet."
                      : "No results match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-900/40 cursor-pointer"
                    onClick={() => router.push(`/admin/session/${log.id}`)}
                  >
                    <td className="px-4 py-3 text-white font-medium">{log.userName}</td>
                    <td className="px-4 py-3 text-gray-400">{log.userEmail}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate">
                      {log.topic}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.mode === "certification"
                            ? "bg-yellow-900/40 text-yellow-400"
                            : log.mode === "demo"
                            ? "bg-blue-900/40 text-blue-400"
                            : log.mode === "pitch"
                            ? "bg-purple-900/40 text-purple-400"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {log.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(log.startedAt).toLocaleDateString()}{" "}
                      <span className="text-gray-600">
                        {new Date(log.startedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{log.duration || "—"}</td>
                    <td className="px-4 py-3">
                      {log.score != null ? (
                        <span
                          className={`font-bold ${
                            log.score >= 80
                              ? "text-green-400"
                              : log.score >= 60
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                        >
                          {log.score}
                          {log.certificationStatus && (
                            <span
                              className={`ml-1 text-xs ${
                                log.certificationStatus === "pass"
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {log.certificationStatus === "pass" ? "PASS" : "FAIL"}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === "completed"
                            ? "bg-green-900/40 text-green-400"
                            : log.status === "active"
                            ? "bg-blue-900/40 text-blue-400"
                            : "bg-gray-800 text-gray-500"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
