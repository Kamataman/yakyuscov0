import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireGameAccess } from "@/lib/auth"

interface PitcherResult {
  playerId?: string
  playerName: string
  outsPitched: number
  isMidInningExit: boolean
  hits: number
  runs: number
  earnedRuns: number
  strikeouts: number
  walks: number
  hitByPitch: number
  homeRuns: number
  pitchCount?: number
  isWin?: boolean
  isLose?: boolean
  isSave?: boolean
  isHold?: boolean
  isHelper?: boolean
}

// 投手成績を保存（都度保存用 - 全体を置き換え）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const body = await request.json()
  const { pitchers, shareToken } = body as {
    pitchers: PitcherResult[]
    shareToken?: string
  }

  // アクセス権チェック
  const session = await requireGameAccess(gameId, shareToken)
  if (!session) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 401 })
  }

  const supabase = await createClient()

  // 既存の投手成績を削除
  await supabase
    .from("pitcher_results")
    .delete()
    .eq("game_id", gameId)

  // 新しい投手成績を挿入
  if (pitchers && pitchers.length > 0) {
    const validPitchers = pitchers.filter(p => p.playerName && p.playerName.trim() !== "")
    
    if (validPitchers.length > 0) {
      const insertData = validPitchers.map((p, index) => ({
        game_id: gameId,
        player_id: p.playerId && p.playerId.trim() !== "" ? p.playerId : null,
        player_name: p.playerName,
        innings_outs: p.outsPitched || 0,
        is_mid_inning_exit: p.isMidInningExit || false,
        hits: p.hits || 0,
        runs: p.runs || 0,
        earned_runs: p.earnedRuns || 0,
        strikeouts: p.strikeouts || 0,
        walks: p.walks || 0,
        hit_by_pitch: p.hitByPitch || 0,
        home_runs: p.homeRuns || 0,
        pitch_count: p.pitchCount || null,
        is_win: p.isWin || false,
        is_lose: p.isLose || false,
        is_save: p.isSave || false,
        is_hold: p.isHold || false,
        is_helper: p.isHelper || false,
        order_index: index,
      }))

      const { error } = await supabase
        .from("pitcher_results")
        .insert(insertData)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true })
}
