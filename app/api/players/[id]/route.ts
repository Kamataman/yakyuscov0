import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

// 選手を更新（管理者のみ）
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { name, number } = body

  // 管理者権限チェック
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 })
  }

  const supabase = await createClient()

  // この選手が管理者のチームのものか確認
  const { data: player } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", id)
    .single()

  if (!player || player.team_id !== session.teamId) {
    return NextResponse.json({ error: "この選手にアクセスできません" }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("players")
    .update({ name, number })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// 選手を削除（管理者のみ）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // 管理者権限チェック
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 })
  }

  const supabase = await createClient()

  // この選手が管理者のチームのものか確認
  const { data: player } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", id)
    .single()

  if (!player || player.team_id !== session.teamId) {
    return NextResponse.json({ error: "この選手にアクセスできません" }, { status: 403 })
  }

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
