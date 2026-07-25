import { getAdminSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getAdminSession();

  return NextResponse.json({ teamId: session?.teamId ?? null });
}
