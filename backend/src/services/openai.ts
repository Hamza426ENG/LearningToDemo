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
        threshold: 0.7,
        prefix_padding_ms: 300,
        silence_duration_ms: 1200,
        create_response: true,
      },
      max_response_output_tokens: 4096,
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

export async function generateCertificationAssessment(
  session: Session
): Promise<AssessmentResult> {
  const transcriptText = session.transcript
    .map((t) => `[${t.role.toUpperCase()}]: ${t.text}`)
    .join("\n");

  const prompt = `You are an expert certification examiner and knowledge assessor.
Analyze the following certification exam transcript and provide a detailed assessment of the candidate's knowledge.

CERTIFICATION DETAILS:
- Topic: ${session.topic}
- Data Source: ${session.dataSource || "Not provided"}
- Duration: From ${session.startedAt} to ${session.endedAt}

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
  "categories": [
    {
      "name": "Technical Knowledge & Accuracy",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<specific feedback on accuracy of responses>"
    },
    {
      "name": "Depth of Understanding",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<feedback on depth - surface level vs comprehensive>"
    },
    {
      "name": "Practical Application",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<feedback on ability to apply knowledge to scenarios>"
    },
    {
      "name": "Problem-Solving & Critical Thinking",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<feedback on reasoning and analytical skills>"
    },
    {
      "name": "Communication & Clarity",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<feedback on how clearly they explained their answers>"
    },
    {
      "name": "Confidence & Completeness",
      "score": <number 1-10>,
      "maxScore": 10,
      "feedback": "<feedback on answer completeness and confidence>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "areasForImprovement": ["<area 1>", "<area 2>", "<area 3>"],
  "tips": ["<actionable tip for improvement 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "summary": "<2-3 sentence summary of certification result and key observations>"
}

IMPORTANT:
- Be rigorous and fair. Award points only if answers are technically correct or demonstrate clear understanding
- Certification Score should be derived from the categories (average * 10 to get 0-100 scale)
- Set certificationStatus to "pass" if overallScore >= 70, else "fail"
- Reference specific answers from the transcript in your feedback
- Be detailed about what the candidate did well and what needs improvement

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
    isCertification: true,
    ...result,
  };
}
