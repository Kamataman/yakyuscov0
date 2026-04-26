import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireGameAccess } from "@/lib/auth"

// 試合基本情報を更新（都度保存用）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const body = await request.json()
  const { date, opponent, location, memo, isFirstBatting, totalInnings, shareToken } = body

  // アクセス権チェック
  const session = await requireGameAccess(gameId, shareToken)
  if (!session) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 401 })
  }

  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (date !== undefined) updateData.date = date
  if (opponent !== undefined) updateData.opponent = opponent
  if (location !== undefined) updateData.location = location
  if (memo !== undefined) updateData.memo = memo
  if (isFirstBatting !== undefined) updateData.is_first_batting = isFirstBatting
  if (totalInnings !== undefined) updateData.total_innings = totalInnings

  const { error } = await supabase
    .from("games")
    .update(updateData)
    .eq("id", gameId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
