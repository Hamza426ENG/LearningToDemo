"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Avatar from "@/components/Avatar";
import TranscriptPanel from "@/components/TranscriptPanel";
import SessionControls from "@/components/SessionControls";
import { useRealtimeSession, TranscriptEntry } from "@/hooks/useRealtimeSession";
import { startSession, endSession } from "@/lib/api";

function SessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const userName = searchParams.get("userName") || "";
  const userEmail = searchParams.get("userEmail") || "";
  const topic = searchParams.get("topic") || "";
  const context = searchParams.get("context") || "";
  const mode = searchParams.get("mode") || "demo";
  const voice = searchParams.get("voice") || "alloy";
  const dataSource = searchParams.get("dataSource") || "";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState("00:00");
  const startedAtRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitialized = useRef(false);

  const { isConnected, transcript, avatarState, remoteStream, micEnabled, connect, disconnect } =
    useRealtimeSession();

  const initSession = useCallback(async () => {
    try {
      const data = await startSession({ topic, context, mode, voice, dataSource });
      setSessionId(data.sessionId);

      // Log session for admin tracking
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.sessionId,
          userName,
          userEmail,
          topic,
          mode,
          voice,
          context,
          dataSource,
        }),
      }).catch(() => {});

      // Connect to OpenAI Realtime via WebRTC
      const secret =
        typeof data.clientSecret === "object"
          ? data.clientSecret.value
          : data.clientSecret;
      await connect(secret);

      // Start timer
      startTimeRef.current = Date.now();
      startedAtRef.current = new Date().toISOString();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
        const secs = String(elapsed % 60).padStart(2, "0");
        setDuration(`${mins}:${secs}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to start session");
    }
  }, [topic, context, mode, voice, dataSource, connect]);

  useEffect(() => {
    if (!topic) {
      router.push("/");
      return;
    }
    // Guard against React Strict Mode double-mount in dev
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    initSession();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      disconnect();
      hasInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndSession = async () => {
    if (!sessionId) return;
    setIsEnding(true);

    if (timerRef.current) clearInterval(timerRef.current);
    disconnect();

    try {
      const result = await endSession(
        sessionId,
        { topic, context, mode, startedAt: startedAtRef.current },
        transcript
      );
      // Store assessment in sessionStorage and navigate
      sessionStorage.setItem(
        "assessment",
        JSON.stringify(result.assessment)
      );
      sessionStorage.setItem("sessionId", sessionId);
      sessionStorage.setItem("sessionTopic", topic);
      sessionStorage.setItem("sessionMode", mode);
      sessionStorage.setItem("sessionDuration", duration);
      sessionStorage.setItem(
        "sessionTranscript",
        JSON.stringify(transcript)
      );
      router.push("/assessment");
    } catch (err: any) {
      setError(err.message || "Failed to generate assessment");
      setIsEnding(false);
    }
  };

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-red-400 text-lg font-medium">Connection Error</div>
          <p className="text-gray-400 max-w-md">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setError("");
                initSession();
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-white">
            Demo<span className="text-blue-500">Coach</span>
          </h1>
        </div>
        <div className="text-sm text-gray-400">
          <span className="text-gray-500">Topic:</span>{" "}
          <span className="text-white">{topic}</span>
          <span className="mx-2 text-gray-700">|</span>
          <span className="capitalize text-gray-300">{mode}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Avatar */}
        <div className="w-1/2 flex flex-col items-center justify-center bg-gray-950 border-r border-gray-800">
          <Avatar state={avatarState} />
          {!isConnected && !isEnding && (
            <div className="mt-6 text-gray-500 text-sm animate-pulse">
              Connecting to your coach...
            </div>
          )}
        </div>

        {/* Right: Transcript */}
        <div className="w-1/2 flex flex-col bg-gray-900/30">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-400">
              Live Transcript
            </h2>
          </div>
          <TranscriptPanel transcript={transcript} />
        </div>
      </div>

      {/* Bottom Controls */}
      <SessionControls
        isConnected={isConnected}
        isLoading={isEnding}
        onEndSession={handleEndSession}
        duration={duration}
        micEnabled={micEnabled}
      />
    </main>
  );
}

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 animate-pulse">Loading session...</div>
        </main>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
