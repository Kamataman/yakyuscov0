import Link from "next/link"
import { Calendar, MapPin, PlusCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { requireTeamAdmin } from "@/lib/auth"

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

export default async function GamesListPage({ params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()

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
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {isAdmin && (
          <Link
            href={`/${teamId}/games/new`}
            className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.98]"
          >
            <PlusCircle className="h-5 w-5" />
            <span className="font-bold">新しい試合を記録</span>
          </Link>
        )}

        {games.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-slate-500">まだ試合が記録されていません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => {
              const total = getTotalScore(game.inning_scores || [])
              const result = getResult(game.inning_scores || [])
              return (
                <Link
                  key={game.id}
                  href={`/${teamId}/games/${game.id}`}
                  className="block rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>{game.date}</span>
                        {game.location && (
                          <>
                            <MapPin className="ml-2 h-4 w-4" />
                            <span>{game.location}</span>
                          </>
                        )}
                      </div>
                      <p className="mt-1 text-lg font-bold text-slate-800">
                        vs {game.opponent}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-block rounded-lg px-3 py-1 text-sm font-bold ${
                          result === "win"
                            ? "bg-emerald-100 text-emerald-700"
                            : result === "lose"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {result === "win" ? "勝" : result === "lose" ? "敗" : "分"}
                      </div>
                      <p className="mt-1 text-2xl font-bold">
                        <span className="text-blue-600">{total.our}</span>
                        <span className="mx-2 text-slate-400">-</span>
                        <span className="text-red-600">{total.opponent}</span>
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
