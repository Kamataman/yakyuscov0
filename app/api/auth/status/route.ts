import { NextResponse, type NextRequest } from "next/server"
import { getAdminSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("teamId")
  
  const session = await getAdminSession()
  
  // 特定のチームに対する管理者権限をチェック
  const isAdmin = !!session && (!teamId || session.teamId === teamId)
  
  return NextResponse.json({
    isLoggedIn: !!session,
    isAdmin,
    teamId: session?.teamId || null,
  })
}
