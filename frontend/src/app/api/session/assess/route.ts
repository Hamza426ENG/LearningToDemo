import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface TranscriptEntry {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, topic, context, mode, transcript, startedAt, endedAt } =
      (await req.json()) as {
        sessionId: string;
        topic: string;
        context: string;
        mode: string;
        transcript: TranscriptEntry[];
        startedAt: string;
        endedAt: string;
      };

    if (!transcript || transcript.length < 2) {
      return NextResponse.json(
        { error: "Not enough conversation to assess. Please have a longer session." },
        { status: 400 }
      );
    }

    const transcriptText = transcript
      .map((t) => `[${t.role.toUpperCase()}]: ${t.text}`)
      .join("\n");

    const prompt = `You are an expert communication coach and product demonstration assessor.
Analyze the following practice session transcript and provide a detailed assessment.

SESSION DETAILS:
- Topic: ${topic}
- Context: ${context}
- Mode: ${mode}
- Duration: From ${startedAt} to ${endedAt}

TRANSCRIPT:
${transcriptText}

Provide your assessment as a JSON object with this exact structure:
{
  "overallScore": <number 1-100>,
  "categories": [
    { "name": "Clarity & Articulation", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback>" },
    { "name": "Content Structure", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback>" },
    { "name": "Product Knowledge Depth", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback>" },
    { "name": "Audience Engagement", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback>" },
    { "name": "Confidence & Delivery", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback>" },
    { "name": "Handling Questions & Objections", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback>" },
    { "name": "Language & Grammar", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback with examples of grammar issues if any>" },
    { "name": "Filler Words & Fluency", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback noting filler words like um, uh, like, you know>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "summary": "<2-3 sentence overall summary>"
}

Be specific, constructive, and reference actual parts of the transcript in your feedback.
Return ONLY the JSON object, no markdown or other text.`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json({
      assessment: { sessionId, ...result },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate assessment" },
      { status: 500 }
    );
  }
}
