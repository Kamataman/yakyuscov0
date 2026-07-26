import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"
import { requireTeamAdmin, generateShareToken } from "@/lib/auth"

// 共有トークンを取得または作成
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const supabase = createServiceClient()

  // この試合が所属するチームを確認
  const { data: game } = await supabase
    .from("games")
    .select("team_id")
    .eq("id", gameId)
    .single()

  if (!game) {
    return NextResponse.json({ error: "この試合にアクセスできません" }, { status: 403 })
  }

  // 管理者権限チェック
  const session = await requireTeamAdmin(game.team_id)
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 })
  }

  // 既存の有効なトークンを確認
  const { data: existingToken } = await supabase
    .from("game_share_tokens")
    .select("token, expires_at")
    .eq("game_id", gameId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (existingToken) {
    return NextResponse.json({
      token: existingToken.token,
      expiresAt: existingToken.expires_at,
      isNew: false,
    })
  }

  // 新しいトークンを作成（24時間有効）
  const token = generateShareToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  const { error } = await supabase
    .from("game_share_tokens")
    .insert({
      game_id: gameId,
      token,
      expires_at: expiresAt.toISOString(),
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    token,
    expiresAt: expiresAt.toISOString(),
    isNew: true,
  })
}

// 共有トークンを無効化
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params

  const supabase = createServiceClient()

  // この試合が所属するチームを確認
  const { data: game } = await supabase
    .from("games")
    .select("team_id")
    .eq("id", gameId)
    .single()

  if (!game) {
    return NextResponse.json({ error: "この試合にアクセスできません" }, { status: 403 })
  }

  const session = await requireTeamAdmin(game.team_id)
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 })
  }

  // 全てのトークンを削除
  await supabase
    .from("game_share_tokens")
    .delete()
    .eq("game_id", gameId)

  return NextResponse.json({ success: true })
}
