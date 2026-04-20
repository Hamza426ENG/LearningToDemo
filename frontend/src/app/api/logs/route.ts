import { NextRequest, NextResponse } from "next/server";
import { addLog, getAllLogs, updateLog, SessionLog } from "@/lib/store";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

// POST — create a new session log (public)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userName, userEmail, topic, mode, voice, context, dataSource } = body;

    if (!id || !userName || !userEmail || !topic || !mode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log: SessionLog = {
      id,
      userName,
      userEmail,
      topic,
      mode,
      voice: voice || "alloy",
      context: context || "",
      dataSource: dataSource || "",
      startedAt: new Date().toISOString(),
      status: "active",
    };

    addLog(log);
    return NextResponse.json({ ok: true, log });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — list all logs (admin only)
export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ logs: getAllLogs() });
}

// PUT — update an existing log (public — called when session ends)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing session id" }, { status: 400 });
    }

    const updated = updateLog(id, data);
    if (!updated) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, log: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
