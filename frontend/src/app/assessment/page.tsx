"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScoreCard from "@/components/ScoreCard";

interface AssessmentResult {
  sessionId: string;
  overallScore: number;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];
  strengths: string[];
  improvements: string[];
  tips: string[];
  summary: string;
}

export default function AssessmentPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [sessionMeta, setSessionMeta] = useState({
    topic: "",
    mode: "",
    duration: "",
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("assessment");
    if (!stored) {
      router.push("/");
      return;
    }
    setAssessment(JSON.parse(stored));
    setSessionMeta({
      topic: sessionStorage.getItem("sessionTopic") || "",
      mode: sessionStorage.getItem("sessionMode") || "",
      duration: sessionStorage.getItem("sessionDuration") || "",
    });
  }, [router]);

  if (!assessment) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading assessment...</div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-white">
          Demo<span className="text-blue-500">Coach</span>
          <span className="text-gray-500 font-normal ml-2">/ Assessment</span>
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{sessionMeta.topic}</span>
          <span className="text-gray-700">|</span>
          <span className="capitalize">{sessionMeta.mode}</span>
          <span className="text-gray-700">|</span>
          <span>{sessionMeta.duration}</span>
        </div>
      </div>

      {/* Assessment Content */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <ScoreCard assessment={assessment} />

        {/* Actions */}
        <div className="max-w-4xl mx-auto mt-8 flex gap-4 justify-center pb-8">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Practice Again
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify(assessment, null, 2);
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `assessment-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700"
          >
            Download Report
          </button>
        </div>
      </div>
    </main>
  );
}
