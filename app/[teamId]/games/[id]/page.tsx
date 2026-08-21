import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Edit } from "lucide-react"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { fetchTeamSeoProfile, noindexMetadata } from "@/lib/seo"
import { cn } from "@/lib/utils"
import type { BattingResult, PitcherInningStats } from "@/lib/batting-types"
import { getResultSummary, isHit, isOnBase } from "@/lib/batting-types"
import { calculateGameTotals } from "@/lib/game-score"
import { isGameContentThin } from "@/lib/ai/thin-check"
import { getReactionState } from "@/lib/reactions"
import { ReactionButton } from "@/components/reaction-button"
import { DeleteButton } from "./delete-button"
import { PitcherResultsSection } from "./pitcher-results-section"
import { AiReviewSection } from "./ai-review-section"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ teamId: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { teamId, id: gameId } = await params
  const supabase = createServiceClient()

  const [team, gameResult] = await Promise.all([
    fetchTeamSeoProfile(teamId),
    supabase.from("games").select("date, opponent, location").eq("id", gameId).maybeSingle(),
  ])

  const game = gameResult.data
  if (!team || !game) return noindexMetadata

  const locationText = game.location ? `${game.location}で開催。` : ""

  return {
    title: `${team.name} vs ${game.opponent}(${game.date})の試合結果`,
    description: `${game.date}に行われた${team.name}対${game.opponent}の試合結果。${locationText}イニング別スコア・打撃成績・投手成績を掲載しています。`,
    alternates: { canonical: `/${teamId}/games/${gameId}` },
  }
}

export default async function GameDetailPage({ params }: Props) {
  const { teamId, id: gameId } = await params
  const supabase = createServiceClient()

  const [adminSession, gameResult, inningScoresResult, rawLineupResult, battingResultsResult, rawPitcherResult, reactionState] =
    await Promise.all([
      requireTeamAdmin(teamId),
      supabase.from("games").select("*").eq("id", gameId).single(),
      supabase.from("inning_scores").select("*").eq("game_id", gameId).order("inning"),
      supabase.from("lineup_entries").select("*, players(name)").eq("game_id", gameId)
        .order("batting_order").order("entered_inning", { nullsFirst: true }),
      supabase.from("batting_results").select("*").eq("game_id", gameId),
      supabase.from("pitcher_results").select("*, players(name)").eq("game_id", gameId).order("order_index"),
      // 件数のみを取得する。押下済みかどうかはIPハッシュを必要とするため、
      // 表示はクライアント側の localStorage に任せ、実際の重複判定は
      // POST /api/reactions 側で行う（公開ページをソルト設定に依存させない）。
      getReactionState({ teamId, targetType: "game", targetId: gameId, kind: "nice_game" }),
    ])

  if (gameResult.error || !gameResult.data) notFound()

  const game = gameResult.data
  const inningScores = inningScoresResult.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineupEntries = (rawLineupResult.data ?? []).map((e: any) => ({
    ...e,
    player_name: e.players?.name || e.player_name,
    players: undefined,
  }))
  const battingResults = battingResultsResult.data ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pitcherResults = (rawPitcherResult.data ?? []).map((r: any) => ({
    ...r,
    player_name: r.players?.name || r.player_name,
    players: undefined,
  }))

  // イニングごとの投手成績を取得
  const pitcherIds = pitcherResults.map((p: { id: string }) => p.id)
  let pitcherInningStatsMap: Record<string, PitcherInningStats[]> = {}
  if (pitcherIds.length > 0) {
    const { data: rawInningStats } = await supabase
      .from("pitcher_inning_stats")
      .select("*")
      .in("pitcher_result_id", pitcherIds)
      .order("inning")
    if (rawInningStats) {
      for (const row of rawInningStats) {
        if (!pitcherInningStatsMap[row.pitcher_result_id]) {
          pitcherInningStatsMap[row.pitcher_result_id] = []
        }
        pitcherInningStatsMap[row.pitcher_result_id].push({
          inning: row.inning,
          outs: row.outs ?? 3,
          runs: row.runs,
          hits: row.hits,
          strikeouts: row.strikeouts,
          earnedRuns: row.earned_runs,
          walks: row.walks,
          hitByPitch: row.hit_by_pitch,
          homeRuns: row.home_runs,
          battersFaced: row.batters_faced,
        })
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pitcherResultsWithInning = pitcherResults.map((p: any) => ({
    ...p,
    inningStats: pitcherInningStatsMap[p.id] ?? [],
  }))
  const isAdmin = !!adminSession
  const canGenerateAiReview = !isGameContentThin({
    battingResults: battingResults.length,
    pitcherResults: pitcherResults.length,
    inningsPlayed: inningScores.length,
    lineupEntries: lineupEntries.length,
  })

  const isFirstBatting = game.is_first_batting ?? true
  const totalInnings = game.total_innings || 9
  const maxInning = totalInnings
  const hasX = game.last_inning_x ?? false
  const xScore = game.last_inning_x_score ?? null

  const { our: ourTotal, opponent: opponentTotal } = calculateGameTotals(game, inningScores)
  const isWin = ourTotal > opponentTotal
  const isLose = ourTotal < opponentTotal

  const lineupByOrder = new Map<number, typeof lineupEntries>()
  for (const entry of lineupEntries) {
    if (!lineupByOrder.has(entry.batting_order)) lineupByOrder.set(entry.batting_order, [])
    lineupByOrder.get(entry.batting_order)!.push(entry)
  }

  const resultsMap = new Map<string, (typeof battingResults)[0]>()
  const atBatSeqsMap: Record<number, number> = {}
  for (const result of battingResults) {
    const seq = result.at_bat_sequence ?? 1
    resultsMap.set(`${result.batting_order}-${result.inning}-${seq}`, result)
    if (!atBatSeqsMap[result.inning] || atBatSeqsMap[result.inning] < seq) {
      atBatSeqsMap[result.inning] = seq
    }
  }
  const maxOrder = Math.max(9, ...lineupEntries.map((e: { batting_order: number }) => e.batting_order))

  type AtBatColumn = { inning: number; sequence: number }
  const columns: AtBatColumn[] = []
  for (let i = 1; i <= maxInning; i++) {
    const maxSeq = atBatSeqsMap[i] ?? 1
    for (let s = 1; s <= maxSeq; s++) columns.push({ inning: i, sequence: s })
  }
  const lastColIndexByInning = new Map<number, number>()
  columns.forEach((col, idx) => lastColIndexByInning.set(col.inning, idx))

  type DisplayRow = {
    battingOrder: number
    playerName: string
    positions: string[]
    activeFrom: number
    activeTo: number
    isStarter: boolean
    isFirstOfOrder: boolean
  }

  const displayRows: DisplayRow[] = []
  for (let order = 1; order <= maxOrder; order++) {
    const entries = lineupByOrder.get(order) ?? []
    const sorted = [...entries].sort((a, b) => {
      if (!a.is_substitute && b.is_substitute) return -1
      if (a.is_substitute && !b.is_substitute) return 1
      return (a.entered_inning ?? 1) - (b.entered_inning ?? 1)
    })
    if (sorted.length === 0) {
      displayRows.push({ battingOrder: order, playerName: "-", positions: [], activeFrom: 1, activeTo: maxInning, isStarter: false, isFirstOfOrder: true })
      continue
    }
    sorted.forEach((entry, idx) => {
      const activeFrom = entry.is_substitute ? (entry.entered_inning ?? 1) : 1
      const activeTo = idx < sorted.length - 1 ? (sorted[idx + 1].entered_inning ?? maxInning) - 1 : maxInning
      displayRows.push({
        battingOrder: order,
        playerName: entry.player_name,
        positions: entry.positions ?? [],
        activeFrom, activeTo,
        isStarter: !entry.is_substitute,
        isFirstOfOrder: idx === 0,
      })
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground md:text-xl">試合結果</h1>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                href={`/${teamId}/games/${gameId}/edit`}
                className="flex items-center gap-2 bg-turf px-4 py-2 text-sm font-bold text-turf-foreground transition-opacity hover:opacity-90"
              >
                <Edit className="h-4 w-4" />
                編集
              </Link>
              <DeleteButton gameId={gameId} teamId={teamId} />
            </div>
          )}
        </div>

        <div className="space-y-3 border-b border-border pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{game.date}</p>
              <p className="text-xl font-black text-foreground md:text-2xl">vs {game.opponent}</p>
              {game.location && <p className="text-sm text-muted-foreground">{game.location}</p>}
              <div className="mt-3">
                <ReactionButton
                  teamId={teamId}
                  targetType="game"
                  targetId={gameId}
                  kind="nice_game"
                  label="ナイスゲーム！"
                  initialCount={reactionState.count}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="font-display whitespace-nowrap text-4xl font-black text-foreground md:text-5xl">
                {ourTotal}-{opponentTotal}
              </div>
              <span
                className={cn(
                  "mt-1 inline-block px-3 py-1 text-sm font-bold",
                  isWin ? "bg-turf text-turf-foreground" : isLose ? "bg-stitch text-stitch-foreground" : "border border-foreground text-foreground"
                )}
              >
                {isWin ? "勝利" : isLose ? "敗戦" : "引分"}
              </span>
            </div>
          </div>
          {game.memo && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground border-t border-border pt-3">{game.memo}</p>
          )}
        </div>

        <AiReviewSection
          gameId={gameId}
          isAdmin={isAdmin}
          aiReview={game.ai_review}
          aiReviewError={game.ai_review_error}
          regenerateCount={game.ai_review_count ?? 0}
          canGenerate={canGenerateAiReview}
          aiFeatureEnabled={!!process.env.AI_API_KEY}
        />

        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground border-b-2 border-foreground pb-1">スコアボード</h2>
          <div className="overflow-x-auto">
            <table className="text-center text-sm border-collapse" style={{ minWidth: `${Math.max(300, 80 + maxInning * 32 + 48)}px` }}>
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 z-10 bg-background w-20 min-w-[80px] px-2 py-1 text-left"></th>
                  {Array.from({ length: maxInning }, (_, i) => (
                    <th key={i} className="w-8 min-w-[32px] px-1 py-1 text-muted-foreground">{i + 1}</th>
                  ))}
                  <th className="sticky right-0 z-10 bg-background w-12 min-w-[48px] px-2 py-1 font-bold">計</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className={cn("sticky left-0 z-10 bg-background w-20 min-w-[80px] px-2 py-2 text-left font-bold whitespace-nowrap", isFirstBatting ? "text-turf" : "text-stitch")}>
                    {isFirstBatting ? "自チーム" : game.opponent}
                  </td>
                  {Array.from({ length: maxInning }, (_, i) => {
                    const inning = i + 1
                    const score = inningScores.find((s: { inning: number }) => s.inning === inning)
                    const val = isFirstBatting ? (score?.our_score ?? 0) : (score?.opponent_score ?? 0)
                    return (
                      <td key={i} className={cn("w-8 min-w-[32px] px-1 py-2", val > 0 && "font-bold text-foreground")}>
                        {val}
                      </td>
                    )
                  })}
                  <td className={cn("sticky right-0 z-10 w-12 min-w-[48px] px-2 py-2 font-bold", isFirstBatting ? "bg-turf-tint" : "bg-stitch-tint")}>
                    {isFirstBatting ? ourTotal : opponentTotal}
                  </td>
                </tr>
                <tr>
                  <td className={cn("sticky left-0 z-10 bg-background w-20 min-w-[80px] px-2 py-2 text-left font-bold whitespace-nowrap truncate max-w-[80px]", isFirstBatting ? "text-stitch" : "text-turf")}>
                    {isFirstBatting ? game.opponent : "自チーム"}
                  </td>
                  {Array.from({ length: maxInning }, (_, i) => {
                    const inning = i + 1
                    const score = inningScores.find((s: { inning: number }) => s.inning === inning)
                    const isXCell = hasX && inning === maxInning
                    if (isXCell) {
                      return (
                        <td key={i} className="w-8 min-w-[32px] px-1 py-2 font-bold text-foreground">
                          {xScore === null ? "✕" : `${xScore}✕`}
                        </td>
                      )
                    }
                    const val = isFirstBatting ? (score?.opponent_score ?? 0) : (score?.our_score ?? 0)
                    return (
                      <td key={i} className={cn("w-8 min-w-[32px] px-1 py-2", val > 0 && "font-bold text-foreground")}>
                        {val}
                      </td>
                    )
                  })}
                  <td className={cn("sticky right-0 z-10 w-12 min-w-[48px] px-2 py-2 font-bold", isFirstBatting ? "bg-stitch-tint" : "bg-turf-tint")}>
                    {isFirstBatting ? opponentTotal : ourTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-foreground border-b-2 border-foreground pb-1">打撃成績</h2>
          <div className="relative overflow-x-auto border border-border">
            <table className="text-center text-sm border-collapse" style={{ minWidth: `${Math.max(400, 176 + columns.length * 56)}px` }}>
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="sticky left-0 z-20 bg-muted w-10 min-w-[40px] px-2 py-2 text-center border-r border-border">打順</th>
                  <th className="sticky left-10 z-20 bg-muted w-10 min-w-[40px] px-1 py-2 text-center border-r border-border">守</th>
                  <th className="sticky left-20 z-20 bg-muted w-24 min-w-[96px] px-2 py-2 text-left border-r border-border">選手</th>
                  {columns.map((col, idx) => {
                    const isLastOfInning = lastColIndexByInning.get(col.inning) === idx
                    return (
                      <th key={`${col.inning}-${col.sequence}`} className={cn("px-1 py-2", col.sequence === 1 ? "w-14 min-w-[56px]" : "w-10 min-w-[40px]", isLastOfInning && "border-r border-border")}>
                        {col.sequence === 1 ? col.inning : <span className="text-muted-foreground text-[10px]">{["②", "③", "④", "⑤"][col.sequence - 2] ?? col.sequence}</span>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <tr key={`${row.battingOrder}-${row.activeFrom}`} className="border-b border-border">
                    <td className="sticky left-0 z-10 bg-background w-10 min-w-[40px] px-2 py-2 text-center font-bold border-r border-border">
                      {row.isStarter ? `(${row.battingOrder})` : row.battingOrder}
                    </td>
                    <td className="sticky left-10 z-10 bg-background w-10 min-w-[40px] px-1 py-2 text-center border-r border-border">
                      {row.positions.length > 0 ? (
                        <div className="flex gap-0.5 justify-center flex-nowrap overflow-hidden">
                          {row.positions.map((p, i) => <span key={i} className="text-xs font-medium text-muted-foreground shrink-0">{p}</span>)}
                        </div>
                      ) : <span className="text-muted-foreground/40 text-xs">-</span>}
                    </td>
                    <td className="sticky left-20 z-10 bg-background w-24 min-w-[96px] px-2 py-2 text-left border-r border-border">
                      <div className="truncate font-medium">{row.playerName}</div>
                    </td>
                    {columns.map((col, idx) => {
                      const isActive = col.inning >= row.activeFrom && col.inning <= row.activeTo
                      const isLastOfInning = lastColIndexByInning.get(col.inning) === idx
                      const cellClass = cn(col.sequence === 1 ? "w-14 min-w-[56px]" : "w-10 min-w-[40px]", "px-1 py-2", isLastOfInning && "border-r border-border")
                      if (!isActive) return <td key={`${col.inning}-${col.sequence}`} className={cn(cellClass, "text-muted-foreground/40")}>-</td>
                      const result = resultsMap.get(`${row.battingOrder}-${col.inning}-${col.sequence}`)
                      if (!result) return <td key={`${col.inning}-${col.sequence}`} className={cn(cellClass, "text-muted-foreground/40")}>-</td>
                      const resultObj: BattingResult = {
                        hitResult: result.hit_result as BattingResult["hitResult"],
                        direction: result.direction as BattingResult["direction"],
                        rbiCount: result.rbi_count,
                        scored: result.scored,
                      }
                      const summary = getResultSummary(resultObj)
                      const hit = isHit(result.hit_result as BattingResult["hitResult"])
                      const onBase = isOnBase(result.hit_result as BattingResult["hitResult"])
                      return (
                        <td key={`${col.inning}-${col.sequence}`} className={cn(cellClass, "text-xs font-medium whitespace-nowrap", hit ? "font-bold text-turf" : onBase ? "text-foreground" : "text-muted-foreground")}>
                          {summary}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <PitcherResultsSection pitchers={pitcherResultsWithInning} totalInnings={totalInnings} />
      </div>
    </main>
  )
}
