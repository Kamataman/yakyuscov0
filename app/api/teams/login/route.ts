import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { teamId, email, password } = body

  if (!teamId || !email || !password) {
    return NextResponse.json(
      { error: "すべての項目を入力してください" },
      { status: 400 }
    )
  }

  // チーム取得
  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single()

  if (error || !team) {
    return NextResponse.json(
      { error: "チームが見つかりません" },
      { status: 404 }
    )
  }

  // メールアドレス確認
  if (team.admin_email !== email) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません" },
      { status: 401 }
    )
  }

  // パスワード確認
  const isValid = await bcrypt.compare(password, team.admin_password_hash)
  if (!isValid) {
    return NextResponse.json(
      { error: "メールアドレスまたはパスワードが正しくありません" },
      { status: 401 }
    )
  }

  // セッションCookieを設定
  const cookieStore = await cookies()
  cookieStore.set(`team_session_${teamId}`, JSON.stringify({
    teamId: team.id,
    teamName: team.name,
    isAdmin: true,
    loginAt: new Date().toISOString(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1週間
    path: "/",
  })

  return NextResponse.json({
    success: true,
    team: {
      id: team.id,
      name: team.name,
    },
  })
}
