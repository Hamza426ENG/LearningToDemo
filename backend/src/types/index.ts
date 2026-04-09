export interface Session {
  id: string;
  topic: string;
  context: string;
  mode: "demo" | "conversation" | "pitch";
  transcript: TranscriptEntry[];
  startedAt: string;
  endedAt?: string;
}

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface AssessmentResult {
  sessionId: string;
  overallScore: number;
  categories: AssessmentCategory[];
  strengths: string[];
  improvements: string[];
  tips: string[];
  summary: string;
}

export interface AssessmentCategory {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}
