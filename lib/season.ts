// 年度（シーズン）の考え方をこのファイルに集約する。
// 年度は games.date から導出する派生値であり、DB には持たない。
// 現在の区切りは暦年（1月1日〜12月31日）。4月始まりやチームごとの開始月に
// 変更する場合も、変更点が getSeasonYear / getCurrentSeasonYear に閉じるようにする。

export const SEASON_ALL = "all"
export type SeasonFilter = number | typeof SEASON_ALL

const ISO_DATE_PATTERN = /^(\d{4})-\d{2}-\d{2}$/

// 「今年」の判定はサーバーのタイムゾーンに左右されてはいけないため日本時間で行う
const TEAM_TIME_ZONE = "Asia/Tokyo"

export interface HasGameDate {
  date: string
}

/** 試合日（ISO形式の日付文字列）が属する年度を返す */
export function getSeasonYear(isoDate: string): number {
  const matched = ISO_DATE_PATTERN.exec(isoDate)
  if (!matched) {
    throw new Error(`試合日として解釈できない値です: ${isoDate}`)
  }
  return Number(matched[1])
}

/** 現在（日本時間）の年度を返す */
export function getCurrentSeasonYear(now: Date = new Date()): number {
  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: TEAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
  return getSeasonYear(isoDate)
}

/** 試合が存在する年度を新しい順に列挙する */
export function listSeasonYears(games: HasGameDate[]): number[] {
  const years = new Set<number>()
  for (const game of games) {
    years.add(getSeasonYear(game.date))
  }
  return [...years].sort((a, b) => b - a)
}

/**
 * 年度指定がないときの既定値。
 * 今年の試合があれば今年、なければ直近の年度、試合が1件もなければ通算。
 */
export function defaultSeason(availableSeasons: number[]): SeasonFilter {
  if (availableSeasons.length === 0) return SEASON_ALL
  const currentYear = getCurrentSeasonYear()
  return availableSeasons.includes(currentYear) ? currentYear : availableSeasons[0]
}

/** クエリパラメータ（?season=）を年度として解釈する。不正値は既定値に丸める */
export function resolveSeason(param: string | undefined, availableSeasons: number[]): SeasonFilter {
  if (param === SEASON_ALL) return SEASON_ALL
  if (param !== undefined) {
    const parsed = Number(param)
    if (Number.isInteger(parsed) && availableSeasons.includes(parsed)) {
      return parsed
    }
  }
  return defaultSeason(availableSeasons)
}

export function isInSeason(isoDate: string, season: SeasonFilter): boolean {
  return season === SEASON_ALL || getSeasonYear(isoDate) === season
}

export function filterBySeason<T extends HasGameDate>(games: T[], season: SeasonFilter): T[] {
  return season === SEASON_ALL ? games : games.filter((game) => isInSeason(game.date, season))
}

/** 「2026年」「通算」など、年度の見出し文字列 */
export function formatSeasonLabel(season: SeasonFilter): string {
  return season === SEASON_ALL ? "通算" : `${season}年`
}

/** 年度切り替えリンクの href を組み立てる */
export function seasonHref(basePath: string, season: SeasonFilter): string {
  return `${basePath}?season=${season}`
}
