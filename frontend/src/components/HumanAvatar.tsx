"use client";

import { useEffect, useRef, useState } from "react";

interface HumanAvatarProps {
  state: "idle" | "listening" | "speaking" | "thinking";
  remoteStream: MediaStream | null;
  variant?: "female" | "male";
}

/**
 * Portrait-style SVG avatar of a bearded man with aviator glasses,
 * swept-back black hair, light gray blazer over black shirt.
 * Includes audio-reactive lip sync, blinking, and subtle head sway.
 */
export default function HumanAvatar({
  state,
  remoteStream,
}: HumanAvatarProps) {
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [headOffset, setHeadOffset] = useState({ x: 0, y: 0 });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // ----- Lip sync from remote audio -----
  useEffect(() => {
    if (!remoteStream) return;
    let cancelled = false;
    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.6;

    const source = audioCtx.createMediaStreamSource(remoteStream);
    source.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (cancelled) return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      const start = 2;
      const end = Math.min(40, dataArray.length);
      for (let i = start; i < end; i++) sum += dataArray[i];
      const avg = sum / (end - start);
      const normalized = Math.min(1, Math.max(0, (avg - 10) / 110));
      setMouthOpen((prev) => prev * 0.4 + normalized * 0.6);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        source.disconnect();
        analyser.disconnect();
        audioCtx.close();
      } catch {
        /* ignore */
      }
      audioCtxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    };
  }, [remoteStream]);

  useEffect(() => {
    if (state !== "speaking") setMouthOpen(0);
  }, [state]);

  // ----- Random blinking -----
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      timeout = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 130);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // ----- Subtle head sway -----
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const animate = (t: number) => {
      const elapsed = (t - start) / 1000;
      setHeadOffset({
        x: Math.sin(elapsed * 0.5) * 1.5,
        y: Math.cos(elapsed * 0.35) * 1,
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ----- State-driven micro animations -----
  const eyebrowRaise =
    state === "thinking" ? -3 : state === "listening" ? -1 : 0;
  const mouthHeight = mouthOpen * 16;
  const mouthWidth = 30 + mouthOpen * 6;
  const eyeScaleY = blinking ? 0.05 : state === "listening" ? 1.05 : 1;

  const glow =
    state === "speaking"
      ? "rgba(96, 165, 250, 0.45)"
      : state === "listening"
      ? "rgba(74, 222, 128, 0.35)"
      : state === "thinking"
      ? "rgba(250, 204, 21, 0.35)"
      : "rgba(148, 163, 184, 0.2)";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-3xl blur-3xl transition-colors duration-500"
          style={{ background: glow, transform: "scale(1.1)" }}
        />

        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          style={{ width: 320, height: 380 }}
        >
          <svg viewBox="0 0 320 380" width="320" height="380">
            {/* ---------- DEFINITIONS ---------- */}
            <defs>
              {/* Studio background - dark moody */}
              <radialGradient id="bg" cx="0.5" cy="0.4" r="0.9">
                <stop offset="0%" stopColor="#1f2937" />
                <stop offset="60%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#020617" />
              </radialGradient>

              {/* Skin tones - warm tan */}
              <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e5b18a" />
                <stop offset="50%" stopColor="#d49b73" />
                <stop offset="100%" stopColor="#a87253" />
              </linearGradient>
              <linearGradient
                id="skinLight"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#f0c39c" />
                <stop offset="100%" stopColor="#d49b73" />
              </linearGradient>

              {/* Hair - black with subtle blue highlights */}
              <linearGradient id="hair" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1c1917" />
                <stop offset="70%" stopColor="#0c0a09" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>
              <linearGradient
                id="hairHighlight"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3f3a37" stopOpacity="0" />
                <stop offset="50%" stopColor="#525252" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3f3a37" stopOpacity="0" />
              </linearGradient>

              {/* Beard - black with texture */}
              <linearGradient id="beard" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2a2520" />
                <stop offset="100%" stopColor="#0a0908" />
              </linearGradient>

              {/* Blazer - light gray */}
              <linearGradient id="blazer" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#d1d5db" />
                <stop offset="50%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#6b7280" />
              </linearGradient>
              <linearGradient
                id="blazerShadow"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>

              {/* Black shirt */}
              <linearGradient id="shirt" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1c1917" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>

              {/* Glass tint (subtle blue reflection) */}
              <linearGradient id="glassLens" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" stopOpacity="0.2" />
                <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
              </linearGradient>

              {/* Soft face shadow */}
              <radialGradient id="faceShadow" cx="0.7" cy="0.5" r="0.6">
                <stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
              </radialGradient>
            </defs>

            {/* ---------- BACKGROUND ---------- */}
            <rect width="320" height="380" fill="url(#bg)" />

            {/* Subtle background texture */}
            <circle
              cx="80"
              cy="80"
              r="120"
              fill="#1e293b"
              opacity="0.3"
            />

            {/* ---------- BODY ---------- */}
            <g
              style={{
                transform: `translate(${headOffset.x}px, ${headOffset.y}px)`,
                transition: "transform 0.05s linear",
              }}
            >
              {/* Blazer - main shape */}
              <path
                d="M 30 380 L 40 290 Q 80 270 120 280 L 130 320 L 190 320 L 200 280 Q 240 270 280 290 L 290 380 Z"
                fill="url(#blazer)"
              />
              {/* Blazer right lapel */}
              <path
                d="M 200 280 L 190 320 L 175 350 L 200 360 L 225 290 Z"
                fill="url(#blazerShadow)"
              />
              {/* Blazer left lapel */}
              <path
                d="M 120 280 L 130 320 L 145 350 L 120 360 L 95 290 Z"
                fill="url(#blazerShadow)"
              />
              {/* Lapel edge highlights */}
              <path
                d="M 200 280 L 225 290 L 222 295 L 198 285 Z"
                fill="#e5e7eb"
                opacity="0.5"
              />
              <path
                d="M 120 280 L 95 290 L 98 295 L 122 285 Z"
                fill="#e5e7eb"
                opacity="0.5"
              />

              {/* Black shirt collar opening */}
              <path
                d="M 140 270 L 130 320 L 145 350 L 175 350 L 190 320 L 180 270 Z"
                fill="url(#shirt)"
              />
              {/* Shirt collar fold lines */}
              <path
                d="M 140 270 L 145 320 M 180 270 L 175 320"
                stroke="#000"
                strokeWidth="0.8"
                opacity="0.6"
              />

              {/* Neck */}
              <path
                d="M 138 240 Q 140 270 145 285 L 175 285 Q 180 270 182 240 Z"
                fill="url(#skin)"
              />
              {/* Neck shadow under chin */}
              <path
                d="M 138 240 Q 160 255 182 240 Q 180 250 160 252 Q 140 250 138 240 Z"
                fill="#000"
                opacity="0.3"
              />

              {/* ---------- HEAD ---------- */}
              {/* Head/face base */}
              <path
                d="M 90 145 Q 90 95 160 90 Q 230 95 230 145 Q 230 195 220 220 Q 210 245 195 250 Q 175 255 160 255 Q 145 255 125 250 Q 110 245 100 220 Q 90 195 90 145 Z"
                fill="url(#skin)"
              />
              {/* Right side face shadow */}
              <path
                d="M 160 90 Q 230 95 230 145 Q 230 195 220 220 Q 210 245 195 250 Q 175 255 160 255 Z"
                fill="url(#faceShadow)"
              />
              {/* Forehead highlight */}
              <ellipse
                cx="135"
                cy="115"
                rx="30"
                ry="10"
                fill="url(#skinLight)"
                opacity="0.6"
              />

              {/* ---------- EARS ---------- */}
              <path
                d="M 86 155 Q 78 158 80 175 Q 82 188 92 188 Z"
                fill="url(#skin)"
              />
              <path
                d="M 234 155 Q 242 158 240 175 Q 238 188 228 188 Z"
                fill="url(#skin)"
              />
              <path
                d="M 84 165 Q 86 175 90 180"
                stroke="#a87253"
                strokeWidth="1"
                fill="none"
                opacity="0.5"
              />

              {/* ---------- HAIR ---------- */}
              {/* Main hair mass swept back */}
              <path
                d="M 90 145
                   Q 75 130 80 95
                   Q 85 60 130 50
                   Q 160 45 190 50
                   Q 235 60 240 100
                   Q 245 130 230 145
                   Q 232 115 220 100
                   Q 200 85 160 82
                   Q 120 85 105 105
                   Q 95 120 90 145 Z"
                fill="url(#hair)"
              />
              {/* Hair top strands - swept back look */}
              <path
                d="M 110 90 Q 125 70 160 65 Q 195 70 215 95 Q 200 75 175 70 Q 145 68 120 80 Z"
                fill="#0a0a0a"
              />
              {/* Hair side strand right */}
              <path
                d="M 215 95 Q 235 100 240 130 Q 232 110 220 105 Z"
                fill="url(#hair)"
              />
              {/* Hair side strand left */}
              <path
                d="M 105 95 Q 85 100 80 130 Q 88 110 100 105 Z"
                fill="url(#hair)"
              />
              {/* Hair highlights - subtle silver */}
              <path
                d="M 130 75 Q 160 65 195 73 Q 175 70 155 72 Q 140 73 130 75 Z"
                fill="url(#hairHighlight)"
              />
              {/* Forehead hairline detail */}
              <path
                d="M 100 110 Q 130 95 160 92 Q 190 95 220 110"
                stroke="#000"
                strokeWidth="1"
                fill="none"
                opacity="0.4"
              />

              {/* ---------- EYEBROWS ---------- */}
              <g
                style={{
                  transform: `translateY(${eyebrowRaise}px)`,
                  transition: "transform 0.3s ease",
                }}
              >
                <path
                  d="M 105 152 Q 125 146 145 152 Q 135 149 125 149 Q 115 150 105 152 Z"
                  fill="#0a0a0a"
                />
                <path
                  d="M 175 152 Q 195 146 215 152 Q 205 149 195 149 Q 185 150 175 152 Z"
                  fill="#0a0a0a"
                />
              </g>

              {/* ---------- AVIATOR GLASSES ---------- */}
              {/* Lens shadows behind */}
              <ellipse
                cx="125"
                cy="172"
                rx="26"
                ry="22"
                fill="#000"
                opacity="0.15"
              />
              <ellipse
                cx="195"
                cy="172"
                rx="26"
                ry="22"
                fill="#000"
                opacity="0.15"
              />

              {/* EYES (visible behind clear-ish lenses) */}
              <g
                style={{
                  transform: `scaleY(${eyeScaleY})`,
                  transformOrigin: "160px 172px",
                  transition: blinking
                    ? "transform 0.08s ease"
                    : "transform 0.15s ease",
                }}
              >
                <ellipse cx="125" cy="172" rx="9" ry="5.5" fill="#ffffff" />
                <ellipse cx="195" cy="172" rx="9" ry="5.5" fill="#ffffff" />
                {/* Iris - dark brown */}
                <circle cx="125" cy="172" r="4.5" fill="#3b2818" />
                <circle cx="195" cy="172" r="4.5" fill="#3b2818" />
                {/* Pupils */}
                <circle cx="125" cy="172" r="2.2" fill="#0a0a0a" />
                <circle cx="195" cy="172" r="2.2" fill="#0a0a0a" />
                {/* Eye sparkle */}
                <circle cx="127" cy="170" r="1.2" fill="#ffffff" />
                <circle cx="197" cy="170" r="1.2" fill="#ffffff" />
              </g>

              {/* Aviator lens - slight blue tint */}
              <path
                d="M 100 170 Q 100 152 125 152 Q 152 152 152 170 Q 152 192 130 195 Q 105 195 100 170 Z"
                fill="url(#glassLens)"
              />
              <path
                d="M 168 170 Q 168 152 195 152 Q 220 152 220 170 Q 220 192 200 195 Q 175 195 168 170 Z"
                fill="url(#glassLens)"
              />

              {/* Aviator frames - thin metallic */}
              <path
                d="M 100 170 Q 100 152 125 152 Q 152 152 152 170 Q 152 192 130 195 Q 105 195 100 170 Z"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
              />
              <path
                d="M 168 170 Q 168 152 195 152 Q 220 152 220 170 Q 220 192 200 195 Q 175 195 168 170 Z"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
              />
              {/* Bridge */}
              <path
                d="M 152 165 Q 160 162 168 165"
                stroke="#475569"
                strokeWidth="2"
                fill="none"
              />
              {/* Top bar */}
              <path
                d="M 105 158 L 148 158 M 172 158 L 215 158"
                stroke="#475569"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Lens highlights (reflection) */}
              <path
                d="M 108 160 Q 115 158 125 158"
                stroke="#ffffff"
                strokeWidth="1.2"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M 178 160 Q 185 158 195 158"
                stroke="#ffffff"
                strokeWidth="1.2"
                fill="none"
                opacity="0.6"
              />
              {/* Frame arms going to ears */}
              <path
                d="M 100 170 Q 90 168 86 165"
                stroke="#475569"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M 220 170 Q 230 168 234 165"
                stroke="#475569"
                strokeWidth="1.5"
                fill="none"
              />

              {/* ---------- NOSE ---------- */}
              <path
                d="M 158 175 Q 152 200 156 215 Q 160 220 167 218 Q 172 215 168 200 Q 165 185 162 175 Z"
                fill="url(#skin)"
              />
              {/* Nose bridge shadow */}
              <path
                d="M 158 175 Q 154 195 156 215"
                stroke="#a87253"
                strokeWidth="1"
                fill="none"
                opacity="0.6"
              />
              {/* Nose tip highlight */}
              <ellipse
                cx="161"
                cy="213"
                rx="3"
                ry="2"
                fill="#f0c39c"
                opacity="0.7"
              />
              {/* Nostrils */}
              <ellipse
                cx="156"
                cy="220"
                rx="2"
                ry="1.2"
                fill="#5a3a22"
                opacity="0.7"
              />
              <ellipse
                cx="166"
                cy="220"
                rx="2"
                ry="1.2"
                fill="#5a3a22"
                opacity="0.7"
              />

              {/* ---------- BEARD & MUSTACHE ---------- */}
              {/* Beard outline (full beard along jaw) */}
              <path
                d="M 95 200
                   Q 92 235 105 255
                   Q 115 270 130 273
                   Q 145 275 160 275
                   Q 175 275 190 273
                   Q 205 270 215 255
                   Q 228 235 225 200
                   Q 220 215 210 230
                   Q 195 245 175 250
                   Q 160 252 145 250
                   Q 125 245 110 230
                   Q 100 215 95 200 Z"
                fill="url(#beard)"
              />
              {/* Beard texture strokes */}
              <g opacity="0.4">
                <path
                  d="M 105 230 L 103 240 M 115 245 L 113 255 M 130 255 L 128 265 M 145 260 L 143 270 M 175 260 L 177 270 M 190 255 L 192 265 M 205 245 L 207 255 M 215 230 L 217 240"
                  stroke="#000"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />
              </g>
              {/* Mustache */}
              <path
                d="M 130 230
                   Q 145 225 158 228
                   Q 162 226 166 228
                   Q 180 225 195 230
                   Q 195 240 180 240
                   Q 170 238 162 238
                   Q 154 238 145 240
                   Q 130 240 130 230 Z"
                fill="url(#beard)"
              />
              {/* Mustache parting under nose */}
              <path
                d="M 159 232 Q 162 235 165 232"
                stroke="#000"
                strokeWidth="0.8"
                fill="none"
                opacity="0.7"
              />

              {/* ---------- MOUTH (audio-reactive) ---------- */}
              <g
                style={{
                  transformOrigin: "162px 248px",
                }}
              >
                {/* Lower lip area visible through beard */}
                <ellipse
                  cx="162"
                  cy="248"
                  rx={mouthWidth / 2}
                  ry={Math.max(2.5, mouthHeight / 2 + 2)}
                  fill="#7a4032"
                />
                {/* Inner mouth */}
                {mouthOpen > 0.1 && (
                  <ellipse
                    cx="162"
                    cy="248"
                    rx={mouthWidth / 2 - 4}
                    ry={Math.max(0, mouthHeight / 2)}
                    fill="#1a0a0a"
                  />
                )}
                {/* Teeth hint */}
                {mouthOpen > 0.4 && (
                  <rect
                    x={162 - mouthWidth / 2 + 5}
                    y={248 - mouthHeight / 2 + 1}
                    width={mouthWidth - 10}
                    height={2.5}
                    fill="#f5f5f5"
                    rx="1"
                  />
                )}
                {/* Lower lip line */}
                <path
                  d={`M ${162 - mouthWidth / 2 + 3} ${248 + Math.max(2.5, mouthHeight / 2)}
                      Q 162 ${252 + mouthOpen * 3} ${162 + mouthWidth / 2 - 3} ${
                    248 + Math.max(2.5, mouthHeight / 2)
                  }`}
                  stroke="#5a2820"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.8"
                />
              </g>

              {/* Final face shadow on right side */}
              <path
                d="M 220 145 Q 230 195 220 220 Q 210 240 200 245 Q 215 230 222 200 Q 230 170 220 145 Z"
                fill="#000"
                opacity="0.18"
              />
            </g>

            {/* Vignette for portrait depth */}
            <rect
              width="320"
              height="380"
              fill="url(#bg)"
              opacity="0.15"
              style={{ mixBlendMode: "multiply" }}
            />
          </svg>

          {/* State indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                state === "speaking"
                  ? "bg-blue-400 animate-pulse"
                  : state === "listening"
                  ? "bg-green-400 animate-pulse"
                  : state === "thinking"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-gray-500"
              }`}
            />
            <span className="text-[9px] uppercase tracking-wider text-white/70 font-medium">
              {state === "speaking"
                ? "Live"
                : state === "listening"
                ? "Listening"
                : state === "thinking"
                ? "Thinking"
                : "Idle"}
            </span>
          </div>
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
