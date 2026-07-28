import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'
import { createServiceClient } from '@/lib/supabase/service'
import { selectIndexableTeams, type IndexableTeam } from '@/lib/seo'

// sitemapをビルド時に固定すると新規チームがデプロイまで反映されず、
// 完全に動的にするとクローラーのアクセスごとに全件クエリが走る。
// 1時間ごとの再生成に固定して両方を避ける。
export const revalidate = 3600

/** 掲載基準を満たすチームをDBから取得する。絞り込み自体は selectIndexableTeams に委譲する。 */
async function fetchIndexableTeams(): Promise<IndexableTeam[]> {
  try {
    const supabase = createServiceClient()

    const [teamsResult, gamesResult, playersResult] = await Promise.all([
      supabase.from('teams').select('id'),
      supabase.from('games').select('team_id, updated_at'),
      supabase.from('players').select('team_id'),
    ])

    const errors = [teamsResult.error, gamesResult.error, playersResult.error]
      .filter((error) => error !== null)
      .map((error) => error.message)

    if (errors.length > 0) {
      throw new Error(errors.join(' / '))
    }

    return selectIndexableTeams(
      teamsResult.data ?? [],
      gamesResult.data ?? [],
      playersResult.data ?? [],
    )
  } catch (error) {
    // sitemap生成の失敗でビルドやクローラーへの応答を止めたくないため、
    // ログを残したうえで静的URLのみのsitemapに縮退させる。
    console.error('sitemap用のチーム情報の取得に失敗しました:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // /register は登録フォームのみで検索意図に応える内容が無く、Googleに
  // 「クロール済み - インデックス未登録」として扱われるためsitemapから除外している。
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/demo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  const teams = await fetchIndexableTeams()
  const staticUrls = new Set(staticEntries.map((entry) => entry.url))

  const teamEntries: MetadataRoute.Sitemap = teams
    .map((team) => ({
      url: `${SITE_URL}/${team.id}`,
      lastModified: team.lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
    // デモチームは上で明示的に載せているため、locの重複を避ける。
    .filter((entry) => !staticUrls.has(entry.url))

  return [...staticEntries, ...teamEntries]
}
