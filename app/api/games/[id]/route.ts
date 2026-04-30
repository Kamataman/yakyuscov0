import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 試合基本情報を取得
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single()

  if (gameError) {
    return NextResponse.json({ error: gameError.message }, { status: 404 })
  }

  // イニングスコアを取得
  const { data: inningScores } = await supabase
    .from("inning_scores")
    .select("*")
    .eq("game_id", id)
    .order("inning")

  // 打順を取得（選手名をJOINで解決）
  const { data: rawLineupEntries } = await supabase
    .from("lineup_entries")
    .select("*, players(name)")
    .eq("game_id", id)
    .order("batting_order")
    .order("entered_inning", { nullsFirst: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineupEntries = (rawLineupEntries || []).map((entry: any) => ({
    ...entry,
    player_name: entry.players?.name || entry.player_name,
    players: undefined,
  }))

  // 打撃結果を取得
  const { data: battingResults } = await supabase
    .from("batting_results")
    .select("*")
    .eq("game_id", id)

  // 投手成績を取得（選手名をJOINで解決）
  const { data: rawPitcherResults } = await supabase
    .from("pitcher_results")
    .select("*, players(name)")
    .eq("game_id", id)
    .order("order_index")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pitcherResults = (rawPitcherResults || []).map((result: any) => ({
    ...result,
    player_name: result.players?.name || result.player_name,
    players: undefined,
  }))

  return NextResponse.json({
    game,
    inningScores: inningScores || [],
    lineupEntries,
    battingResults: battingResults || [],
    pitcherResults,
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()

  const { date, opponent, location, memo, inningScores, lineupSlots, battingResults, pitchers } = body

  // 管理者権限チェック（この試合のチームの管理者かどうか）
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 })
  }

  // この試合が管理者のチームのものか確認
  const { data: game } = await supabase
    .from("games")
    .select("team_id")
    .eq("id", id)
    .single()

  if (!game || game.team_id !== session.teamId) {
    return NextResponse.json({ error: "この試合にアクセスできません" }, { status: 403 })
  }

  // 試合基本情報を更新
  const { error: gameError } = await supabase
    .from("games")
    .update({
      date,
      opponent,
      location,
      memo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (gameError) {
    return NextResponse.json({ error: gameError.message }, { status: 500 })
  }

  // 既存データを削除
  await supabase.from("inning_scores").delete().eq("game_id", id)
  await supabase.from("lineup_entries").delete().eq("game_id", id)
  await supabase.from("batting_results").delete().eq("game_id", id)
  await supabase.from("pitcher_results").delete().eq("game_id", id)

  // イニングスコアを挿入
  if (inningScores && inningScores.length > 0) {
    const scoreInserts = inningScores.map((score: { our: number; opponent: number }, index: number) => ({
      game_id: id,
      inning: index + 1,
      our_score: score.our,
      opponent_score: score.opponent,
    }))
    await supabase.from("inning_scores").insert(scoreInserts)
  }

  // 打順を挿入
  if (lineupSlots) {
    const lineupInserts: Array<{
      game_id: string
      batting_order: number
      player_id: string | null
      player_name: string
      position: string | null
      is_substitute: boolean
      entered_inning: number | null
      is_helper: boolean
    }> = []

    for (const slot of lineupSlots) {
      for (const entry of slot.entries) {
        lineupInserts.push({
          game_id: id,
          batting_order: slot.order,
          player_id: entry.playerId || null,
          player_name: entry.playerName,
          position: entry.position || null,
          is_substitute: entry.isSubstitute || false,
          entered_inning: entry.enteredInning || null,
          is_helper: entry.isHelper || false,
        })
      }
    }
    
    if (lineupInserts.length > 0) {
      await supabase.from("lineup_entries").insert(lineupInserts)
    }
  }

  // 打撃結果を挿入
  if (battingResults) {
    const resultInserts: Array<{
      game_id: string
      batting_order: number
      inning: number
      at_bat_sequence: number
      hit_result: string
      direction: string | null
      rbi_count: number
      runner_first: boolean
      runner_second: boolean
      runner_third: boolean
      stolen_second: boolean
      stolen_third: boolean
      stolen_home: boolean
      memo: string | null
    }> = []

    for (const [key, result] of Object.entries(battingResults)) {
      const parts = key.split("-")
      const order = Number(parts[0])
      const inning = Number(parts[1])
      const atBatSeq = Number(parts[2] ?? 1)
      const r = result as {
        hitResult: string
        direction?: string
        rbiCount: number
        runners?: { first: boolean; second: boolean; third: boolean }
        stolenBases?: { second: boolean; third: boolean; home: boolean }
        memo?: string
      }

      resultInserts.push({
        game_id: id,
        batting_order: order,
        inning: inning,
        at_bat_sequence: atBatSeq,
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
      })
    }
    
    if (resultInserts.length > 0) {
      await supabase.from("batting_results").insert(resultInserts)
    }
  }

  // 投手成績を挿入
  if (pitchers && pitchers.length > 0) {
    const pitcherInserts = pitchers.map((p: {
      playerId?: string
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
      isHelper?: boolean
    }, index: number) => ({
      game_id: id,
      player_id: p.playerId && p.playerId.trim() !== "" ? p.playerId : null,
      player_name: p.playerName,
      innings_pitched: p.inningsPitched,
      hits: p.hits,
      runs: p.runs,
      earned_runs: p.earnedRuns,
      strikeouts: p.strikeouts,
      walks: p.walks,
      hit_by_pitch: p.hitByPitch,
      home_runs: p.homeRuns,
      pitch_count: p.pitchCount || null,
      is_win: p.isWin || false,
      is_lose: p.isLose || false,
      is_save: p.isSave || false,
      is_hold: p.isHold || false,
      is_helper: p.isHelper || false,
      order_index: index,
    }))
    await supabase.from("pitcher_results").insert(pitcherInserts)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // 管理者権限チェック
  const session = await requireAdmin()
  if (!session) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 401 })
  }

  // この試合が管理者のチームのものか確認
  const { data: game } = await supabase
    .from("games")
    .select("team_id")
    .eq("id", id)
    .single()

  if (!game || game.team_id !== session.teamId) {
    return NextResponse.json({ error: "この試合にアクセスできません" }, { status: 403 })
  }

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
