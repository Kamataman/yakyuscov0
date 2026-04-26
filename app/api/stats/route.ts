import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { calculateBattingStats, type BattingStats } from "@/lib/stats"
import type { HitResult } from "@/lib/batting-types"

export interface PlayerStatsResponse {
  playerId: string
  playerName: string
  stats: BattingStats
}

export async function GET() {
  const supabase = await createClient()

  // 全打撃結果を取得
  const { data: allResults, error: resultsError } = await supabase
    .from("batting_results")
    .select("*")

  if (resultsError) {
    return NextResponse.json({ error: resultsError.message }, { status: 500 })
  }

  // 打順エントリーを取得
  const { data: lineupEntries, error: lineupError } = await supabase
    .from("lineup_entries")
    .select("player_id, player_name, game_id, batting_order")

  if (lineupError) {
    return NextResponse.json({ error: lineupError.message }, { status: 500 })
  }

  // 打順エントリーから選手とゲームの紐付けを作成
  const battingOrderMap = new Map<string, { playerId: string; playerName: string }>()
  for (const entry of lineupEntries || []) {
    const key = `${entry.game_id}-${entry.batting_order}`
    battingOrderMap.set(key, {
      playerId: entry.player_id || entry.player_name,
      playerName: entry.player_name,
    })
  }

  // 選手ごとの結果をグループ化
  const playerResultsMap = new Map<string, {
    name: string
    results: Array<{
      hit_result: HitResult
      rbi_count: number
      stolen_second?: boolean
      stolen_third?: boolean
      stolen_home?: boolean
    }>
    gameIds: Set<string>
  }>()

  // 打撃結果を選手ごとに集計
  for (const result of allResults || []) {
    const key = `${result.game_id}-${result.batting_order}`
    const lineup = battingOrderMap.get(key)
    
    if (!lineup) continue
    
    const playerId = lineup.playerId
    const playerName = lineup.playerName

    if (!playerResultsMap.has(playerId)) {
      playerResultsMap.set(playerId, {
        name: playerName,
        results: [],
        gameIds: new Set(),
      })
    }

    const playerData = playerResultsMap.get(playerId)!
    playerData.results.push({
      hit_result: result.hit_result as HitResult,
      rbi_count: result.rbi_count || 0,
      stolen_second: result.stolen_second,
      stolen_third: result.stolen_third,
      stolen_home: result.stolen_home,
    })
    playerData.gameIds.add(result.game_id)
  }

  // 各選手の統計を計算
  const statsResponse: PlayerStatsResponse[] = []

  for (const [playerId, data] of playerResultsMap) {
    const stats = calculateBattingStats(data.results, data.gameIds.size)
    statsResponse.push({
      playerId,
      playerName: data.name,
      stats,
    })
  }

  // 打席数でソート
  statsResponse.sort((a, b) => b.stats.plateAppearances - a.stats.plateAppearances)

  return NextResponse.json(statsResponse)
}
