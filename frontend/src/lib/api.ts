function getApiKey(): string {
  const key = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : null;
  if (!key) throw new Error("OpenAI API key not found. Please go back and enter your key.");
  return key;
}

export async function startSession(data: {
  topic: string;
  context: string;
  mode: string;
  voice: string;
  dataSource?: string;
}) {
  const res = await fetch(`/api/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, apiKey: getApiKey() }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function endSession(
  sessionId: string,
  meta: { topic: string; context: string; mode: string; startedAt: string },
  transcript: { role: string; text: string; timestamp: string }[]
) {
  const res = await fetch(`/api/session/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      ...meta,
      transcript,
      endedAt: new Date().toISOString(),
      apiKey: getApiKey(),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
