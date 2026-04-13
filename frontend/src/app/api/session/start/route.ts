import { NextRequest, NextResponse } from "next/server";
import { buildInstructions } from "@/lib/instructions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { topic, context, mode, voice } = await req.json();

    if (!topic || !mode) {
      return NextResponse.json(
        { error: "Topic and mode are required" },
        { status: 400 }
      );
    }

    const instructions = buildInstructions(topic, context || "", mode);

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: voice || "alloy",
          instructions,
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: {
            type: "server_vad",
            threshold: 0.55,
            prefix_padding_ms: 250,
            silence_duration_ms: 600,
            create_response: true,
          },
          max_response_output_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `OpenAI error: ${error}` },
        { status: 500 }
      );
    }

    const realtimeSession = await response.json();
    const sessionId = crypto.randomUUID();

    return NextResponse.json({
      sessionId,
      clientSecret: realtimeSession.client_secret,
      realtimeSession,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to start session" },
      { status: 500 }
    );
  }
}
