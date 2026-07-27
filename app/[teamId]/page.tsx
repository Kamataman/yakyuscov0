import Link from "next/link"
import Image from "next/image"
import { Calendar, MessageCircle, PlusCircle } from "lucide-react"
import { createServiceClient } from "@/lib/supabase/service"
import { requireTeamAdmin } from "@/lib/auth"
import { fetchTeamHeaderImage, fetchTeamImages } from "@/lib/team-images-server"
import { TeamPhotoCarousel } from "@/components/team-photo-carousel"
import { LinkPendingIndicator } from "@/components/link-pending-indicator"
import { cn } from "@/lib/utils"

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

  const [gamesResult, nameResult, profileResult, adminSession, headerImage, photos, ownerCountResult] =
    await Promise.all([
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
      supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .eq("role", "owner"),
    ])

  const games = (gamesResult.data ?? []) as unknown as GameSummary[]
  const teamName = nameResult.data?.name ?? teamId
  const profile = profileResult.data as TeamProfileExtra | null
  const isAdmin = !!adminSession
  const canReceiveContact = (ownerCountResult.count ?? 0) > 0

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
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        {/* チームプロフィール */}
        <div className="mb-8">
          {/* ヘッダー画像（未設定の場合は表示しない） */}
          {headerImage && (
            <div className="diagonal-cut flex h-40 w-full items-center justify-center overflow-hidden md:h-56">
              <Image
                src={headerImage.url}
                alt={teamName}
                width={headerImage.width ?? 1200}
                height={headerImage.height ?? 400}
                className="h-full w-full object-cover"
                style={{ objectPosition: `50% ${headerImage.positionY}%` }}
                priority
              />
            </div>
          )}
          <div className="py-6">
            <h1 className="text-2xl font-black text-foreground">{teamName}</h1>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {profile?.description || "チーム紹介文は準備中です"}
            </p>

            {/* チーム写真カルーセル（未アップロードの場合は表示しない） */}
            {photos.length > 0 && (
              <div className="mt-6">
                <TeamPhotoCarousel photos={photos} teamName={teamName} />
              </div>
            )}

            {/* チームへの問い合わせ */}
            {canReceiveContact && (
              <div className="mt-6">
                <Link
                  href={`/${teamId}/contact`}
                  className="flex items-center justify-center gap-2 border border-border px-4 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted active:bg-muted"
                >
                  <MessageCircle className="h-4 w-4" />
                  このチームに問い合わせる
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* クイックアクション（管理者のみ表示） */}
        {isAdmin && (
          <div className="mb-8">
            <Link
              href={`/${teamId}/games/new`}
              className="diagonal-cut flex items-center justify-center gap-3 bg-turf px-6 py-5 text-turf-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              <PlusCircle className="h-6 w-6" />
              <span className="text-lg font-bold">新しい試合を記録</span>
              <LinkPendingIndicator className="h-6 w-6" />
            </Link>
          </div>
        )}

        {/* 直近の試合 */}
        <div className="mt-8">
          <h2 className="pb-2 text-lg font-bold text-foreground border-b-4 border-foreground">直近の試合</h2>
          <div className="py-2">
            {recentGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">まだ試合が記録されていません</p>
                {isAdmin && (
                  <Link
                    href={`/${teamId}/games/new`}
                    className="mt-4 text-sm font-medium text-turf hover:underline"
                  >
                    最初の試合を記録する
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentGames.map((game) => {
                  const total = getTotalScore(game.inning_scores || [])
                  const result = getResult(game.inning_scores || [])
                  return (
                    <Link
                      key={game.id}
                      href={`/${teamId}/games/${game.id}`}
                      className="flex items-center justify-between py-3 transition-colors hover:bg-muted/50 active:bg-muted/50"
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">{game.date}</p>
                        <p className="font-bold text-foreground">vs {game.opponent}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "px-2 py-0.5 text-xs font-bold",
                            result === "win"
                              ? "bg-turf text-turf-foreground"
                              : result === "lose"
                                ? "bg-stitch text-stitch-foreground"
                                : "border border-foreground text-foreground"
                          )}
                        >
                          {result === "win" ? "勝" : result === "lose" ? "敗" : "分"}
                        </div>
                        <span className="font-display text-lg font-bold text-foreground whitespace-nowrap">
                          {total.our}-{total.opponent}
                        </span>
                      </div>
                    </Link>
                  )
                })}
                {games.length > 3 && (
                  <Link
                    href={`/${teamId}/games`}
                    className="block py-3 text-center text-sm font-medium text-turf hover:underline"
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
