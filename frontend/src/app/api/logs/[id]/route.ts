import { NextRequest, NextResponse } from "next/server";
import { getLog } from "@/lib/store";
import { verifyToken } from "@/lib/auth";

export const runtime = "nodejs";

// GET — fetch a single session log by ID (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const log = getLog(id);
  if (!log) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ log });
}
