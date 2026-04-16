"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ScoreCard from "@/components/ScoreCard";
import { generateAssessmentPDF } from "@/lib/pdf";

interface AssessmentResult {
  sessionId: string;
  overallScore: number;
  certificationScore?: number;
  certificationStatus?: "pass" | "fail";
  isCertification?: boolean;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];
  strengths: string[];
  improvements?: string[];
  weaknesses?: string[];
  areasForImprovement?: string[];
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

  const isCertification = assessment.isCertification || sessionMeta.mode === "certification";
  const certificationStatus = assessment.certificationStatus || (assessment.overallScore >= 70 ? "pass" : "fail");

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-sm font-semibold text-white">
          Demo<span className="text-blue-500">Coach</span>
          <span className="text-gray-500 font-normal ml-2">/ {isCertification ? "Certification Result" : "Assessment"}</span>
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
        {isCertification && (
          <div className={`max-w-4xl mx-auto mb-8 p-6 rounded-2xl border-2 ${
            certificationStatus === "pass"
              ? "bg-green-950/30 border-green-600 text-green-300"
              : "bg-red-950/30 border-red-600 text-red-300"
          }`}>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {certificationStatus === "pass" ? "✓ PASSED" : "✗ NOT PASSED"}
              </div>
              <div className="text-lg mb-3">
                Certification Score: <span className="font-bold">{assessment.certificationScore || assessment.overallScore}/100</span>
              </div>
              <p className="text-sm opacity-90">
                {certificationStatus === "pass"
                  ? `Congratulations! You have been certified in ${sessionMeta.topic}.`
                  : `You did not meet the passing threshold (70/100). Please review the feedback and try again.`}
              </p>
            </div>
          </div>
        )}

        <ScoreCard assessment={assessment} isCertification={isCertification} />

        {/* Actions */}
        <div className="max-w-4xl mx-auto mt-8 flex gap-4 justify-center pb-8">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            {isCertification ? "Take Another Exam" : "Practice Again"}
          </button>
          <button
            onClick={() => generateAssessmentPDF(assessment, sessionMeta)}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors border border-gray-700"
          >
            Download PDF Report
          </button>
        </div>
      </div>
    </main>
  );
}
