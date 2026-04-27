import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { id, name, adminEmail, adminPassword } = body
  const origin = request.headers.get("origin") ?? "http://localhost:3000"

  if (!id || !name || !adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "すべての項目を入力してください" },
      { status: 400 }
    )
  }

  if (!/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json(
      { error: "チームIDは英小文字、数字、ハイフンのみ使用できます" },
      { status: 400 }
    )
  }

  const { data: existingTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("id", id)
    .single()

  if (existingTeam) {
    return NextResponse.json(
      { error: "このチームIDはすでに使用されています" },
      { status: 400 }
    )
  }

  // Supabase Auth でユーザーを作成（team_id をメタデータに保存）
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      data: { team_id: id },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  })

  if (authError || !authData.user) {
    console.error("Error creating auth user:", authError)
    return NextResponse.json(
      { error: authError?.message || "ユーザーの作成に失敗しました" },
      { status: 500 }
    )
  }

  // identities が空 = 既存メールに対するobfuscated response（メール列挙攻撃対策）
  // この場合 authData.user.id はDBに存在しないダミーIDなのでFK違反になる
  if (!authData.session && authData.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "このメールアドレスはすでに使用されています" },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("teams")
    .insert({
      id,
      name,
      admin_email: adminEmail,
      user_id: authData.user.id,
    })

  if (error) {
    console.error("Error creating team:", error)
    return NextResponse.json(
      { error: `チームの作成に失敗しました: ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    teamId: id,
    emailConfirmationRequired: !authData.session,
  })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("id")

  if (teamId) {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, created_at")
      .eq("id", teamId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "チームが見つかりません" }, { status: 404 })
    }

    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
