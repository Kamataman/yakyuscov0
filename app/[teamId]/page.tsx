import Link from "next/link"
import { Calendar, Users, PlusCircle, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { requireTeamAdmin } from "@/lib/auth"

interface GameSummary {
  id: string
  date: string
  opponent: string
  inning_scores: { our_score: number; opponent_score: number }[]
}

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function TeamDashboardPage({ params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()

  const [gamesResult, playersResult, adminSession] = await Promise.all([
    supabase
      .from("games")
      .select("id, date, opponent, inning_scores(our_score, opponent_score)")
      .eq("team_id", teamId)
      .order("date", { ascending: false }),
    supabase
      .from("players")
      .select("id")
      .eq("team_id", teamId),
    requireTeamAdmin(teamId),
  ])

  const games = (gamesResult.data ?? []) as unknown as GameSummary[]
  const playerCount = playersResult.data?.length ?? 0
  const isAdmin = !!adminSession

  const getTotalScore = (scores: GameSummary["inning_scores"]) => ({
    our: scores?.reduce((sum, s) => sum + (s.our_score || 0), 0) || 0,
    opponent: scores?.reduce((sum, s) => sum + (s.opponent_score || 0), 0) || 0,
  })

  const getResult = (scores: GameSummary["inning_scores"]) => {
    const total = getTotalScore(scores)
    if (total.our > total.opponent) return "win"
    if (total.our < total.opponent) return "lose"
    return "draw"
  }

  const recentGames = games.slice(0, 3)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* クイックアクション（管理者のみ表示） */}
        {isAdmin && (
          <div className="mb-8">
            <Link
              href={`/${teamId}/games/new`}
              className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-xl active:scale-[0.98]"
            >
              <PlusCircle className="h-6 w-6" />
              <span className="text-lg font-bold">新しい試合を記録</span>
            </Link>
          </div>
        )}

        {/* ナビゲーションカード */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 試合一覧 */}
          <Link
            href={`/${teamId}/games`}
            className="group rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-100 p-3">
                <Calendar className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600">
                  試合一覧
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  過去の試合結果を確認・編集
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <span>{games.length} 試合</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 個人成績 */}
          <Link
            href={`/${teamId}/stats`}
            className="group rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-100 p-3">
                <TrendingUp className="h-7 w-7 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-amber-600">
                  個人成績
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  選手ごとの打撃・投手成績を確認
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <span>{playerCount} 選手</span>
                </div>
              </div>
            </div>
          </Link>

          {/* 選手一覧 */}
          <Link
            href={`/${teamId}/players`}
            className="group rounded-2xl bg-white p-6 shadow-md transition-all hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-purple-100 p-3">
                <Users className="h-7 w-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-purple-600">
                  選手一覧
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  登録選手の確認
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <span>{playerCount} 選手登録済み</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 直近の試合 */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-slate-800">直近の試合</h2>
          <div className="rounded-2xl bg-white p-6 shadow-md">
            {recentGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-3 h-12 w-12 text-slate-300" />
                <p className="text-slate-500">まだ試合が記録されていません</p>
                {isAdmin && (
                  <Link
                    href={`/${teamId}/games/new`}
                    className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    最初の試合を記録する
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentGames.map((game) => {
                  const total = getTotalScore(game.inning_scores || [])
                  const result = getResult(game.inning_scores || [])
                  return (
                    <Link
                      key={game.id}
                      href={`/${teamId}/games/${game.id}`}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-all hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm text-slate-500">{game.date}</p>
                        <p className="font-bold text-slate-800">vs {game.opponent}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded px-2 py-0.5 text-xs font-bold ${
                            result === "win"
                              ? "bg-emerald-100 text-emerald-700"
                              : result === "lose"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {result === "win" ? "勝" : result === "lose" ? "敗" : "分"}
                        </div>
                        <span className="text-lg font-bold">
                          <span className="text-blue-600">{total.our}</span>
                          <span className="mx-1 text-slate-400">-</span>
                          <span className="text-red-600">{total.opponent}</span>
                        </span>
                      </div>
                    </Link>
                  )
                })}
                {games.length > 3 && (
                  <Link
                    href={`/${teamId}/games`}
                    className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    すべての試合を見る
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
