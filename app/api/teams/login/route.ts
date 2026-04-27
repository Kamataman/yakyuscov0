import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

  // Supabase Auth でログイン
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data.user) {
    const message =
      error?.message === "Email not confirmed"
        ? "メールアドレスの確認が完了していません。登録時に送信されたメールのリンクをクリックしてください。"
        : "メールアドレスまたはパスワードが正しくありません"
    return NextResponse.json({ error: message }, { status: 401 })
  }

  // ログインユーザーが対象チームの管理者か確認
  const userTeamId = data.user.user_metadata?.team_id as string | undefined
  if (userTeamId !== teamId) {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: "このチームの管理者ではありません" },
      { status: 403 }
    )
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .single()

  return NextResponse.json({
    success: true,
    team: {
      id: team?.id ?? teamId,
      name: team?.name ?? "",
    },
  })
}
