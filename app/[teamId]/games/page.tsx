import type { Metadata } from "next"
import Link from "next/link"
import { Calendar, MapPin, PlusCircle } from "lucide-react"
import { buildTeamDescription, fetchTeamSeoProfile, noindexMetadata } from "@/lib/seo"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"
import { SeasonFilter } from "@/components/season-filter"
import { TeamRecordSummary } from "@/components/team-record-summary"
import { cn } from "@/lib/utils"
import {
  calculateGameTotals,
  getGameResult,
  summarizeTeamRecord,
  type GameResult,
  type InningScoreLike,
} from "@/lib/game-score"
import { filterBySeason, formatSeasonLabel, listSeasonYears, resolveSeason } from "@/lib/season"

interface GameWithScores {
  id: string
  date: string
  opponent: string
  location?: string
  total_innings: number | null
  is_first_batting: boolean | null
  last_inning_x: boolean | null
  last_inning_x_score: number | null
  inning_scores: InningScoreLike[]
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
    title: `${team.name}の試合結果`,
    description: buildTeamDescription(team, "試合結果一覧"),
    alternates: { canonical: `/${teamId}/games` },
  }
}

export default async function GamesListPage({ params, searchParams }: Props) {
  const { teamId } = await params
  const { season: seasonParam } = await searchParams
  const supabase = createServiceClient()

  const [gamesResult, adminSession] = await Promise.all([
    supabase
      .from("games")
      .select(
        "id, date, opponent, location, total_innings, is_first_batting, last_inning_x, last_inning_x_score, inning_scores(inning, our_score, opponent_score)"
      )
      .eq("team_id", teamId)
      .order("date", { ascending: false }),
    requireTeamAdmin(teamId),
  ])

  const games = (gamesResult.data ?? []) as unknown as GameWithScores[]
  const isAdmin = !!adminSession

  // 年度は試合日から導出する。年度が選ばれていない場合は今年（今年の試合がなければ直近の年度）
  const seasons = listSeasonYears(games)
  const season = resolveSeason(seasonParam, seasons)
  const seasonGames = filterBySeason(games, season)

  // 一覧の各試合でも使う勝敗を先に確定させ、サマリーと表示で同じ結果を使う
  const gameResults = new Map<string, { result: GameResult; our: number; opponent: number }>()
  for (const game of seasonGames) {
    const total = calculateGameTotals(game, game.inning_scores || [])
    gameResults.set(game.id, { result: getGameResult(total), our: total.our, opponent: total.opponent })
  }
  const record = summarizeTeamRecord(seasonGames.map((game) => gameResults.get(game.id)!.result))

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {isAdmin && (
          <Link
            href={`/${teamId}/games/new`}
            className="diagonal-cut mb-6 flex items-center justify-center gap-2 bg-turf px-4 py-3 text-turf-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-bold">新しい試合を記録</span>
            <LinkPendingIndicator className="h-5 w-5" />
          </Link>
        )}

        {games.length > 0 && (
          <div className="mb-6">
            <SeasonFilter
              seasons={seasons}
              current={season}
              basePath={`/${teamId}/games`}
              className="mb-3"
            />
            <h2 className="mb-2 text-sm font-bold text-foreground">{formatSeasonLabel(season)}の成績</h2>
            <TeamRecordSummary record={record} />
          </div>
        )}

        {games.length === 0 ? (
          <div className="border border-border p-8 text-center">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">まだ試合が記録されていません</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {seasonGames.map((game) => {
              const total = gameResults.get(game.id)!
              const result = total.result
              return (
                <Link
                  key={game.id}
                  href={`/${teamId}/games/${game.id}`}
                  className="block py-4 transition-colors hover:bg-muted/50 active:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{game.date}</span>
                        {game.location && (
                          <>
                            <MapPin className="ml-2 h-4 w-4" />
                            <span>{game.location}</span>
                          </>
                        )}
                      </div>
                      <p className="mt-1 text-lg font-bold text-foreground">
                        vs {game.opponent}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "inline-block px-3 py-1 text-sm font-bold",
                          result === "win"
                            ? "bg-turf text-turf-foreground"
                            : result === "lose"
                              ? "bg-stitch text-stitch-foreground"
                              : "border border-foreground text-foreground"
                        )}
                      >
                        {result === "win" ? "勝" : result === "lose" ? "敗" : "分"}
                      </div>
                      <p className="font-display text-2xl font-bold text-foreground whitespace-nowrap">
                        {total.our}-{total.opponent}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
