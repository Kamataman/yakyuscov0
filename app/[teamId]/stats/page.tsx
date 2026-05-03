import { createClient } from "@/lib/supabase/server"
import { requireTeamAdmin } from "@/lib/auth"
import { calculateBattingStats, calculatePitchingStats, type BattingStats, type PitchingStats } from "@/lib/stats"
import type { HitResult } from "@/lib/batting-types"
import { StatsClient } from "./stats-client"

interface PlayerBattingStats {
  playerId: string
  playerName: string
  stats: BattingStats
}

interface PlayerPitchingStats {
  playerId: string
  playerName: string
  stats: PitchingStats
}

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function StatsPage({ params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()

  const [adminSession, gamesResult] = await Promise.all([
    requireTeamAdmin(teamId),
    supabase.from("games").select("id").eq("team_id", teamId),
  ])

  const gameIds = gamesResult.data?.map((g) => g.id) ?? []

  if (gameIds.length === 0) {
    return (
      <StatsClient
        battingStats={[]}
        pitchingStats={[]}
        isAdmin={!!adminSession}
        teamId={teamId}
      />
    )
  }

  const [battingResultsResult, lineupResult, pitcherResultsResult] = await Promise.all([
    supabase.from("batting_results").select("*").in("game_id", gameIds),
    supabase.from("lineup_entries")
      .select("player_id, player_name, game_id, batting_order, is_helper, players(name)")
      .eq("is_helper", false)
      .in("game_id", gameIds),
    supabase.from("pitcher_results")
      .select("*, players(name)")
      .eq("is_helper", false)
      .in("game_id", gameIds),
  ])

  // イニングごとの成績を取得（存在する場合は集計値として使用）
  const pitcherResultIds = (pitcherResultsResult.data ?? []).map((r: { id: string }) => r.id)
  const inningStatsMap = new Map<string, { hits: number; runs: number; earned_runs: number; strikeouts: number; walks: number; hit_by_pitch: number; home_runs: number; batters_faced: number }>()
  if (pitcherResultIds.length > 0) {
    const { data: inningRows } = await supabase
      .from("pitcher_inning_stats")
      .select("*")
      .in("pitcher_result_id", pitcherResultIds)
    if (inningRows) {
      for (const row of inningRows) {
        const prev = inningStatsMap.get(row.pitcher_result_id) ?? { hits: 0, runs: 0, earned_runs: 0, strikeouts: 0, walks: 0, hit_by_pitch: 0, home_runs: 0, batters_faced: 0 }
        inningStatsMap.set(row.pitcher_result_id, {
          hits: prev.hits + row.hits,
          runs: prev.runs + row.runs,
          earned_runs: prev.earned_runs + row.earned_runs,
          strikeouts: prev.strikeouts + row.strikeouts,
          walks: prev.walks + row.walks,
          hit_by_pitch: prev.hit_by_pitch + row.hit_by_pitch,
          home_runs: prev.home_runs + row.home_runs,
          batters_faced: prev.batters_faced + row.batters_faced,
        })
      }
    }
  }

  // 打順エントリーから選手とゲームの紐付けを作成
  const battingOrderMap = new Map<string, { playerId: string; playerName: string }>()
  for (const entry of lineupResult.data ?? []) {
    if (!entry.player_id) continue
    const key = `${entry.game_id}-${entry.batting_order}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerData = (entry as any).players as { name: string } | null
    battingOrderMap.set(key, {
      playerId: entry.player_id,
      playerName: playerData?.name || entry.player_name,
    })
  }

  // 選手ごとの打撃結果を集計
  const playerResultsMap = new Map<string, {
    name: string
    results: Array<{ hit_result: HitResult; rbi_count: number; scored?: boolean; stolen_second?: boolean; stolen_third?: boolean; stolen_home?: boolean }>
    gameIds: Set<string>
  }>()

  for (const result of battingResultsResult.data ?? []) {
    const key = `${result.game_id}-${result.batting_order}`
    const lineup = battingOrderMap.get(key)
    if (!lineup) continue

    if (!playerResultsMap.has(lineup.playerId)) {
      playerResultsMap.set(lineup.playerId, { name: lineup.playerName, results: [], gameIds: new Set() })
    }
    const playerData = playerResultsMap.get(lineup.playerId)!
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

  const battingStats: PlayerBattingStats[] = []
  for (const [playerId, data] of playerResultsMap) {
    battingStats.push({
      playerId,
      playerName: data.name,
      stats: calculateBattingStats(data.results, data.gameIds.size),
    })
  }
  battingStats.sort((a, b) => b.stats.plateAppearances - a.stats.plateAppearances)

  // 投手ごとの成績を集計
  const pitcherResultsMap = new Map<string, {
    name: string
    results: Array<{ outs_pitched: number; hits: number; runs: number; earned_runs: number; strikeouts: number; walks: number; hit_by_pitch: number; home_runs: number; batters_faced: number; pitcher_award: string | null }>
  }>()

  for (const result of pitcherResultsResult.data ?? []) {
    if (!result.player_id) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pitcherPlayerData = (result as any).players as { name: string } | null
    const pitcherName = pitcherPlayerData?.name || result.player_name

    // イニングデータがある場合はその合計を使用、なければ集約フィールドを使用
    const inning = inningStatsMap.get(result.id)

    if (!pitcherResultsMap.has(result.player_id)) {
      pitcherResultsMap.set(result.player_id, { name: pitcherName, results: [] })
    }
    pitcherResultsMap.get(result.player_id)!.results.push({
      outs_pitched: result.innings_outs || 0,
      hits: inning ? inning.hits : (result.hits || 0),
      runs: inning ? inning.runs : (result.runs || 0),
      earned_runs: inning ? inning.earned_runs : (result.earned_runs || 0),
      strikeouts: inning ? inning.strikeouts : (result.strikeouts || 0),
      walks: inning ? inning.walks : (result.walks || 0),
      hit_by_pitch: inning ? inning.hit_by_pitch : (result.hit_by_pitch || 0),
      home_runs: inning ? inning.home_runs : (result.home_runs || 0),
      batters_faced: inning ? inning.batters_faced : (result.batters_faced || 0),
      pitcher_award: result.pitcher_award ?? null,
    })
  }

  const pitchingStats: PlayerPitchingStats[] = []
  for (const [pitcherId, data] of pitcherResultsMap) {
    pitchingStats.push({
      playerId: pitcherId,
      playerName: data.name,
      stats: calculatePitchingStats(data.results),
    })
  }
  pitchingStats.sort((a, b) => b.stats.games - a.stats.games)

  return (
    <StatsClient
      battingStats={battingStats}
      pitchingStats={pitchingStats}
      isAdmin={!!adminSession}
      teamId={teamId}
    />
  )
}
