import Link from "next/link"
import Image from "next/image"
import { Calendar, PlusCircle, Shield, ImageIcon } from "lucide-react"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { fetchTeamHeaderImage, fetchTeamImages } from "@/lib/team-images-server"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"

interface GameSummary {
  id: string
  date: string
  opponent: string
  inning_scores: { our_score: number; opponent_score: number }[]
}

interface TeamProfileExtra {
  description: string | null
}

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function TeamDashboardPage({ params }: Props) {
  const { teamId } = await params
  const supabase = createServiceClient()

  const [gamesResult, nameResult, profileResult, adminSession, headerImage, photos] = await Promise.all([
    supabase
      .from("games")
      .select("id, date, opponent, inning_scores(our_score, opponent_score)")
      .eq("team_id", teamId)
      .order("date", { ascending: false }),
    supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single(),
    supabase
      .from("teams")
      .select("description")
      .eq("id", teamId)
      .maybeSingle(),
    requireTeamAdmin(teamId),
    fetchTeamHeaderImage(teamId),
    fetchTeamImages(teamId, "photo"),
  ])

  const games = (gamesResult.data ?? []) as unknown as GameSummary[]
  const teamName = nameResult.data?.name ?? teamId
  const profile = profileResult.data as TeamProfileExtra | null
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
        {/* チームプロフィール */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-md">
          {/* ヘッダー画像 */}
          <div className="flex h-40 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-100 to-slate-200 md:h-56">
            {headerImage ? (
              <Image
                src={headerImage.url}
                alt={teamName}
                width={headerImage.width ?? 1200}
                height={headerImage.height ?? 400}
                className="h-full w-full object-cover"
                style={{ objectPosition: `50% ${headerImage.positionY}%` }}
                priority
              />
            ) : (
              <Shield className="h-16 w-16 text-blue-300 md:h-20 md:w-20" />
            )}
          </div>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800">{teamName}</h1>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
              {profile?.description || "チーム紹介文は準備中です"}
            </p>

            {/* チーム写真カルーセル */}
            <div className="mt-6">
              <h2 className="mb-3 text-sm font-bold text-slate-700">チーム写真</h2>
              <Carousel className="mx-auto w-full max-w-xl">
                <CarouselContent>
                  {photos.length === 0 ? (
                    <CarouselItem>
                      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200">
                        <ImageIcon className="h-10 w-10 text-slate-400" />
                      </div>
                    </CarouselItem>
                  ) : (
                    photos.map((photo) => (
                      <CarouselItem key={photo.id}>
                        <Image
                          src={photo.url}
                          alt={`${teamName}のチーム写真`}
                          width={photo.width ?? 640}
                          height={photo.height ?? 360}
                          className="aspect-[16/9] w-full rounded-xl object-cover"
                        />
                      </CarouselItem>
                    ))
                  )}
                </CarouselContent>
                {photos.length > 1 && (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                  </>
                )}
              </Carousel>
            </div>
          </div>
        </div>

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
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-all hover:bg-slate-50 active:opacity-80 active:bg-slate-50"
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
