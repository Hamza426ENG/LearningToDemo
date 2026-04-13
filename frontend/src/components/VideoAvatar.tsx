"use client";

import { useEffect, useRef } from "react";

interface VideoAvatarProps {
  state: "idle" | "listening" | "speaking" | "thinking";
  remoteStream: MediaStream | null;
  src?: string;
}

/**
 * Video-based avatar that loops a pre-rendered clip while the AI speaks
 * and freezes (pauses) when idle/listening/thinking.
 * The visual frame around the video reacts to the audio amplitude.
 */
export default function VideoAvatar({
  state,
  remoteStream,
  src = "/mine.mp4",
}: VideoAvatarProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Smoothly ramp playbackRate between 0 (paused) and 1 (full speed) instead
  // of hard play/pause — eliminates visible stutter when the AI starts/stops
  // speaking.
  const targetRateRef = useRef(0);
  const rampRafRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure playback is started (HTML <video> with playbackRate>0 will play
    // only after .play()). We always keep it "playing" — the rate controls
    // motion.
    const ensurePlaying = () => {
      // Set a tiny rate first so play() doesn't error on iOS, then ramp.
      video.play().catch(() => {
        /* will retry on user gesture */
      });
    };
    if (video.readyState >= 2) ensurePlaying();
    else video.addEventListener("canplay", ensurePlaying, { once: true });

    // Target rate based on state
    targetRateRef.current = state === "speaking" ? 1.0 : 0.0;

    // Smoothly interpolate current → target rate
    const step = () => {
      const current = video.playbackRate;
      const target = targetRateRef.current;
      const diff = target - current;
      if (Math.abs(diff) < 0.02) {
        // Snap & stop animating
        try {
          video.playbackRate = target;
        } catch {
          /* ignore */
        }
        rampRafRef.current = null;
        return;
      }
      // Ease ~0.12 per frame → ~250ms ramp at 60fps
      const next = Math.max(0, Math.min(1, current + diff * 0.12));
      try {
        video.playbackRate = next;
      } catch {
        /* ignore */
      }
      rampRafRef.current = requestAnimationFrame(step);
    };
    if (rampRafRef.current) cancelAnimationFrame(rampRafRef.current);
    rampRafRef.current = requestAnimationFrame(step);

    return () => {
      video.removeEventListener("canplay", ensurePlaying);
      if (rampRafRef.current) cancelAnimationFrame(rampRafRef.current);
    };
  }, [state]);

  // Audio amplitude → glow scale (visual reactivity)
  useEffect(() => {
    if (!remoteStream) return;
    let cancelled = false;

    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.65;
    const source = audioCtx.createMediaStreamSource(remoteStream);
    source.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (cancelled) return;
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 2; i < 40; i++) sum += data[i];
      const avg = sum / 38;
      const intensity = Math.min(1, Math.max(0, (avg - 10) / 100));
      // Apply CSS variable for glow scale
      if (containerRef.current) {
        containerRef.current.style.setProperty(
          "--audio-intensity",
          intensity.toString()
        );
      }
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

  const glowColor =
    state === "speaking"
      ? "rgba(96, 165, 250, 0.55)"
      : state === "listening"
      ? "rgba(74, 222, 128, 0.4)"
      : state === "thinking"
      ? "rgba(250, 204, 21, 0.4)"
      : "rgba(148, 163, 184, 0.2)";

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="relative">
        {/* Audio-reactive glow */}
        <div
          className="absolute inset-0 rounded-3xl blur-3xl transition-colors duration-500"
          style={{
            background: glowColor,
            transform:
              "scale(calc(1.05 + var(--audio-intensity, 0) * 0.25))",
            transition: "transform 0.08s ease-out, background 0.4s ease",
          }}
        />

        {/* Video container */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10"
          style={{ width: 320, height: 380 }}
        >
          <video
            ref={videoRef}
            src={src}
            loop
            muted
            autoPlay
            playsInline
            preload="auto"
            disablePictureInPicture
            className="absolute inset-0 w-full h-full object-cover will-change-transform"
            style={{
              filter:
                state === "speaking"
                  ? "brightness(1.05) saturate(1.1)"
                  : state === "listening"
                  ? "brightness(1) saturate(1)"
                  : state === "thinking"
                  ? "brightness(0.9) saturate(0.95)"
                  : "brightness(0.8) saturate(0.85)",
              transition: "filter 0.6s ease",
            }}
          />

          {/* Subtle dark vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)",
            }}
          />

          {/* State indicator */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md">
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
            <span className="text-[9px] uppercase tracking-wider text-white/80 font-semibold">
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
