import OpenAI from "openai";
import { Session, AssessmentResult } from "../types";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function createRealtimeSession(
  instructions: string,
  voice: string = "alloy"
) {
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice,
      instructions,
      input_audio_transcription: {
        model: "whisper-1",
      },
      turn_detection: {
        type: "server_vad",
        threshold: 0.6,
        prefix_padding_ms: 300,
        silence_duration_ms: 800,
        create_response: true,
      },
      max_response_output_tokens: 300,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create realtime session: ${error}`);
  }

  return response.json() as Promise<{ client_secret: { value: string; expires_at: number } }>;
}

export async function generateAssessment(
  session: Session
): Promise<AssessmentResult> {
  const transcriptText = session.transcript
    .map((t) => `[${t.role.toUpperCase()}]: ${t.text}`)
    .join("\n");

  const prompt = `You are an expert communication coach and product demonstration assessor.
Analyze the following practice session transcript and provide a detailed assessment.

SESSION DETAILS:
- Topic: ${session.topic}
- Context: ${session.context}
- Mode: ${session.mode}
- Duration: From ${session.startedAt} to ${session.endedAt}

TRANSCRIPT:
${transcriptText}

Provide your assessment as a JSON object with this exact structure:
{
  "overallScore": <number 1-100>,
  "categories": [
    {
      "name": "Clarity & Articulation",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback>"
    },
    {
      "name": "Content Structure",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback>"
    },
    {
      "name": "Product Knowledge Depth",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback>"
    },
    {
      "name": "Audience Engagement",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback>"
    },
    {
      "name": "Confidence & Delivery",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback>"
    },
    {
      "name": "Handling Questions & Objections",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback>"
    },
    {
      "name": "Language & Grammar",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback with examples of grammar issues if any>"
    },
    {
      "name": "Filler Words & Fluency",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback noting filler words like um, uh, like, you know>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "summary": "<2-3 sentence overall summary>"
}

Be specific, constructive, and reference actual parts of the transcript in your feedback.
Return ONLY the JSON object, no markdown or other text.`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(completion.choices[0].message.content || "{}");
  return {
    sessionId: session.id,
    ...result,
  };
}
