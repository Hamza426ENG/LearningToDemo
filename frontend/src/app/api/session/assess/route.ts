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
    const { sessionId, topic, context, mode, transcript, startedAt, endedAt, dataSource, apiKey } =
      (await req.json()) as {
        sessionId: string;
        topic: string;
        context: string;
        mode: string;
        transcript: TranscriptEntry[];
        startedAt: string;
        endedAt: string;
        dataSource?: string;
        apiKey?: string;
      };

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key is required" },
        { status: 400 }
      );
    }

    if (!transcript || transcript.length < 2) {
      return NextResponse.json(
        { error: "Not enough conversation to assess. Please have a longer session." },
        { status: 400 }
      );
    }

    const transcriptText = transcript
      .map((t) => `[${t.role.toUpperCase()}]: ${t.text}`)
      .join("\n");

    let prompt = "";
    
    if (mode === "certification") {
      prompt = `You are an expert certification examiner and knowledge assessor.
Analyze the following certification exam transcript and provide a detailed assessment of the candidate's knowledge.

CERTIFICATION DETAILS:
- Topic: ${topic}
- Data Source: ${dataSource || "Not provided"}
- Duration: From ${startedAt} to ${endedAt}

TRANSCRIPT:
${transcriptText}

Your task:
1. Evaluate the candidate's answers for technical accuracy and depth
2. Assess their understanding of core concepts, practical application, and problem-solving
3. Determine if they meet the certification standard (typically 70+ is passing)

Provide your assessment as a JSON object with this exact structure:
{
  "overallScore": <number 0-100, where 70+ is passing>,
  "certificationStatus": "<pass or fail based on 70% threshold>",
  "certificationScore": <number 0-100>,
  "isCertification": true,
  "categories": [
    { "name": "Technical Knowledge & Accuracy", "score": <1-10>, "maxScore": 10, "feedback": "<specific feedback on accuracy>" },
    { "name": "Depth of Understanding", "score": <1-10>, "maxScore": 10, "feedback": "<feedback on depth>" },
    { "name": "Practical Application", "score": <1-10>, "maxScore": 10, "feedback": "<feedback on application>" },
    { "name": "Problem-Solving & Critical Thinking", "score": <1-10>, "maxScore": 10, "feedback": "<feedback on reasoning>" },
    { "name": "Communication & Clarity", "score": <1-10>, "maxScore": 10, "feedback": "<feedback on clarity>" },
    { "name": "Confidence & Completeness", "score": <1-10>, "maxScore": 10, "feedback": "<feedback on completeness>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "areasForImprovement": ["<area 1>", "<area 2>", "<area 3>"],
  "tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "summary": "<2-3 sentence summary of certification result and key observations>"
}

IMPORTANT:
- Be rigorous and fair. Award points only if answers are technically correct
- Set certificationStatus to "pass" if overallScore >= 70, else "fail"
- Reference specific answers from the transcript in your feedback

Return ONLY the JSON object, no markdown or other text.`;
    } else {
      prompt = `You are an expert communication coach and product demonstration assessor.
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
    }

    const openai = new OpenAI({ apiKey });
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
