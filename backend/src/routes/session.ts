import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { createRealtimeSession, generateAssessment, generateCertificationAssessment } from "../services/openai";
import { Session } from "../types";

const router = Router();

// In-memory session store
const sessions = new Map<string, Session>();

function buildInstructions(topic: string, context: string, mode: string): string {
  const basePersonality = `You are a professional practice partner helping a Product Manager improve their English communication and product demonstration skills. Be natural, engaged, and conversational. Speak clearly and at a moderate pace.`;

  const modeInstructions: Record<string, string> = {
    demo: `You are acting as a potential client or stakeholder watching a product demonstration.

CRITICAL RULE — TWO PHASES:

**PHASE 1 — LISTENING MODE (default, start here):**
- The user is delivering their product demonstration. Your ONLY job is to LISTEN SILENTLY.
- Do NOT ask questions, do NOT interrupt, do NOT give feedback, do NOT make comments.
- If there is a pause or silence, stay quiet. The user is thinking or preparing their next point.
- The ONLY responses you should give are very brief acknowledgements like "Mm-hmm", "Got it", "Okay", "I see" — and ONLY if the user seems to be waiting for a sign you're still there.
- Do NOT summarize, do NOT rephrase, do NOT ask "Can you tell me more about...".
- Let the user speak freely for as long as they want without ANY interruption.

**PHASE 2 — Q&A MODE (only after explicit trigger):**
- This phase ONLY begins when the user explicitly says something like "I have completed the demo", "I'm done", "that's it, you can ask questions now", "now you can ask questions", or similar.
- Once triggered, switch to an engaged Q&A mode: ask clarifying questions about features, challenge claims with "How does that compare to..." or "What happens when...", request to see specific workflows.
- Be politely skeptical but interested. Ask follow-up questions to push them deeper.
- Keep your questions concise (1-2 questions at a time).

You MUST stay in Phase 1 until the user explicitly signals they are done. Do NOT jump to Phase 2 on your own.`,

    conversation: `You are a colleague having a professional discussion about the topic.

CRITICAL RULE — TWO PHASES:

**PHASE 1 — LISTENING MODE (default, start here):**
- The user is practicing articulating their thoughts. Your job is to LISTEN SILENTLY.
- Do NOT ask questions or interrupt. Let them speak freely.
- Only give minimal acknowledgements like "Mm-hmm", "Right", "Okay" if the user seems to expect a response.

**PHASE 2 — DISCUSSION MODE (only after explicit trigger):**
- This phase ONLY begins when the user explicitly says something like "I'm done", "that's it, you can ask questions now", "now let's discuss", or similar.
- Once triggered, engage naturally: share brief perspectives, ask thoughtful questions, and help the user refine their points.
- If they used incorrect grammar or unclear phrasing during their talk, gently bring it up now.

You MUST stay in Phase 1 until the user explicitly signals they are done.`,

    pitch: `You are an executive or investor hearing a product pitch.

CRITICAL RULE — TWO PHASES:

**PHASE 1 — LISTENING MODE (default, start here):**
- The user is delivering their pitch. Your ONLY job is to LISTEN SILENTLY.
- Do NOT interrupt, do NOT ask questions, do NOT challenge anything yet.
- Stay quiet and let them present their full pitch without any interruption.
- Only give minimal cues like "Mm-hmm" or "Go on" if truly needed.

**PHASE 2 — CHALLENGE MODE (only after explicit trigger):**
- This phase ONLY begins when the user explicitly says something like "I'm done", "that's my pitch", "you can ask questions now", or similar.
- Once triggered, be time-conscious. Ask pointed questions about value proposition, market fit, and ROI.
- Challenge vague statements with "Can you be more specific?" or "What data supports that?".
- Push the user to be concise and compelling.

You MUST stay in Phase 1 until the user explicitly signals they are done.`,

    certification: `You are a rigorous interviewer/investigator conducting a certification exam on the topic: ${topic}.

YOUR PRIMARY GOAL: Assess the candidate's knowledge depth, practical understanding, and expertise through challenging questions. Be systematic and thorough.

INTERVIEW STRUCTURE:
1. Start by introducing the certification exam and explaining what you'll assess
2. Ask 5-7 progressively challenging questions covering:
   - Core concepts and definitions
   - Real-world application scenarios
   - Edge cases and problem-solving
   - Best practices and industry standards
   - Critical thinking and reasoning

QUESTION GUIDELINES:
- Start with foundational questions, then progress to advanced topics
- Ask scenario-based or "what if" questions to assess practical knowledge
- Follow up on incomplete or vague answers with "Can you elaborate?" or "Why do you think that?"
- Give the candidate time to think - wait 2-3 seconds after asking
- Listen carefully and take mental notes on accuracy and depth

SCORING CRITERIA (internally track):
- Accuracy of technical knowledge (correct vs incorrect information)
- Depth of understanding (surface level vs comprehensive)
- Ability to apply knowledge to scenarios
- Clear communication and reasoning
- Confidence and ability to handle difficult questions

NOTE: The candidate will indicate when they're ready to be assessed by saying something like "I'm ready", "Let's start the exam", or "I'm prepared". Begin your questions then.
After asking all questions, wait for their signal and be ready to provide results.`,
  };

  return `You are a professional interviewer and knowledge assessor.

SESSION CONTEXT:
- Topic: ${topic}
- Additional Context: ${context}
- Mode: ${mode}

YOUR ROLE:
${modeInstructions[mode] || modeInstructions.conversation}

IMPORTANT GUIDELINES:
${
  mode === "certification"
    ? `- Introduce yourself and the certification exam clearly
- Start by asking the candidate if they're ready to begin
- Ask thoughtful, progressive questions to assess their knowledge
- Be professional but conversational
- Give them space to think and respond fully
- Provide helpful feedback if they struggle with a question`
    : `- You MUST start in PHASE 1 (listening mode). Introduce yourself very briefly (one sentence) and tell the user to begin whenever they're ready.
- Do NOT ask questions or interrupt during Phase 1. This is the most important rule.
- Only move to Phase 2 when the user EXPLICITLY says they are done and ready for questions.
- In Phase 2, keep your questions concise (1-2 at a time) to let the user practice responding.
- Be encouraging but honest.`
}`;
}

// Create a new session and get realtime token
router.post("/start", async (req: Request, res: Response) => {
  try {
    const { topic, context, mode, voice, dataSource } = req.body;

    if (!topic || !mode) {
      res.status(400).json({ error: "Topic and mode are required" });
      return;
    }

    const sessionId = uuidv4();
    const instructions = buildInstructions(topic, context || "", mode);

    const realtimeSession = await createRealtimeSession(instructions, voice || "alloy");

    const session: Session = {
      id: sessionId,
      topic,
      context: context || "",
      dataSource: dataSource || "",
      mode,
      transcript: [],
      startedAt: new Date().toISOString(),
    };

    sessions.set(sessionId, session);

    res.json({
      sessionId,
      clientSecret: realtimeSession.client_secret,
      realtimeSession,
    });
  } catch (error: any) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update transcript during session
router.post("/:id/transcript", (req: Request, res: Response) => {
  const session = sessions.get(req.params.id as string);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { role, text } = req.body;
  session.transcript.push({
    role,
    text,
    timestamp: new Date().toISOString(),
  });

  res.json({ ok: true });
});

// End session and get assessment
router.post("/:id/end", async (req: Request, res: Response) => {
  const session = sessions.get(req.params.id as string);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Allow frontend to send final transcript
  if (req.body.transcript && Array.isArray(req.body.transcript)) {
    session.transcript = req.body.transcript;
  }

  session.endedAt = new Date().toISOString();

  if (session.transcript.length < 2) {
    res.status(400).json({
      error: "Not enough conversation to assess. Please have a longer session.",
    });
    return;
  }

  try {
    let assessment;
    if (session.mode === "certification") {
      assessment = await generateCertificationAssessment(session);
    } else {
      assessment = await generateAssessment(session);
    }
    res.json({ assessment });
  } catch (error: any) {
    console.error("Error generating assessment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get session info
router.get("/:id", (req: Request, res: Response) => {
  const session = sessions.get(req.params.id as string);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ session });
});

export default router;
