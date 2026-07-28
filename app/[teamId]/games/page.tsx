import type { Metadata } from "next"
import Link from "next/link"
import { Calendar, MapPin, PlusCircle } from "lucide-react"
import { buildTeamDescription, fetchTeamSeoProfile, noindexMetadata } from "@/lib/seo"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"
import { cn } from "@/lib/utils"

interface GameWithScores {
  id: string
  date: string
  opponent: string
  location?: string
  inning_scores: { inning: number; our_score: number; opponent_score: number }[]
}

interface Props {
  params: Promise<{ teamId: string }>
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

export default async function GamesListPage({ params }: Props) {
  const { teamId } = await params
  const supabase = createServiceClient()

  const [gamesResult, adminSession] = await Promise.all([
    supabase
      .from("games")
      .select("id, date, opponent, location, inning_scores(inning, our_score, opponent_score)")
      .eq("team_id", teamId)
      .order("date", { ascending: false }),
    requireTeamAdmin(teamId),
  ])

  const games = (gamesResult.data ?? []) as unknown as GameWithScores[]
  const isAdmin = !!adminSession

  const getTotalScore = (scores: GameWithScores["inning_scores"]) => ({
    our: scores.reduce((sum, s) => sum + (s.our_score || 0), 0),
    opponent: scores.reduce((sum, s) => sum + (s.opponent_score || 0), 0),
  })

  const getResult = (scores: GameWithScores["inning_scores"]) => {
    const total = getTotalScore(scores)
    if (total.our > total.opponent) return "win"
    if (total.our < total.opponent) return "lose"
    return "draw"
  }

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

        {games.length === 0 ? (
          <div className="border border-border p-8 text-center">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">まだ試合が記録されていません</p>
          </div>
        ) : (
          <div className="divide-y divide-border border-y border-border">
            {games.map((game) => {
              const total = getTotalScore(game.inning_scores || [])
              const result = getResult(game.inning_scores || [])
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
