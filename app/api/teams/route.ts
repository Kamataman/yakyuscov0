import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  // userId はクライアント側でsupabase.auth.signUp()を実行した後に取得したもの
  const { id, name, adminEmail, userId } = body

  if (!id || !name || !adminEmail || !userId) {
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

  const { error } = await supabase
    .from("teams")
    .insert({
      id,
      name,
      admin_email: adminEmail,
      user_id: userId,
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

  const { data, error } = await supabase
    .from("teams")
    .select("id, name, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
