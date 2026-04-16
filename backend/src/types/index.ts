export interface Session {
  id: string;
  topic: string;
  context: string;
  dataSource?: string;
  mode: "demo" | "conversation" | "pitch" | "certification";
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
  isCertification?: boolean;
  certificationStatus?: "pass" | "fail";
  certificationScore?: number;
}

export interface AssessmentCategory {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}
