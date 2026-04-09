"use client";

interface AvatarProps {
  state: "idle" | "listening" | "speaking" | "thinking";
}

export default function Avatar({ state }: AvatarProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Outer pulse ring */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 ${
            state === "speaking"
              ? "animate-ping bg-blue-400/30 scale-125"
              : state === "listening"
              ? "animate-pulse bg-green-400/20 scale-110"
              : state === "thinking"
              ? "animate-pulse bg-yellow-400/20 scale-110"
              : ""
          }`}
        />

        {/* Avatar container */}
        <div
          className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${
            state === "speaking"
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30"
              : state === "listening"
              ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30"
              : state === "thinking"
              ? "bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30"
              : "bg-gradient-to-br from-gray-600 to-gray-700 shadow-lg shadow-gray-500/20"
          }`}
        >
          {/* Face */}
          <div className="flex flex-col items-center gap-3">
            {/* Eyes */}
            <div className="flex gap-6">
              <div
                className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                  state === "thinking" ? "animate-bounce" : ""
                } ${state === "listening" ? "h-5" : ""}`}
              />
              <div
                className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                  state === "thinking" ? "animate-bounce [animation-delay:0.1s]" : ""
                } ${state === "listening" ? "h-5" : ""}`}
              />
            </div>

            {/* Mouth */}
            <div
              className={`bg-white/90 rounded-full transition-all duration-200 ${
                state === "speaking"
                  ? "w-8 h-6 animate-[mouth_0.3s_ease-in-out_infinite]"
                  : state === "thinking"
                  ? "w-6 h-3"
                  : "w-8 h-2"
              }`}
            />
          </div>

          {/* Sound waves for speaking */}
          {state === "speaking" && (
            <div className="absolute -right-2 flex flex-col gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white/60 rounded-full animate-pulse"
                  style={{
                    height: `${8 + i * 4}px`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* State label */}
      <div
        className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-300 ${
          state === "speaking"
            ? "bg-blue-500/10 text-blue-400"
            : state === "listening"
            ? "bg-green-500/10 text-green-400"
            : state === "thinking"
            ? "bg-yellow-500/10 text-yellow-400"
            : "bg-gray-500/10 text-gray-500"
        }`}
      >
        {state === "speaking"
          ? "Speaking..."
          : state === "listening"
          ? "Listening to you..."
          : state === "thinking"
          ? "Thinking..."
          : "Ready"}
      </div>
    </div>
  );
}
