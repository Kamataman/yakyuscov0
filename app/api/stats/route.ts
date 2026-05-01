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

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("teamId")

  // チームの試合IDを取得
  let gameIds: string[] = []
  if (teamId) {
    const { data: games } = await supabase
      .from("games")
      .select("id")
      .eq("team_id", teamId)
    gameIds = games?.map(g => g.id) || []
  }

  // 全打撃結果を取得
  let resultsQuery = supabase.from("batting_results").select("*")
  if (teamId && gameIds.length > 0) {
    resultsQuery = resultsQuery.in("game_id", gameIds)
  } else if (teamId) {
    // チームに試合がない場合は空を返す
    return NextResponse.json({ batting: [], pitching: [] })
  }
  const { data: allResults, error: resultsError } = await resultsQuery

  if (resultsError) {
    return NextResponse.json({ error: resultsError.message }, { status: 500 })
  }

  // 打順エントリーを取得（助っ人を除く、選手名JOINで解決）
  let lineupQuery = supabase
    .from("lineup_entries")
    .select("player_id, player_name, game_id, batting_order, is_helper, players(name)")
    .eq("is_helper", false)
  if (teamId && gameIds.length > 0) {
    lineupQuery = lineupQuery.in("game_id", gameIds)
  }
  const { data: lineupEntries, error: lineupError } = await lineupQuery

  if (lineupError) {
    return NextResponse.json({ error: lineupError.message }, { status: 500 })
  }

  // 打順エントリーから選手とゲームの紐付けを作成（削除済み選手はスキップ）
  const battingOrderMap = new Map<string, { playerId: string; playerName: string }>()
  for (const entry of lineupEntries || []) {
    if (!entry.player_id) continue
    const key = `${entry.game_id}-${entry.batting_order}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const players = (entry as any).players as { name: string } | null
    battingOrderMap.set(key, {
      playerId: entry.player_id,
      playerName: players?.name || entry.player_name,
    })
  }

  // 選手ごとの結果をグループ化
  const playerResultsMap = new Map<string, {
    name: string
    results: Array<{
      hit_result: HitResult
      rbi_count: number
      scored?: boolean
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
      scored: result.scored,
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

  // 投手成績を取得（助っ人を除外、選手名JOINで解決）
  let pitcherQuery = supabase.from("pitcher_results").select("*, players(name)").eq("is_helper", false)
  if (teamId && gameIds.length > 0) {
    pitcherQuery = pitcherQuery.in("game_id", gameIds)
  }
  const { data: pitcherResults, error: pitcherError } = await pitcherQuery

  if (pitcherError) {
    return NextResponse.json({ error: pitcherError.message }, { status: 500 })
  }

  // 投手ごとにグループ化（削除済み選手はスキップ）
  const pitcherResultsMap = new Map<string, {
    name: string
    results: Array<{
      outs_pitched: number
      hits: number
      runs: number
      earned_runs: number
      strikeouts: number
      walks: number
      hit_by_pitch: number
      home_runs: number
      batters_faced: number
      is_win: boolean
      is_lose: boolean
      is_save: boolean
      is_hold: boolean
    }>
  }>()

  for (const result of pitcherResults || []) {
    if (!result.player_id) continue
    const pitcherId = result.player_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pitcherPlayers = (result as any).players as { name: string } | null
    const pitcherName = pitcherPlayers?.name || result.player_name

    if (!pitcherResultsMap.has(pitcherId)) {
      pitcherResultsMap.set(pitcherId, {
        name: pitcherName,
        results: [],
      })
    }

    pitcherResultsMap.get(pitcherId)!.results.push({
      outs_pitched: result.innings_outs || 0,
      hits: result.hits || 0,
      runs: result.runs || 0,
      earned_runs: result.earned_runs || 0,
      strikeouts: result.strikeouts || 0,
      walks: result.walks || 0,
      hit_by_pitch: result.hit_by_pitch || 0,
      home_runs: result.home_runs || 0,
      batters_faced: result.batters_faced || 0,
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
