"use client";

import { useEffect, useRef } from "react";

interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface TranscriptPanelProps {
  transcript: TranscriptEntry[];
}

export default function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        Conversation will appear here...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 p-4">
      {transcript.map((entry, i) => (
        <div
          key={i}
          className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              entry.role === "user"
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-gray-800 text-gray-200 rounded-bl-md"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold uppercase opacity-60">
                {entry.role === "user" ? "You" : "Coach"}
              </span>
            </div>
            {entry.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
