"use client";

interface AssessmentCategory {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

interface AssessmentResult {
  sessionId: string;
  overallScore: number;
  categories: AssessmentCategory[];
  strengths: string[];
  improvements: string[];
  tips: string[];
  summary: string;
}

interface ScoreCardProps {
  assessment: AssessmentResult;
}

function getScoreColor(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 80) return "text-green-400 bg-green-400";
  if (pct >= 60) return "text-yellow-400 bg-yellow-400";
  return "text-red-400 bg-red-400";
}

function getOverallGrade(score: number) {
  if (score >= 90) return { grade: "A+", color: "text-green-400", label: "Excellent" };
  if (score >= 80) return { grade: "A", color: "text-green-400", label: "Great" };
  if (score >= 70) return { grade: "B", color: "text-blue-400", label: "Good" };
  if (score >= 60) return { grade: "C", color: "text-yellow-400", label: "Fair" };
  return { grade: "D", color: "text-red-400", label: "Needs Work" };
}

export default function ScoreCard({ assessment }: ScoreCardProps) {
  const overall = getOverallGrade(assessment.overallScore);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Overall Score */}
      <div className="text-center py-8 bg-gray-900/50 rounded-2xl border border-gray-800">
        <div className={`text-7xl font-bold ${overall.color}`}>
          {assessment.overallScore}
        </div>
        <div className="text-gray-400 mt-2 text-lg">
          Grade: <span className={`font-bold ${overall.color}`}>{overall.grade}</span>{" "}
          — {overall.label}
        </div>
        <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm leading-relaxed px-4">
          {assessment.summary}
        </p>
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.categories.map((cat) => {
            const colors = getScoreColor(cat.score, cat.maxScore);
            const pct = (cat.score / cat.maxScore) * 100;
            return (
              <div
                key={cat.name}
                className="bg-gray-900/50 rounded-xl p-4 border border-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">{cat.name}</span>
                  <span className={`text-sm font-bold ${colors.split(" ")[0]}`}>
                    {cat.score}/{cat.maxScore}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colors.split(" ")[1]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{cat.feedback}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths, Improvements, Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-950/30 border border-green-900/50 rounded-xl p-5">
          <h4 className="text-green-400 font-semibold mb-3 text-sm uppercase tracking-wide">
            Strengths
          </h4>
          <ul className="space-y-2">
            {assessment.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5">
          <h4 className="text-red-400 font-semibold mb-3 text-sm uppercase tracking-wide">
            Areas to Improve
          </h4>
          <ul className="space-y-2">
            {assessment.improvements.map((s, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-red-400 mt-0.5">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-950/30 border border-blue-900/50 rounded-xl p-5">
          <h4 className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-wide">
            Pro Tips
          </h4>
          <ul className="space-y-2">
            {assessment.tips.map((s, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <span className="text-blue-400 mt-0.5">★</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
