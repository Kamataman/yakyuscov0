import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { calculateBattingStats, calculatePitchingStats, type BattingStats, type PitchingStats } from "@/lib/stats"
import type { HitResult } from "@/lib/batting-types"

export interface PlayerBattingStatsResponse {
  playerId: string
  playerName: string
  stats: BattingStats
}

export interface PlayerPitchingStatsResponse {
  playerId: string
  playerName: string
  stats: PitchingStats
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
  const battingStatsResponse: PlayerBattingStatsResponse[] = []

  for (const [playerId, data] of playerResultsMap) {
    const stats = calculateBattingStats(data.results, data.gameIds.size)
    battingStatsResponse.push({
      playerId,
      playerName: data.name,
      stats,
    })
  }

  // 打席数でソート
  battingStatsResponse.sort((a, b) => b.stats.plateAppearances - a.stats.plateAppearances)

  // 投手成績を取得
  const { data: pitcherResults, error: pitcherError } = await supabase
    .from("pitcher_results")
    .select("*")

  if (pitcherError) {
    return NextResponse.json({ error: pitcherError.message }, { status: 500 })
  }

  // 投手ごとにグループ化
  const pitcherResultsMap = new Map<string, {
    name: string
    results: Array<{
      innings_pitched: number
      hits: number
      runs: number
      earned_runs: number
      strikeouts: number
      walks: number
      hit_by_pitch: number
      home_runs: number
      is_win: boolean
      is_lose: boolean
      is_save: boolean
      is_hold: boolean
    }>
  }>()

  for (const result of pitcherResults || []) {
    const pitcherId = result.player_id || result.player_name
    const pitcherName = result.player_name

    if (!pitcherResultsMap.has(pitcherId)) {
      pitcherResultsMap.set(pitcherId, {
        name: pitcherName,
        results: [],
      })
    }

    pitcherResultsMap.get(pitcherId)!.results.push({
      innings_pitched: result.innings_pitched || 0,
      hits: result.hits || 0,
      runs: result.runs || 0,
      earned_runs: result.earned_runs || 0,
      strikeouts: result.strikeouts || 0,
      walks: result.walks || 0,
      hit_by_pitch: result.hit_by_pitch || 0,
      home_runs: result.home_runs || 0,
      is_win: result.is_win || false,
      is_lose: result.is_lose || false,
      is_save: result.is_save || false,
      is_hold: result.is_hold || false,
    })
  }

  // 各投手の統計を計算
  const pitchingStatsResponse: PlayerPitchingStatsResponse[] = []

  for (const [pitcherId, data] of pitcherResultsMap) {
    const stats = calculatePitchingStats(data.results)
    pitchingStatsResponse.push({
      playerId: pitcherId,
      playerName: data.name,
      stats,
    })
  }

  // 登板数でソート
  pitchingStatsResponse.sort((a, b) => b.stats.games - a.stats.games)

  return NextResponse.json({
    batting: battingStatsResponse,
    pitching: pitchingStatsResponse,
  })
}
