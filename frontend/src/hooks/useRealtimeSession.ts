"use client";

import { useRef, useState, useCallback } from "react";

export interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface UseRealtimeSessionOptions {
  onTranscriptUpdate?: (transcript: TranscriptEntry[]) => void;
  onAvatarStateChange?: (state: "idle" | "listening" | "speaking" | "thinking") => void;
}

export function useRealtimeSession(options: UseRealtimeSessionOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [avatarState, setAvatarState] = useState<"idle" | "listening" | "speaking" | "thinking">("idle");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Track active response to prevent overlaps
  const activeResponseIdRef = useRef<string | null>(null);
  const isRespondingRef = useRef(false);

  // Buffers for accumulating partial transcripts
  const assistantTranscriptBuffer = useRef<string>("");

  const updateAvatarState = useCallback(
    (state: "idle" | "listening" | "speaking" | "thinking") => {
      setAvatarState(state);
      options.onAvatarStateChange?.(state);
    },
    [options]
  );

  const addTranscriptEntry = useCallback(
    (role: "user" | "assistant", text: string) => {
      if (!text.trim()) return;
      const entry: TranscriptEntry = {
        role,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      setTranscript((prev) => {
        const updated = [...prev, entry];
        options.onTranscriptUpdate?.(updated);
        return updated;
      });
    },
    [options]
  );

  const handleRealtimeEvent = useCallback(
    (event: any) => {
      switch (event.type) {
        // User started speaking — server VAD handles interruption automatically
        case "input_audio_buffer.speech_started":
          updateAvatarState("listening");
          break;

        case "input_audio_buffer.speech_stopped":
          updateAvatarState("thinking");
          break;

        // A new response is being created
        case "response.created":
          activeResponseIdRef.current = event.response?.id || null;
          isRespondingRef.current = true;
          updateAvatarState("thinking");
          break;

        // Audio transcript streaming in
        case "response.audio_transcript.delta":
          if (event.response_id === activeResponseIdRef.current) {
            assistantTranscriptBuffer.current += event.delta || "";
            updateAvatarState("speaking");
          }
          break;

        // Single response audio transcript complete
        case "response.audio_transcript.done":
          if (event.response_id === activeResponseIdRef.current) {
            addTranscriptEntry(
              "assistant",
              assistantTranscriptBuffer.current || event.transcript || ""
            );
            assistantTranscriptBuffer.current = "";
          }
          break;

        // Entire response finished
        case "response.done":
          isRespondingRef.current = false;
          activeResponseIdRef.current = null;
          assistantTranscriptBuffer.current = "";
          updateAvatarState("listening");
          break;

        // User speech transcribed
        case "conversation.item.input_audio_transcription.completed":
          addTranscriptEntry("user", event.transcript || "");
          break;

        // Handle errors gracefully
        case "error":
          console.error("Realtime error:", event.error);
          isRespondingRef.current = false;
          activeResponseIdRef.current = null;
          updateAvatarState("listening");
          break;
      }
    },
    [addTranscriptEntry, updateAvatarState]
  );

  const connect = useCallback(
    async (clientSecret: string) => {
      // Guard: never create a second connection if one already exists
      if (pcRef.current) {
        console.warn("Realtime connection already active — skipping duplicate connect()");
        return;
      }

      // Configure with STUN servers for NAT traversal (fixes choppy audio)
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun.cloudflare.com:3478" },
        ],
        bundlePolicy: "max-bundle",
      });
      pcRef.current = pc;

      // Set up audio playback — attach to body so it actually plays in all browsers
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.setAttribute("playsinline", "true");
      // Append hidden to body — Safari requires the element to be in the DOM
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
      audioElRef.current = audioEl;

      pc.ontrack = (e) => {
        if (audioEl.srcObject !== e.streams[0]) {
          audioEl.srcObject = e.streams[0];
          // Force playback start
          audioEl.play().catch((err) => {
            console.warn("Audio playback failed:", err);
          });
        }
      };

      // Monitor connection state for diagnostics
      pc.onconnectionstatechange = () => {
        console.log("WebRTC connection state:", pc.connectionState);
      };
      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
      };

      // Get microphone with noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 24000,
        },
      });
      pc.addTrack(stream.getTracks()[0], stream);

      // Create data channel for events
      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.addEventListener("message", (e) => {
        try {
          const event = JSON.parse(e.data);
          handleRealtimeEvent(event);
        } catch {
          // ignore parse errors
        }
      });

      // Create and set local offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI Realtime API
      const sdpResponse = await fetch(
        "https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${clientSecret}`,
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error("Failed to connect to OpenAI Realtime");
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setIsConnected(true);
      setIsListening(true);
      updateAvatarState("listening");
    },
    [updateAvatarState, handleRealtimeEvent]
  );

  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      pcRef.current.close();
      pcRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.srcObject = null;
      audioElRef.current.remove();
      audioElRef.current = null;
    }
    dcRef.current = null;
    isRespondingRef.current = false;
    activeResponseIdRef.current = null;
    setIsConnected(false);
    setIsListening(false);
    updateAvatarState("idle");
  }, [updateAvatarState]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!dcRef.current || dcRef.current.readyState !== "open") return;

      dcRef.current.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text }],
          },
        })
      );
      dcRef.current.send(JSON.stringify({ type: "response.create" }));
      addTranscriptEntry("user", text);
    },
    [addTranscriptEntry]
  );

  return {
    isConnected,
    isListening,
    transcript,
    avatarState,
    connect,
    disconnect,
    sendMessage,
  };
}
