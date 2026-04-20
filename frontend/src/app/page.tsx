"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MODES = [
  {
    id: "demo",
    label: "Product Demo",
    description: "Practice demonstrating a product to a client or stakeholder",
    icon: "🖥",
  },
  {
    id: "conversation",
    label: "Professional Talk",
    description: "Have a natural professional conversation to improve fluency",
    icon: "💬",
  },
  {
    id: "pitch",
    label: "Elevator Pitch",
    description: "Practice pitching to executives or investors under pressure",
    icon: "🎯",
  },
  {
    id: "certification",
    label: "Get Certified",
    description: "Take a certification exam on a topic with an AI investigator",
    icon: "🏆",
  },
];

const VOICES = [
  { id: "alloy", label: "Alloy (Neutral)" },
  { id: "echo", label: "Echo (Male)" },
  { id: "shimmer", label: "Shimmer (Female)" },
  { id: "ash", label: "Ash (Male)" },
  { id: "coral", label: "Coral (Female)" },
];

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [mode, setMode] = useState("demo");
  const [voice, setVoice] = useState("alloy");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!userName.trim() || !userEmail.trim()) {
      setError("Please enter your name and email.");
      return;
    }

    if (!topic.trim()) {
      setError("Please enter a topic for your practice session.");
      return;
    }

    if (mode === "certification" && !dataSource.trim()) {
      setError("Please provide learning materials or data source for certification.");
      return;
    }

    setIsLoading(true);
    setError("");

    const params = new URLSearchParams({
      userName: userName.trim(),
      userEmail: userEmail.trim(),
      topic: topic.trim(),
      context: context.trim(),
      mode,
      voice,
    });

    if (mode === "certification" && dataSource.trim()) {
      params.append("dataSource", dataSource.trim());
    }

    router.push(`/session?${params.toString()}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Demo<span className="text-blue-500">Coach</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Practice product demonstrations and sharpen your communication
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="e.g., john@company.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What are you presenting?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., HRIS Leave Management Module, Slack Integrations, Our Q3 Roadmap..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional context{" "}
              <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe your audience, key points to cover, or any specific scenario..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Data Source - Only show for certification mode */}
          {mode === "certification" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Learning Materials / Data Source{" "}
                <span className="text-yellow-400">(required for certification)</span>
              </label>
              <textarea
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                placeholder="Paste the learning materials, documentation, or key information the candidate should know for certification..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                This will be used to validate the candidate's knowledge during the certification exam.
              </p>
            </div>
          )}

          {/* Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Practice Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === m.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                  }`}
                >
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <div className="text-sm font-medium text-white">{m.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voice */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Coach Voice
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            {isLoading ? "Starting..." : "Start Practice Session"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-600">
          Requires microphone access. Your conversations are analyzed for assessment.
        </p>
      </div>
    </main>
  );
}
