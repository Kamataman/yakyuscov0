import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireGameAccess } from "@/lib/auth"

// 打撃結果を保存（都度保存用）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const body = await request.json()
  const { battingOrder, inning, atBatSequence = 1, result, shareToken } = body

  // アクセス権チェック
  const session = await requireGameAccess(gameId, shareToken)
  if (!session) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 401 })
  }

  const supabase = await createClient()

  // 既存の結果を削除
  await supabase
    .from("batting_results")
    .delete()
    .eq("game_id", gameId)
    .eq("batting_order", battingOrder)
    .eq("inning", inning)
    .eq("at_bat_sequence", atBatSequence)

  // 結果がある場合は挿入
  if (result && result.hitResult) {
    const { error } = await supabase
      .from("batting_results")
      .insert({
        game_id: gameId,
        batting_order: battingOrder,
        inning: inning,
        at_bat_sequence: atBatSequence,
        hit_result: result.hitResult,
        direction: result.direction || null,
        rbi_count: result.rbiCount || 0,
        scored: result.scored || false,
        runner_first: result.runners?.first || false,
        runner_second: result.runners?.second || false,
        runner_third: result.runners?.third || false,
        stolen_second: result.stolenBases?.second || false,
        stolen_third: result.stolenBases?.third || false,
        stolen_home: result.stolenBases?.home || false,
        memo: result.memo || null,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}

// 打撃結果を削除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const { searchParams } = new URL(request.url)
  const battingOrder = parseInt(searchParams.get("battingOrder") || "0")
  const inning = parseInt(searchParams.get("inning") || "0")
  const atBatSequence = parseInt(searchParams.get("atBatSequence") || "1")
  const shareToken = searchParams.get("shareToken") || undefined

  const session = await requireGameAccess(gameId, shareToken)
  if (!session) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 401 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("batting_results")
    .delete()
    .eq("game_id", gameId)
    .eq("batting_order", battingOrder)
    .eq("inning", inning)
    .eq("at_bat_sequence", atBatSequence)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
