"use client";

interface SessionControlsProps {
  isConnected: boolean;
  isLoading: boolean;
  onEndSession: () => void;
  duration: string;
}

export default function SessionControls({
  isConnected,
  isLoading,
  onEndSession,
  duration,
}: SessionControlsProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-t border-gray-800">
      <div className="flex items-center gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-400">
          {isConnected ? "Session Active" : "Disconnected"}
        </span>
      </div>

      <div className="text-lg font-mono text-gray-300">{duration}</div>

      <button
        onClick={onEndSession}
        disabled={isLoading}
        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors text-sm"
      >
        {isLoading ? "Analyzing..." : "End & Assess"}
      </button>
    </div>
  );
}
