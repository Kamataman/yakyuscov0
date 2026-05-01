import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireTeamAdmin } from "@/lib/auth"

// 試合一覧を取得
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const teamId = searchParams.get("teamId")

  let query = supabase
    .from("games")
    .select(`
      *,
      inning_scores (inning, our_score, opponent_score)
    `)
    .order("date", { ascending: false })

  if (teamId) {
    query = query.eq("team_id", teamId)
  }

  const { data: games, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(games)
}

// 新しい試合を作成（管理者のみ）
export async function POST(request: Request) {
  const body = await request.json()
  const { teamId, date, opponent, location, memo, isFirstBatting, totalInnings, inningScores, lineupSlots, battingResults, pitchers } = body

  // 管理者権限チェック
  const session = await requireTeamAdmin(teamId)
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 })
  }

  const supabase = await createClient()

  // 試合を作成
  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      team_id: teamId || null,
      date,
      opponent,
      location,
      memo,
      is_first_batting: isFirstBatting ?? true,
      total_innings: totalInnings ?? 9,
    })
    .select()
    .single()

  if (gameError) {
    return NextResponse.json({ error: gameError.message }, { status: 500 })
  }

  const gameId = game.id

  // イニングスコアを保存
  if (inningScores && inningScores.length > 0) {
    const scoresData = inningScores.map((score: { our: number; opponent: number }, index: number) => ({
      game_id: gameId,
      inning: index + 1,
      our_score: score.our,
      opponent_score: score.opponent,
    }))

    const { error: scoresError } = await supabase
      .from("inning_scores")
      .insert(scoresData)

    if (scoresError) {
      console.error("Error saving inning scores:", scoresError)
    }
  }

  // 打順を保存
  if (lineupSlots && lineupSlots.length > 0) {
    const lineupData: {
      game_id: string
      batting_order: number
      player_id: string | null
      player_name: string
      positions: string[] | null
      is_substitute: boolean
      entered_inning: number | null
    }[] = []

    lineupSlots.forEach((slot: { order: number; entries: Array<{ playerId: string; playerName: string; positions?: string[]; isSubstitute?: boolean; enteredInning?: number }> }) => {
      slot.entries.forEach((entry) => {
        if (entry.playerName && entry.playerName.trim() !== "") {
          lineupData.push({
            game_id: gameId,
            batting_order: slot.order,
            player_id: entry.playerId || null,
            player_name: entry.playerName,
            positions: entry.positions && entry.positions.length > 0 ? entry.positions : null,
            is_substitute: entry.isSubstitute || false,
            entered_inning: entry.enteredInning || null,
          })
        }
      })
    })

    if (lineupData.length > 0) {
      const { error: lineupError } = await supabase
        .from("lineup_entries")
        .insert(lineupData)

      if (lineupError) {
        console.error("Error saving lineup:", lineupError)
      }
    }
  }

  // 打撃結果を保存
  if (battingResults && Object.keys(battingResults).length > 0) {
    const resultsData = Object.entries(battingResults).map(([key, result]) => {
      const [order, inning] = key.split("-").map(Number)
      const r = result as {
        hitResult: string
        direction?: string
        rbiCount: number
        runners?: { first: boolean; second: boolean; third: boolean }
        stolenBases?: { second: boolean; third: boolean; home: boolean }
        memo?: string
      }
      return {
        game_id: gameId,
        batting_order: order,
        inning: inning,
        hit_result: r.hitResult,
        direction: r.direction || null,
        rbi_count: r.rbiCount || 0,
        runner_first: r.runners?.first || false,
        runner_second: r.runners?.second || false,
        runner_third: r.runners?.third || false,
        stolen_second: r.stolenBases?.second || false,
        stolen_third: r.stolenBases?.third || false,
        stolen_home: r.stolenBases?.home || false,
        memo: r.memo || null,
      }
    })

    const { error: resultsError } = await supabase
      .from("batting_results")
      .insert(resultsData)

    if (resultsError) {
      console.error("Error saving batting results:", resultsError)
    }
  }

  // 投手成績を保存
  if (pitchers && pitchers.length > 0) {
    const pitchersData = pitchers
      .filter((p: { playerName?: string }) => p.playerName && p.playerName.trim() !== "")
      .map((p: {
        playerId: string
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
        award?: string | null
        isHelper?: boolean
      }, index: number) => ({
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
        pitcher_award: p.award ?? null,
        is_helper: p.isHelper || false,
        order_index: index,
      }))

    if (pitchersData.length > 0) {
      const { error: pitchersError } = await supabase
        .from("pitcher_results")
        .insert(pitchersData)

      if (pitchersError) {
        console.error("Error saving pitchers:", pitchersError)
      }
    }
  }

  return NextResponse.json({ id: gameId, success: true })
}
