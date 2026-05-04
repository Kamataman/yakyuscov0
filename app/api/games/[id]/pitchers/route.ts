import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireGameAccess } from "@/lib/auth"

interface PitcherInningStatsInput {
  inning: number
  outs: number
  runs: number
  hits: number
  strikeouts: number
  earnedRuns: number
  walks: number
  hitByPitch: number
  homeRuns: number
  battersFaced: number
}

interface PitcherResultInput {
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
  battersFaced?: number
  pitchCount?: number
  award?: string | null
  isHelper?: boolean
  inningStats?: PitcherInningStatsInput[]
}

// 投手成績を保存（都度保存用 - 全体を置き換え）
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const body = await request.json()
  const { pitchers, shareToken } = body as {
    pitchers: PitcherResultInput[]
    shareToken?: string
  }

  // アクセス権チェック
  const session = await requireGameAccess(gameId, shareToken)
  if (!session) {
    return NextResponse.json({ error: "アクセス権限がありません" }, { status: 401 })
  }

  const supabase = await createClient()

  // 既存の投手成績を削除（CASCADE で pitcher_inning_stats も削除）
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
        batters_faced: p.battersFaced || 0,
        pitch_count: p.pitchCount || null,
        pitcher_award: p.award ?? null,
        is_helper: p.isHelper || false,
        order_index: index,
      }))

      const { data: insertedPitchers, error } = await supabase
        .from("pitcher_results")
        .insert(insertData)
        .select("id, order_index")

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // イニングごとの成績を挿入
      if (insertedPitchers) {
        const inningInserts: Array<{
          pitcher_result_id: string
          inning: number
          outs: number
          runs: number
          hits: number
          strikeouts: number
          earned_runs: number
          walks: number
          hit_by_pitch: number
          home_runs: number
          batters_faced: number
        }> = []

        for (const inserted of insertedPitchers) {
          const pitcher = validPitchers[inserted.order_index]
          if (pitcher?.inningStats && pitcher.inningStats.length > 0) {
            for (const s of pitcher.inningStats) {
              inningInserts.push({
                pitcher_result_id: inserted.id,
                inning: s.inning,
                outs: s.outs ?? 3,
                runs: s.runs,
                hits: s.hits,
                strikeouts: s.strikeouts,
                earned_runs: s.earnedRuns,
                walks: s.walks,
                hit_by_pitch: s.hitByPitch,
                home_runs: s.homeRuns,
                batters_faced: s.battersFaced,
              })
            }
          }
        }

        if (inningInserts.length > 0) {
          const { error: inningError } = await supabase
            .from("pitcher_inning_stats")
            .insert(inningInserts)
          if (inningError) {
            return NextResponse.json({ error: inningError.message }, { status: 500 })
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}
