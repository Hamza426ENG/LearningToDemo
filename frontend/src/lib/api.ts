export async function startSession(data: {
  topic: string;
  context: string;
  mode: string;
  voice: string;
}) {
  const res = await fetch(`/api/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
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
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
