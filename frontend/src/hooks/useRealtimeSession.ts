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

  // Cancel any in-progress response
  const cancelCurrentResponse = useCallback(() => {
    if (!dcRef.current || dcRef.current.readyState !== "open") return;
    if (!isRespondingRef.current) return;

    dcRef.current.send(JSON.stringify({ type: "response.cancel" }));
    isRespondingRef.current = false;
    activeResponseIdRef.current = null;
    assistantTranscriptBuffer.current = "";
  }, []);

  const handleRealtimeEvent = useCallback(
    (event: any) => {
      switch (event.type) {
        // User started speaking — cancel any AI response in progress
        case "input_audio_buffer.speech_started":
          cancelCurrentResponse();
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
    [addTranscriptEntry, updateAvatarState, cancelCurrentResponse]
  );

  const connect = useCallback(
    async (clientSecret: string) => {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Set up audio playback — single audio element, no overlap
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // Get microphone with noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      pc.addTrack(stream.getTracks()[0]);

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

      // Cancel any in-progress response first
      cancelCurrentResponse();

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
    [addTranscriptEntry, cancelCurrentResponse]
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
