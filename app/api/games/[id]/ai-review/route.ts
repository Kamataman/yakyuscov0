import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { getReviewGenerator } from "@/lib/ai/provider"
import { isGameContentThin } from "@/lib/ai/thin-check"
import { buildReviewPrompt } from "@/lib/ai/prompt"
import { resolveEffectivePitcherStats } from "@/lib/ai/pitcher-stats"
import { calculateGameTotals } from "@/lib/game-score"
import { AI_REVIEW_MAX_REGENERATE_COUNT } from "@/lib/constants"

interface GameRow {
  team_id: string
  date: string
  opponent: string
  location: string | null
  is_first_batting: boolean | null
  total_innings: number | null
  last_inning_x: boolean | null
  last_inning_x_score: number | null
  ai_review_count: number
}

const THIN_CONTENT_MESSAGE = "試合内容を充実させてください"
const EXTERNAL_ERROR_MESSAGE = "時間をおいて再度お試しください"
const GENERATION_FAILED_MESSAGE = "戦評の生成に失敗しました。時間をおいて再度お試しください。"

// AI試合戦評を生成・再生成する
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const supabase = createServiceClient()

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("team_id, date, opponent, location, is_first_batting, total_innings, last_inning_x, last_inning_x_score, ai_review_count")
    .eq("id", gameId)
    .single<GameRow>()

  if (gameError || !game) {
    // Next.js App RouterはRoute Handlerでもstatus 404を組み込みのnot-foundページに差し替えるため、
    // JSONボディを届けるにはこのAPIでは404を使わない
    return NextResponse.json({ error: "試合が見つかりません" }, { status: 400 })
  }

  const session = await requireTeamAdmin(game.team_id)
  if (!session) {
    return NextResponse.json({ error: "権限がありません" }, { status: 401 })
  }

  const generator = getReviewGenerator()
  if (!generator) {
    return NextResponse.json({ error: "AI戦評機能は現在利用できません" }, { status: 503 })
  }

  if (game.ai_review_count >= AI_REVIEW_MAX_REGENERATE_COUNT) {
    return NextResponse.json({ error: "再生成の上限（3回）に達しています" }, { status: 429 })
  }

  const [teamResult, inningScoresResult, lineupResult, battingResult, pitcherResult] = await Promise.all([
    supabase.from("teams").select("name").eq("id", game.team_id).single(),
    supabase.from("inning_scores").select("inning, our_score, opponent_score").eq("game_id", gameId),
    supabase.from("lineup_entries").select("batting_order, player_name, is_substitute, entered_inning").eq("game_id", gameId),
    supabase
      .from("batting_results")
      .select("batting_order, inning, at_bat_sequence, hit_result, direction, rbi_count, scored")
      .eq("game_id", gameId),
    supabase
      .from("pitcher_results")
      .select("id, player_name, innings_outs, is_mid_inning_exit, hits, runs, earned_runs, strikeouts, walks, hit_by_pitch, home_runs, pitcher_award")
      .eq("game_id", gameId),
  ])

  const teamName = teamResult.data?.name ?? "自チーム"
  const inningScores = inningScoresResult.data ?? []
  const lineupEntries = lineupResult.data ?? []
  const battingResults = battingResult.data ?? []
  const rawPitcherResults = pitcherResult.data ?? []

  // 投手成績は「イニングごと」入力の場合、pitcher_resultsの集計カラムが未入力(0)のままになりうるため、
  // pitcher_inning_statsの合計で実効値に補正する（表示側と同じロジック）
  const pitcherIds = rawPitcherResults.map((p) => p.id)
  const inningStatsResult =
    pitcherIds.length > 0
      ? await supabase
          .from("pitcher_inning_stats")
          .select("pitcher_result_id, inning, outs, runs, hits, strikeouts, earned_runs, walks, hit_by_pitch, home_runs")
          .in("pitcher_result_id", pitcherIds)
          .order("inning")
      : { data: [] }
  const inningStatsByPitcherId = new Map<string, typeof inningStatsResult.data>()
  for (const stat of inningStatsResult.data ?? []) {
    const list = inningStatsByPitcherId.get(stat.pitcher_result_id) ?? []
    list.push(stat)
    inningStatsByPitcherId.set(stat.pitcher_result_id, list)
  }
  const pitcherResults = rawPitcherResults.map((p) =>
    resolveEffectivePitcherStats(p, inningStatsByPitcherId.get(p.id) ?? [])
  )

  if (
    isGameContentThin({
      battingResults: battingResults.length,
      pitcherResults: pitcherResults.length,
      inningsPlayed: inningScores.length,
      lineupEntries: lineupEntries.length,
    })
  ) {
    return NextResponse.json({ error: THIN_CONTENT_MESSAGE }, { status: 422 })
  }

  const { our: ourTotal, opponent: opponentTotal } = calculateGameTotals(game, inningScores)

  const { system, user } = buildReviewPrompt({
    game: { date: game.date, opponent: game.opponent, location: game.location, teamName },
    ourTotal,
    opponentTotal,
    inningScores,
    lineupEntries,
    battingResults,
    pitcherResults,
  })

  let reviewText: string
  let resolvedModelId: string
  try {
    const result = await generator.generate(system, user)
    reviewText = result.text
    resolvedModelId = result.resolvedModelId
  } catch (err) {
    console.error("AI戦評の生成に失敗しました:", err)
    // 生成開始後の失敗は、離脱していても次回訪問時に気づけるようDBに保存する
    await supabase.from("games").update({ ai_review_error: EXTERNAL_ERROR_MESSAGE }).eq("id", gameId)
    return NextResponse.json({ error: EXTERNAL_ERROR_MESSAGE }, { status: 503 })
  }

  if (reviewText.length < 60 || reviewText.length > 220) {
    console.error(`AI戦評の文字数が想定外です(${reviewText.length}字): ${reviewText}`)
    await supabase.from("games").update({ ai_review_error: GENERATION_FAILED_MESSAGE }).eq("id", gameId)
    return NextResponse.json({ error: GENERATION_FAILED_MESSAGE }, { status: 500 })
  }

  const generatedAt = new Date().toISOString()
  const newCount = game.ai_review_count + 1

  const { error: updateError } = await supabase
    .from("games")
    .update({
      ai_review: reviewText,
      ai_review_generated_at: generatedAt,
      ai_review_model: resolvedModelId,
      ai_review_count: newCount,
      ai_review_error: null,
    })
    .eq("id", gameId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    review: reviewText,
    generatedAt,
    model: resolvedModelId,
    count: newCount,
  })
}

// AI試合戦評を削除する（生成回数のカウントは維持する）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params
  const supabase = createServiceClient()

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("team_id")
    .eq("id", gameId)
    .single()

  if (gameError || !game) {
    return NextResponse.json({ error: "試合が見つかりません" }, { status: 400 })
  }

  const session = await requireTeamAdmin(game.team_id)
  if (!session) {
    return NextResponse.json({ error: "権限がありません" }, { status: 401 })
  }

  const { error } = await supabase
    .from("games")
    .update({ ai_review: null, ai_review_generated_at: null, ai_review_model: null, ai_review_error: null })
    .eq("id", gameId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
