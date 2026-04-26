import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// 試合一覧を取得
export async function GET() {
  const supabase = await createClient()
  
  const { data: games, error } = await supabase
    .from("games")
    .select(`
      *,
      inning_scores (inning, our_score, opponent_score)
    `)
    .order("date", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(games)
}

// 新しい試合を作成
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { date, opponent, location, memo, inningScores, lineupSlots, battingResults, pitchers } = body

  // 試合を作成
  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      date,
      opponent,
      location,
      memo,
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
      position: string | null
      is_substitute: boolean
      entered_inning: number | null
    }[] = []
    
    lineupSlots.forEach((slot: { order: number; entries: Array<{ playerId: string; playerName: string; position?: string; isSubstitute?: boolean; enteredInning?: number }> }) => {
      slot.entries.forEach((entry) => {
        if (entry.playerName && entry.playerName.trim() !== "") {
          lineupData.push({
            game_id: gameId,
            batting_order: slot.order,
            player_id: entry.playerId || null,
            player_name: entry.playerName,
            position: entry.position || null,
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
        inningsPitched: number
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
      }, index: number) => ({
        game_id: gameId,
        player_id: p.playerId && p.playerId.trim() !== "" ? p.playerId : null,
        player_name: p.playerName,
        innings_pitched: p.inningsPitched || 0,
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
