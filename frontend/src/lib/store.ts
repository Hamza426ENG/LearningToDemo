// In-memory session log store.
// Persists across warm serverless invocations on the same instance.
// For production persistence, swap for a database (Vercel KV, Postgres, etc.).

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface AssessmentData {
  overallScore: number;
  certificationScore?: number;
  certificationStatus?: "pass" | "fail";
  isCertification?: boolean;
  categories: { name: string; score: number; maxScore: number; feedback: string }[];
  strengths: string[];
  improvements?: string[];
  weaknesses?: string[];
  areasForImprovement?: string[];
  tips: string[];
  summary: string;
}

export interface SessionLog {
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

const logs = new Map<string, SessionLog>();

export function addLog(log: SessionLog) {
  logs.set(log.id, log);
}

export function getLog(id: string) {
  return logs.get(id);
}

export function updateLog(id: string, data: Partial<SessionLog>) {
  const log = logs.get(id);
  if (!log) return null;
  const updated = { ...log, ...data };
  logs.set(id, updated);
  return updated;
}

export function getAllLogs(): SessionLog[] {
  return Array.from(logs.values()).sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}
