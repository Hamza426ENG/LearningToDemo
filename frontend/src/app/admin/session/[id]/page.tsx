"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface Category {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface AssessmentData {
  overallScore: number;
  certificationScore?: number;
  certificationStatus?: "pass" | "fail";
  isCertification?: boolean;
  categories: Category[];
  strengths: string[];
  improvements?: string[];
  weaknesses?: string[];
  areasForImprovement?: string[];
  tips: string[];
  summary: string;
}

interface SessionLog {
  id: string;
  userName: string;
  userEmail: string;
  topic: string;
  mode: string;
  voice: string;
  context?: string;
  dataSource?: string;
  startedAt: string;
  endedAt?: string;
  duration?: string;
  score?: number;
  certificationStatus?: "pass" | "fail";
  status: "active" | "completed" | "abandoned";
  transcript?: TranscriptEntry[];
  assessment?: AssessmentData;
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = (score / max) * 100;
  const color =
    pct >= 80 ? "bg-green-400" : pct >= 60 ? "bg-yellow-400" : "bg-red-400";
  const textColor =
    pct >= 80
      ? "text-green-400"
      : pct >= 60
      ? "text-yellow-400"
      : "text-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${textColor} w-12 text-right`}>
        {score}/{max}
      </span>
    </div>
  );
}

export default function AdminSessionDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [log, setLog] = useState<SessionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLog() {
      try {
        const res = await fetch(`/api/logs/${id}`);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Session not found");
        const data = await res.json();
        setLog(data.log);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLog();
  }, [id, router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-gray-400 animate-pulse">Loading session...</div>
      </main>
    );
  }

  if (error || !log) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-400">{error || "Session not found"}</div>
        <button
          onClick={() => router.push("/admin")}
          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
        >
          Back to Dashboard
        </button>
      </main>
    );
  }

  const a = log.assessment;
  const isCert = a?.isCertification || log.mode === "certification";
  const improvementsList = a?.areasForImprovement || a?.improvements || [];
  const weaknessesList = a?.weaknesses || [];

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            &larr;
          </button>
          <h1 className="text-sm font-semibold text-white">
            Demo<span className="text-blue-500">Coach</span>
            <span className="text-gray-500 font-normal ml-2">
              / Admin / Session Detail
            </span>
          </h1>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            log.status === "completed"
              ? "bg-green-900/40 text-green-400"
              : log.status === "active"
              ? "bg-blue-900/40 text-blue-400"
              : "bg-gray-800 text-gray-500"
          }`}
        >
          {log.status}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Session Info */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Session Information
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Name</div>
              <div className="text-white font-medium">{log.userName}</div>
            </div>
            <div>
              <div className="text-gray-500">Email</div>
              <div className="text-gray-300">{log.userEmail}</div>
            </div>
            <div>
              <div className="text-gray-500">Topic</div>
              <div className="text-white font-medium">{log.topic}</div>
            </div>
            <div>
              <div className="text-gray-500">Mode</div>
              <div>
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
              </div>
            </div>
            <div>
              <div className="text-gray-500">Date</div>
              <div className="text-gray-300">
                {new Date(log.startedAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Duration</div>
              <div className="text-gray-300">{log.duration || "—"}</div>
            </div>
            <div>
              <div className="text-gray-500">Voice</div>
              <div className="text-gray-300 capitalize">{log.voice}</div>
            </div>
            <div>
              <div className="text-gray-500">Score</div>
              <div
                className={`font-bold ${
                  (log.score || 0) >= 80
                    ? "text-green-400"
                    : (log.score || 0) >= 60
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
              >
                {log.score != null ? log.score : "—"}
                {log.certificationStatus && (
                  <span
                    className={`ml-2 text-xs ${
                      log.certificationStatus === "pass"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {log.certificationStatus === "pass" ? "PASSED" : "FAILED"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Report */}
        {a && (
          <>
            {/* Overall + Summary */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {isCert ? "Certification Report" : "Assessment Report"}
              </h2>
              <div className="flex items-center gap-6 mb-4">
                <div
                  className={`text-5xl font-bold ${
                    a.overallScore >= 80
                      ? "text-green-400"
                      : a.overallScore >= 60
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {a.overallScore}
                </div>
                <div className="text-sm text-gray-400 leading-relaxed flex-1">
                  {a.summary}
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Category Breakdown
              </h2>
              <div className="space-y-4">
                {a.categories.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{cat.name}</span>
                    </div>
                    <ScoreBar score={cat.score} max={cat.maxScore} />
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {cat.feedback}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths / Weaknesses / Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-5">
                <h4 className="text-green-400 font-semibold mb-3 text-sm uppercase tracking-wide">
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {a.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-green-400 mt-0.5 shrink-0">+</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5">
                <h4 className="text-red-400 font-semibold mb-3 text-sm uppercase tracking-wide">
                  {isCert ? "Weaknesses" : "Areas to Improve"}
                </h4>
                <ul className="space-y-2">
                  {(weaknessesList.length > 0
                    ? weaknessesList
                    : improvementsList
                  ).map((s, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-red-400 mt-0.5 shrink-0">&rarr;</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-5">
                <h4 className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-wide">
                  {isCert ? "Next Steps" : "Pro Tips"}
                </h4>
                <ul className="space-y-2">
                  {a.tips.map((s, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-blue-400 mt-0.5 shrink-0">*</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Transcript */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Conversation Transcript
          </h2>
          {log.transcript && log.transcript.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {log.transcript.map((entry, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${
                    entry.role === "user" ? "" : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      entry.role === "user"
                        ? "bg-blue-900/50 text-blue-400"
                        : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {entry.role === "user" ? "U" : "AI"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-xs font-medium ${
                          entry.role === "user"
                            ? "text-blue-400"
                            : "text-gray-400"
                        }`}
                      >
                        {entry.role === "user" ? log.userName : "AI Coach"}
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              No transcript available for this session.
            </p>
          )}
        </div>

        {/* Back button */}
        <div className="flex justify-center pb-8">
          <button
            onClick={() => router.push("/admin")}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
