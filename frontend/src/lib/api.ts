const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function startSession(data: {
  topic: string;
  context: string;
  mode: string;
  voice: string;
}) {
  const res = await fetch(`${API_URL}/api/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function endSession(
  sessionId: string,
  transcript: { role: string; text: string; timestamp: string }[]
) {
  const res = await fetch(`${API_URL}/api/session/${sessionId}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
