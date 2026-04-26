import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireGameAccess } from "@/lib/auth"

// イニングスコアを保存（都度保存用）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const body = await request.json()
  const { inning, ourScore, opponentScore, shareToken } = body

  // アクセス権チェック
  const session = await requireGameAccess(gameId, shareToken)
  if (!session) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 401 })
  }

  const supabase = await createClient()

  // upsert（あれば更新、なければ挿入）
  const { error } = await supabase
    .from("inning_scores")
    .upsert(
      {
        game_id: gameId,
        inning,
        our_score: ourScore,
        opponent_score: opponentScore,
      },
      {
        onConflict: "game_id,inning",
      }
    )

  if (error) {
    // conflict keyがない場合は delete & insert で対応
    await supabase
      .from("inning_scores")
      .delete()
      .eq("game_id", gameId)
      .eq("inning", inning)

    const { error: insertError } = await supabase
      .from("inning_scores")
      .insert({
        game_id: gameId,
        inning,
        our_score: ourScore,
        opponent_score: opponentScore,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
