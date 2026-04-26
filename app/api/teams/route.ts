import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { id, name, adminEmail, adminPassword } = body

  // バリデーション
  if (!id || !name || !adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "すべての項目を入力してください" },
      { status: 400 }
    )
  }

  // チームIDの形式チェック（英数字とハイフンのみ）
  if (!/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json(
      { error: "チームIDは英小文字、数字、ハイフンのみ使用できます" },
      { status: 400 }
    )
  }

  // チームIDの重複チェック
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

  // パスワードハッシュ化
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  // チーム作成
  const { error } = await supabase
    .from("teams")
    .insert({
      id,
      name,
      admin_email: adminEmail,
      admin_password_hash: passwordHash,
    })

  if (error) {
    console.error("Error creating team:", error)
    return NextResponse.json(
      { error: "チームの作成に失敗しました" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, teamId: id })
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

  // 全チーム一覧（管理用）
  const { data, error } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
