import { cache } from "react"
import type { Metadata } from "next"
import { createServiceClient } from "@/lib/supabase/service"
import { APP_NAME } from "@/lib/constants"

/**
 * 検索結果に載せる必要のないページ(管理画面・認証フロー・トークン付きURL)に付与する。
 * ルートレイアウトの `robots: { index: true }` を打ち消す。
 */
export const noindexMetadata: Metadata = {
  robots: { index: false, follow: false },
}

export interface IndexableTeam {
  id: string
  lastModified: Date
}

/**
 * sitemapに載せるチームを絞り込む。
 *
 * 試合も選手も登録されていないチームページは中身が無く、インデックスされないまま
 * サイト全体の品質評価を下げるため除外する。
 * lastModified には配下の試合の最終更新時刻を使う(現在時刻ではGoogleへの情報にならない)。
 */
export function selectIndexableTeams(
  teams: { id: string }[],
  games: { team_id: string | null; updated_at: string }[],
  players: { team_id: string | null }[],
): IndexableTeam[] {
  // チームごとの最終試合更新時刻。キーの存在がそのまま「試合が1件以上ある」の判定になる。
  const latestGameUpdate = new Map<string, Date>()
  for (const game of games) {
    if (!game.team_id) continue
    const updatedAt = new Date(game.updated_at)
    if (Number.isNaN(updatedAt.getTime())) continue
    const current = latestGameUpdate.get(game.team_id)
    if (!current || updatedAt > current) {
      latestGameUpdate.set(game.team_id, updatedAt)
    }
  }

  const teamsWithPlayers = new Set(
    players
      .map((player) => player.team_id)
      .filter((teamId): teamId is string => Boolean(teamId)),
  )

  return teams.flatMap((team) => {
    const lastModified = latestGameUpdate.get(team.id)
    if (!lastModified || !teamsWithPlayers.has(team.id)) return []
    return [{ id: team.id, lastModified }]
  })
}

export interface TeamSeoProfile {
  name: string
  description: string | null
  activityArea: string | null
  activityDays: string | null
  teamLevel: string | null
  league: string | null
}

/**
 * generateMetadata 用のチーム情報取得。
 * 同一リクエスト内では layout / page から複数回呼ばれるため cache() で1回に畳む。
 */
export const fetchTeamSeoProfile = cache(
  async (teamId: string): Promise<TeamSeoProfile | null> => {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from("teams")
      .select("name, description, activity_area, activity_days, team_level, league")
      .eq("id", teamId)
      .maybeSingle()

    if (!data) return null

    return {
      name: data.name,
      description: data.description,
      activityArea: data.activity_area,
      activityDays: data.activity_days,
      teamLevel: data.team_level,
      league: data.league,
    }
  },
)

/**
 * チームページの meta description を組み立てる。
 * 管理者が説明文を入力していればそれを優先し、無ければプロフィール項目から生成する。
 * どのチームページも同じ文面にならないようにするのが目的。
 */
export function buildTeamDescription(team: TeamSeoProfile, suffix: string): string {
  if (team.description) {
    const summary =
      team.description.length > 100 ? `${team.description.slice(0, 100)}…` : team.description
    return `${summary} ${team.name}の${suffix}を${APP_NAME}で公開しています。`
  }

  const facts = [
    team.activityArea && `活動地域は${team.activityArea}`,
    team.activityDays && `活動曜日は${team.activityDays}`,
    team.league && `所属リーグは${team.league}`,
    team.teamLevel && `カテゴリは${team.teamLevel}`,
  ].filter((fact): fact is string => Boolean(fact))

  const factsText = facts.length > 0 ? `${facts.join("、")}。` : ""
  return `${team.name}の${suffix}。${factsText}試合スコア・打率・OPS・防御率を${APP_NAME}で公開しています。`
}
