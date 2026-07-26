import { requireTeamAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");

  if (!teamId) {
    return NextResponse.json({ teamId: null, role: null });
  }

  const session = await requireTeamAdmin(teamId);

  return NextResponse.json({
    teamId: session?.teamId ?? null,
    role: session?.role ?? null,
  });
}
