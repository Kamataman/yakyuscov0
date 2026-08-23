import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { buildTeamDescription, fetchTeamSeoProfile, noindexMetadata } from "@/lib/seo"
import { calculateBattingStats, calculatePitchingStats, type BattingStats, type PitchingStats } from "@/lib/stats"
import type { HitResult } from "@/lib/batting-types"
import { filterBySeason, listSeasonYears, resolveSeason } from "@/lib/season"
import { buildActiveRanges, resolveEntryForInning, type ActiveRange } from "@/lib/lineup-assignment"
import { StatsClient } from "./stats-client"

interface PlayerBattingStats {
  playerId: string
  playerName: string
  stats: BattingStats
  isQualified: boolean
}

interface PlayerPitchingStats {
  playerId: string
  playerName: string
  stats: PitchingStats
  isQualified: boolean
}

interface Props {
  params: Promise<{ teamId: string }>
  searchParams: Promise<{ season?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId } = await params
  const team = await fetchTeamSeoProfile(teamId)
  if (!team) return noindexMetadata

  return {
    title: `${team.name}の個人成績`,
    description: buildTeamDescription(team, "個人成績(打率・出塁率・OPS・防御率)"),
    alternates: { canonical: `/${teamId}/stats` },
  }
}

export default async function StatsPage({ params, searchParams }: Props) {
  const { teamId } = await params
  const { season: seasonParam } = await searchParams
  const supabase = createServiceClient()

  const [adminSession, gamesResult, teamResult] = await Promise.all([
    requireTeamAdmin(teamId),
    supabase.from("games").select("id, date").eq("team_id", teamId),
    supabase.from("teams").select("qualified_pa_coefficient, qualified_ip_coefficient").eq("id", teamId).single(),
  ])

  // 成績は年度単位で集計する。規定打席・規定投球回もその年度の試合数から算出する
  const allGames = gamesResult.data ?? []
  const seasons = listSeasonYears(allGames)
  const season = resolveSeason(seasonParam, seasons)
  const gameIds = filterBySeason(allGames, season).map((game) => game.id)
  const seasonGamesCount = gameIds.length
  const paCoefficient = teamResult.data?.qualified_pa_coefficient ?? 3.1
  const ipCoefficient = teamResult.data?.qualified_ip_coefficient ?? 1
  const qualifiedPlateAppearances = seasonGamesCount * paCoefficient
  const qualifiedInningsPitched = seasonGamesCount * ipCoefficient

  if (gameIds.length === 0) {
    return (
      <StatsClient
        battingStats={[]}
        pitchingStats={[]}
        isAdmin={!!adminSession}
        teamId={teamId}
        qualifiedPlateAppearances={qualifiedPlateAppearances}
        qualifiedInningsPitched={qualifiedInningsPitched}
        seasons={seasons}
        season={season}
        seasonGamesCount={seasonGamesCount}
      />
    )
  }

  const [battingResultsResult, lineupResult, pitcherResultsResult, allPitcherGameIdsResult] = await Promise.all([
    supabase.from("batting_results").select("*").in("game_id", gameIds),
    supabase.from("lineup_entries")
      .select("player_id, player_name, game_id, batting_order, is_substitute, entered_inning, positions, is_helper, players(name)")
      .in("game_id", gameIds)
      .order("batting_order")
      .order("entered_inning", { nullsFirst: true }),
    supabase.from("pitcher_results")
      .select("*, players(name)")
      .eq("is_helper", false)
      .in("game_id", gameIds),
    // 完投判定用に、助っ人も含めた試合ごとの登板投手数を数える
    supabase.from("pitcher_results")
      .select("game_id")
      .in("game_id", gameIds),
  ])

  // 試合ごとの登板投手数（助っ人を含む）。1人だけならその投手は完投
  const pitcherCountByGame = new Map<string, number>()
  for (const row of allPitcherGameIdsResult.data ?? []) {
    pitcherCountByGame.set(row.game_id, (pitcherCountByGame.get(row.game_id) ?? 0) + 1)
  }

  // イニングごとの成績を取得（存在する場合は集計値として使用）
  const pitcherResultIds = (pitcherResultsResult.data ?? []).map((r: { id: string }) => r.id)
  const inningStatsMap = new Map<string, { hits: number; runs: number; earned_runs: number; strikeouts: number; walks: number; hit_by_pitch: number; home_runs: number; batters_faced: number; outs_pitched: number }>()
  if (pitcherResultIds.length > 0) {
    const { data: inningRows } = await supabase
      .from("pitcher_inning_stats")
      .select("*")
      .in("pitcher_result_id", pitcherResultIds)
    if (inningRows) {
      for (const row of inningRows) {
        const prev = inningStatsMap.get(row.pitcher_result_id) ?? { hits: 0, runs: 0, earned_runs: 0, strikeouts: 0, walks: 0, hit_by_pitch: 0, home_runs: 0, batters_faced: 0, outs_pitched: 0 }
        inningStatsMap.set(row.pitcher_result_id, {
          hits: prev.hits + row.hits,
          runs: prev.runs + row.runs,
          earned_runs: prev.earned_runs + row.earned_runs,
          strikeouts: prev.strikeouts + row.strikeouts,
          walks: prev.walks + row.walks,
          hit_by_pitch: prev.hit_by_pitch + row.hit_by_pitch,
          home_runs: prev.home_runs + row.home_runs,
          batters_faced: prev.batters_faced + row.batters_faced,
          outs_pitched: prev.outs_pitched + (row.outs ?? 3),
        })
      }
    }
  }

  // 打順ごとにエントリーをまとめ、打席を担当するイニング範囲を求める。
  // 助っ人や未登録選手のエントリーも範囲計算には含める（除外するとその打席が
  // 同じ打順の別の選手に加算されてしまうため）。
  type LineupRow = {
    player_id: string | null
    player_name: string
    game_id: string
    batting_order: number
    is_substitute: boolean | null
    entered_inning: number | null
    positions: string[] | null
    is_helper: boolean | null
    players: { name: string } | null
  }
  const lineupRows = (lineupResult.data ?? []) as unknown as LineupRow[]

  const rangesByOrder = new Map<string, ActiveRange<LineupRow>[]>()
  const entriesByOrder = new Map<string, LineupRow[]>()
  for (const entry of lineupRows) {
    const key = `${entry.game_id}-${entry.batting_order}`
    if (!entriesByOrder.has(key)) entriesByOrder.set(key, [])
    entriesByOrder.get(key)!.push(entry)
  }
  for (const [key, entries] of entriesByOrder) {
    rangesByOrder.set(key, buildActiveRanges(entries))
  }

  // 選手ごとの打撃結果を集計
  const playerResultsMap = new Map<string, {
    name: string
    results: Array<{ hit_result: HitResult; rbi_count: number; scored?: boolean; stolen_second?: boolean; stolen_third?: boolean; stolen_home?: boolean; runner_second?: boolean; runner_third?: boolean }>
    gameIds: Set<string>
  }>()

  const ensurePlayerData = (entry: LineupRow) => {
    const playerId = entry.player_id!
    if (!playerResultsMap.has(playerId)) {
      playerResultsMap.set(playerId, {
        name: entry.players?.name || entry.player_name,
        results: [],
        gameIds: new Set(),
      })
    }
    return playerResultsMap.get(playerId)!
  }

  // 試合数は出場登録ベース（打席が無い代走・守備固めも1試合として数える）
  for (const entry of lineupRows) {
    if (entry.is_helper || !entry.player_id) continue
    ensurePlayerData(entry).gameIds.add(entry.game_id)
  }

  for (const result of battingResultsResult.data ?? []) {
    const ranges = rangesByOrder.get(`${result.game_id}-${result.batting_order}`)
    if (!ranges) continue
    const entry = resolveEntryForInning(ranges, result.inning)
    // 助っ人・未登録選手の打席は集計対象外（他の選手には加算しない）
    if (!entry || entry.is_helper || !entry.player_id) continue

    const playerData = ensurePlayerData(entry)
    playerData.results.push({
      hit_result: result.hit_result as HitResult,
      rbi_count: result.rbi_count || 0,
      scored: result.scored,
      stolen_second: result.stolen_second,
      stolen_third: result.stolen_third,
      stolen_home: result.stolen_home,
      runner_second: result.runner_second,
      runner_third: result.runner_third,
    })
  }

  const battingStats: PlayerBattingStats[] = []
  for (const [playerId, data] of playerResultsMap) {
    const stats = calculateBattingStats(data.results, data.gameIds.size)
    battingStats.push({
      playerId,
      playerName: data.name,
      stats,
      isQualified: stats.plateAppearances >= qualifiedPlateAppearances,
    })
  }
  battingStats.sort((a, b) => b.stats.plateAppearances - a.stats.plateAppearances)

  // 投手ごとの成績を集計
  const pitcherResultsMap = new Map<string, {
    name: string
    results: Array<{ outs_pitched: number; hits: number; runs: number; earned_runs: number; strikeouts: number; walks: number; hit_by_pitch: number; home_runs: number; batters_faced: number; pitcher_award: string | null; isCompleteGame: boolean; isShutout: boolean }>
  }>()

  for (const result of pitcherResultsResult.data ?? []) {
    if (!result.player_id) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pitcherPlayerData = (result as any).players as { name: string } | null
    const pitcherName = pitcherPlayerData?.name || result.player_name

    // イニングデータがある場合はその合計を使用、なければ集約フィールドを使用
    const inning = inningStatsMap.get(result.id)

    // 完投 = その試合の投手が自分1人だけ / 完封 = 完投かつ失点0
    const runs = inning ? inning.runs : (result.runs || 0)
    const isCompleteGame = pitcherCountByGame.get(result.game_id) === 1
    const isShutout = isCompleteGame && runs === 0

    if (!pitcherResultsMap.has(result.player_id)) {
      pitcherResultsMap.set(result.player_id, { name: pitcherName, results: [] })
    }
    pitcherResultsMap.get(result.player_id)!.results.push({
      outs_pitched: inning ? inning.outs_pitched : (result.innings_outs || 0),
      hits: inning ? inning.hits : (result.hits || 0),
      runs,
      earned_runs: inning ? inning.earned_runs : (result.earned_runs || 0),
      strikeouts: inning ? inning.strikeouts : (result.strikeouts || 0),
      walks: inning ? inning.walks : (result.walks || 0),
      hit_by_pitch: inning ? inning.hit_by_pitch : (result.hit_by_pitch || 0),
      home_runs: inning ? inning.home_runs : (result.home_runs || 0),
      batters_faced: inning ? inning.batters_faced : (result.batters_faced || 0),
      pitcher_award: result.pitcher_award ?? null,
      isCompleteGame,
      isShutout,
    })
  }

  const pitchingStats: PlayerPitchingStats[] = []
  for (const [pitcherId, data] of pitcherResultsMap) {
    const stats = calculatePitchingStats(data.results)
    pitchingStats.push({
      playerId: pitcherId,
      playerName: data.name,
      stats,
      isQualified: stats.inningsPitched >= qualifiedInningsPitched,
    })
  }
  pitchingStats.sort((a, b) => b.stats.games - a.stats.games)

  return (
    <StatsClient
      battingStats={battingStats}
      pitchingStats={pitchingStats}
      isAdmin={!!adminSession}
      teamId={teamId}
      qualifiedPlateAppearances={qualifiedPlateAppearances}
      qualifiedInningsPitched={qualifiedInningsPitched}
      seasons={seasons}
      season={season}
      seasonGamesCount={seasonGamesCount}
    />
  )
}
